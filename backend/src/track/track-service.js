import Track from './track-model.js'
import Horse from '../horse/horse-model.js'

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
    if (typeof w.startPos === 'number' && w.startPos !== 99) {
      startCounts[w.startPos] = (startCounts[w.startPos] || 0) + 1
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

  return {
    trackRecord: fastestDisplay,
    favouriteStartingPosition: favPos
  }
}

const getTrackByCode = async (trackCode) => {
  return await Track.findOne({ trackCode }).lean()
}

const updateTrackStats = async (trackCode) => {
  const stats = await computeStatsForTrack(trackCode)
  if (!stats.trackRecord && stats.favouriteStartingPosition == null) return
  await Track.updateOne({ trackCode }, {
    $set: {
      trackRecord: stats.trackRecord,
      favouriteStartingPosition: stats.favouriteStartingPosition
    }
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
