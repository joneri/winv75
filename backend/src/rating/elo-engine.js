import { expectedScore } from './elo-utils.js'
import {
  CAREER_RATING_HALF_LIFE_DAYS,
  CAREER_RECENCY_HALF_LIFE_DAYS,
  DEFAULT_ELO,
  ELO_ENGINE_VERSION as ENGINE_VERSION,
  FORM_RATING_HALF_LIFE_DAYS,
  FORM_RECENCY_HALF_LIFE_DAYS,
  clamp,
  differenceInDays,
  getRecencyWeight,
  getResultSignal,
  safeNumber,
  toDate
} from './elo-policy.js'

export const DEFAULT_K = 20
export const DEFAULT_RATING = DEFAULT_ELO
export const DEFAULT_DECAY_DAYS = CAREER_RECENCY_HALF_LIFE_DAYS
export const K_CLASS_MULTIPLIER = Number(process.env.ELO_K_CLASS_MULTIPLIER || 1)
export const ELO_ENGINE_VERSION = ENGINE_VERSION

export const ELO_PROFILES = {
  career: {
    name: 'career',
    recencyHalfLifeDays: CAREER_RECENCY_HALF_LIFE_DAYS,
    stateHalfLifeDays: CAREER_RATING_HALF_LIFE_DAYS,
    kMultiplier: Number(process.env.ELO_CAREER_K_MULTIPLIER || 1),
    anchor: 'seed'
  },
  form: {
    name: 'form',
    recencyHalfLifeDays: FORM_RECENCY_HALF_LIFE_DAYS,
    stateHalfLifeDays: FORM_RATING_HALF_LIFE_DAYS,
    kMultiplier: Number(process.env.ELO_FORM_K_MULTIPLIER || 1.65),
    anchor: 'career'
  }
}

const getExperienceMultiplier = (races) => {
  if (races < 5) return 1.5
  if (races < 20) return 1.2
  return 1
}

const normalizeRaceEntries = (placements = {}, { raceDate, fieldSizeHint } = {}) => {
  const entries = Object.entries(placements)
    .map(([id, raw]) => {
      const record = typeof raw === 'object' && raw !== null
        ? raw
        : { placement: raw }
      const signal = getResultSignal(record, {
        referenceDate: raceDate,
        fieldSize: fieldSizeHint
      })
      return {
        id: String(id),
        placement: signal.placement,
        code: signal.code,
        fieldScore: signal.fieldScore,
        outcomeScore: signal.outcomeScore
      }
    })
    .filter((entry) => Number.isFinite(entry.fieldScore))

  const inferredFieldSize = Math.max(fieldSizeHint || 0, entries.length || 0)
  return entries.map((entry) => {
    if (entry.fieldScore != null) return entry
    const signal = getResultSignal({
      placement: entry.placement,
      placementValue: entry.placement
    }, {
      referenceDate: raceDate,
      fieldSize: inferredFieldSize
    })
    return {
      ...entry,
      fieldScore: signal.fieldScore,
      outcomeScore: signal.outcomeScore
    }
  })
}

const getAnchorRating = ({
  id,
  entry,
  defaultRating,
  profile,
  anchorRatings
}) => {
  if (profile?.anchor === 'career' && anchorRatings instanceof Map) {
    const anchorEntry = anchorRatings.get(String(id))
    const anchorRating = safeNumber(anchorEntry?.rating, NaN)
    if (Number.isFinite(anchorRating)) return anchorRating
  }

  const seedRating = safeNumber(entry?.seedRating, NaN)
  if (Number.isFinite(seedRating)) return seedRating
  return defaultRating
}

const applyStateDecay = ({
  id,
  entry,
  raceDate,
  defaultRating,
  profile,
  anchorRatings
}) => {
  const stateHalfLifeDays = Number(profile?.stateHalfLifeDays)
  if (!Number.isFinite(stateHalfLifeDays) || stateHalfLifeDays <= 0) {
    return entry
  }

  const previousRaceDate = toDate(entry?.lastRaceDate)
  const currentRaceDate = toDate(raceDate)
  if (!previousRaceDate || !currentRaceDate) {
    return entry
  }

  const gapDays = differenceInDays(previousRaceDate, currentRaceDate)
  if (!Number.isFinite(gapDays) || gapDays <= 0) {
    return entry
  }

  const anchorRating = getAnchorRating({
    id,
    entry,
    defaultRating,
    profile,
    anchorRatings
  })
  const retained = Math.exp(-gapDays / stateHalfLifeDays)
  entry.rating = anchorRating + ((entry.rating - anchorRating) * retained)
  entry.decayDebug = {
    gapDays: Number(gapDays.toFixed(1)),
    retained: Number(retained.toFixed(4)),
    anchorRating: Number(anchorRating.toFixed(2))
  }
  return entry
}

const expectedFieldScore = (id, entries, ratings, defaultRating) => {
  const self = ratings.get(String(id)) || { rating: defaultRating }
  const opponents = entries.filter((entry) => entry.id !== String(id))
  if (!opponents.length) return 0.5

  const total = opponents.reduce((sum, opponent) => {
    const opponentState = ratings.get(opponent.id) || { rating: defaultRating }
    return sum + expectedScore(self.rating, opponentState.rating)
  }, 0)

  return total / opponents.length
}

export const processRace = (
  placements,
  ratings,
  {
    k = DEFAULT_K,
    defaultRating = DEFAULT_RATING,
    raceDate = new Date(),
    referenceDate = raceDate,
    decayDays = DEFAULT_DECAY_DAYS,
    classFactor = 1,
    kClassMultiplier = K_CLASS_MULTIPLIER,
    profile = ELO_PROFILES.career,
    anchorRatings = null,
    fieldSizeHint = null
  } = {}
) => {
  const raceEntries = normalizeRaceEntries(placements, { raceDate, fieldSizeHint })
  if (raceEntries.length < 2) return

  for (const entry of raceEntries) {
    const key = String(entry.id)
    const current = ratings.get(key) || {
      rating: defaultRating,
      numberOfRaces: 0,
      seedRating: defaultRating,
      lastRaceDate: null
    }
    if (!ratings.has(key)) ratings.set(key, current)
    applyStateDecay({
      id: key,
      entry: current,
      raceDate,
      defaultRating,
      profile,
      anchorRatings
    })
  }

  const recencyWeight = getRecencyWeight(raceDate, {
    referenceDate,
    halfLifeDays: Number.isFinite(Number(decayDays))
      ? Number(decayDays)
      : Number(profile?.recencyHalfLifeDays || DEFAULT_DECAY_DAYS)
  })

  const effectiveK = k * classFactor * kClassMultiplier * safeNumber(profile?.kMultiplier, 1)
  const deltas = new Map()

  for (const entry of raceEntries) {
    const key = String(entry.id)
    const current = ratings.get(key) || { rating: defaultRating, numberOfRaces: 0 }
    const expected = expectedFieldScore(key, raceEntries, ratings, defaultRating)
    const actual = safeNumber(entry.fieldScore, 0.5)
    const experienceMultiplier = getExperienceMultiplier(current.numberOfRaces)
    const delta = recencyWeight * effectiveK * experienceMultiplier * (actual - expected)
    deltas.set(key, delta)
  }

  for (const entry of raceEntries) {
    const key = String(entry.id)
    const current = ratings.get(key) || { rating: defaultRating, numberOfRaces: 0 }
    current.rating += deltas.get(key) || 0
    current.numberOfRaces += 1
    current.lastRaceDate = toDate(raceDate)
    current.eloVersion = ELO_ENGINE_VERSION
    ratings.set(key, current)
  }
}

export {
  getRecencyWeight,
  getExperienceMultiplier
}

export default {
  processRace,
  getRecencyWeight,
  getExperienceMultiplier,
  DEFAULT_K,
  DEFAULT_RATING,
  DEFAULT_DECAY_DAYS,
  ELO_PROFILES,
  ELO_ENGINE_VERSION
}
