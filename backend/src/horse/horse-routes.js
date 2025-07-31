import express from 'express'
import horseService from './horse-service.js'
import HorseRating from './horse-rating-model.js'
import { validateNumericParam } from '../middleware/validators.js'

const router = express.Router()

router.get('/ratings', async (req, res) => {
    try {
        const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : undefined
        const ratings = await HorseRating.find(ids ? { horseId: { $in: ids } } : {}).lean()
        res.json(ratings.map(r => ({ id: r.horseId, rating: r.rating })))
    } catch (error) {
        console.error('Error fetching horse ratings:', error)
        res.status(500).send('Failed to fetch horse ratings.')
    }
})

router.get('/scores', async (req, res) => {
    try {
        const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : undefined
        const minScore = req.query.minScore ? parseFloat(req.query.minScore) : undefined
        const horses = await horseService.getHorsesByScore({ ids, minScore })
        res.json(horses)
    } catch (error) {
        console.error('Error fetching horse scores:', error)
        res.status(500).send('Failed to fetch horse scores.')
    }
})

router.get('/rankings/:raceId', validateNumericParam('raceId'), async (req, res) => {
    let rankings
    try {
        const raceId = req.params.raceId
        console.log('req:', req.originalUrl, 'raceId:', raceId)
        rankings = await horseService.getHorseRankings(raceId)
        res.status(200).json(rankings)
    } catch (error) {
        const errorMessage = `Error fetching horse rankings: ${error}`
        console.error(errorMessage)
        res.status(500).send('Failed to fetch horse data.')
    }
})

router.put('/:horseId', validateNumericParam('horseId'), async (req, res) => {
    try {
        console.log('req:', req.originalUrl)
        const horseId = req.params.horseId
        const result = await horseService.upsertHorseData(horseId)

        res.send(result);
    } catch (error) {
        console.error('Error fetching or upserting horse data:', error)
        res.status(500).send('Failed to fetch or upsert horse data.')
    }
})

router.get('/:horseId', validateNumericParam('horseId'), async (req, res) => {
    let horseId
    try {
        console.log('req:', req.originalUrl)
        horseId = req.params.horseId
        const horse = await horseService.getHorseData(horseId)

        if (!horse) {
            return res.status(404).send('Horse not found.')
        }

        res.send(horse)
    } catch (error) {
        const errorMessage = horseId 
            ? `Error fetching horse data for id ${horseId}: ${error}` 
            : `Error fetching horse data: ${error}`
        console.error(errorMessage)
        res.status(500).send('Failed to fetch horse data.')
    }
})

export default router
