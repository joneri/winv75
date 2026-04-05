import express from 'express'
import { validateObjectIdParam } from '../middleware/validators.js'
import {
  getSuggestionById,
  getSuggestionAnalytics,
  listMarkers,
  createMarker
} from './suggestion-service.js'

const router = express.Router()

router.get('/analytics', async (req, res) => {
  try {
    const analytics = await getSuggestionAnalytics({
      gameType: req.query?.gameType || null
    })
    res.json(analytics)
  } catch (error) {
    console.error('Failed to fetch suggestion analytics:', error)
    res.status(500).json({ error: 'Misslyckades hämta analytics för spelförslag' })
  }
})

router.get('/markers', async (_req, res) => {
  try {
    const markers = await listMarkers()
    res.json({ items: markers })
  } catch (error) {
    console.error('Failed to fetch suggestion markers:', error)
    res.status(500).json({ error: 'Misslyckades hämta tidslinjemarkorer' })
  }
})

router.post('/markers', async (req, res) => {
  try {
    const label = String(req.body?.label || '').trim()
    if (!label) {
      return res.status(400).json({ error: 'label is required' })
    }

    const marker = await createMarker(req.body)
    res.status(201).json(marker)
  } catch (error) {
    console.error('Failed to create suggestion marker:', error)
    res.status(500).json({ error: 'Misslyckades skapa tidslinjemarkor' })
  }
})

router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const detail = await getSuggestionById(req.params.id)
    if (!detail) {
      return res.status(404).json({ error: 'Suggestion not found' })
    }
    res.json(detail)
  } catch (error) {
    console.error(`Failed to fetch suggestion ${req.params.id}:`, error)
    res.status(500).json({ error: 'Misslyckades hämta spelförslag' })
  }
})

export default router
