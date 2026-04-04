import { config } from 'dotenv'
import connectDB from './config/db.js'
import createApp from './app.js'

import { startRatingsCronJob } from './rating/ratings-scheduler.js'
import { startDriverCronJob } from './driver/scheduler.js'

config()

const app = createApp()
const PORT = process.env.PORT || 3001

connectDB()
startRatingsCronJob()
startDriverCronJob()

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
