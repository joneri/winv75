import Track from './track-model.js'
import Horse from '../horse/horse-model.js'
import { getSeededMetaForTrack } from './track-meta.js'

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
  const startCounts = {}

  for (const w of winners) {
    if (typeof w.timeSort === 'number' && (fastestSort === null || w.timeSort < fastestSort)) {
      fastestSort = w.timeSort
      fastestDisplay = w.timeDisplay
    }
    const pos = w.startPos
    // Exclude invalid values such as 99 (no draw) and anything outside 1-20
    if (Number.isInteger(pos) && pos >= 1 && pos <= 20) {
      startCounts[pos] = (startCounts[pos] || 0) + 1
    }
  }

  if (Object.keys(startCounts).length === 0) {
    console.warn(`No valid starting positions found for track ${trackCode}`)
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

const updateTrackStats = async (trackCode) => {
  const stats = await computeStatsForTrack(trackCode)
  if (!stats.trackRecord && stats.favouriteStartingPosition == null) return
  const update = { trackRecord: stats.trackRecord }
  if (stats.favouriteStartingPosition != null) {
    update.favouriteStartingPosition = stats.favouriteStartingPosition
  }
  await Track.updateOne({ trackCode }, {
    $set: update
  }, { upsert: true })
}

const updateAllTrackStats = async () => {
  const trackCodes = await Horse.distinct('results.trackCode')
  for (const code of trackCodes) {
    if (!code) continue
    await updateTrackStats(code)
  }
}

export default {
  getTrackByCode,
  updateTrackStats,
  updateAllTrackStats
}
