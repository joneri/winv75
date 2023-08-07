import express from 'express'
import startlistService from './startlist-service.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    console.log('req', req.body)
    const startlistData = req.body
    const result = await startlistService.upsertStartlistData(startlistData)
    res.send(result)
  } catch (error) {
    res.status(500).send(error + "Failed to update/start the startlist. Please try again.")
  }
})

export default router