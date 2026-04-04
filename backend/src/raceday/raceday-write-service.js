import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import { refreshRacedayHorses } from './raceday-refresh-service.js'

async function persistAtgPastComments(racedayJSON) {
  try {
    const starts = racedayJSON?.raceList?.flatMap(race => (
      race.atgExtendedRaw?.starts || []
    ).map(start => ({ start, race }))) || []

    for (const { start, race } of starts) {
      const horseId = start?.horse?.id
      if (!horseId) continue

      const savedComments = (Array.isArray(start?.horse?.results?.records) ? start.horse.results.records : [])
        .filter(record => record?.trMediaInfo?.comment && record.trMediaInfo.comment.trim())
        .map(record => ({
          date: record?.date ? new Date(record.date) : null,
          comment: record.trMediaInfo.comment.trim(),
          place: record?.place || race?.trackName || '',
          raceId: race?.raceId || 0,
          source: 'ATG'
        }))

      if (!savedComments.length) continue

      const horseDoc = await Horse.findOne({ id: horseId })
      if (!horseDoc) continue

      const existing = horseDoc.atgPastComments || []
      const keyFor = (comment) => `${(comment.date ? new Date(comment.date).toISOString().slice(0, 10) : '')}::${comment.comment}`
      const seen = new Set(existing.map(keyFor))
      const toAdd = savedComments.filter(comment => !seen.has(keyFor(comment)))

      if (toAdd.length) {
        horseDoc.atgPastComments.push(...toAdd)
        await horseDoc.save()
      }
    }
  } catch (error) {
    console.warn('Failed to persist ATG past comments (non-fatal):', error.message)
  }
}

export async function upsertStartlistData(racedayJSON) {
  const raceDayId = racedayJSON.raceDayId
  let raceDay

  try {
    raceDay = await Raceday.findOneAndUpdate(
      { raceDayId },
      racedayJSON,
      { upsert: true, new: true, runValidators: true }
    )
  } catch (error) {
    console.error(`Error while upserting the startlist with raceDayId ${raceDayId}:`, error)
    throw error
  }

  await persistAtgPastComments(racedayJSON)
  refreshRacedayHorses(raceDay).catch(error => console.error('Failed updating horses for raceday', error))

  return raceDay
}

export default {
  upsertStartlistData
}
