import express from 'express'
import horseService from './horse-service.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    console.log('req.body', req.body)
    const { horseData } = req.body
    const result = await horseService.upsertHorseData(horseData)
    res.send(result)
  } catch (error) {
    res.status(500).send(error)
  }
})

export default router