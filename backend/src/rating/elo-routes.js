import express from 'express'
import updateRatings from '../horse/update-elo-ratings.js'
import eloService from './elo-service.js'
import { evaluateElo } from './elo-eval.js'

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

export default router
