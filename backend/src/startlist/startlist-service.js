import Startlist from './startlist-model.js'

const upsertStartlistData = async (startlistJSON) => {
    const startlistId = startlistJSON.raceDayId;
    let startlist
    try {
        startlist = await Startlist.updateOne({ raceDayId: startlistId }, startlistJSON, { upsert: true, new: true })
    } catch (error) {
        console.error(`Error while upserting the startlist with raceDayId ${startlistId}:`, error)
        throw error
    }
    return startlist
}

export default {
    upsertStartlistData
}