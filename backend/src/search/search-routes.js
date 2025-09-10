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
    console.error('Error during search:', error)
    res.status(500).send('Search failed')
  }
})

export default router
