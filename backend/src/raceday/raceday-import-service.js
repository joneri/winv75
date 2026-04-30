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
      const details = error.externalFetch
      const status = details?.status ? ` status=${details.status}` : ''
      const responseMessage = details?.responseMessage ? ` response="${details.responseMessage}"` : ''
      console.warn(`Skipping racedayId ${info.raceDayId} due to startlist fetch failure:${status}${responseMessage}`)
    }
  }

  return stored
}

export default {
  fetchAndStoreByDate
}
