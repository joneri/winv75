import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Horse from './horse-model.js'
import HorseRating from './horse-rating-model.js'
import RatingMeta from './rating-meta-model.js'
import { expectedScore } from '../rating/elo-utils.js'
import { fileURLToPath } from 'url'

const DEFAULT_K = 20
const DEFAULT_DECAY_DAYS = 365

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

const processRace = (horsePlacements, ratings, k, raceDate, decayDays) => {
  const deltas = {}
  const ids = Object.keys(horsePlacements)
  const weight = getRecencyWeight(raceDate, decayDays)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]
      const idB = ids[j]
      const placeA = horsePlacements[idA]
      const placeB = horsePlacements[idB]
      if (placeA == null || placeB == null) continue
      const entryA = ratings.get(idA) || { rating: 1000, numberOfRaces: 0 }
      const entryB = ratings.get(idB) || { rating: 1000, numberOfRaces: 0 }
      const ratingA = entryA.rating
      const ratingB = entryB.rating
      let outcomeA = 0.5
      if (placeA < placeB) outcomeA = 1
      else if (placeA > placeB) outcomeA = 0
      const expectedA = expectedScore(ratingA, ratingB)
      const expectedB = 1 - expectedA
      const outcomeB = 1 - outcomeA
      const factorA = getExperienceMultiplier(entryA.numberOfRaces)
      const factorB = getExperienceMultiplier(entryB.numberOfRaces)
      const deltaA = weight * k * factorA * (outcomeA - expectedA)
      const deltaB = weight * k * factorB * (outcomeB - expectedB)
      deltas[idA] = (deltas[idA] || 0) + deltaA
      deltas[idB] = (deltas[idB] || 0) + deltaB
    }
  }
  for (const id of ids) {
    const base = ratings.get(id) || { rating: 1000, numberOfRaces: 0 }
    base.rating += deltas[id] || 0
    base.numberOfRaces += 1
    ratings.set(id, base)
  }
}

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const updateRatings = async (
  k = DEFAULT_K,
  decayDays = DEFAULT_DECAY_DAYS,
  syncHorses = true,
  { disconnect = false } = {}
) => {
  await ensureConnection()

  const meta = await RatingMeta.findById('elo')
  const lastDate = meta?.lastProcessedRaceDate || new Date(0)

  const pipeline = [
    { $unwind: '$results' },
    { $project: {
        horseId: '$id',
        raceId: '$results.raceInformation.raceId',
        raceDate: '$results.raceInformation.date',
        placement: '$results.placement.sortValue',
        withdrawn: '$results.withdrawn'
    } },
    { $match: { withdrawn: { $ne: true }, raceDate: { $gt: lastDate } } },
    { $group: {
        _id: '$raceId',
        raceDate: { $first: '$raceDate' },
        horses: { $push: { horseId: '$horseId', placement: '$placement' } }
    } },
    { $sort: { raceDate: 1 } }
  ]

  const races = await Horse.aggregate(pipeline)

  const ratings = new Map()
  const existing = await HorseRating.find().lean()
  for (const doc of existing) {
    ratings.set(String(doc.horseId), { rating: doc.rating, numberOfRaces: doc.numberOfRaces })
  }

  let raceCount = 0
  for (const race of races) {
    const placements = {}
    for (const h of race.horses) {
      placements[h.horseId] = h.placement
    }
    processRace(placements, ratings, k, race.raceDate, decayDays)
    raceCount++
  }

  const bulk = HorseRating.collection.initializeUnorderedBulkOp()
  const horseBulk = Horse.collection.initializeUnorderedBulkOp()
  for (const [horseId, info] of ratings.entries()) {
    bulk.find({ horseId: Number(horseId) }).upsert().updateOne({
      $set: {
        rating: info.rating,
        numberOfRaces: info.numberOfRaces,
        lastUpdated: new Date()
      }
    })
    if (syncHorses) {
      horseBulk.find({ id: Number(horseId) }).updateOne({
        $set: { rating: info.rating }
      })
    }
  }
  if (bulk.length > 0) await bulk.execute()
  if (syncHorses && horseBulk.length > 0) await horseBulk.execute()

  const lastRaceDate = races.length > 0 ? races[races.length - 1].raceDate : lastDate
  await RatingMeta.updateOne({ _id: 'elo' }, { lastProcessedRaceDate: lastRaceDate }, { upsert: true })

  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  console.log(`Processed ${raceCount} races, updated ${ratings.size} horses`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = process.env.ELO_K ? Number(process.env.ELO_K) : DEFAULT_K
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  updateRatings(k, decayDays, true, { disconnect: true }).then(() => {
    console.log('Horse ratings updated')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update horse ratings', err)
    process.exit(1)
  })
}

export default updateRatings
