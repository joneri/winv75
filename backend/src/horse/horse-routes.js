import express from 'express'
import horseService from './horse-service.js'
import axios from 'axios'

const router = express.Router()

router.get('/:horseId', async (req, res) => {
  try {
      const horseId = req.params.horseId
      // Handle the fetched horse data (e.g., upsert to your database)
      const result = await horseService.upsertHorseData(horseId)

      res.send(result);
  } catch (error) {
      console.error('Error fetching or upserting horse data:', error)
      res.status(500).send('Failed to fetch or upsert horse data.')
  }
})

export default router