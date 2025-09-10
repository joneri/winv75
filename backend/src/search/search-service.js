import Horse from '../horse/horse-model.js'
import Raceday from '../raceday/raceday-model.js'
import Track from '../track/track-model.js'

async function globalSearch(query) {
  if (!query || query.length < 2) {
    return { horses: [], raceDays: [], results: [], tracks: [] }
  }

  const regex = new RegExp(query, 'i')
  const now = new Date()

  const [horses, raceDays, results, tracks] = await Promise.all([
    Horse.find({ name: regex }).limit(5).select('id name'),
    Raceday.find({ trackName: regex, firstStart: { $gte: now } })
      .sort({ firstStart: 1 })
      .limit(5)
      .select('raceDayId trackName raceDayDate'),
    Raceday.find({ trackName: regex, firstStart: { $lt: now } })
      .sort({ firstStart: -1 })
      .limit(5)
      .select('raceDayId trackName raceDayDate'),
    Track.find({ trackName: regex }).limit(5).select('trackCode trackName')
  ])

  return { horses, raceDays, results, tracks }
}

export default { globalSearch }
