import Track from './track-model.js'
import Horse from '../horse/horse-model.js'
import Raceday from '../raceday/raceday-model.js'
import { getSeededMetaForTrack, getSeededMetaForTrackName } from './track-meta.js'

const computeStatsForTrack = async (trackCode) => {
  const winners = await Horse.aggregate([
    { $unwind: '$results' },
    {
      $match: {
        'results.trackCode': trackCode,
        'results.placement.sortValue': 1
      }
    },
    {
      $project: {
        startPos: '$results.startPosition.sortValue',
        timeDisplay: '$results.kilometerTime.displayValue',
        timeSort: '$results.kilometerTime.sortValue'
      }
    }
  ])

  if (winners.length === 0) return {}

  let fastestSort = null
  let fastestDisplay = null
  let fastestPos = null
  const startCounts = {}

  for (const w of winners) {
    const pos = w.startPos
    const validPos = Number.isInteger(pos) && pos >= 1 && pos <= 20

    if (typeof w.timeSort === 'number' && (fastestSort === null || w.timeSort < fastestSort)) {
      fastestSort = w.timeSort
      fastestDisplay = w.timeDisplay
      fastestPos = validPos ? pos : null
    }

    // Exclude invalid values such as 99 (no draw) and anything outside 1-20
    if (validPos) {
      startCounts[pos] = (startCounts[pos] || 0) + 1
    }
  }

  let favPos = null
  let favCount = 0
  for (const [pos, count] of Object.entries(startCounts)) {
    if (count > favCount) {
      favCount = count
      favPos = Number(pos)
    }
  }

  const result = { trackRecord: fastestDisplay }
  if (favPos !== null) {
    result.favouriteStartingPosition = favPos
  }
  if (fastestPos !== null) {
    result.fastestStartingPosition = fastestPos
  }
  return result
}

const getTrackByCode = async (trackCode) => {
  const doc = await Track.findOne({ trackCode }).lean()
  const seeded = getSeededMetaForTrack(trackCode)
  if (!doc) {
    // No DB row: return seeded defaults with minimal identity
    return {
      trackCode,
      trackName: undefined,
      trackLength: seeded.trackLengthMeters,
      trackLengthMeters: seeded.trackLengthMeters,
      hasOpenStretch: seeded.hasOpenStretch,
      openStretchLanes: seeded.openStretchLanes
    }
  }
  // Merge: DB wins, but fill missing new fields from seeded
  const trackLengthMeters = doc.trackLengthMeters ?? doc.trackLength ?? seeded.trackLengthMeters
  const hasOpenStretch = (doc.hasOpenStretch != null) ? doc.hasOpenStretch : seeded.hasOpenStretch
  let openStretchLanes = (doc.openStretchLanes != null) ? doc.openStretchLanes : seeded.openStretchLanes
  if (hasOpenStretch && (!openStretchLanes || openStretchLanes < 1)) openStretchLanes = 1
  return {
    ...doc,
    trackLength: trackLengthMeters, // keep legacy key aligned to meters
    trackLengthMeters,
    hasOpenStretch,
    openStretchLanes
  }
}

const getTrackByName = async (trackName) => {
  const normalizedName = String(trackName || '').trim()
  if (!normalizedName) return null

  // Primary: lookup by trackName in Track collection
  const doc = await Track.findOne({ trackName: normalizedName }).lean()
  if (doc) {
    const seeded = getSeededMetaForTrackName(normalizedName)
    const trackLengthMeters = doc.trackLengthMeters ?? doc.trackLength ?? seeded.trackLengthMeters
    const hasOpenStretch = (doc.hasOpenStretch != null) ? doc.hasOpenStretch : seeded.hasOpenStretch
    let openStretchLanes = (doc.openStretchLanes != null) ? doc.openStretchLanes : seeded.openStretchLanes
    if (hasOpenStretch && (!openStretchLanes || openStretchLanes < 1)) openStretchLanes = 1
    return { ...doc, trackLengthMeters, hasOpenStretch, openStretchLanes }
  }

  // Fallback: derive trackCode via Raceday → Horse join, then look up by trackCode.
  // This covers existing Track docs that were upserted without trackName.
  const sampleRaceday = await Raceday.findOne({ trackName: normalizedName }, { raceDayId: 1 }).lean()
  if (!sampleRaceday) return null

  const sampleHorse = await Horse.findOne(
    { 'results.raceInformation.raceDayId': sampleRaceday.raceDayId, 'results.trackCode': { $exists: true, $ne: '' } },
    { 'results.trackCode': 1, 'results.raceInformation.raceDayId': 1 }
  ).lean()

  const matchingResult = sampleHorse?.results?.find(
    r => r.raceInformation?.raceDayId === sampleRaceday.raceDayId
  )
  const trackCode = matchingResult?.trackCode
  if (!trackCode) return null

  return getTrackByCode(trackCode)
}

const updateTrackStats = async (trackCode, trackName = null) => {
  const stats = await computeStatsForTrack(trackCode)
  if (!stats.trackRecord && stats.favouriteStartingPosition == null && stats.fastestStartingPosition == null) return
  const update = { trackRecord: stats.trackRecord }
  if (stats.favouriteStartingPosition != null) {
    update.favouriteStartingPosition = stats.favouriteStartingPosition
  }
  if (stats.fastestStartingPosition != null) {
    update.fastestStartingPosition = stats.fastestStartingPosition
  }
  if (trackName) {
    update.trackName = String(trackName).trim()
  }
  await Track.updateOne({ trackCode }, {
    $set: update
  }, { upsert: true })
}

const updateAllTrackStats = async () => {
  // Build trackCode → trackName map by sampling one Raceday per unique trackCode
  const samples = await Horse.aggregate([
    { $unwind: '$results' },
    { $match: { 'results.trackCode': { $exists: true, $ne: '' } } },
    { $group: { _id: '$results.trackCode', raceDayId: { $first: '$results.raceInformation.raceDayId' } } }
  ])

  const raceDayIds = samples.map(s => s.raceDayId).filter(Boolean)
  const racedays = await Raceday.find(
    { raceDayId: { $in: raceDayIds } },
    { raceDayId: 1, trackName: 1 }
  ).lean()
  const nameByRaceDayId = new Map(racedays.map(rd => [rd.raceDayId, rd.trackName]))

  const trackNameByCode = new Map()
  for (const s of samples) {
    const name = nameByRaceDayId.get(s.raceDayId)
    if (name) trackNameByCode.set(s._id, name)
  }

  for (const s of samples) {
    const code = s._id
    if (!code) continue
    try {
      await updateTrackStats(code, trackNameByCode.get(code) || null)
    } catch (error) {
      console.error(`Failed to update track stats for ${code}:`, error.message)
    }
  }
}

export default {
  getTrackByCode,
  getTrackByName,
  updateTrackStats,
  updateAllTrackStats
}
