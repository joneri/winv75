import express from 'express'
import service, { listProfiles, getActiveProfile, getProfileByKey, createProfile, updateProfile, duplicateProfile, activateProfile } from './ai-profile-service.js'
import { buildRaceInsights } from '../race/race-insights.js'
import Raceday from '../raceday/raceday-model.js'
import AIProfileHistory from './ai-profile-history-model.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await listProfiles()
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/active', async (req, res) => {
  try {
    const active = await getActiveProfile()
    res.json(active)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:key', async (req, res) => {
  try {
    const item = await getProfileByKey(req.params.key)
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'admin')
    const created = await createProfile(req.body, userId)
    res.status(201).json(created)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/:key/duplicate', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'admin')
    const { newKey } = req.body || {}
    const dup = await duplicateProfile(req.params.key, newKey, userId)
    res.status(201).json(dup)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:key', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'admin')
    const updated = await updateProfile(req.params.key, req.body, userId)
    res.json(updated)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/:key/activate', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'admin')
    const active = await activateProfile(req.params.key, userId)
    res.json(active)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

function computeMetrics(races) {
  const items = []
  for (const r of races) {
    const ranking = r?.ranking || []
    const res = r?.race?.results || []
    if (!ranking.length || !Array.isArray(res) || !res.length) continue
    // Try to find winner horseId; support structures where results include horseId or nested placement
    let winnerId = null
    for (const it of res) {
      const placement = Number(it?.placement?.sortValue || it?.placement || 0)
      const hid = Number(it?.horseId || it?.id || 0)
      if (placement === 1 && hid) { winnerId = hid; break }
    }
    if (!winnerId) continue
    const probs = ranking.map(h => ({ id: Number(h.id), p: Number(h.prob || 0) }))
    const totalP = probs.reduce((a,b)=>a+b.p, 0)
    // Normalize if slight drift
    const norm = totalP > 0 ? totalP : 1
    const brier = probs.reduce((acc, x) => {
      const y = x.id === winnerId ? 1 : 0
      const p = Math.min(1, Math.max(0, x.p / norm))
      return acc + Math.pow(p - y, 2)
    }, 0)
    const pWinner = Math.min(1, Math.max(0, (probs.find(x => x.id === winnerId)?.p || 0) / norm))
    items.push({ raceId: r?.race?.raceId, brier, pWinner })
  }
  const n = items.length || 1
  const avgBrier = items.reduce((a,b)=>a+b.brier, 0) / n
  const rmseWinner = Math.sqrt(items.reduce((a,b)=>a + Math.pow(1 - b.pWinner, 2), 0) / n)
  return { count: items.length, avgBrier, rmseWinner }
}

router.get('/:key/history', async (req, res) => {
  try {
    const key = req.params.key
    const limit = Math.min(200, Number(req.query.limit || 100))
    const items = await AIProfileHistory.find({ profileKey: key }).sort({ at: -1 }).limit(limit).lean()
    res.json({ count: items.length, items })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Preview: run insights for a raceday or date window with settings/profile
router.post('/preview', async (req, res) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'admin')
    const { racedayId, dateFrom, dateTo, profileKey, overrides } = req.body || {}
    let effectiveOverrides = overrides || {}

    if (profileKey) {
      const prof = await getProfileByKey(profileKey)
      if (!prof) return res.status(404).json({ error: 'Profile not found' })
      effectiveOverrides = { ...prof.settings, ...effectiveOverrides, preset: profileKey }
    }

    const races = []
    if (racedayId) {
      const day = await Raceday.findOne({ id: Number(racedayId) }).lean()
      if (!day) return res.status(404).json({ error: 'Raceday not found' })
      for (const r of (day.raceList || [])) {
        const insights = await buildRaceInsights(r.raceId, effectiveOverrides)
        if (insights) races.push(insights)
      }
    } else if (dateFrom || dateTo) {
      const q = {}
      if (dateFrom) q.date = { ...q.date, $gte: new Date(dateFrom) }
      if (dateTo) q.date = { ...q.date, $lte: new Date(dateTo) }
      const days = await Raceday.find(q, { raceList: 1, trackName: 1, date: 1 }).lean()
      for (const d of days) {
        for (const r of (d.raceList || [])) {
          const insights = await buildRaceInsights(r.raceId, effectiveOverrides)
          if (insights) races.push(insights)
        }
      }
    } else {
      return res.status(400).json({ error: 'Provide racedayId or dateFrom/dateTo' })
    }

    const metrics = computeMetrics(races)
    await AIProfileHistory.create({ profileKey: profileKey || 'adhoc', action: 'preview', summary: `Preview run (${metrics.count} races)`, settings: effectiveOverrides, userId })

    res.json({ count: races.length, metrics, races })
  } catch (e) {
    console.error('Preview error', e)
    res.status(500).json({ error: 'Preview failed' })
  }
})

export default router
