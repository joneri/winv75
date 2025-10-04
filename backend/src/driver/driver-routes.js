import express from 'express'
import Driver from './driver-model.js'
import Raceday from '../raceday/raceday-model.js'
import { recomputeDriverRatings } from './driver-elo-service.js'
import buildDrivers from './build-driver-collection.js'

const router = express.Router()

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

    const RECENT_LIMIT = 25
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
      return Number.isFinite(num) ? num : null
    }

    const recentResults = recent.map(res => {
      const meta = raceMetaMap.get(res?.raceId) || {}
      const placementValue = getPlacement(res)
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
        trackName: meta.trackName ?? null,
        raceNumber: meta.raceNumber ?? null,
        distance: meta.distance ?? null,
        startTime: normalizeDate(meta.startTime),
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
