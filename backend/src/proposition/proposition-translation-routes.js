import express from 'express'
import { getPropositionTranslationOverview } from './proposition-translation-service.js'

const router = express.Router()

router.get('/overview', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 250
    const language = typeof req.query.propLanguage === 'string' ? req.query.propLanguage : 'sv'
    const overview = await getPropositionTranslationOverview({ limit, language })
    res.json(overview)
  } catch (error) {
    console.error('Error fetching proposition translation overview:', error)
    res.status(500).json({ error: 'Failed to fetch proposition translation overview.' })
  }
})

export default router
