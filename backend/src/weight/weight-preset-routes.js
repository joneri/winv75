import express from 'express'
import { getRequestUser, hasRole } from '../utils/request-user.js'
import { createPreset, getPresetById, listPresetsForUser } from './weight-preset-service.js'
import { listSessionsForRace, recordWeightSession } from './weight-session-service.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const user = getRequestUser(req)
    const presets = await listPresetsForUser(user)
    res.json({ presets, user })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const user = getRequestUser(req)
    const { name, description, scope = 'personal', weights, signalsVersion } = req.body || {}
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' })
    }
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({ error: 'weights is required' })
    }

    const normalizedScope = ['system', 'team', 'personal'].includes(scope) ? scope : 'personal'

    if (normalizedScope === 'system' && !hasRole(user, 'analyst')) {
      return res.status(403).json({ error: 'Endast Analyst eller högre får spara system-preset' })
    }
    if (normalizedScope === 'team') {
      if (!hasRole(user, 'analyst')) {
        return res.status(403).json({ error: 'Endast Analyst eller högre får spara team-preset' })
      }
      if (!user.teamId) {
        return res.status(400).json({ error: 'Team-preset kräver att teamId anges' })
      }
    }

    const preset = await createPreset({
      name,
      description,
      scope: normalizedScope,
      weights,
      signalsVersion,
      user,
      teamId: user.teamId
    })
    res.status(201).json(preset)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/manifest', async (req, res, next) => {
  try {
    const user = getRequestUser(req)
    const preset = await getPresetById(req.params.id, user)
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' })
    }
    const manifest = {
      id: preset.id,
      name: preset.name,
      scope: preset.scope,
      description: preset.description,
      weights: preset.weights,
      signalsVersion: preset.signalsVersion,
      metadata: {
        ownerId: preset.ownerId,
        teamId: preset.teamId,
        savedAt: preset.updatedAt,
        createdAt: preset.createdAt,
        locked: preset.locked
      }
    }
    res.json(manifest)
  } catch (err) {
    next(err)
  }
})

router.post('/sessions', async (req, res, next) => {
  try {
    const user = getRequestUser(req)
    const payload = req.body || {}
    const session = await recordWeightSession({
      raceId: payload.raceId,
      signalVersion: payload.signalVersion,
      user,
      preset: payload.preset,
      durationMs: payload.durationMs,
      changes: payload.changes,
      dominanceSignals: payload.dominanceSignals,
      weights: payload.weights,
      summary: payload.summary,
      notes: payload.notes
    })
    res.status(201).json({ id: session.id, createdAt: session.createdAt })
  } catch (err) {
    next(err)
  }
})

router.get('/sessions', async (req, res, next) => {
  try {
    const user = getRequestUser(req)
    if (!hasRole(user, 'analyst')) {
      return res.status(403).json({ error: 'Endast Analyst eller högre får hämta sessioner' })
    }
    const { raceId, limit } = req.query
    const sessions = await listSessionsForRace({ raceId, limit })
    res.json({ sessions })
  } catch (err) {
    next(err)
  }
})

export default router
