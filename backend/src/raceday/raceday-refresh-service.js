import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import horseService from '../horse/horse-service.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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

export async function updateEarliestUpdatedHorseTimestamp(raceDayId, targetRaceId) {
  try {
    const raceDay = await Raceday.findById(raceDayId)
    if (!raceDay) {
      throw new Error(`No raceDay found for the given ID: ${raceDayId}`)
    }

    let raceFound = false

    for (const race of raceDay.raceList) {
      if (String(race.raceId) !== String(targetRaceId)) continue

      raceFound = true
      let earliestTimestamp = new Date()

      for (const listHorse of race.horses) {
        const horse = await Horse.findOne({ id: listHorse.id })
        if (!horse) {
          console.warn(`No horse found for ID: ${listHorse.id}`)
          continue
        }
        if (horse.updatedAt < earliestTimestamp) {
          earliestTimestamp = horse.updatedAt
        }
      }

      race.earliestUpdatedHorseTimestamp = earliestTimestamp
      raceDay.markModified('raceList')
      await raceDay.save()
      return raceDay
    }

    if (!raceFound) {
      throw new Error(`No race found for the given raceId: ${targetRaceId}`)
    }
  } catch (error) {
    console.error('Error updating earliest horse timestamp:', error.message)
    throw error
  }
}

export async function refreshRacedayHorses(raceDay) {
  const horseIds = [...new Set(raceDay.raceList.flatMap(race => race.horses.map(horse => horse.id)))]
  console.log(`Updating ${horseIds.length} horses for raceday ${raceDay.raceDayId}`)

  for (let index = 0; index < horseIds.length; index += 1) {
    const horseId = horseIds[index]
    try {
      console.log(`Updating horse ${index + 1} of ${horseIds.length}: ${horseId}`)
      await horseService.upsertHorseData(horseId)
    } catch (error) {
      console.error(`Skipped horse ${horseId} due to error:`, error.message)
    }

    if (index < horseIds.length - 1) {
      await delay(400)
    }
  }

  for (const race of raceDay.raceList) {
    try {
      await updateEarliestUpdatedHorseTimestamp(raceDay._id, race.raceId)
    } catch (error) {
      console.error(`Failed updating earliest horse timestamp for race ${race.raceId}:`, error.message)
    }
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

  for (const race of races) {
    try {
      await updateEarliestUpdatedHorseTimestamp(raceDay._id, race.raceId)
    } catch (error) {
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
  updateEarliestUpdatedHorseTimestamp,
  refreshRacedayHorses,
  refreshTargetRaceHorses
}
