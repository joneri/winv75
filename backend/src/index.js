import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import connectDB from './config/db.js'

// Use the renamed modules for imports
import horseRoutes from './horse/horse-routes.js'
import racedayRoutes from './raceday/raceday-routes.js'
import raceRoutes from './race/race-routes.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '2mb' }));
connectDB()

app.use(cors())
app.get('/', (req, res) => {
  res.send('200 OK')
})
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
})

// Update the API endpoint paths
app.use('/api/horses', horseRoutes)
app.use('/api/raceday', racedayRoutes)
app.use('/api/race', raceRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
