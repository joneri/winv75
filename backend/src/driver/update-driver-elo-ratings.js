import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../config/db.js'
import Driver from './driver-model.js'
import { expectedScore } from '../rating/elo-utils.js'

const DEFAULT_K = 20
const DEFAULT_RATING = 1400
const DEFAULT_DECAY_DAYS = 365
const MIN_RACES = 5

const getRecencyWeight = (date, decayDays = DEFAULT_DECAY_DAYS) => {
  const diff = Date.now() - new Date(date).getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return Math.exp(-days / decayDays)
}

const getExperienceMultiplier = (races) => {
  if (races < 5) return 1.5
  if (races < 20) return 1.2
  return 1
}

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const processRace = (placements, ratings, k, raceDate, decayDays) => {
  const ids = Object.keys(placements)
  const deltas = {}
  const weight = getRecencyWeight(raceDate, decayDays)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]
      const idB = ids[j]
      const placeA = placements[idA]
      const placeB = placements[idB]
      if (placeA == null || placeB == null) continue
      const entryA = ratings.get(idA) || { rating: DEFAULT_RATING, races: 0 }
      const entryB = ratings.get(idB) || { rating: DEFAULT_RATING, races: 0 }
      const ratingA = entryA.rating
      const ratingB = entryB.rating
      let outcomeA = 0.5
      if (placeA < placeB) outcomeA = 1
      else if (placeA > placeB) outcomeA = 0
      const expectedA = expectedScore(ratingA, ratingB)
      const expectedB = 1 - expectedA
      const outcomeB = 1 - outcomeA
      const factorA = getExperienceMultiplier(entryA.races)
      const factorB = getExperienceMultiplier(entryB.races)
      const deltaA = weight * k * factorA * (outcomeA - expectedA)
      const deltaB = weight * k * factorB * (outcomeB - expectedB)
      deltas[idA] = (deltas[idA] || 0) + deltaA
      deltas[idB] = (deltas[idB] || 0) + deltaB
    }
  }
  for (const id of ids) {
    const base = ratings.get(id) || { rating: DEFAULT_RATING, races: 0 }
    base.rating += deltas[id] || 0
    base.races += 1
    ratings.set(id, base)
  }
}

const updateDriverEloRatings = async (
  k = DEFAULT_K,
  decayDays = DEFAULT_DECAY_DAYS,
  { disconnect = false } = {}
) => {
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
    processRace(race.placements, ratings, k, race.date, decayDays)
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
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  updateDriverEloRatings(k, decayDays, { disconnect: true }).then(() => {
    console.log('Driver Elo ratings updated')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update driver Elo ratings', err)
    process.exit(1)
  })
}

export default updateDriverEloRatings
