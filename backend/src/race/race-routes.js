import express from 'express'
import raceService from './race-service.js'
import eloService from '../elo/elo-service.js'
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
