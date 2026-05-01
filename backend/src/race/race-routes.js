import express from 'express'
import eloService from '../rating/elo-service.js'
import raceReadService from './race-read-service.js'
import { getRaceProfile } from './race-profile-service.js'
import { validateNumericParam } from '../middleware/validators.js'
import { updateDriverRatingsForRace } from '../driver/driver-elo-service.js'

const router = express.Router()

router.get('/profile/:id', validateNumericParam('id'), async (req, res) => {
  try {
    const profile = await getRaceProfile(req.params.id)
    if (profile) {
      return res.json(profile)
    }
    res.status(404).send('Race profile not found.')
  } catch (error) {
    console.error(`Error fetching race profile with ID ${req.params.id}:`, error)
    res.status(500).send('Failed to fetch race profile. Please try again.')
  }
})

router.get('/:id', validateNumericParam('id'), async (req, res) => {
  console.log('req:', req.originalUrl)
  try {
    const race = await raceReadService.getRaceWithRatings(req.params.id)
    if (race) {
      return res.json(race)
    }
    res.status(404).send('Race not found.')
  } catch (error) {
    console.error(`Error fetching race with ID ${req.params.id}:`, error)
    res.status(500).send('Failed to fetch race. Please try again.')
  }
})

router.post('/:id/results', validateNumericParam('id'), async (req, res) => {
  try {
    const raceData = req.body
    if (!raceData || !Array.isArray(raceData.horses)) {
      return res.status(400).send('Invalid race data')
    }

    const updated = await eloService.updateRatingsForRace(req.params.id, raceData)
    try {
      await updateDriverRatingsForRace(req.params.id, raceData)
    } catch (driverErr) {
      console.error(`Error updating driver ratings for race ${req.params.id}:`, driverErr)
    }
    res.json(updated)
  } catch (error) {
    console.error(`Error updating ratings for race ${req.params.id}:`, error)
    res.status(500).send('Failed to update ratings')
  }
})

router.get('/horse/:horseId/past-comments', async (req, res) => {
  try {
    const comments = await raceReadService.getHorsePastComments(req.params.horseId)
    res.json({ comments })
  } catch (error) {
    console.error('Failed fetching past comments', error)
    res.status(500).json({ error: 'Failed fetching past comments' })
  }
})

export default router
