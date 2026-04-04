import { fetchRacedaysByDate, fetchStartlistById } from './raceday-atg-client.js'
import { upsertStartlistData } from './raceday-write-service.js'

export async function fetchAndStoreByDate(date) {
  const raceDaysInfo = await fetchRacedaysByDate(date)
  const stored = []

  for (const info of raceDaysInfo) {
    if (!info.hasOldStartList && !info.hasNewStartList) continue

    try {
      const startlist = await fetchStartlistById(info.raceDayId)
      const raceDay = await upsertStartlistData(startlist)
      stored.push(raceDay)
    } catch (error) {
      console.error(`Skipping racedayId ${info.raceDayId} due to fetch error:`, error.message)
    }
  }

  return stored
}

export default {
  fetchAndStoreByDate
}
