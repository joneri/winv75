import { expectedScore } from './elo-utils.js'

export const DEFAULT_K = 20
export const DEFAULT_RATING = 1000
export const DEFAULT_DECAY_DAYS = 365

export const getRecencyWeight = (date, decayDays = DEFAULT_DECAY_DAYS) => {
  const diff = Date.now() - new Date(date).getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return Math.exp(-days / decayDays)
}

export const getExperienceMultiplier = (races) => {
  if (races < 5) return 1.5
  if (races < 20) return 1.2
  return 1
}

export const processRace = (
  placements,
  ratings,
  {
    k = DEFAULT_K,
    defaultRating = DEFAULT_RATING,
    raceDate = new Date(),
    decayDays = DEFAULT_DECAY_DAYS
  } = {}
) => {
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
      const entryA = ratings.get(idA) || { rating: defaultRating, numberOfRaces: 0 }
      const entryB = ratings.get(idB) || { rating: defaultRating, numberOfRaces: 0 }
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
    const base = ratings.get(id) || { rating: defaultRating, numberOfRaces: 0 }
    base.rating += deltas[id] || 0
    base.numberOfRaces += 1
    ratings.set(id, base)
  }
}

export default {
  processRace,
  getRecencyWeight,
  getExperienceMultiplier,
  DEFAULT_K,
  DEFAULT_RATING,
  DEFAULT_DECAY_DAYS
}
