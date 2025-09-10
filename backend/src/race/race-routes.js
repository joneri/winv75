import express from 'express'
import raceService from './race-service.js'
import eloService from '../rating/elo-service.js'
import { validateNumericParam } from '../middleware/validators.js'
import { buildRaceInsights } from './race-insights.js'
import { generateHorseSummary } from '../ai-horse-summary.js'
import Raceday from '../raceday/raceday-model.js'
import Horse from '../horse/horse-model.js'
import HorseRating from '../horse/horse-rating-model.js'

const router = express.Router()

// AI: per-horse summary endpoint
router.post('/horse-summary', async (req, res) => {
  try {
    const payload = req.body || {}
    const { raceId, horseId } = payload
    if (!raceId || !horseId) return res.status(400).json({ error: 'raceId and horseId required' })

    // Build field ELO context and enrich prompt inputs from our own store only
    const raceday = await Raceday.findOne({ 'raceList.raceId': Number(raceId) })
    if (!raceday) return res.status(404).json({ error: 'Race not found' })
    const race = (raceday.raceList || []).find(r => String(r.raceId) === String(raceId))
    if (!race) return res.status(404).json({ error: 'Race not found' })

    const field = race.horses || []
    const elos = field.map(h => Number(h.rating || h.eloRating || 0)).filter(n => n > 0)
    const avg = elos.length ? elos.reduce((a, b) => a + b, 0) / elos.length : 0
    const sorted = [...elos].sort((a, b) => a - b)
    const median = sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2 : 0

    const me = field.find(h => String(h.id) === String(horseId)) || {}
    const percentile = elos.length ? Math.round((elos.filter(v => v <= (me.rating || me.eloRating || 0)).length / elos.length) * 100) : 0

    const startMethod = (race.propTexts || []).some(pt => /Autostart/i.test(pt.text || '')) ? 'Autostart' : 'Voltstart'
    const startPosition = me.actualStartPosition ?? me.startPosition ?? null

    // Past comments: prefer non-empty payload.pastRaceComments; fallback to persisted ATG comments from DB
    const horseDoc = await Horse.findOne({ id: Number(horseId) }, { atgPastComments: 1, results: 1, name: 1 }).lean()
    const requestComments = (payload.pastRaceComments || '').trim()
    const dbComments = (horseDoc?.atgPastComments || [])
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6)
      .map(c => `${c.date ? new Date(c.date).toISOString().slice(0,10) : ''}: ${c.comment}`)
      .join('\n')
    const pastComments = requestComments.length ? requestComments : dbComments

    // ELO extras: rank in field, delta to top, and implied win probability (Bradley-Terry approximation)
    const withIds = (field || []).map(h => ({ id: String(h.id), rating: Number(h.rating || h.eloRating || 0) }))
    const sortedDesc = [...withIds].sort((a, b) => b.rating - a.rating)
    const horseRating = Number(me.rating || me.eloRating || 0)
    const rank = sortedDesc.findIndex(h => h.id === String(horseId)) + 1 || 0
    const topRating = sortedDesc[0]?.rating || 0
    const deltaToTop = topRating - horseRating
    const scores = withIds.map(h => Math.pow(10, (h.rating || 0) / 400))
    const sumScores = scores.reduce((a, b) => a + b, 0) || 1
    const horseScore = Math.pow(10, (horseRating || 0) / 400)
    const impliedWinPct = Math.round((horseScore / sumScores) * 100)

    const promptInputs = {
      ...payload,
      conditions: payload.conditions || [],
      pastRaceComments: pastComments,
      trackName: race.trackName || raceday.trackName || '',
      fieldEloExtras: {
        rank,
        fieldSize: withIds.length,
        topRating,
        deltaToTop,
        impliedWinPct
      }
    }
    const summary = await generateHorseSummary(promptInputs)
    if (!summary || typeof summary !== 'string') {
      return res.status(502).json({ error: 'AI summary service returned no text' })
    }

    // Persist per user per horse per race
    const userId = String(req.headers['x-user-id'] || 'anon')
    race.horses = (race.horses || []).map(h => {
      if (String(h.id) === String(horseId)) {
        h.aiSummary = summary
        h.aiSummaryMeta = {
          generatedAt: new Date(),
          userId,
          context: {
            raceId: Number(raceId),
            horseId: Number(horseId),
            programNumber: h.programNumber,
            startMethod,
            startPosition,
            baseDistance: race.distance,
            actualDistance: h.actualDistance,
            eloRating: h.rating || h.eloRating,
            driverElo: h.driver?.elo,
            fieldElo: { avg, median, percentile },
            fieldEloExtras: { rank, fieldSize: withIds.length, topRating, deltaToTop, impliedWinPct },
            hasOpenStretch: !!payload.hasOpenStretch,
            openStretchLanes: payload.openStretchLanes || (payload.hasOpenStretch ? 1 : 0),
            trackLengthMeters: payload.trackLengthMeters || race.trackLength || undefined,
            usedPastComments: !!pastComments
           }
         }
       }
       return h
     })
    await raceday.save()

    res.json({ summary, saved: true })
  } catch (err) {
    console.error('Failed to generate horse AI summary', err)
    res.status(500).json({ error: 'Failed to generate AI summary' })
  }
})

// New: per-race AI list endpoint
router.get('/:id/ai-list', validateNumericParam('id'), async (req, res) => {
  try {
    const raceId = Number(req.params.id)
    const insights = await buildRaceInsights(raceId)
    if (!insights) return res.status(404).send('Race not found')
    res.json(insights)
  } catch (error) {
    console.error('Error building AI list:', error)
    res.status(500).send('Failed to build AI list')
  }
})

// Fetch a specific race by its ID
router.get('/:id', validateNumericParam('id'), async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const raceId = req.params.id;
        const race = await raceService.getRaceById(raceId)
        if (race) {
            try {
                const horseIds = (race.horses || []).map(h => h.id)
                if (horseIds.length) {
                    const ratingDocs = await HorseRating.find({ horseId: { $in: horseIds } }).lean()
                    const map = new Map(ratingDocs.map(r => [r.horseId, r]))
                    race.horses = (race.horses || []).map(h => ({
                        ...h,
                        rating: map.get(h.id)?.rating ?? h.rating,
                        eloRating: map.get(h.id)?.rating ?? h.eloRating,
                        formRating: map.get(h.id)?.formRating ?? map.get(h.id)?.rating ?? h.formRating
                    }))
                }
            } catch (e) {
                console.warn('Failed enriching race horses with ratings', e)
            }
            res.send(race)
        } else {
            res.status(404).send('Race not found.')
        }
    } catch (error) {
        console.error(`Error fetching race with ID ${req.params.id}:`, error)
        res.status(500).send('Failed to fetch race. Please try again.')
    }
})

// Update Elo ratings for a race
router.post('/:id/results', validateNumericParam('id'), async (req, res) => {
    try {
        const raceData = req.body
        if (!raceData || !Array.isArray(raceData.horses)) {
            return res.status(400).send('Invalid race data')
        }
        const updated = await eloService.updateRatingsForRace(req.params.id, raceData)
        res.json(updated)
    } catch (error) {
        console.error(`Error updating ratings for race ${req.params.id}:`, error)
        res.status(500).send('Failed to update ratings')
    }
})

// Fetch saved AI summary/meta for a specific horse in a race
router.get('/:id/horse/:horseId/summary', async (req, res) => {
  try {
    const raceId = Number(req.params.id)
    const horseId = Number(req.params.horseId)
    const raceday = await Raceday.findOne({ 'raceList.raceId': raceId })
    if (!raceday) return res.status(404).json({ error: 'Race not found' })
    const race = (raceday.raceList || []).find(r => r.raceId === raceId)
    if (!race) return res.status(404).json({ error: 'Race not found' })
    const horse = (race.horses || []).find(h => h.id === horseId)
    if (!horse) return res.status(404).json({ error: 'Horse not found' })
    res.json({ summary: horse.aiSummary || '', meta: horse.aiSummaryMeta || null })
  } catch (e) {
    console.error('Failed fetching saved AI summary', e)
    res.status(500).json({ error: 'Failed fetching saved AI summary' })
  }
})

// Fetch saved ATG past comments for a horse
router.get('/horse/:horseId/past-comments', async (req, res) => {
  try {
    const horseId = Number(req.params.horseId)
    const horse = await Horse.findOne({ id: horseId }, { atgPastComments: 1 }).lean()
    res.json({ comments: horse?.atgPastComments || [] })
  } catch (e) {
    console.error('Failed fetching past comments', e)
    res.status(500).json({ error: 'Failed fetching past comments' })
  }
})

export default router
