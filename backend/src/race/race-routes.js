import express from 'express'
import raceService from './race-service.js'
import eloService from '../rating/elo-service.js'
import { validateNumericParam } from '../middleware/validators.js'

const router = express.Router()

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
// --- AI Horse Summary Endpoint ---
import { generateHorseSummary } from '../ai-horse-summary.js'

// POST /api/race/horse-summary
// POST /api/race/horse-summary
// Expects: { raceId, horseId, ...horseData }
import Raceday from '../raceday/raceday-model.js'
router.post('/horse-summary', async (req, res) => {
    try {
        const { raceId, horseId, ...horseData } = req.body
        if (!raceId || !horseId) {
            return res.status(400).json({ error: 'Missing raceId or horseId' })
        }
        const summary = await generateHorseSummary({ ...horseData, horseName: horseData.horseName || horseData.name, promptType: 'structured-v2' })

        // Find and update the correct horse in the correct race in the correct raceday
        const raceDay = await Raceday.findOne({ "raceList.raceId": raceId })
        if (!raceDay) {
            return res.status(404).json({ error: 'Raceday not found' })
        }
        const race = raceDay.raceList.find(r => r.raceId.toString() === raceId.toString())
        if (!race) {
            return res.status(404).json({ error: 'Race not found' })
        }
        const horse = race.horses.find(h => h.id.toString() === horseId.toString())
        if (!horse) {
            return res.status(404).json({ error: 'Horse not found' })
        }
        horse.aiSummary = summary
        raceDay.markModified('raceList')
        await raceDay.save()

        res.json({ summary })
    } catch (error) {
        console.error('AI summary error:', error)
        res.status(500).json({ error: 'Failed to generate summary' })
    }
})
