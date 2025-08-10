import express from 'express'
import updateRatings from '../horse/update-elo-ratings.js'
import eloService from './elo-service.js'
import { evaluateElo } from './elo-eval.js'
import { startAutoTuneJob, getAutoTuneStatus, cancelAutoTune, hasActiveJob } from './auto-tune.js'

const router = express.Router()

// Trigger Elo ratings recalculation (supports full rebuild via ?full=true)
router.post('/update', async (req, res) => {
  try {
    const isFull = req.query.full === 'true' || req.query.full === '1'
    await updateRatings(undefined, undefined, true, { fullRecalc: isFull })
    res.json({ message: isFull ? 'Ratings fully rebuilt' : 'Ratings updated' })
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

// Evaluate Elo RMSE over a date range with tunable class settings (no DB writes)
router.get('/eval', async (req, res) => {
  try {
    const { from, to, k, decayDays, classMin, classMax, classRef, kClassMultiplier } = req.query
    const result = await evaluateElo({
      from,
      to,
      k: k ? Number(k) : undefined,
      decayDays: decayDays ? Number(decayDays) : undefined,
      classMin: classMin ? Number(classMin) : undefined,
      classMax: classMax ? Number(classMax) : undefined,
      classRef: classRef ? Number(classRef) : undefined,
      kClassMultiplier: kClassMultiplier ? Number(kClassMultiplier) : undefined
    })
    res.json(result)
  } catch (err) {
    console.error('Elo evaluation failed', err)
    res.status(500).send('Elo evaluation failed')
  }
})

// Start auto-tune over a grid of parameters
router.post('/auto-tune/start', async (req, res) => {
  try {
    if (hasActiveJob()) return res.status(409).json({ error: 'A job is already running' })
    const { from, to, classMin, classMax, kClassMultiplier, k, decayDays, classRef } = req.body || {}
    const result = await startAutoTuneJob({ from, to, classMin, classMax, kClassMultiplier, k, decayDays, classRef })
    res.json(result)
  } catch (err) {
    console.error('Failed to start auto-tune', err)
    res.status(400).json({ error: err?.message || 'Failed to start auto-tune' })
  }
})

// Get auto-tune status
router.get('/auto-tune/status/:jobId', (req, res) => {
  const job = getAutoTuneStatus(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

// Cancel auto-tune
router.post('/auto-tune/cancel/:jobId', (req, res) => {
  const out = cancelAutoTune(req.params.jobId)
  if (!out.ok) return res.status(400).json(out)
  res.json({ ok: true })
})

export default router
