import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Horse from './horse-model.js'
import HorseRating from './horse-rating-model.js'
import RatingMeta from './rating-meta-model.js'
import { fileURLToPath } from 'url'
import {
  processRace,
  DEFAULT_K,
  DEFAULT_DECAY_DAYS
} from '../rating/elo-engine.js'
import { seedFromHorseDoc } from '../rating/rating-seed.js'
import { classFactorFromPurse } from '../rating/class-factor.js'

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const updateRatings = async (
  k = DEFAULT_K,
  decayDays = DEFAULT_DECAY_DAYS,
  syncHorses = true,
  { disconnect = false, fullRecalc = false } = {}
) => {
  await ensureConnection()

  const lastDate = !fullRecalc
    ? (await RatingMeta.findById('elo'))?.lastProcessedRaceDate || new Date(0)
    : new Date(0)

  const pipeline = [
    { $unwind: '$results' },
    { $project: {
        horseId: '$id',
        raceId: '$results.raceInformation.raceId',
        raceDate: '$results.raceInformation.date',
        placement: {
          $cond: [
            { $eq: ['$results.placement.sortValue', 99] },
            null,
            '$results.placement.sortValue'
          ]
        },
        withdrawn: '$results.withdrawn',
        prize: '$results.prizeMoney.sortValue'
    } },
    { $match: { withdrawn: { $ne: true }, raceDate: { $gt: lastDate } } },
    { $group: {
        _id: '$raceId',
        raceDate: { $first: '$raceDate' },
        topPrize: { $max: '$prize' },
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
  // Seed any horses missing ratings using ST points
  const allHorses = await Horse.find({}, { id: 1, points: 1 }).lean()
  let seededCount = 0
  for (const h of allHorses) {
    const key = String(h.id)
    if (!ratings.has(key)) {
      const seed = seedFromHorseDoc(h)
      ratings.set(key, { rating: seed, numberOfRaces: 0, seedRating: seed })
      seededCount++
    }
  }

  let raceCount = 0
  for (const race of races) {
    const placements = {}
    for (const h of race.horses) {
      placements[h.horseId] = h.placement
    }
    const classFactor = classFactorFromPurse(race.topPrize)
    processRace(placements, ratings, {
      k,
      raceDate: race.raceDate,
      decayDays,
      classFactor
    })
    raceCount++
  }

  const bulk = HorseRating.collection.initializeUnorderedBulkOp()
  const horseBulk = Horse.collection.initializeUnorderedBulkOp()
  for (const [horseId, info] of ratings.entries()) {
    bulk.find({ horseId: Number(horseId) }).upsert().updateOne({
      $set: {
        rating: info.rating,
        numberOfRaces: info.numberOfRaces,
        lastUpdated: new Date(),
        ...(info.seedRating ? { seedRating: info.seedRating } : {})
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

  console.log(`Processed ${raceCount} races, updated ${ratings.size} horses, seeded ${seededCount} new ratings`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = process.env.ELO_K ? Number(process.env.ELO_K) : DEFAULT_K
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  const fullRecalc = process.argv.includes('--full')
  updateRatings(k, decayDays, true, { disconnect: true, fullRecalc }).then(() => {
    console.log('Horse ratings updated')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to update horse ratings', err)
    process.exit(1)
  })
}

export default updateRatings
