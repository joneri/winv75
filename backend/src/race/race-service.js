import Raceday from '../raceday/raceday-model.js'

const getRaceById = async (id) => {
    try {
        const raceDay = await Raceday.findOne({"raceList.raceId": id}, 'raceList')
        
        if (raceDay) {
            return raceDay.raceList.find(r => r.raceId.toString() === id.toString())
        } else {
            console.log(`No matching document found for race with ID ${id}.`)
        }
    } catch (err) {
        console.error(`Error fetching race with ID ${id}: ${err}`)
    }
}

export default {
    getRaceById
}
