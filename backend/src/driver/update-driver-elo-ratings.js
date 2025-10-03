import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../config/db.js'
import {
  DEFAULT_K
} from '../rating/elo-engine.js'
import { recomputeDriverRatings } from './driver-elo-service.js'

// Starting rating for all drivers. Lower to allow meaningful drop for
// poor performers and more realistic distribution.
const DEFAULT_RATING = Number(process.env.DRIVER_DEFAULT_RATING || 900)
const DEFAULT_DECAY_DAYS = Number(process.env.DRIVER_ELO_DECAY_DAYS || 365)

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const updateDriverEloRatings = async (
  k = DEFAULT_K,
  decayDays = DEFAULT_DECAY_DAYS,
  { disconnect = false, formDecayDays = Number(process.env.DRIVER_FORM_DECAY_DAYS || 45), formK = Number(process.env.DRIVER_FORM_K || k) } = {}
) => {
  await ensureConnection()

  const { racesProcessed, driversUpdated, distribution } = await recomputeDriverRatings({
    k,
    decayDays,
    formDecayDays,
    formK
  })

  console.log(
    `Rating distribution - min: ${distribution.min}, max: ${distribution.max}, median: ${distribution.median}`
  )
  console.log(`Processed ${racesProcessed} races, updated ${driversUpdated} drivers`)

  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = process.env.DRIVER_ELO_K ? Number(process.env.DRIVER_ELO_K) : DEFAULT_K
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  const formDecayDays = process.env.DRIVER_FORM_DECAY_DAYS ? Number(process.env.DRIVER_FORM_DECAY_DAYS) : 45
  const formK = process.env.DRIVER_FORM_K ? Number(process.env.DRIVER_FORM_K) : k
  updateDriverEloRatings(k, decayDays, { disconnect: true, formDecayDays, formK }).then(() => {
    console.log('Driver Elo ratings updated')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update driver Elo ratings', err)
    process.exit(1)
  })
}

export default updateDriverEloRatings
