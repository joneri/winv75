import express from 'express'
import updateRatings from '../horse/update-elo-ratings.js'
import eloService from './elo-service.js'

const router = express.Router()

// Trigger full Elo ratings recalculation
router.post('/update', async (req, res) => {
  try {
    await updateRatings()
    res.json({ message: 'Ratings updated' })
  } catch (err) {
    console.error('Manual rating update failed', err)
    res.status(500).send('Failed to update ratings')
  }
})

// Update ratings for a specific race using result payload
router.post('/race/:raceId', async (req, res) => {
  try {
    const raceId = req.params.raceId
    const raceData = req.body
    const updated = await eloService.updateRatingsForRace(raceId, raceData)
    res.json(updated)
  } catch (err) {
    console.error('Failed to update ratings for race', req.params.raceId, err)
    res.status(500).send('Failed to update ratings')
  }
})

export default router
