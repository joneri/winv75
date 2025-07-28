import axios from 'axios'
import HorseRating from '../horse/horse-rating-model.js'

const fetchResults = async horseId => {
    const url = `https://api.travsport.se/webapi/horses/results/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    const { data } = await axios.get(url)
    return data
}

const calculateRatingChange = result => {
    const place = result.placement?.sortValue
    if (place === 1) return 5
    if (place === 2) return 3
    if (place === 3) return 1
    return 0
}

export const updateRatingsForRace = async (horseId, result) => {
    const change = calculateRatingChange(result)
    await HorseRating.updateOne({ horseId }, {
        $inc: { rating: change },
        $setOnInsert: { lastUpdated: new Date() }
    }, { upsert: true })
}

export const refreshHorseRating = async horseRating => {
    const results = await fetchResults(horseRating.horseId)
    const last = horseRating.lastUpdated || new Date(0)
    const newResults = results.filter(r => new Date(r.raceInformation.date) > last)
    for (const res of newResults) {
        await updateRatingsForRace(horseRating.horseId, res)
    }
    horseRating.lastUpdated = new Date()
    await horseRating.save()
}
