import express from 'express'
import cors from 'cors'

import errorHandler from './middleware/errorHandler.js'
import { registerApiRoutes } from './startup/register-api-routes.js'

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '2mb' }))
  app.use(cors())

  app.get('/', (_req, res) => {
    res.send('200 OK')
  })

  registerApiRoutes(app)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' })
  })

  app.use(errorHandler)

  return app
}

export default createApp
