import HorseRating from './horse-rating-model.js'
import RatingHistory from './rating-history-model.js'

const DEFAULT_RATING = 1500
const K_FACTOR = 32

const updateRatingsForRace = async (raceId, raceData) => {
  if (!raceData || !Array.isArray(raceData.horses)) {
    throw new Error('Invalid race data')
  }

  const horses = raceData.horses.map(h => ({ id: h.id, placement: h.placement }))
  const horseIds = horses.map(h => h.id)
  const existing = await HorseRating.find({ horseId: { $in: horseIds } })
  const ratingMap = new Map()
  existing.forEach(r => ratingMap.set(r.horseId, r))

  for (const horse of horses) {
    if (!ratingMap.has(horse.id)) {
      ratingMap.set(horse.id, new HorseRating({ horseId: horse.id, rating: DEFAULT_RATING }))
    }
  }

  const currentRatings = {}
  for (const horse of horses) {
    currentRatings[horse.id] = ratingMap.get(horse.id).rating
  }

  const n = horses.length
  const history = []
  for (const horse of horses) {
    let actual = 0
    let expected = 0
    for (const opponent of horses) {
      if (horse.id === opponent.id) continue
      const r1 = currentRatings[horse.id]
      const r2 = currentRatings[opponent.id]
      const exp = 1 / (1 + Math.pow(10, (r2 - r1) / 400))
      expected += exp
      if (horse.placement < opponent.placement) actual += 1
      else if (horse.placement === opponent.placement) actual += 0.5
    }
    expected /= (n - 1)
    actual /= (n - 1)
    const ratingChange = K_FACTOR * (actual - expected)
    const entry = ratingMap.get(horse.id)
    const oldRating = entry.rating
    entry.rating = Math.round(entry.rating + ratingChange)
    entry.numberOfRaces += 1
    entry.lastUpdated = new Date()

    history.push({
      raceId,
      timestamp: entry.lastUpdated,
      horseId: horse.id,
      oldRating,
      newRating: entry.rating
    })
  }

  const promises = []
  for (const entry of ratingMap.values()) {
    const { horseId, rating, numberOfRaces, lastUpdated } = entry
    promises.push(
      HorseRating.findOneAndUpdate(
        { horseId },
        { rating, numberOfRaces, lastUpdated },
        { upsert: true, new: true }
      )
    )
  }

  const updated = await Promise.all(promises)
  await RatingHistory.insertMany(history)
  return updated
}

export default {
  updateRatingsForRace
}
