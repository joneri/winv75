import express from 'express'
import searchService from './search-service.js'

const router = express.Router()

// Global search endpoint
router.get('/', async (req, res) => {
  const query = req.query.q || ''
  try {
    const results = await searchService.globalSearch(query)
    res.json(results)
  } catch (error) {
    console.error('Error during search (router):', error)
    // Always respond 200 with stable empty structure
    res.json({ horses: [], drivers: [], upcomingRaces: [], racedays: [], results: [], tracks: [] })
  }
})

export default router
