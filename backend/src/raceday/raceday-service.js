import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import axios from 'axios'
import horseService from '../horse/horse-service.js'
import { buildRaceInsights } from '../race/race-insights.js'
import { aiMetrics } from '../middleware/metrics.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const updateEarliestUpdatedHorseTimestamp = async (raceDayId, targetRaceId) => {
  try {
    const raceDay = await Raceday.findById(raceDayId)
    if (!raceDay) {
      throw new Error(`No raceDay found for the given ID: ${raceDayId}`)
    }

  let raceFound = false

  for (const race of raceDay.raceList) {
    if (String(race.raceId) === String(targetRaceId)) {
      raceFound = true;
      let earliestTimestamp = new Date(); // Initialize to current date and time

      for (const listHorse of race.horses) {
        const horse = await Horse.findOne({ id: listHorse.id })
        if (!horse) {
          console.warn(`No horse found for ID: ${listHorse.id}`)
          continue;
        }
        if (horse.updatedAt < earliestTimestamp) {
          earliestTimestamp = horse.updatedAt;
        }
      }
      console.log(`Setting earliestTimestamp: ${earliestTimestamp}`)
      race.earliestUpdatedHorseTimestamp = earliestTimestamp;

      // Mark the sub-document as modified to ensure it gets saved
      raceDay.markModified('raceList')
      await raceDay.save();
      console.log('Race day saved.');
      return raceDay;
    }
  }

  if (!raceFound) {
    throw new Error(`No race found for the given raceId: ${targetRaceId}`)
  }
  } catch (error) {
    console.error('Error updating earliest horse timestamp:', error.message)
    throw error
  }
}

const upsertStartlistData = async (racedayJSON) => {
    const raceDayId = racedayJSON.raceDayId
    let raceDay
    try {
        raceDay = await Raceday.findOneAndUpdate(
            { raceDayId: raceDayId },
            racedayJSON,
            { upsert: true, new: true, runValidators: true }
        )
    } catch (error) {
        console.error(`Error while upserting the startlist with raceDayId ${raceDayId}:`, error)
        throw error
    }
    updateHorsesForRaceday(raceDay).catch(err => console.error('Failed updating horses for raceday', err))
    return raceDay
}

const updateHorsesForRaceday = async (raceDay) => {
    const horseIds = [...new Set(raceDay.raceList.flatMap(r => r.horses.map(h => h.id)))]
    console.log(`Updating ${horseIds.length} horses for raceday ${raceDay.raceDayId}`)
    for (let i = 0; i < horseIds.length; i++) {
        const id = horseIds[i]
        try {
            console.log(`Updating horse ${i + 1} of ${horseIds.length}: ${id}`)
            await horseService.upsertHorseData(id)
        } catch (err) {
            console.error(`Skipped horse ${id} due to error:`, err.message)
        }
        if (i < horseIds.length - 1) {
            await delay(400)
        }
    }

    // After all horses have been refreshed, align race metadata so the UI
    // can display when horses were last updated. This mirrors the manual
    // update flow where this timestamp is calculated after updating each
    // horse individually.
    for (const race of raceDay.raceList) {
        try {
            await updateEarliestUpdatedHorseTimestamp(raceDay._id, race.raceId)
        } catch (err) {
            console.error(`Failed updating earliest horse timestamp for race ${race.raceId}:`, err.message)
        }
    }
}

const getAllRacedays = async (skip = 0, limit = null) => {
    try {
        const query = Raceday.find({}).sort({ firstStart: -1 })
        if (skip) query.skip(skip)
        if (limit) query.limit(limit)
        return await query.exec()
    } catch (error) {
        console.error('Error in getAllRacedays:', error)
        throw error
    }
};

const getRacedayById = async (id) => {
    try {
        return await Raceday.findById(id)
    } catch (error) {
        console.error(`Error in getRacedayById for ID ${id}:`, error)
        throw error
    }
};

const fetchRacedaysByDate = async (date) => {
    const url = `https://api.travsport.se/webapi/raceinfo/organisation/TROT/sourceofdata/BOTH?fromracedate=${date}&toracedate=${date}&tosubmissiondate=${date}&typeOfRacesCodes=`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Error fetching raceday data for ${date}:`, error)
        throw error
    }
}

const fetchStartlistById = async (racedayId) => {
    const url = `https://api.travsport.se/webapi/raceinfo/startlists/organisation/TROT/sourceofdata/SPORT/racedayid/${racedayId}`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Error fetching startlist for racedayId ${racedayId}:`, error)
        throw error
    }
}

const fetchAndStoreByDate = async (date) => {
    const raceDaysInfo = await fetchRacedaysByDate(date)
    const stored = []
    for (const info of raceDaysInfo) {
        if (info.hasOldStartList || info.hasNewStartList) {
            try {
                const startlist = await fetchStartlistById(info.raceDayId)
                const raceDay = await upsertStartlistData(startlist)
                stored.push(raceDay)
            } catch (error) {
                console.error(`Skipping racedayId ${info.raceDayId} due to fetch error:`, error.message)
            }
        }
    }
    return stored
}

const getRacedaysPaged = async (skip = 0, limit = null, fields = null) => {
  try {
    const selected = Array.isArray(fields) && fields.length ? fields : null

    // Build projection for aggregation, allowing computed raceCount
    const projection = { _id: 1 }
    if (selected) {
      for (const f of selected) {
        if (f === 'raceCount' || f === 'hasResults') continue // handled below
        // Avoid exposing entire raceList by default unless explicitly asked
        if (f === 'raceList') {
          projection['raceList'] = 1
        } else {
          projection[f] = 1
        }
      }
      if (selected.includes('raceCount')) {
        projection['raceCount'] = { $size: { $ifNull: ['$raceList', []] } }
      }
      if (selected.includes('hasResults')) {
        projection['hasResults'] = {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ['$raceList', []] },
                  as: 'r',
                  cond: { $eq: ['$$r.resultsReady', true] }
                }
              }
            },
            0
          ]
        }
      }
    } else {
      // Default minimal projection
      projection['firstStart'] = 1
      projection['raceDayDate'] = 1
      projection['trackName'] = 1
      projection['raceStandard'] = 1
    }

    const pipeline = [
      { $sort: { firstStart: -1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: projection }
    ]

    const [items, total] = await Promise.all([
      Raceday.aggregate(pipeline).exec(),
      Raceday.countDocuments().exec()
    ])

    return { items, total }
  } catch (error) {
    console.error('Error in getRacedaysPaged:', error)
    throw error
  }
}

// Return AI list for a raceday, using cache if fresh; rebuild and persist if stale/missing
const getRacedayAiList = async (racedayId, { force = false } = {}) => {
  const ttlMinutes = Number(process.env.AI_RACEDAY_CACHE_TTL_MINUTES || 120)
  const now = Date.now()

  const raceday = await Raceday.findById(
    racedayId,
    { aiListCache: 1, firstStart: 1, trackName: 1, raceDayDate: 1, raceList: 1, gameTypes: 1 }
  )
  if (!raceday) return null

  const genAt = raceday.aiListCache?.generatedAt ? new Date(raceday.aiListCache.generatedAt).getTime() : 0
  const fresh = !!genAt && (now - genAt) <= ttlMinutes * 60 * 1000

  if (!force && fresh && Array.isArray(raceday.aiListCache?.races) && raceday.aiListCache.races.length) {
    try { aiMetrics.raceday.cacheHits += 1 } catch {}
    return { raceday: { id: raceday._id, trackName: raceday.trackName, raceDayDate: raceday.raceDayDate }, races: raceday.aiListCache.races }
  }
  try { aiMetrics.raceday.cacheMisses += 1 } catch {}

  // Rebuild
  const gamesMap = {}
  const gt = raceday.gameTypes || {}
  for (const [game, ids] of Object.entries(gt)) {
    ids.forEach((rid, idx) => {
      if (!gamesMap[rid]) gamesMap[rid] = []
      gamesMap[rid].push({ game, leg: idx + 1 })
    })
  }

  const raceIds = (raceday.raceList || []).map(r => r.raceId)
  const races = []
  for (const rid of raceIds) {
    const insights = await buildRaceInsights(rid)
    if (insights) {
      races.push({ ...insights, games: gamesMap[rid] || [] })
    }
  }
  races.sort((a, b) => (a.race?.raceNumber || 0) - (b.race?.raceNumber || 0))

  raceday.aiListCache = { generatedAt: new Date(), races }
  await raceday.save()

  return { raceday: { id: raceday._id, trackName: raceday.trackName, raceDayDate: raceday.raceDayDate }, races }
}

// Precompute and cache AI list for a specific raceday id
const precomputeRacedayAiList = async (racedayId) => {
  await getRacedayAiList(racedayId, { force: true })
  return { ok: true }
}

const precomputeUpcomingAiLists = async (daysAhead = 3) => {
  const today = new Date()
  const target = new Date(today)
  target.setDate(target.getDate() + daysAhead)
  const items = await Raceday.find({ firstStart: { $gte: today, $lte: target } }, { _id: 1 }).lean()
  for (const it of items) {
    try { await precomputeRacedayAiList(it._id) } catch (e) { console.error('AI precompute failed for', it._id, e) }
  }
  return { count: items.length }
}

export default {
    upsertStartlistData,
    getAllRacedays,
    getRacedayById,
    updateEarliestUpdatedHorseTimestamp,
    fetchAndStoreByDate,
    getRacedaysPaged,
    precomputeRacedayAiList,
    precomputeUpcomingAiLists,
    getRacedayAiList
}
