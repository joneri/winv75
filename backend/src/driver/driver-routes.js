import express from 'express'
import Driver from './driver-model.js'

const router = express.Router()

router.get('/ratings', async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : []
    const query = ids.length ? { _id: { $in: ids } } : {}
    const drivers = await Driver.find(query, '_id elo').lean()
    res.json(drivers.map(d => ({ id: d._id, elo: d.elo })))
  } catch (error) {
    console.error('Error fetching driver elo ratings:', error)
    res.status(500).send('Failed to fetch driver ratings.')
  }
})

export default router
