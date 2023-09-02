import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'

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

const fetchBasicInformation = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/basicinformation/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    const response = await axios.get(url)
    return response.data
}

const upsertHorseData = async (horseId) => {
    const [basicInformation, results, statistics] = await Promise.all([fetchBasicInformation(horseId), fetchResults(horseId), fetchStatistics(horseId)])
    const horseData = { 
        ...basicInformation, 
        results: [...results], 
        statistics: [...statistics.statistics] 
    }
    horseData.winningRate = statistics.winningRate
    horseData.placementRate = statistics.placementRate
    if (statistics.points) {
     horseData.points = Number(statistics.points.replace(/\s/g, ''))
    } else {
        console.warn('statistics.points is undefined for horseId:', horseId)
        horseData.points = 0
    }

    let horse
    try {
        horse = await Horse.updateOne({ id: horseId }, horseData, { upsert: true })
    } catch (error) {
        console.error('Error in upsertHorseData:', error)
        throw error
    }
    return horse
}

const getHorseData = async (horseId) => {
    return await Horse.findOne({ id: horseId });
}

const getHorseRankings = async (raceId) => {
    return await horseRanking.aggregateHorses(raceId)
}

export default {
    upsertHorseData,
    getHorseData,
    getHorseRankings
}