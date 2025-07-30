import express from 'express'
import trackService from './track-service.js'

const router = express.Router()

// Get track metadata by track code
router.get('/:trackCode', async (req, res) => {
  try {
    const trackCode = req.params.trackCode
    const track = await trackService.getTrackByCode(trackCode)
    if (!track) {
      return res.status(404).send('Track not found.')
    }
    res.json(track)
  } catch (error) {
    console.error(`Error fetching track with code ${req.params.trackCode}:`, error)
    res.status(500).send('Failed to fetch track')
  }
})

export default router
