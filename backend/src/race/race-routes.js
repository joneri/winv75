import express from 'express'
import raceService from './race-service.js'
import eloService from '../rating/elo-service.js'
import { validateNumericParam } from '../middleware/validators.js'
import { updateDriverRatingsForRace } from '../driver/driver-elo-service.js'
import Horse from '../horse/horse-model.js'
import HorseRating from '../horse/horse-rating-model.js'
import Driver from '../driver/driver-model.js'

const router = express.Router()

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
                    const driverIds = (race.horses || [])
                        .map(h => {
                            const driverId = h?.driver?.licenseId ?? h?.driver?.id
                            const num = Number(driverId)
                            return Number.isFinite(num) ? num : null
                        })
                        .filter(id => id != null)
                    const driverDocs = driverIds.length
                        ? await Driver.find({ _id: { $in: driverIds } }, { _id: 1, elo: 1, careerElo: 1 }).lean()
                        : []
                    const driverMap = new Map(driverDocs.map(d => [Number(d._id), d]))
                    // IMPORTANT: Mongoose subdocuments are not plain objects.
                    // Spreading them (`{...h}`) can drop fields. Convert first.
                    race.horses = (race.horses || []).map(h => {
                        const base = typeof h?.toObject === 'function' ? h.toObject() : h
                        const rated = map.get(base.id)
                        const driverId = Number(base?.driver?.licenseId ?? base?.driver?.id)
                        const driverDoc = Number.isFinite(driverId) ? driverMap.get(driverId) : null
                        return {
                            ...base,
                            rating: rated?.rating ?? base.rating,
                            eloRating: rated?.rating ?? base.eloRating,
                            formRating: rated?.formRating ?? rated?.rating ?? base.formRating,
                            ...(driverDoc ? { driver: { ...base.driver, elo: driverDoc?.elo ?? null, careerElo: driverDoc?.careerElo ?? null } } : {})
                        }
                    })
                }
            } catch (e) {
                console.warn('Failed enriching race horses with ratings', e)
            }
            // Ensure we return a plain JSON object (avoid Mongoose subdoc quirks)
            const payload = typeof race?.toObject === 'function' ? race.toObject() : JSON.parse(JSON.stringify(race))
            // Preserve enriched horses array from above
            if (race?.horses) payload.horses = race.horses
            res.json(payload)
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
        try {
            await updateDriverRatingsForRace(req.params.id, raceData)
        } catch (driverErr) {
            console.error(`Error updating driver ratings for race ${req.params.id}:`, driverErr)
        }
        res.json(updated)
    } catch (error) {
        console.error(`Error updating ratings for race ${req.params.id}:`, error)
        res.status(500).send('Failed to update ratings')
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
