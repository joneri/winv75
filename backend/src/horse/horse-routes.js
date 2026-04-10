import express from 'express'
import horseService from './horse-service.js'
import HorseRating from './horse-rating-model.js'
import Horse from './horse-model.js'
import { validateNumericParam } from '../middleware/validators.js'
import { buildHorseEloPrediction } from '../rating/horse-elo-prediction.js'

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

const buildCatalogSortTuple = (entry = {}) => ({
  formRating: Number.isFinite(Number(entry.formRating)) ? Number(entry.formRating) : Number.NEGATIVE_INFINITY,
  rating: Number.isFinite(Number(entry.rating)) ? Number(entry.rating) : Number.NEGATIVE_INFINITY,
  id: Number.isFinite(Number(entry.id)) ? Number(entry.id) : Number.MAX_SAFE_INTEGER
})

const compareCatalogEntries = (left = {}, right = {}) => {
  const a = buildCatalogSortTuple(left)
  const b = buildCatalogSortTuple(right)

  if (a.formRating !== b.formRating) return b.formRating - a.formRating
  if (a.rating !== b.rating) return b.rating - a.rating
  return a.id - b.id
}

const isEntryAfterCursor = (entry = {}, cursor = null) => {
  if (!cursor) return true

  const tuple = buildCatalogSortTuple(entry)
  const cursorForm = Number(cursor.formRating)
  const cursorRating = Number(cursor.rating)
  const cursorId = Number(cursor.id) || 0

  if (Number.isFinite(cursorForm) && tuple.formRating !== cursorForm) {
    return tuple.formRating < cursorForm
  }

  if (Number.isFinite(cursorRating) && tuple.rating !== cursorRating) {
    return tuple.rating < cursorRating
  }

  return tuple.id > cursorId
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

    const pipeline = []
    if (Object.keys(match).length) {
      pipeline.push({ $match: match })
    }
    pipeline.push({
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        results: 1,
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
    const horseIds = docs.map((horse) => Number(horse.id)).filter(Number.isFinite)
    const ratingDocs = horseIds.length
      ? await HorseRating.find({ horseId: { $in: horseIds } }, {
          _id: 0,
          horseId: 1,
          rating: 1,
          formRating: 1
        }).lean()
      : []
    const ratingMap = new Map(ratingDocs.map((doc) => [Number(doc.horseId), doc]))

    const predictedDocs = docs
      .map((horse) => {
        const prediction = buildHorseEloPrediction({
          horse,
          ratingDoc: ratingMap.get(Number(horse.id)) || {}
        })

        return {
          id: horse.id,
          name: horse.name,
          formRating: prediction.formElo ?? (Number.isFinite(horse.formRating) ? horse.formRating : horse.rating ?? null),
          formDelta: prediction.debug?.formGapToCareer ?? null,
          formTrendDelta: prediction.debug?.formTrendDelta ?? null,
          rating: prediction.careerElo ?? (Number.isFinite(horse.rating) ? horse.rating : null),
          winningRate: horse.winningRate ?? null,
          placementRate: horse.placementRate ?? null,
          trainerName: horse.trainerName ?? null,
          dateOfBirth: horse.dateOfBirth ?? null,
          birthCountryCode: horse.birthCountryCode ?? null
        }
      })
      .sort(compareCatalogEntries)

    const cursorFiltered = cursor ? predictedDocs.filter((entry) => isEntryAfterCursor(entry, cursor)) : predictedDocs
    const hasMore = cursorFiltered.length > limit
    const items = hasMore ? cursorFiltered.slice(0, limit) : cursorFiltered
    const last = items[items.length - 1] || null

    res.json({
      items,
      hasMore,
      nextCursor: last
        ? encodeCursor({
            formRating: Number.isFinite(last.formRating) ? last.formRating : last.rating ?? 0,
            rating: Number.isFinite(last.rating) ? last.rating : 0,
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
