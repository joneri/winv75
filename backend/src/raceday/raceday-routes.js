import express from 'express'
import raceDayService from './raceday-service.js'
import Raceday from './raceday-model.js'
import { validateNumericParam, validateObjectIdParam } from '../middleware/validators.js'
import {
  listV75Templates,
  buildV75Suggestion,
  buildV75Suggestions,
  updateV75DistributionForRaceday
} from './v75-service.js'

const router = express.Router()

// Fetch raceday data from the external API and store it
router.post('/fetch', async (req, res) => {
    const date = req.query.date
    if (!date) {
        return res.status(400).send('Missing date parameter')
    }
    try {
        const result = await raceDayService.fetchAndStoreByDate(date)
        res.send(result)
    } catch (error) {
        console.error('Error fetching raceday data from external API:', error)
        res.status(500).send('Failed to fetch raceday data')
    }
})

router.post('/', async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const startlistData = req.body;
        if (!startlistData.raceDayId || !/^[0-9]+$/.test(startlistData.raceDayId)) {
            return res.status(400).send('Invalid raceDayId')
        }
        const result = await raceDayService.upsertStartlistData(startlistData)
        res.send(result)
    } catch (error) {
        console.error('Error upserting raceday data:', error)
        res.status(500).send('Failed to upsert raceday data. Please try again.')
    }
})

// Fetch all racedays
router.get('/', async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const skip = parseInt(req.query.skip) || 0
        const limit = req.query.limit ? parseInt(req.query.limit) : null
        const racedays = await raceDayService.getAllRacedays(skip, limit)
        res.send(racedays)
    } catch (error) {
        console.error('Error fetching all racedays:', error);
        res.status(500).send('Failed to fetch racedays. Please try again.')
    }
})

// Update the earliest updated horse timestamp for a specific race
router.put('/:raceDayId/race/:raceId', validateObjectIdParam('raceDayId'), validateNumericParam('raceId'), async (req, res) => {
  console.log('Update the earliest updated horse timestamp for a specific race - req:', req.originalUrl)
  try {
    const raceDayId = req.params.raceDayId
    const raceId = req.params.raceId
    const raceDay = await raceDayService.updateEarliestUpdatedHorseTimestamp(raceDayId, raceId)
    res.send(raceDay)
  } catch (error) {
    console.error(`Error updating the earliest updated horse timestamp for raceDayId ${req.params.raceDayId}:`, error)
    res.status(500).send('Failed to update. Please try again.')
  }
})

// Lightweight paginated summary of racedays (placed before '/:id' to avoid param capture)
router.get('/summary', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 40
    const fields = typeof req.query.fields === 'string' && req.query.fields.trim().length
      ? req.query.fields.split(',').map(s => s.trim())
      : ['firstStart', 'raceDayDate', 'trackName', 'raceStandard']

    const result = await raceDayService.getRacedaysPaged(skip, limit, fields)
    res.json(result)
  } catch (error) {
    console.error('Error fetching raceday summary:', error)
    res.status(500).send('Failed to fetch raceday summary. Please try again.')
  }
})

router.get('/v75/templates', async (_req, res) => {
  try {
    res.json({ templates: listV75Templates() })
  } catch (error) {
    console.error('Error fetching V75 templates:', error)
    res.status(500).json({ error: 'Failed to fetch V75 templates' })
  }
})

router.get('/:id/v75/info', validateObjectIdParam('id'), async (req, res) => {
  try {
    const raceday = await Raceday.findById(req.params.id, { v75Info: 1 }).lean()
    res.json({ info: raceday?.v75Info || null })
  } catch (error) {
    console.error('Failed to fetch V75 info:', error)
    res.status(500).json({ error: 'Misslyckades hämta V75-information' })
  }
})

router.post('/:id/v75/update', validateObjectIdParam('id'), async (req, res) => {
  try {
    const info = await updateV75DistributionForRaceday(req.params.id)
    res.json({ ok: true, info })
  } catch (error) {
    console.error('Failed to update V75 distribution:', error)
    res.status(500).json({ error: error.message || 'Misslyckades att uppdatera V75%' })
  }
})

router.post('/:id/v75', validateObjectIdParam('id'), async (req, res) => {
  try {
    const {
      templateKey,
      stake,
      maxCost,
      maxBudget,
      mode,
      modes,
      multi
    } = req.body || {}

    const wantsMulti = multi === true || (Array.isArray(modes) && modes.length > 0)

    if (wantsMulti) {
      const result = await buildV75Suggestions(req.params.id, {
        templateKey,
        stake,
        maxCost,
        maxBudget,
        modes
      })
      if (result?.error) {
        return res.status(400).json(result)
      }
      return res.json(result)
    }

    const suggestion = await buildV75Suggestion(req.params.id, {
      templateKey,
      stake,
      maxCost,
      maxBudget,
      mode
    })
    if (suggestion?.error) {
      return res.status(400).json(suggestion)
    }
    res.json(suggestion)
  } catch (error) {
    console.error('Failed to build V75 suggestion:', error)
    res.status(500).json({ error: 'Det gick inte att skapa V75-spelförslag' })
  }
})

// New: AI-style list for an entire raceday (each race) with caching
router.get('/:id/ai-list', validateObjectIdParam('id'), async (req, res) => {
  try {
    const force = String(req.query.force || '').toLowerCase() === 'true'
    const data = await raceDayService.getRacedayAiList(req.params.id, { force })
    if (!data) return res.status(404).send('Raceday not found')
    res.json(data)
  } catch (err) {
    console.error('Failed to build raceday AI list', err)
    res.status(500).send('Failed to build raceday AI list')
  }
})

// Admin: Precompute upcoming raceday AI lists (cron target)
router.post('/_admin/precompute-ai', async (req, res) => {
  try {
    const daysAhead = req.query.daysAhead ? Number(req.query.daysAhead) : 3
    const result = await raceDayService.precomputeUpcomingAiLists(daysAhead)
    res.json(result)
  } catch (e) {
    console.error('Precompute failed', e)
    res.status(500).send('Precompute failed')
  }
})

// Admin: Force refresh cache for a raceday
router.post('/:_id/_admin/refresh-ai', validateObjectIdParam('_id'), async (req, res) => {
  try {
    const data = await raceDayService.getRacedayAiList(req.params._id, { force: true })
    if (!data) return res.status(404).send('Raceday not found')
    res.json({ ok: true, generatedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Refresh AI failed', e)
    res.status(500).send('Refresh AI failed')
  }
})

// Fetch a specific raceday by its ID
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const racedayId = req.params.id;
        const raceday = await raceDayService.getRacedayById(racedayId)
        if (raceday) {
            res.send(raceday);
        } else {
            res.status(404).send('Raceday not found.')
        }
    } catch (error) {
        console.error(`Error fetching raceday with ID ${req.params.id}:`, error)
        res.status(500).send('Failed to fetch raceday. Please try again.')
    }
})

export default router
