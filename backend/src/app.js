import express from 'express'
import cors from 'cors'

import horseRoutes from './horse/horse-routes.js'
import racedayRoutes from './raceday/raceday-routes.js'
import raceRoutes from './race/race-routes.js'
import trackRoutes from './track/track-routes.js'
import eloRoutes from './rating/elo-routes.js'
import driverRoutes from './driver/driver-routes.js'
import gameRoutes from './game/game-routes.js'
import searchRoutes from './search/search-routes.js'
import errorHandler from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '2mb' }))
  app.use(cors())

  app.get('/', (_req, res) => {
    res.send('200 OK')
  })

  app.use('/api/horses', horseRoutes)
  app.use('/api/raceday', racedayRoutes)
  app.use('/api/race', raceRoutes)
  app.use('/api/track', trackRoutes)
  app.use('/api/rating', eloRoutes)
  app.use('/api/driver', driverRoutes)
  app.use('/api/spelformer', gameRoutes)
  app.use('/api/search', searchRoutes)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' })
  })

  app.use(errorHandler)

  return app
}

export default createApp
