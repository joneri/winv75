import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import connectDB from './config/db.js'

import horseRoutes from './horse/horse-routes.js'
import startlistRoutes from './startlist/startlist-routes.js'

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

app.use('/api/horses', horseRoutes)
app.use('/api/startlists', startlistRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})