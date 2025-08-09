import express from 'express'
import raceService from './race-service.js'
import eloService from '../rating/elo-service.js'
import { validateNumericParam } from '../middleware/validators.js'
import { buildRaceInsights } from './race-insights.js'
import { generateHorseSummary } from '../ai-horse-summary.js'

const router = express.Router()

// AI: per-horse summary endpoint
router.post('/horse-summary', async (req, res) => {
  try {
    const payload = req.body || {}
    const summary = await generateHorseSummary(payload)
    if (!summary || typeof summary !== 'string') {
      return res.status(502).json({ error: 'AI summary service returned no text' })
    }
    res.json({ summary })
  } catch (err) {
    console.error('Failed to generate horse AI summary', err)
    res.status(500).json({ error: 'Failed to generate AI summary' })
  }
})

// New: per-race AI list endpoint
router.get('/:id/ai-list', validateNumericParam('id'), async (req, res) => {
  try {
    const raceId = Number(req.params.id)
    const insights = await buildRaceInsights(raceId)
    if (!insights) return res.status(404).send('Race not found')
    res.json(insights)
  } catch (error) {
    console.error('Error building AI list:', error)
    res.status(500).send('Failed to build AI list')
  }
})

// Fetch a specific race by its ID
router.get('/:id', validateNumericParam('id'), async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const raceId = req.params.id;
        const race = await raceService.getRaceById(raceId)
        if (race) {
            res.send(race)
        } else {
            res.status(404).send('Race not found.')
        }
    } catch (error) {
        console.error(`Error fetching race with ID ${req.params.id}:`, error)
        res.status(500).send('Failed to fetch race. Please try again.')
    }
})

// Update Elo ratings for a race
router.post('/:id/results', validateNumericParam('id'), async (req, res) => {
    try {
        const raceData = req.body
        if (!raceData || !Array.isArray(raceData.horses)) {
            return res.status(400).send('Invalid race data')
        }
        const updated = await eloService.updateRatingsForRace(req.params.id, raceData)
        res.json(updated)
    } catch (error) {
        console.error(`Error updating ratings for race ${req.params.id}:`, error)
        res.status(500).send('Failed to update ratings')
    }
})

export default router
