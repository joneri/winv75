import express from 'express'
import horseService from './horse-service.js'
import axios from 'axios'

const router = express.Router()

router.put('/:horseId', async (req, res) => {
    try {
        console.log('req:', req.originalUrl)
        const horseId = req.params.horseId
        // Handle the fetched horse data (e.g., upsert to your database)
        const result = await horseService.upsertHorseData(horseId)

        res.send(result);
    } catch (error) {
        console.error('Error fetching or upserting horse data:', error)
        res.status(500).send('Failed to fetch or upsert horse data.')
    }
})

router.get('/:horseId', async (req, res) => {
    let horseId
    try {
        console.log('req:', req.originalUrl)
        const horseId = req.params.horseId
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
