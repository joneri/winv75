import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../config/db.js'
import Driver from './driver-model.js'
import {
  processRace,
  DEFAULT_K
} from '../rating/elo-engine.js'

const DEFAULT_RATING = 1400
const MIN_RACES = 5

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}


const updateDriverEloRatings = async (k = DEFAULT_K, { disconnect = false } = {}) => {
  await ensureConnection()

  const cursor = Driver.find({}, { _id: 1, results: 1 }).lean().cursor()
  const races = new Map()
  const seenDrivers = new Set()

  for await (const driver of cursor) {
    const driverId = driver._id
    if (!Array.isArray(driver.results)) continue
    for (const res of driver.results) {
      if (res.withdrawn) continue
      const raceId = res.raceId
      if (raceId == null) continue
      let race = races.get(raceId)
      if (!race) {
        race = { date: res.date, placements: {} }
        races.set(raceId, race)
      }
      const placement = res.placement?.sortValue
      if (typeof placement !== 'number' || placement === 99 || placement <= 0) continue
      race.placements[driverId] = placement
      seenDrivers.add(driverId)
    }
  }

  const raceList = Array.from(races.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const ratings = new Map()

  for (const race of raceList) {
    processRace(race.placements, ratings, {
      k,
      defaultRating: DEFAULT_RATING,
      raceDate: race.date
    })
  }

  const bulk = Driver.collection.initializeUnorderedBulkOp()
  for (const driverId of seenDrivers) {
    const info = ratings.get(String(driverId)) || { rating: DEFAULT_RATING, races: 0 }
    const elo = info.races < MIN_RACES ? DEFAULT_RATING : Math.round(info.rating)
    bulk.find({ _id: driverId }).updateOne({ $set: { elo } })
  }
  if (bulk.length > 0) await bulk.execute()

  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  console.log(`Processed ${raceList.length} races, updated ${seenDrivers.size} drivers`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = process.env.DRIVER_ELO_K ? Number(process.env.DRIVER_ELO_K) : DEFAULT_K
  updateDriverEloRatings(k, { disconnect: true }).then(() => {
    console.log('Driver Elo ratings updated')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update driver Elo ratings', err)
    process.exit(1)
  })
}

export default updateDriverEloRatings
