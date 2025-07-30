import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../backend/src/config/db.js'
import trackService from '../backend/src/track/track-service.js'

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const updateAll = async ({ disconnect = false } = {}) => {
  await ensureConnection()
  await trackService.updateAllTrackStats()
  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  console.log('Track metadata updated')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateAll({ disconnect: true }).then(() => {
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update track metadata', err)
    process.exit(1)
  })
}

export default updateAll
