import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import horseService from '../horse/horse-service.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const readPositiveInteger = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const HORSE_REFRESH_CONCURRENCY = readPositiveInteger(process.env.RACEDAY_HORSE_REFRESH_CONCURRENCY, 4)
const HORSE_REFRESH_DELAY_MS = readPositiveInteger(process.env.RACEDAY_HORSE_REFRESH_DELAY_MS, 200)
const RACEDAY_REFRESH_QUEUE_CONCURRENCY = readPositiveInteger(process.env.RACEDAY_HORSE_REFRESH_QUEUE_CONCURRENCY, 1)

const runWithConcurrency = async (items, worker, limit = 6) => {
  const concurrency = Math.max(1, Number(limit) || 1)
  let cursor = 0

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor
      cursor += 1
      await worker(items[currentIndex], currentIndex)
    }
  })

  await Promise.all(runners)
}

let nextHorseRefreshStartAt = 0
const waitForHorseRefreshSlot = async (delayMs = HORSE_REFRESH_DELAY_MS) => {
  if (!delayMs) return

  const now = Date.now()
  const scheduledStart = Math.max(now, nextHorseRefreshStartAt)
  nextHorseRefreshStartAt = scheduledStart + delayMs

  if (scheduledStart > now) {
    await delay(scheduledStart - now)
  }
}

const racedayRefreshQueue = []
let activeRacedayRefreshes = 0

const drainRacedayRefreshQueue = () => {
  while (activeRacedayRefreshes < RACEDAY_REFRESH_QUEUE_CONCURRENCY && racedayRefreshQueue.length > 0) {
    const job = racedayRefreshQueue.shift()
    activeRacedayRefreshes += 1

    refreshRacedayHorses(job.raceDay, job.options)
      .then(job.resolve)
      .catch(job.reject)
      .finally(() => {
        activeRacedayRefreshes -= 1
        drainRacedayRefreshQueue()
      })
  }
}

export function enqueueRacedayHorseRefresh(raceDay, options = {}) {
  return new Promise((resolve, reject) => {
    racedayRefreshQueue.push({ raceDay, options, resolve, reject })
    drainRacedayRefreshQueue()
  })
}

export async function updateEarliestUpdatedHorseTimestamps(raceDayId, targetRaceIds = []) {
  const raceDay = await Raceday.findById(raceDayId)
  if (!raceDay) {
    throw new Error(`No raceDay found for the given ID: ${raceDayId}`)
  }

  const targetIdSet = new Set((targetRaceIds || []).map((id) => String(id)))
  const targetRaces = targetIdSet.size
    ? raceDay.raceList.filter((race) => targetIdSet.has(String(race.raceId)))
    : raceDay.raceList

  if (targetIdSet.size && targetRaces.length !== targetIdSet.size) {
    const foundIds = new Set(targetRaces.map((race) => String(race.raceId)))
    const missingIds = [...targetIdSet].filter((id) => !foundIds.has(id))
    throw new Error(`No race found for the given raceId(s): ${missingIds.join(', ')}`)
  }

  const horseIds = [...new Set(targetRaces.flatMap((race) => (
    race.horses || []
  ).map((horse) => horse?.id).filter(Boolean)))]
  const horses = await Horse.find({ id: { $in: horseIds } }).select('id updatedAt').lean()
  const updatedAtByHorseId = new Map(horses.map((horse) => [String(horse.id), horse.updatedAt]))
  const now = new Date()

  for (const race of targetRaces) {
    let earliestTimestamp = now

    for (const listHorse of race.horses || []) {
      const updatedAt = updatedAtByHorseId.get(String(listHorse?.id))
      if (!updatedAt) {
        console.warn(`No horse found for ID: ${listHorse?.id}`)
        continue
      }
      if (updatedAt < earliestTimestamp) {
        earliestTimestamp = updatedAt
      }
    }

    race.earliestUpdatedHorseTimestamp = earliestTimestamp
  }

  raceDay.markModified('raceList')
  await raceDay.save()
  return raceDay
}

export async function updateEarliestUpdatedHorseTimestamp(raceDayId, targetRaceId) {
  try {
    return await updateEarliestUpdatedHorseTimestamps(raceDayId, [targetRaceId])
  } catch (error) {
    console.error('Error updating earliest horse timestamp:', error.message)
    throw error
  }
}

export async function refreshRacedayHorses(raceDay, options = {}) {
  const startedAt = Date.now()
  const concurrency = readPositiveInteger(options.concurrency, HORSE_REFRESH_CONCURRENCY)
  const delayMs = readPositiveInteger(options.delayMs, HORSE_REFRESH_DELAY_MS)
  const horseIds = [...new Set(raceDay.raceList.flatMap(race => race.horses.map(horse => horse.id)))]
  const failedHorseIds = []
  let updatedHorseCount = 0
  console.log(`Updating ${horseIds.length} horses for raceday ${raceDay.raceDayId} (concurrency=${concurrency}, delayMs=${delayMs})`)

  await runWithConcurrency(
    horseIds,
    async (horseId, index) => {
      try {
        await waitForHorseRefreshSlot(delayMs)
        console.log(`Updating horse ${index + 1} of ${horseIds.length}: ${horseId}`)
        await horseService.upsertHorseData(horseId)
        updatedHorseCount += 1
      } catch (error) {
        console.error(`Skipped horse ${horseId} due to error:`, error.message)
        failedHorseIds.push(horseId)
      }
    },
    concurrency
  )

  try {
    await updateEarliestUpdatedHorseTimestamps(raceDay._id)
  } catch (error) {
    for (const race of raceDay.raceList) {
      console.error(`Failed updating earliest horse timestamp for race ${race.raceId}:`, error.message)
    }
  }

  const durationMs = Date.now() - startedAt
  console.log(`Finished horse refresh for raceday ${raceDay.raceDayId}: ${updatedHorseCount}/${horseIds.length} horses in ${durationMs}ms`)

  return {
    requestedHorseCount: horseIds.length,
    updatedHorseCount,
    failedHorseIds,
    durationMs
  }
}

export async function refreshTargetRaceHorses(raceDay, raceIds = [], options = {}) {
  const targetIds = new Set((raceIds || []).map((id) => String(id)))
  const races = (raceDay?.raceList || []).filter((race) => targetIds.has(String(race?.raceId)))
  const horseIds = [...new Set(races.flatMap((race) => (race?.horses || []).map((horse) => horse?.id)).filter(Boolean))]
  const failedHorseIds = []
  let updatedHorseCount = 0

  await runWithConcurrency(
    horseIds,
    async (horseId, index) => {
      try {
        if (options.delayMs) {
          await waitForHorseRefreshSlot(readPositiveInteger(options.delayMs, HORSE_REFRESH_DELAY_MS))
        }
        console.log(`Targeted refresh horse ${index + 1} of ${horseIds.length}: ${horseId}`)
        await horseService.upsertHorseData(horseId)
        updatedHorseCount += 1
      } catch (error) {
        console.error(`Skipped horse ${horseId} due to error:`, error.message)
        failedHorseIds.push(horseId)
      }
    },
    options.concurrency ?? 6
  )

  try {
    await updateEarliestUpdatedHorseTimestamps(raceDay._id, races.map((race) => race.raceId))
  } catch (error) {
    for (const race of races) {
      console.error(`Failed updating earliest horse timestamp for race ${race.raceId}:`, error.message)
    }
  }

  return {
    raceIds: races.map((race) => Number(race.raceId)).filter(Number.isFinite),
    requestedHorseCount: horseIds.length,
    updatedHorseCount,
    failedHorseIds
  }
}

export default {
  enqueueRacedayHorseRefresh,
  updateEarliestUpdatedHorseTimestamps,
  updateEarliestUpdatedHorseTimestamp,
  refreshRacedayHorses,
  refreshTargetRaceHorses
}
