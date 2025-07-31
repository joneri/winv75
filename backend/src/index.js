import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import connectDB from './config/db.js'

// Routes
import horseRoutes from './horse/horse-routes.js'
import racedayRoutes from './raceday/raceday-routes.js'
import raceRoutes from './race/race-routes.js'
import trackRoutes from './track/track-routes.js'
import eloRoutes from './rating/elo-routes.js'
import driverRoutes from './driver/driver-routes.js'
import { startRatingsCronJob } from './rating/ratings-scheduler.js'
import { startDriverCronJob } from './driver/scheduler.js'

// Middleware
import errorHandler from './middleware/errorHandler.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '2mb' }));
connectDB()
startRatingsCronJob()

app.use(cors())
app.get('/', (req, res) => {
  res.send('200 OK')
})

// API routes
app.use('/api/horses', horseRoutes)
app.use('/api/raceday', racedayRoutes)
app.use('/api/race', raceRoutes)
app.use('/api/track', trackRoutes)
app.use('/api/rating', eloRoutes)
app.use('/api/driver', driverRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
startDriverCronJob()