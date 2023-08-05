import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import connectDB from './config/db.js'

import horseRoutes from './horse/horse-routes.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json());
connectDB()

app.use(cors())
app.get('/', (req, res) => {
  res.send('200 OK')
})
app.use('/api/horses', horseRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})