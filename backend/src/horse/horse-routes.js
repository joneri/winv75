import express from 'express'
import horseService from './horse-service.js'
import HorseRating from './horse-rating-model.js'
import Horse from './horse-model.js'
import { validateNumericParam } from '../middleware/validators.js'

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

    if (cursor && Number.isFinite(Number(cursor.formRating))) {
      const formRating = Number(cursor.formRating)
      const horseId = Number(cursor.id) || 0
      match.$or = [
        { formRating: { $lt: formRating } },
        { formRating, id: { $gt: horseId } }
      ]
    }

    const sort = { formRating: -1, rating: -1, id: 1 }

    const pipeline = []
    if (Object.keys(match).length) {
      pipeline.push({ $match: match })
    }
    pipeline.push({ $sort: sort })
    pipeline.push({ $limit: limit + 1 })
    pipeline.push({
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        formRating: 1,
        rating: 1,
        winningRate: 1,
        placementRate: 1,
        trainerName: '$trainer.name',
        dateOfBirth: 1,
        birthCountryCode: 1
      }
    })

    const docs = await Horse.aggregate(pipeline).option({ allowDiskUse: true })

    const hasMore = docs.length > limit
    const items = hasMore ? docs.slice(0, limit) : docs
    const last = hasMore ? items[items.length - 1] : null

    res.json({
      items: items.map((horse) => ({
        id: horse.id,
        name: horse.name,
        formRating: Number.isFinite(horse.formRating) ? horse.formRating : horse.rating ?? null,
        formDelta: Number.isFinite(horse.formRating) && Number.isFinite(horse.rating)
          ? Number((horse.formRating - horse.rating).toFixed(2))
          : null,
        rating: Number.isFinite(horse.rating) ? horse.rating : null,
        winningRate: horse.winningRate ?? null,
        placementRate: horse.placementRate ?? null,
        trainerName: horse.trainerName ?? null,
        dateOfBirth: horse.dateOfBirth ?? null,
        birthCountryCode: horse.birthCountryCode ?? null
      })),
      hasMore,
      nextCursor: last
        ? encodeCursor({
            formRating: Number.isFinite(last.formRating) ? last.formRating : last.rating ?? 0,
            id: last.id ?? 0
          })
        : null
    })
  } catch (error) {
    console.error('Error listing horses:', error)
    res.status(500).json({ error: 'Failed to list horses.' })
  }
})

router.get('/ratings', async (req, res) => {
    try {
        const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : undefined
        const ratings = await HorseRating.find(ids ? { horseId: { $in: ids } } : {}).lean()
        res.json(ratings.map(r => ({ id: r.horseId, rating: r.rating, formRating: r.formRating ?? r.rating })))
    } catch (error) {
        console.error('Error fetching horse ratings:', error)
        res.status(500).send('Failed to fetch horse ratings.')
    }
})

router.get('/scores', async (req, res) => {
    try {
        const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : undefined
        const minScore = req.query.minScore ? parseFloat(req.query.minScore) : undefined
        const horses = await horseService.getHorsesByScore({ ids, minScore })
        res.json(horses)
    } catch (error) {
        console.error('Error fetching horse scores:', error)
        res.status(500).send('Failed to fetch horse scores.')
    }
})

router.get('/rankings/:raceId', validateNumericParam('raceId'), async (req, res) => {
    let rankings
    try {
        const raceId = req.params.raceId
        console.log('req:', req.originalUrl, 'raceId:', raceId)
        rankings = await horseService.getHorseRankings(raceId)
        res.status(200).json(rankings)
    } catch (error) {
        const errorMessage = `Error fetching horse rankings: ${error}`
        console.error(errorMessage)
        res.status(500).send('Failed to fetch horse data.')
    }
})

router.put('/:horseId', validateNumericParam('horseId'), async (req, res) => {
    try {
        console.log('req:', req.originalUrl)
        const horseId = req.params.horseId
        const result = await horseService.upsertHorseData(horseId)

        res.send(result);
    } catch (error) {
        console.error('Error fetching or upserting horse data:', error)
        res.status(500).send('Failed to fetch or upsert horse data.')
    }
})

router.get('/:horseId', validateNumericParam('horseId'), async (req, res) => {
    let horseId
    try {
        console.log('req:', req.originalUrl)
        horseId = req.params.horseId
        const horse = await horseService.getHorseData(horseId)

        if (!horse) {
            return res.status(404).send('Horse not found.')
        }

        res.send(horse)
    } catch (error) {
        const errorMessage = horseId 
            ? `Error fetching horse data for id ${horseId}: ${error}` 
            : `Error fetching horse data: ${error}`
        console.error(errorMessage)
        res.status(500).send('Failed to fetch horse data.')
    }
})

export default router
