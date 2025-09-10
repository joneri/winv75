import Horse from '../horse/horse-model.js'
import Driver from '../driver/driver-model.js'
import Raceday from '../raceday/raceday-model.js'
import Track from '../track/track-model.js'

function buildFlexiblePattern(q) {
  // Basic diacritic flexibility for Swedish letters: å/ä ~ a, ö ~ o
  const map = (ch) => {
    const c = ch.toLowerCase()
    if (['a', 'å', 'ä'].includes(c)) return '[aåä]'
    if (['o', 'ö'].includes(c)) return '[oö]'
    // Escape regex specials
    return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return Array.from(q).map(map).join('')
}

function rankByRelevance(items, getText, q) {
  const nq = (q || '').trim().toLowerCase()
  const fold = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  const fq = fold(nq)

  return [...items].sort((a, b) => {
    const ta = fold(String(getText(a) || ''))
    const tb = fold(String(getText(b) || ''))

    const exactA = ta === fq ? 3 : 0
    const exactB = tb === fq ? 3 : 0
    if (exactA !== exactB) return exactB - exactA

    const startsA = ta.startsWith(fq) ? 2 : 0
    const startsB = tb.startsWith(fq) ? 2 : 0
    if (startsA !== startsB) return startsB - startsA

    const inclA = ta.includes(fq) ? 1 : 0
    const inclB = tb.includes(fq) ? 1 : 0
    if (inclA !== inclB) return inclB - inclA

    return ta.localeCompare(tb)
  })
}

async function globalSearch(query) {
  try {
    const rawQ = (query ?? '').trim()
    if (!rawQ || rawQ.length < 2) {
      return { horses: [], drivers: [], racedays: [], results: [], tracks: [] }
    }

    const pat = buildFlexiblePattern(rawQ)
    const rxAny = new RegExp(pat, 'i')
    const rxStart = new RegExp('^' + pat, 'i')
    const now = new Date()

    // Fetch tracks first to enable code->name mapping for racedays/results
    const trackDocs = await Track.find({
      $or: [
        { trackName: rxAny },
        { trackCode: rxAny }
      ]
    }).limit(20).select('trackCode trackName')

    const trackNames = [...new Set(trackDocs.map(t => t.trackName))]

    // Parallel fetches for other categories
    const [horseDocs, driverDocs, upcomingDocs, resultDocs] = await Promise.all([
      // Horses: search by name
      Horse.find({ name: rxAny }).limit(32).select('id name'),

      // Drivers: search by name
      Driver.find({ name: rxAny }).limit(32).select('_id name'),

      // Upcoming racedays by track name or by codes mapped to names
      Raceday.find({
        firstStart: { $gte: now },
        $or: [
          { trackName: rxAny },
          trackNames.length ? { trackName: { $in: trackNames } } : null
        ].filter(Boolean)
      })
        .sort({ firstStart: 1 })
        .limit(24)
        .select('raceDayId trackName raceDayDate firstStart'),

      // Results (past): match by track name, horse name, or driver name
      Raceday.find({
        firstStart: { $lt: now },
        $or: [
          { trackName: rxAny },
          // any horse name in the card
          { 'raceList.horses.name': rxAny },
          // any driver name in the card
          { 'raceList.horses.driver.name': rxAny },
          // match via mapped track names from code
          trackNames.length ? { trackName: { $in: trackNames } } : null
        ].filter(Boolean)
      })
        .sort({ firstStart: -1 })
        .limit(24)
        .select('raceDayId trackName raceDayDate firstStart')
    ])

    // Rank client-side for name-based categories
    const horses = rankByRelevance(horseDocs, (h) => h.name, rawQ).slice(0, 8)
    const drivers = rankByRelevance(driverDocs, (d) => d.name, rawQ).slice(0, 8)
    const tracks = rankByRelevance(trackDocs, (t) => t.trackName, rawQ).slice(0, 8)

    // For racedays and results, we already sort by date; limit to 8
    const racedays = upcomingDocs.slice(0, 8)
    const results = resultDocs.slice(0, 8)

    return { horses, drivers, racedays, results, tracks }
  } catch (err) {
    console.error('Error during search (service):', err)
    // Never throw – always return stable empty payload
    return { horses: [], drivers: [], racedays: [], results: [], tracks: [] }
  }
}

export default { globalSearch }
