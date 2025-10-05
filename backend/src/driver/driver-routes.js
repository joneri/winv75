import express from 'express'
import Driver from './driver-model.js'
import Raceday from '../raceday/raceday-model.js'
import { recomputeDriverRatings } from './driver-elo-service.js'
import buildDrivers from './build-driver-collection.js'

const router = express.Router()

const clampLimit = (value, fallback = 50, max = 100) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(max, Math.max(1, Math.floor(parsed)))
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const encodeCursor = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64')

const decodeCursor = (cursor) => {
  try {
    if (!cursor) return null
    const json = Buffer.from(String(cursor), 'base64').toString('utf8')
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed
  } catch {
    return null
  }
}

const buildDriverStats = (driver) => {
  const results = Array.isArray(driver.results) ? driver.results : []
  let starts = 0
  let wins = 0
  let top3 = 0
  let lastStart = null

  for (const res of results) {
    const placement = Number(res?.placement?.sortValue ?? res?.placement)
    if (Number.isFinite(placement) && placement > 0 && placement < 99) {
      starts += 1
      if (placement === 1) wins += 1
      if (placement <= 3) top3 += 1
    }
    const date = res?.date ? new Date(res.date) : null
    if (date && !Number.isNaN(date.getTime())) {
      if (!lastStart || date > lastStart) lastStart = date
    }
  }

  const winRate = starts ? wins / starts : null
  const top3Rate = starts ? top3 / starts : null

  return {
    starts,
    wins,
    winRate,
    top3,
    top3Rate,
    lastStart: lastStart ? lastStart.toISOString() : null
  }
}

router.get('/', async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit)
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const cursor = decodeCursor(req.query.cursor)

    if (req.query.cursor && !cursor) {
      return res.status(400).json({ error: 'Invalid cursor' })
    }

    const match = {}
    if (search) {
      match.name = { $regex: escapeRegex(search), $options: 'i' }
    }

    if (cursor && Number.isFinite(Number(cursor.elo))) {
      const elo = Number(cursor.elo)
      const driverId = Number(cursor.id) || 0
      match.$or = [
        { elo: { $lt: elo } },
        { elo, _id: { $gt: driverId } }
      ]
    }

    const sort = { elo: -1, _id: 1 }

    const pipeline = []
    if (Object.keys(match).length) {
      pipeline.push({ $match: match })
    }
    pipeline.push({ $sort: sort })
    pipeline.push({ $limit: limit + 1 })
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        elo: 1,
        careerElo: 1,
        eloRaceCount: 1,
        careerRaceCount: 1,
        eloUpdatedAt: 1,
        results: {
          $map: {
            input: '$results',
            as: 'res',
            in: {
              placement: '$$res.placement',
              date: '$$res.date'
            }
          }
        }
      }
    })

    const docs = await Driver.aggregate(pipeline).option({ allowDiskUse: true })

    const hasMore = docs.length > limit
    const items = hasMore ? docs.slice(0, limit) : docs
    const last = hasMore ? items[items.length - 1] : null

    res.json({
      items: items.map((driver) => {
        const stats = buildDriverStats(driver)
        return {
          id: driver._id,
          name: driver.name,
          elo: Number.isFinite(driver.elo) ? driver.elo : null,
          careerElo: Number.isFinite(driver.careerElo) ? driver.careerElo : null,
          eloRaceCount: driver.eloRaceCount ?? null,
          careerRaceCount: driver.careerRaceCount ?? null,
          eloUpdatedAt: driver.eloUpdatedAt ?? null,
          stats
        }
      }),
      hasMore,
      nextCursor: last
        ? encodeCursor({
            elo: Number.isFinite(last.elo) ? last.elo : 0,
            id: last._id ?? 0
          })
        : null
    })
  } catch (error) {
    console.error('Error listing drivers:', error)
    res.status(500).json({ error: 'Failed to list drivers.' })
  }
})

router.get('/ratings', async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : []
    const query = ids.length ? { _id: { $in: ids } } : {}
    const drivers = await Driver.find(query, '_id elo careerElo eloUpdatedAt').lean()
    res.json(drivers.map(d => ({
      id: d._id,
      elo: d.elo,
      careerElo: d.careerElo ?? null,
      eloUpdatedAt: d.eloUpdatedAt || null
    })))
  } catch (error) {
    console.error('Error fetching driver elo ratings:', error)
    res.status(500).send('Failed to fetch driver ratings.')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid driver id' })
    }

    const driver = await Driver.findById(id).lean()
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    const allResults = Array.isArray(driver.results) ? driver.results : []
    const sorted = [...allResults].sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0
      const db = b?.date ? new Date(b.date).getTime() : 0
      return db - da
    })

    const recentLimitRaw = Number(req.query.resultsLimit)
    const RECENT_LIMIT = Number.isFinite(recentLimitRaw)
      ? Math.min(Math.max(Math.floor(recentLimitRaw), 25), 500)
      : 25

    const recent = sorted.slice(0, RECENT_LIMIT)
    const raceIds = [...new Set(recent.map(r => r?.raceId).filter(Boolean))]

    const raceMetaMap = new Map()
    if (raceIds.length) {
      const raceDocs = await Raceday.find(
        { 'raceList.raceId': { $in: raceIds } },
        { raceDayId: 1, raceDayDate: 1, trackName: 1, raceList: 1 }
      ).lean()

      for (const doc of raceDocs) {
        const raceDayId = doc.raceDayId ?? doc._id
        const raceDayDate = doc.raceDayDate ?? doc.firstStart ?? null
        const list = Array.isArray(doc.raceList) ? doc.raceList : []
        for (const race of list) {
          const raceId = race?.raceId
          if (!raceIds.includes(raceId)) continue
          raceMetaMap.set(raceId, {
            trackName: doc.trackName || null,
            raceNumber: race?.raceNumber ?? null,
            distance: race?.distance ?? null,
            startTime: race?.startDateTime ?? null,
            racedayId: raceDayId ?? null,
            raceDayDate
          })
        }
      }
    }

    const normalizeDate = (value) => {
      if (!value) return null
      const dt = new Date(value)
      return Number.isNaN(dt.getTime()) ? null : dt.toISOString()
    }

  const getPlacement = (entry) => {
    const raw = entry?.placement?.sortValue ?? entry?.placement
    const num = Number(raw)
    if (!Number.isFinite(num)) return null
    if (num >= 900) return null // pending/missing result codes
    if (num <= 0 || num >= 99) return null
    return num
  }

  const recentResults = recent.map(res => {
    const meta = raceMetaMap.get(res?.raceId) || {}
    const placementValue = getPlacement(res)
    const rawPlacement = Number(res?.placement?.sortValue ?? res?.placement)
    const pending = !Number.isFinite(placementValue) && Number.isFinite(rawPlacement) && rawPlacement >= 900
    const startPos = res?.startPosition
    const startMethod = res?.startMethod

    return {
      raceId: res?.raceId ?? null,
        date: normalizeDate(res?.date),
        horseId: res?.horseId ?? null,
        horseName: res?.horseName || '',
        placement: placementValue,
        placementDisplay: res?.placement?.display ?? res?.placement?.displayValue ?? null,
        odds: res?.odds?.sortValue ?? null,
        oddsDisplay: res?.odds?.display ?? res?.odds?.displayValue ?? null,
        prizeMoney: res?.prizeMoney?.amount ?? null,
        prizeDisplay: res?.prizeMoney?.display ?? res?.prizeMoney?.displayValue ?? null,
        withdrawn: res?.withdrawn === true,
        pending,
        trackName: meta.trackName ?? null,
        raceNumber: meta.raceNumber ?? null,
        distance: (() => {
          const dist = meta.distance
          if (Number.isFinite(Number(dist))) return `${dist} m`
          return dist ?? null
        })(),
        startTime: normalizeDate(meta.startTime),
        startPosition: startPos && typeof startPos === 'object'
          ? {
              sortValue: Number.isFinite(Number(startPos?.sortValue)) ? Number(startPos.sortValue) : startPos?.sortValue ?? null,
              displayValue: startPos?.displayValue ?? startPos?.text ?? null
            }
          : startPos ?? null,
        startMethod: startMethod && typeof startMethod === 'object'
          ? startMethod?.displayValue ?? startMethod?.text ?? null
          : startMethod ?? null,
        racedayId: meta.racedayId ?? null,
        raceDayDate: normalizeDate(meta.raceDayDate)
      }
    })

    const eligibleStarts = allResults.filter(res => {
      const placement = getPlacement(res)
      return Number.isFinite(placement) && placement > 0 && placement < 99 && res?.withdrawn !== true
    })

    const starts = eligibleStarts.length
    const wins = eligibleStarts.filter(res => getPlacement(res) === 1).length
    const top3 = eligibleStarts.filter(res => {
      const p = getPlacement(res)
      return Number.isFinite(p) && p > 0 && p <= 3
    }).length
    const top5 = eligibleStarts.filter(res => {
      const p = getPlacement(res)
      return Number.isFinite(p) && p > 0 && p <= 5
    }).length

    const averagePlacement = starts
      ? eligibleStarts.reduce((sum, res) => {
          const p = getPlacement(res)
          return sum + (Number.isFinite(p) ? p : 0)
        }, 0) / starts
      : null

    const lastStartDate = sorted[0]?.date ? normalizeDate(sorted[0].date) : null

    const summary = {
      id: driver._id,
      name: driver.name || '',
      elo: driver.elo ?? null,
      careerElo: driver.careerElo ?? null,
      eloRaceCount: driver.eloRaceCount ?? null,
      careerRaceCount: driver.careerRaceCount ?? null,
      eloUpdatedAt: driver.eloUpdatedAt ? normalizeDate(driver.eloUpdatedAt) : null,
      stats: {
        starts,
        wins,
        winRate: starts ? wins / starts : null,
        top3,
        top3Rate: starts ? top3 / starts : null,
        top5,
        top5Rate: starts ? top5 / starts : null,
        averagePlacement,
        lastStart: lastStartDate
      },
      recentResults
    }

    res.json(summary)
  } catch (error) {
    console.error('Error fetching driver detail:', error)
    res.status(500).json({ error: 'Failed to fetch driver data.' })
  }
})

router.put('/:id/elo', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid driver id' })
    }

    const { elo, careerElo } = req.body || {}
    if (!Number.isFinite(Number(elo))) {
      return res.status(400).json({ error: 'elo is required and must be numeric' })
    }

    const update = {
      elo: Math.round(Number(elo)),
      eloUpdatedAt: new Date()
    }

    if (careerElo != null && Number.isFinite(Number(careerElo))) {
      update.careerElo = Math.round(Number(careerElo))
    }

    const driver = await Driver.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    res.json({
      id: driver._id,
      elo: driver.elo,
      careerElo: driver.careerElo ?? null,
      eloUpdatedAt: driver.eloUpdatedAt || null
    })
  } catch (error) {
    console.error('Error updating driver elo:', error)
    res.status(500).json({ error: 'Failed to update driver elo.' })
  }
})

router.post('/recompute', async (req, res) => {
  try {
    const k = req.body?.k != null ? Number(req.body.k) : undefined
    const decayDays = req.body?.decayDays != null ? Number(req.body.decayDays) : undefined
    const formDecayDays = req.body?.formDecayDays != null ? Number(req.body.formDecayDays) : undefined
    const formK = req.body?.formK != null ? Number(req.body.formK) : undefined

    const shouldRebuild = req.body?.rebuild !== false
    if (shouldRebuild) {
      await buildDrivers()
    }

    const result = await recomputeDriverRatings({
      ...(Number.isFinite(k) ? { k } : {}),
      ...(Number.isFinite(decayDays) ? { decayDays } : {}),
      ...(Number.isFinite(formDecayDays) ? { formDecayDays } : {}),
      ...(Number.isFinite(formK) ? { formK } : {})
    })

    res.json({
      ok: true,
      rebuilt: shouldRebuild,
      ...result
    })
  } catch (error) {
    console.error('Error recomputing driver elo ratings:', error)
    res.status(500).json({ error: 'Failed to recompute driver ratings.' })
  }
})

export default router
