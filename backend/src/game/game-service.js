import axios from 'axios'
import Raceday from '../raceday/raceday-model.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const fetchAndStoreGameData = async (raceday) => {
  const date = raceday.raceDayDate || raceday.firstStart?.toISOString().slice(0, 10)
  if (!date) {
    throw new Error('Unable to determine raceday date')
  }

  const calendarUrl = `${ATG_BASE_URL}/calendar/day/${date}`
  const calendarResp = await axios.get(calendarUrl)
  const games = calendarResp.data?.games || {}

  const result = {}
  const trackName = raceday.trackName
  const raceList = raceday.raceList || []
  const raceCache = {}

  for (const [gameType, gameArray] of Object.entries(games)) {
    for (const game of gameArray) {
      for (const raceKey of game.races || []) {
        if (!raceCache[raceKey]) {
          const raceResp = await axios.get(`${ATG_BASE_URL}/races/${raceKey}`)
          raceCache[raceKey] = raceResp.data
        }
        const raceData = raceCache[raceKey]
        if (raceData.track?.name !== trackName) continue

        const match = raceList.find(r => r.raceNumber === raceData.number)
        if (match) {
          if (!result[gameType]) result[gameType] = []
          if (!result[gameType].includes(match.raceId)) {
            result[gameType].push(match.raceId)
          }
        }
      }
    }
  }

  raceday.atgCalendarGamesRaw = games
  raceday.gameTypes = result
  raceday.markModified('atgCalendarGamesRaw')
  raceday.markModified('gameTypes')
  await raceday.save()

  return result
}

const getGameTypesForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    throw new Error('Raceday not found')
  }

  if (raceday.gameTypes && Object.keys(raceday.gameTypes).length) {
    return raceday.gameTypes
  }

  return await fetchAndStoreGameData(raceday)
}

const refreshGameTypesForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    throw new Error('Raceday not found')
  }

  raceday.atgCalendarGamesRaw = undefined
  raceday.gameTypes = undefined
  await raceday.save()

  return await fetchAndStoreGameData(raceday)
}

export default { getGameTypesForRaceday, refreshGameTypesForRaceday }
