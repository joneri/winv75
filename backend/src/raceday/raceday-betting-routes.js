import express from 'express'
import Raceday from './raceday-model.js'
import { validateObjectIdParam } from '../middleware/validators.js'
import {
  listV85Templates,
  buildV85Suggestion,
  buildV85Suggestions,
  updateV85DistributionForRaceday
} from './v85-service.js'
import {
  listV86Templates,
  buildV86Suggestion,
  buildV86Suggestions,
  updateV86DistributionForRaceday,
  getV86PairingForRaceday,
  getV86GameViewForRaceday
} from './v86-service.js'

const router = express.Router()

async function loadRacedayInfo(racedayId, field) {
  const raceday = await Raceday.findById(racedayId, { [field]: 1 }).lean()
  return raceday?.[field] || null
}

function createTemplateHandler(listTemplates, label) {
  return async (_req, res) => {
    try {
      res.json({ templates: listTemplates() })
    } catch (error) {
      console.error(`Error fetching ${label} templates:`, error)
      res.status(500).json({ error: `Failed to fetch ${label} templates` })
    }
  }
}

function createInfoHandler(field, label) {
  return async (req, res) => {
    try {
      const info = await loadRacedayInfo(req.params.id, field)
      res.json({ info })
    } catch (error) {
      console.error(`Failed to fetch ${label} info:`, error)
      res.status(500).json({ error: `Misslyckades hämta ${label}-information` })
    }
  }
}

function createDistributionUpdateHandler(updateDistribution, fallbackMessage, wrapInfo = false) {
  return async (req, res) => {
    try {
      const result = await updateDistribution(req.params.id)
      res.json(wrapInfo ? { ok: true, info: result } : result)
    } catch (error) {
      console.error(`Failed to update distribution for ${req.params.id}:`, error)
      res.status(500).json({ error: error.message || fallbackMessage })
    }
  }
}

function createSuggestionHandler({ buildSingle, buildMulti, fallbackMessage }) {
  return async (req, res) => {
    try {
      const {
        templateKey,
        stake,
        maxCost,
        maxBudget,
        mode,
        modes,
        multi,
        variantCount,
        userSeeds
      } = req.body || {}

      const baseOptions = {
        templateKey,
        stake,
        maxCost,
        maxBudget,
        userSeeds
      }

      const wantsMulti = multi === true || (Array.isArray(modes) && modes.length > 0)

      if (wantsMulti) {
        const result = await buildMulti(req.params.id, {
          ...baseOptions,
          modes,
          variantCount
        })
        if (result?.error) {
          return res.status(400).json(result)
        }
        return res.json(result)
      }

      const suggestion = await buildSingle(req.params.id, {
        ...baseOptions,
        mode
      })
      if (suggestion?.error) {
        return res.status(400).json(suggestion)
      }
      res.json(suggestion)
    } catch (error) {
      console.error('Failed to build suggestion:', error)
      res.status(500).json({ error: fallbackMessage })
    }
  }
}

router.get('/v85/templates', createTemplateHandler(listV85Templates, 'V85'))
router.get('/v86/templates', createTemplateHandler(listV86Templates, 'V86'))

router.get('/:id/v85/info', validateObjectIdParam('id'), createInfoHandler('v85Info', 'V85'))
router.get('/:id/v86/info', validateObjectIdParam('id'), createInfoHandler('v86Info', 'V86'))

router.get('/:id/v86/pairing', validateObjectIdParam('id'), async (req, res) => {
  try {
    const result = await getV86PairingForRaceday(req.params.id)
    res.json(result)
  } catch (error) {
    console.error('Failed to fetch V86 pairing:', error)
    res.status(500).json({ error: 'Misslyckades hämta V86-parning' })
  }
})

router.get('/:id/v86/game', validateObjectIdParam('id'), async (req, res) => {
  try {
    const result = await getV86GameViewForRaceday(req.params.id)
    res.json(result)
  } catch (error) {
    console.error('Failed to fetch V86 game view:', error)
    res.status(500).json({ error: 'Misslyckades hämta V86-game view' })
  }
})

router.post('/:id/v85/update', validateObjectIdParam('id'), createDistributionUpdateHandler(
  updateV85DistributionForRaceday,
  'Misslyckades att uppdatera V85%',
  true
))

router.post('/:id/v86/update', validateObjectIdParam('id'), createDistributionUpdateHandler(
  updateV86DistributionForRaceday,
  'Misslyckades att uppdatera V86%'
))

router.post('/:id/v85', validateObjectIdParam('id'), createSuggestionHandler({
  buildSingle: buildV85Suggestion,
  buildMulti: buildV85Suggestions,
  fallbackMessage: 'Det gick inte att skapa V85-spelförslag'
}))

router.post('/:id/v86', validateObjectIdParam('id'), createSuggestionHandler({
  buildSingle: buildV86Suggestion,
  buildMulti: buildV86Suggestions,
  fallbackMessage: 'Det gick inte att skapa V86-spelförslag'
}))

export default router
