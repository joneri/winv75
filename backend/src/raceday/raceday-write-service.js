import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import { enqueueRacedayHorseRefresh } from './raceday-refresh-service.js'

const formatDuration = (startedAt) => `${Date.now() - startedAt}ms`

async function persistAtgPastComments(racedayJSON) {
  try {
    const starts = racedayJSON?.raceList?.flatMap(race => (
      race.atgExtendedRaw?.starts || []
    ).map(start => ({ start, race }))) || []
    const commentsByHorseId = new Map()

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

      const key = String(horseId)
      const existing = commentsByHorseId.get(key) || []
      existing.push(...savedComments)
      commentsByHorseId.set(key, existing)
    }

    if (!commentsByHorseId.size) return { horseCount: 0, commentCount: 0 }

    const horseIds = [...commentsByHorseId.keys()].map(Number)
    const horseDocs = await Horse.find({ id: { $in: horseIds } }).select('id atgPastComments').lean()
    const operations = []
    let commentCount = 0

    for (const horseDoc of horseDocs) {
      const savedComments = commentsByHorseId.get(String(horseDoc.id)) || []
      const existing = horseDoc.atgPastComments || []
      const keyFor = (comment) => `${(comment.date ? new Date(comment.date).toISOString().slice(0, 10) : '')}::${comment.comment}`
      const seen = new Set(existing.map(keyFor))
      const toAdd = savedComments.filter(comment => !seen.has(keyFor(comment)))

      if (toAdd.length) {
        operations.push({
          updateOne: {
            filter: { id: horseDoc.id },
            update: { $push: { atgPastComments: { $each: toAdd } } }
          }
        })
        commentCount += toAdd.length
      }
    }

    if (operations.length) {
      await Horse.bulkWrite(operations, { ordered: false })
    }

    return { horseCount: operations.length, commentCount }
  } catch (error) {
    console.warn('Failed to persist ATG past comments (non-fatal):', error.message)
    return { horseCount: 0, commentCount: 0 }
  }
}

export async function upsertStartlistData(racedayJSON, options = {}) {
  const raceDayId = racedayJSON.raceDayId
  const refreshHorses = options.refreshHorses !== false
  const awaitHorseRefresh = options.awaitHorseRefresh === true
  const startedAt = Date.now()
  let raceDay

  try {
    const upsertStartedAt = Date.now()
    raceDay = await Raceday.findOneAndUpdate(
      { raceDayId },
      racedayJSON,
      { upsert: true, new: true, runValidators: true }
    )
    console.log(`Raceday ${raceDayId} upserted in ${formatDuration(upsertStartedAt)}`)
  } catch (error) {
    console.error(`Error while upserting the startlist with raceDayId ${raceDayId}:`, error)
    throw error
  }

  const commentsStartedAt = Date.now()
  const commentSummary = await persistAtgPastComments(racedayJSON)
  console.log(`Raceday ${raceDayId} ATG comments persisted in ${formatDuration(commentsStartedAt)} (${commentSummary.commentCount} comments on ${commentSummary.horseCount} horses)`)

  if (refreshHorses) {
    if (awaitHorseRefresh) {
      await enqueueRacedayHorseRefresh(raceDay)
    } else {
      enqueueRacedayHorseRefresh(raceDay).catch(error => console.error('Failed updating horses for raceday', error))
    }
  }

  console.log(`Raceday ${raceDayId} save pipeline finished in ${formatDuration(startedAt)} (refreshHorses=${refreshHorses}, awaitHorseRefresh=${awaitHorseRefresh})`)
  return raceDay
}

export default {
  upsertStartlistData
}
