import HorseRating from '../horse/horse-rating-model.js'
import RatingHistory from './rating-history-model.js'
import Horse from '../horse/horse-model.js'
import {
  processRace,
  DEFAULT_K,
  DEFAULT_DECAY_DAYS,
  DEFAULT_RATING,
  K_CLASS_MULTIPLIER,
  ELO_ENGINE_VERSION,
  ELO_PROFILES
} from './elo-engine.js'
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
    placements[h.id] = {
      ...h,
      placement: h?.placement,
      withdrawn: h?.withdrawn ?? false,
      date: raceData?.raceDate ?? raceData?.startDateTime ?? null
    }
    horseIds.push(h.id)
  }

  // Fetch existing ratings
  const existing = await HorseRating.find({ horseId: { $in: horseIds } })
  const ratings = new Map(existing.map(r => [String(r.horseId), {
    rating: r.rating,
    numberOfRaces: r.numberOfRaces,
    seedRating: r.seedRating ?? r.rating ?? DEFAULT_RATING,
    lastRaceDate: r.lastRaceDate ?? null
  }]))
  const formRatings = new Map(existing.map(r => [String(r.horseId), {
    rating: r.formRating ?? r.rating,
    numberOfRaces: r.formNumberOfRaces ?? r.numberOfRaces,
    seedRating: r.seedRating ?? r.rating ?? DEFAULT_RATING,
    lastRaceDate: r.formLastRaceDate ?? r.lastRaceDate ?? null
  }]))

  // Seed any missing horses from ST points
  const missingIds = horseIds.filter(id => !ratings.has(String(id)))
  if (missingIds.length) {
    const horseDocs = await Horse.find({ id: { $in: missingIds } }, { id: 1, points: 1 }).lean()
    for (const h of horseDocs) {
      const seed = seedFromHorseDoc(h)
      ratings.set(String(h.id), { rating: seed, numberOfRaces: 0, seedRating: seed, lastRaceDate: null })
      formRatings.set(String(h.id), { rating: seed, numberOfRaces: 0, seedRating: seed, lastRaceDate: null })
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
  const formBefore = new Map()
  for (const id of horseIds) {
    const key = String(id)
    const entry = ratings.get(key) || { rating: DEFAULT_RATING, numberOfRaces: 0 }
    before.set(key, entry.rating)
    // Ensure map has an entry for all horses
    if (!ratings.has(key)) ratings.set(key, entry)
    const fEntry = formRatings.get(key) || { rating: DEFAULT_RATING, numberOfRaces: 0 }
    formBefore.set(key, fEntry.rating)
    if (!formRatings.has(key)) formRatings.set(key, fEntry)
  }

  // Run Elo update
  const k = process.env.ELO_K ? Number(process.env.ELO_K) : DEFAULT_K
  const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : DEFAULT_DECAY_DAYS
  const careerSnapshot = new Map(
    horseIds.map((id) => {
      const state = ratings.get(String(id)) || { rating: DEFAULT_RATING }
      return [String(id), { ...state }]
    })
  )
  processRace(placements, ratings, {
    k,
    raceDate,
    referenceDate: raceDate,
    decayDays,
    classFactor,
    kClassMultiplier: K_CLASS_MULTIPLIER,
    profile: ELO_PROFILES.career
  })
  processRace(placements, formRatings, {
    k,
    raceDate,
    referenceDate: raceDate,
    decayDays,
    classFactor,
    kClassMultiplier: K_CLASS_MULTIPLIER,
    profile: ELO_PROFILES.form,
    anchorRatings: careerSnapshot
  })

  // Persist ratings and history
  const now = new Date()
  const bulk = HorseRating.collection.initializeUnorderedBulkOp()
  const history = []
  for (const id of horseIds) {
    const key = String(id)
    const info = ratings.get(key)
    const fInfo = formRatings.get(key)
    const oldRating = before.get(key)
    const oldForm = formBefore.get(key)
    bulk.find({ horseId: Number(id) }).upsert().updateOne({
      $set: {
        rating: Math.round(info.rating),
        numberOfRaces: info.numberOfRaces,
        lastUpdated: now,
        lastRaceDate: info.lastRaceDate ?? raceDate,
        ...(info.seedRating ? { seedRating: info.seedRating } : {}),
        eloVersion: ELO_ENGINE_VERSION,
        formRating: Math.round(fInfo.rating),
        formNumberOfRaces: fInfo.numberOfRaces,
        formLastUpdated: now,
        formLastRaceDate: fInfo.lastRaceDate ?? raceDate
      }
    })
    history.push({
      raceId: Number(raceId),
      timestamp: now,
      horseId: Number(id),
      oldRating,
      newRating: Math.round(info.rating)
    })
    history.push({
      raceId: Number(raceId),
      timestamp: now,
      horseId: Number(id),
      oldRating: oldForm,
      newRating: Math.round(fInfo.rating),
      ratingType: 'form'
    })
  }
  if (bulk.length > 0) await bulk.execute()
  if (history.length) await RatingHistory.insertMany(history)

  // Return updated current ratings for requested horses
  const out = horseIds.map(id => ({
    id,
    rating: Math.round(ratings.get(String(id)).rating),
    formRating: Math.round(formRatings.get(String(id)).rating)
  }))
  return out
}

export default {
  updateRatingsForRace
}
