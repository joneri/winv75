import express from 'express'
import { config } from 'dotenv'

import horseRoutes from './horse/horse-routes.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json());

// use the routes
app.get('/', (req, res) => {
  res.send('200 OK')
})
app.use('/api/horse', horseRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
