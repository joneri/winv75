import express from 'express'
import {
  buildPropositionTranslationBundle,
  buildPropositionTranslationBundleDownloadName,
  buildPropositionTranslationBundleZip
} from './proposition-translation-export-service.js'
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

router.get('/export-bundle', async (req, res) => {
  try {
    const format = String(req.query.format || 'json').toLowerCase() === 'zip' ? 'zip' : 'json'

    if (format === 'zip') {
      const { bundle, buffer } = await buildPropositionTranslationBundleZip()
      const fileName = buildPropositionTranslationBundleDownloadName(bundle, 'zip')
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      return res.send(buffer)
    }

    const bundle = await buildPropositionTranslationBundle()
    const fileName = buildPropositionTranslationBundleDownloadName(bundle, 'json')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(JSON.stringify(bundle, null, 2))
  } catch (error) {
    console.error('Error exporting proposition translation bundle:', error)
    res.status(500).json({ error: 'Failed to export proposition translation bundle.' })
  }
})

export default router
