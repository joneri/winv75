import express from 'express'
import horseService from './horse-service.js'
import axios from 'axios'

const router = express.Router()

router.get('/:horseId', async (req, res) => {
  try {
      const horseId = req.params.horseId

      // Fetch the basic horse data from the external API
      const response = await axios.get(`https://api.travsport.se/webapi/horses/basicinformation/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`)
      const initialHorseData = response.data

      // Handle the fetched horse data (e.g., upsert to your database)
      const result = await horseService.upsertHorseData(initialHorseData)

      res.send(result);
  } catch (error) {
      console.error('Error fetching or upserting horse data:', error)
      res.status(500).send('Failed to fetch or upsert horse data.')
  }
})

export default router