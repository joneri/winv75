import Raceday from './raceday-model.js'

const upsertStartlistData = async (racedayJSON) => {
    const raceDayId = racedayJSON.raceDayId;
    let raceDay
    try {
        raceDay = await Raceday.updateOne({ raceDayId: raceDayId }, racedayJSON, { upsert: true, new: true })
    } catch (error) {
        console.error(`Error while upserting the startlist with raceDayId ${raceDayId}:`, error)
        throw error
    }
    return raceDay
}

const getAllRacedays = async () => {
    try {
        return await Raceday.find({})
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

export default {
    upsertStartlistData,
    getAllRacedays,
    getRacedayById
}