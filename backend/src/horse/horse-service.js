import Horse from './horse-model.js'
import axios from 'axios'

const fetchResults = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/results/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    const response = await axios.get(url)
    return response.data
}

const fetchStatistics = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/statistics/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    const response = await axios.get(url)
    return response.data
}

const fetchBasicInformatio = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/basicinformation/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    const response = await axios.get(url)
    return response.data
}

const upsertHorseData = async (horseId) => {
    const [basicInformation, results, statistics] = await Promise.all([fetchBasicInformatio(horseId), fetchResults(horseId), fetchStatistics(horseId)])
    const horseData = { 
        ...basicInformation.data, 
        results: [...results], 
        statistics: [...statistics.statistics] 
    };
    horseData.winningRate = statistics.winningRate
    horseData.placementRate = statistics.placementRate
    horseData.points = Number(statistics.points.replace(/\s/g, ''))

    let horse
    try {
        horse = await Horse.updateOne({ id: horseId }, horseData, { upsert: true })
    } catch (error) {
        console.error('Error in upsertHorseData:', error)
        throw error
    }
    return horse
}

export default {
    upsertHorseData
}