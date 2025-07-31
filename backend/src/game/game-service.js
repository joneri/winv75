import axios from 'axios'
import Raceday from '../raceday/raceday-model.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const mapGamesForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId).lean()
  if (!raceday) {
    throw new Error('Raceday not found')
  }

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

  return result
}

export default { mapGamesForRaceday }
