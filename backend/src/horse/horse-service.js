import Horse from './horse-model.js'

async function upsertHorse(horseName, horseData) {
    console.log('upsetHorse', horseName)
    const horseId = horseName.replace(/\s+/g, '-').toLowerCase()

    let horse;
    try {
        horse = await Horse.findOneAndUpdate(
            { horseName },
            { horseName, horseId, horseData },
            { new: true, upsert: true }
        )
    } catch (error) {
        console.error('Error in findOneAndUpdate:', error)
        throw error
    }

    console.log('horseId', horseId)
    return horse
}

export default {
  upsertHorse
}