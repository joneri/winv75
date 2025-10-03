import express from 'express'
import Driver from './driver-model.js'

const router = express.Router()

router.get('/ratings', async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : []
    const query = ids.length ? { _id: { $in: ids } } : {}
    const drivers = await Driver.find(query, '_id elo careerElo eloUpdatedAt').lean()
    res.json(drivers.map(d => ({
      id: d._id,
      elo: d.elo,
      careerElo: d.careerElo ?? null,
      eloUpdatedAt: d.eloUpdatedAt || null
    })))
  } catch (error) {
    console.error('Error fetching driver elo ratings:', error)
    res.status(500).send('Failed to fetch driver ratings.')
  }
})

router.put('/:id/elo', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid driver id' })
    }

    const { elo, careerElo } = req.body || {}
    if (!Number.isFinite(Number(elo))) {
      return res.status(400).json({ error: 'elo is required and must be numeric' })
    }

    const update = {
      elo: Math.round(Number(elo)),
      eloUpdatedAt: new Date()
    }

    if (careerElo != null && Number.isFinite(Number(careerElo))) {
      update.careerElo = Math.round(Number(careerElo))
    }

    const driver = await Driver.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    res.json({
      id: driver._id,
      elo: driver.elo,
      careerElo: driver.careerElo ?? null,
      eloUpdatedAt: driver.eloUpdatedAt || null
    })
  } catch (error) {
    console.error('Error updating driver elo:', error)
    res.status(500).json({ error: 'Failed to update driver elo.' })
  }
})

export default router
