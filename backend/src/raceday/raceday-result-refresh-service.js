import Raceday from './raceday-model.js'
import { fetchStartlistById } from './raceday-atg-client.js'
import { upsertStartlistData } from './raceday-write-service.js'

function toTodayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export async function refreshStaleRacedayResults({ now = new Date(), limit = 100, raceDayIds = [] } = {}) {
  const targetIds = Array.isArray(raceDayIds)
    ? raceDayIds.map(id => Number(id)).filter(id => Number.isFinite(id))
    : []

  const query = {
    raceDayDate: { $lt: toTodayKey(now) },
    raceList: { $not: { $elemMatch: { resultsReady: true } } },
    ...(targetIds.length ? { raceDayId: { $in: targetIds } } : {})
  }

  const staleRacedays = await Raceday.find(query)
    .sort({ firstStart: -1 })
    .limit(targetIds.length ? targetIds.length : Math.max(1, Number(limit) || 100))
    .select('_id raceDayId raceDayDate trackName')
    .lean()

  const refreshed = []
  const failed = []

  for (const raceday of staleRacedays) {
    try {
      const startlist = await fetchStartlistById(raceday.raceDayId)
      const persisted = await upsertStartlistData(startlist)
      const hasResults = Array.isArray(persisted?.raceList) && persisted.raceList.some(race => race?.resultsReady === true)

      refreshed.push({
        _id: String(persisted?._id || raceday._id),
        raceDayId: raceday.raceDayId,
        raceDayDate: persisted?.raceDayDate || raceday.raceDayDate,
        trackName: persisted?.trackName || raceday.trackName,
        hasResults
      })
    } catch (error) {
      failed.push({
        raceDayId: raceday.raceDayId,
        raceDayDate: raceday.raceDayDate,
        trackName: raceday.trackName,
        error: error?.message || 'Unknown refresh failure'
      })
    }
  }

  return {
    scanned: staleRacedays.length,
    refreshedCount: refreshed.length,
    resolvedCount: refreshed.filter(item => item.hasResults).length,
    unresolvedCount: refreshed.filter(item => !item.hasResults).length,
    failedCount: failed.length,
    refreshed,
    failed
  }
}

export default {
  refreshStaleRacedayResults
}
