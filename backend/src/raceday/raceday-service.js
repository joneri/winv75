import Raceday from './raceday-model.js'
import Horse from '../horse/horse-model.js'
import axios from 'axios'

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
    return raceDay
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

const fetchRacedayIdsByDate = async (date) => {
    const url = `https://api.travsport.se/webapi/raceinfo/organisation/TROT/sourceofdata/BOTH?fromracedate=${date}&toracedate=${date}&tosubmissiondate=${date}&typeOfRacesCodes=`
    try {
        const response = await axios.get(url)
        return response.data.map(item => item.raceDayId)
    } catch (error) {
        console.error(`Error fetching raceday ids for ${date}:`, error)
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
    const ids = await fetchRacedayIdsByDate(date)
    const stored = []
    for (const id of ids) {
        const startlist = await fetchStartlistById(id)
        const raceDay = await upsertStartlistData(startlist)
        stored.push(raceDay)
    }
    return stored
}

export default {
    upsertStartlistData,
    getAllRacedays,
    getRacedayById,
    updateEarliestUpdatedHorseTimestamp,
    fetchAndStoreByDate
}
