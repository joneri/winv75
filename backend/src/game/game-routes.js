import express from 'express'
import { validateObjectIdParam } from '../middleware/validators.js'
import gameService from './game-service.js'

const router = express.Router()

router.get('/:racedayId', validateObjectIdParam('racedayId'), async (req, res) => {
  try {
    const data = await gameService.getGameTypesForRaceday(req.params.racedayId)
    res.json(data)
  } catch (err) {
    console.error('Error fetching game types:', err)
    res.status(500).send('Failed to fetch spelformer')
  }
})

router.post('/refresh/:racedayId', validateObjectIdParam('racedayId'), async (req, res) => {
  try {
    const data = await gameService.refreshGameTypesForRaceday(req.params.racedayId)
    res.json(data)
  } catch (err) {
    console.error('Error refreshing game types:', err)
    res.status(500).send('Failed to refresh spelformer')
  }
})

export default router
