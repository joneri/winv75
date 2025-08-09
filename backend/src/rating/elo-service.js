import HorseRating from '../horse/horse-rating-model.js'
import RatingHistory from './rating-history-model.js'
import Horse from '../horse/horse-model.js'
import { processRace, DEFAULT_K, DEFAULT_DECAY_DAYS, DEFAULT_RATING, K_CLASS_MULTIPLIER } from './elo-engine.js'
import { seedFromHorseDoc } from './rating-seed.js'
import { classFactorFromPurse } from './class-factor.js'

const updateRatingsForRace = async (raceId, raceData) => {
  if (!raceData || !Array.isArray(raceData.horses)) {
    throw new Error('Invalid race data')
  }

  // Build placements map
  const placements = {}
  const horseIds = []
  for (const h of raceData.horses) {
    placements[h.id] = h.placement
    horseIds.push(h.id)
  }

  // Fetch existing ratings
  const existing = await HorseRating.find({ horseId: { $in: horseIds } })
  const ratings = new Map(existing.map(r => [String(r.horseId), { rating: r.rating, numberOfRaces: r.numberOfRaces }]))

  // Seed any missing horses from ST points
  const missingIds = horseIds.filter(id => !ratings.has(String(id)))
  if (missingIds.length) {
    const horseDocs = await Horse.find({ id: { $in: missingIds } }, { id: 1, points: 1 }).lean()
    for (const h of horseDocs) {
      const seed = seedFromHorseDoc(h)
      ratings.set(String(h.id), { rating: seed, numberOfRaces: 0, seedRating: seed })
    }
  }

  // Get raceDate and topPrize via aggregation
  const raceMeta = await Horse.aggregate([
    { $unwind: '$results' },
    { $match: { 'results.raceInformation.raceId': Number(raceId) } },
    { $group: {
      _id: '$results.raceInformation.raceId',
      raceDate: { $first: '$results.raceInformation.date' },
      topPrize: { $max: '$results.prizeMoney.sortValue' }
    } }
  ])
  const raceDate = raceMeta[0]?.raceDate || new Date()
  const classFactor = classFactorFromPurse(raceMeta[0]?.topPrize)

  // Snapshot old ratings for history
  const before = new Map()
  for (const id of horseIds) {
    const key = String(id)
    const entry = ratings.get(key) || { rating: DEFAULT_RATING, numberOfRaces: 0 }
    before.set(key, entry.rating)
    // Ensure map has an entry for all horses
    if (!ratings.has(key)) ratings.set(key, entry)
  }

  // Run Elo update
  const k = process.env.ELO_K ? Number(process.env.ELO_K) : DEFAULT_K
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  processRace(placements, ratings, { k, raceDate, decayDays, classFactor, kClassMultiplier: K_CLASS_MULTIPLIER })

  // Persist ratings and history
  const now = new Date()
  const bulk = HorseRating.collection.initializeUnorderedBulkOp()
  const history = []
  for (const id of horseIds) {
    const key = String(id)
    const info = ratings.get(key)
    const oldRating = before.get(key)
    bulk.find({ horseId: Number(id) }).upsert().updateOne({
      $set: {
        rating: Math.round(info.rating),
        numberOfRaces: info.numberOfRaces,
        lastUpdated: now,
        ...(info.seedRating ? { seedRating: info.seedRating } : {})
      }
    })
    history.push({
      raceId: Number(raceId),
      timestamp: now,
      horseId: Number(id),
      oldRating,
      newRating: Math.round(info.rating)
    })
  }
  if (bulk.length > 0) await bulk.execute()
  if (history.length) await RatingHistory.insertMany(history)

  // Return updated current ratings for requested horses
  const out = horseIds.map(id => ({ id, rating: Math.round(ratings.get(String(id)).rating) }))
  return out
}

export default {
  updateRatingsForRace
}
