import Driver from './driver-model.js'
import Horse from '../horse/horse-model.js'
import {
  processRace,
  DEFAULT_K,
  DEFAULT_DECAY_DAYS
} from '../rating/elo-engine.js'

const DEFAULT_RATING = Number(process.env.DRIVER_DEFAULT_RATING || 900)
const DEFAULT_FORM_DECAY_DAYS = Number(process.env.DRIVER_FORM_DECAY_DAYS || 45)
const DEFAULT_CAREER_DECAY_DAYS = Number(process.env.DRIVER_ELO_DECAY_DAYS || DEFAULT_DECAY_DAYS)
const DEFAULT_FORM_K = Number(process.env.DRIVER_FORM_K || DEFAULT_K)
const DEFAULT_CAREER_K = Number(process.env.DRIVER_CAREER_K || DEFAULT_K)
const MIN_RACES = Number(process.env.DRIVER_ELO_MIN_RACES || 5)
const BOTTOM_PENALTY = Number(process.env.DRIVER_ELO_BOTTOM_PENALTY || 15)

const toNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const normalizeDriverId = (raw) => {
  const num = toNumber(raw)
  return num != null ? num : null
}

const resolvePlacementValue = (horse) => {
  const candidates = [
    horse?.placement,
    horse?.placement?.sortValue,
    horse?.placement?.displayValue,
    horse?.result?.placement?.sortValue,
    horse?.result?.placement?.displayValue,
    horse?.result?.placement,
    horse?.result?.sortValue,
    horse?.result?.displayValue,
    horse?.finishPosition,
    horse?.placementValue
  ]
  for (const candidate of candidates) {
    if (candidate == null) continue
    if (typeof candidate === 'number') {
      if (Number.isFinite(candidate)) return candidate
      continue
    }
    if (typeof candidate === 'string') {
      const num = Number(candidate)
      if (Number.isFinite(num)) return num
    }
  }
  return null
}

const resolveRaceDate = async (raceId, fallback) => {
  if (fallback) {
    const dt = new Date(fallback)
    if (!Number.isNaN(dt.getTime())) return dt
  }
  const meta = await Horse.aggregate([
    { $unwind: '$results' },
    { $match: { 'results.raceInformation.raceId': Number(raceId) } },
    { $group: {
      _id: '$results.raceInformation.raceId',
      raceDate: { $first: '$results.raceInformation.date' }
    } }
  ])
  const dateFromDb = meta[0]?.raceDate
  const parsed = dateFromDb ? new Date(dateFromDb) : null
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed
  return new Date()
}

export const processDriverRace = (
  placements,
  ratings,
  formRatings,
  {
    raceDate,
    k = DEFAULT_CAREER_K,
    formK = DEFAULT_FORM_K,
    defaultRating = DEFAULT_RATING,
    decayDays = DEFAULT_CAREER_DECAY_DAYS,
    formDecayDays = DEFAULT_FORM_DECAY_DAYS,
    minRaces = MIN_RACES,
    bottomPenalty = BOTTOM_PENALTY
  } = {}
) => {
  if (!placements || Object.keys(placements).length < 2) return

  processRace(placements, ratings, {
    k,
    defaultRating,
    raceDate,
    decayDays
  })

  processRace(placements, formRatings, {
    k: formK,
    defaultRating,
    raceDate,
    decayDays: formDecayDays
  })

  const entries = Object.entries(placements)
  if (!entries.length) return

  const totalDrivers = entries.length
  const bottomThreshold = Math.ceil(totalDrivers * 0.8)

  for (const [driverId, placementValue] of entries) {
    const placement = Number(placementValue)
    if (!Number.isFinite(placement)) continue
    if (placement >= bottomThreshold) {
      const careerEntry = ratings.get(driverId) || { rating: defaultRating, numberOfRaces: 0 }
      if (careerEntry.numberOfRaces <= minRaces) {
        careerEntry.rating -= bottomPenalty
        ratings.set(driverId, careerEntry)
      }
      const formEntry = formRatings.get(driverId) || { rating: defaultRating, numberOfRaces: 0 }
      if (formEntry.numberOfRaces <= minRaces) {
        formEntry.rating -= bottomPenalty
        formRatings.set(driverId, formEntry)
      }
    }
  }
}

const fetchExistingDriverDocs = async (driverIds) => {
  if (!driverIds.length) return new Map()
  const docs = await Driver.find(
    { _id: { $in: driverIds } },
    { _id: 1, name: 1, elo: 1, careerElo: 1, eloRaceCount: 1, careerRaceCount: 1 }
  ).lean()
  return new Map(docs.map(doc => [String(doc._id), doc]))
}

const buildPlacementMapFromRaceData = (raceData) => {
  if (!raceData || !Array.isArray(raceData.horses)) {
    return { placements: {}, driverMeta: new Map() }
  }
  const placements = {}
  const driverMeta = new Map()
  for (const horse of raceData.horses) {
    const driver = horse?.driver || {}
    const driverId = normalizeDriverId(driver.id ?? driver.licenseId)
    if (driverId == null) continue
    const placement = resolvePlacementValue(horse)
    if (!Number.isFinite(placement) || placement <= 0 || placement >= 99) continue
    placements[driverId] = placement
    if (!driverMeta.has(driverId)) {
      driverMeta.set(driverId, {
        name: driver.name ?? '',
        licenseId: driver.licenseId ?? driverId
      })
    }
  }
  return { placements, driverMeta }
}

export const updateDriverRatingsForRace = async (
  raceId,
  raceData,
  {
    k = DEFAULT_CAREER_K,
    decayDays = DEFAULT_CAREER_DECAY_DAYS,
    formDecayDays = DEFAULT_FORM_DECAY_DAYS,
    formK = DEFAULT_FORM_K
  } = {}
) => {
  const { placements, driverMeta } = buildPlacementMapFromRaceData(raceData)
  const driverIds = Object.keys(placements)
  if (!driverIds.length) return []

  const existingDocs = await fetchExistingDriverDocs(driverIds.map(id => Number(id)))

  const ratings = new Map()
  const formRatings = new Map()
  for (const id of driverIds) {
    const doc = existingDocs.get(id)
    ratings.set(id, {
      rating: doc?.careerElo ?? doc?.elo ?? DEFAULT_RATING,
      numberOfRaces: doc?.careerRaceCount ?? doc?.eloRaceCount ?? 0
    })
    formRatings.set(id, {
      rating: doc?.elo ?? doc?.careerElo ?? DEFAULT_RATING,
      numberOfRaces: doc?.eloRaceCount ?? doc?.careerRaceCount ?? 0
    })
  }

  const raceDate = await resolveRaceDate(raceId, raceData?.raceDate || raceData?.startDateTime)

  processDriverRace(placements, ratings, formRatings, {
    raceDate,
    k,
    decayDays,
    formDecayDays,
    formK
  })

  const now = new Date()
  const bulk = Driver.collection.initializeUnorderedBulkOp()
  const updates = []

  for (const id of driverIds) {
    const numericId = Number(id)
    const career = ratings.get(id) || { rating: DEFAULT_RATING, numberOfRaces: 0 }
    const form = formRatings.get(id) || career
    const doc = existingDocs.get(id) || {}
    const meta = driverMeta.get(numericId) || {}
    const name = meta.name || doc.name || ''
    const elo = Math.round(form.rating)
    const careerElo = Math.round(career.rating)
    bulk.find({ _id: numericId }).upsert().updateOne({
      $set: {
        name,
        elo,
        eloRaceCount: form.numberOfRaces,
        careerElo,
        careerRaceCount: career.numberOfRaces,
        eloUpdatedAt: now
      }
    })
    updates.push({ id: numericId, elo, careerElo })
  }

  if (bulk.length > 0) await bulk.execute()

  return updates
}

export const recomputeDriverRatings = async ({
  k = DEFAULT_CAREER_K,
  decayDays = DEFAULT_CAREER_DECAY_DAYS,
  formDecayDays = DEFAULT_FORM_DECAY_DAYS,
  formK = DEFAULT_FORM_K
} = {}) => {
  const cursor = Driver.find({}, { _id: 1, name: 1, results: 1 }).lean().cursor()
  const races = new Map()
  const driverNames = new Map()
  const seenDrivers = new Set()

  for await (const driver of cursor) {
    const driverId = driver._id
    if (!Array.isArray(driver.results)) continue
    driverNames.set(String(driverId), driver.name ?? '')
    for (const res of driver.results) {
      if (res.withdrawn) continue
      const raceId = res.raceId
      if (raceId == null) continue
      let race = races.get(raceId)
      if (!race) {
        race = { date: res.date, placements: {} }
        races.set(raceId, race)
      }
      const placement = Number(res?.placement?.sortValue ?? res?.placement)
      if (!Number.isFinite(placement) || placement <= 0 || placement >= 99) continue
      race.placements[String(driverId)] = placement
      seenDrivers.add(driverId)
    }
  }

  const raceList = Array.from(races.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const ratings = new Map()
  const formRatings = new Map()

  for (const race of raceList) {
    const raceDate = race.date ? new Date(race.date) : new Date()
    processDriverRace(race.placements, ratings, formRatings, {
      raceDate,
      k,
      decayDays,
      formDecayDays,
      formK
    })
  }

  const now = new Date()
  const bulk = Driver.collection.initializeUnorderedBulkOp()
  for (const driverId of seenDrivers) {
    const stringId = String(driverId)
    const career = ratings.get(stringId) || { rating: DEFAULT_RATING, numberOfRaces: 0 }
    const form = formRatings.get(stringId) || career
    const name = driverNames.get(stringId) || ''
    bulk.find({ _id: driverId }).updateOne({
      $set: {
        name,
        elo: Math.round(form.rating),
        eloRaceCount: form.numberOfRaces,
        careerElo: Math.round(career.rating),
        careerRaceCount: career.numberOfRaces,
        eloUpdatedAt: now
      }
    })
  }
  if (bulk.length > 0) await bulk.execute()

  const allDrivers = await Driver.find({}, { elo: 1 }).lean()
  const allRatings = allDrivers.map(d => d.elo).filter(Number.isFinite).sort((a, b) => a - b)
  const minRating = allRatings[0] ?? 0
  const maxRating = allRatings[allRatings.length - 1] ?? 0
  const mid = Math.floor(allRatings.length / 2)
  const medianRating =
    allRatings.length % 2 === 0
      ? (allRatings[mid - 1] + allRatings[mid]) / 2
      : allRatings[mid]

  return {
    racesProcessed: raceList.length,
    driversUpdated: seenDrivers.size,
    distribution: {
      min: minRating,
      max: maxRating,
      median: medianRating
    }
  }
}

export default {
  processDriverRace,
  updateDriverRatingsForRace,
  recomputeDriverRatings
}
