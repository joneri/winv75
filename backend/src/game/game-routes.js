import express from 'express'
import { validateObjectIdParam } from '../middleware/validators.js'
import gameService from './game-service.js'

const router = express.Router()

router.get('/:racedayId', validateObjectIdParam('racedayId'), async (req, res) => {
  try {
    const data = await gameService.mapGamesForRaceday(req.params.racedayId)
    res.json(data)
  } catch (err) {
    console.error('Error fetching game types:', err)
    res.status(500).send('Failed to fetch spelformer')
  }
})

export default router
