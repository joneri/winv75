import { config } from 'dotenv'
import connectDB from './config/db.js'
import createApp from './app.js'
import { startActiveSchedulers } from './startup/start-schedulers.js'

config()

const app = createApp()
const PORT = process.env.PORT || 3001

connectDB()
startActiveSchedulers()

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
