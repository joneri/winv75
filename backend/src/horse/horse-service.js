import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'
import { getWeights } from '../config/scoring.js'

const calculateHorseRating = (horse, weights = getWeights()) => {
    const pointsNumeric = typeof horse.points === 'string'
        ? parseFloat(horse.points.replace(/\s/g, '')) || 0
        : horse.points || 0
    const winningRateNumeric = parseFloat(horse.winningRate) || 0
    const placementRateNumeric = parseFloat(horse.placementRate) || 0
    const placementString = horse.statistics?.[0]?.placements || '0-0-0'
    const [first = 0, second = 0, third = 0] = placementString.split('-').map(n => parseInt(n) || 0)
    const consistencyScore = first * 3 + second * 2 + third

    return (pointsNumeric * weights.points) +
        (consistencyScore * weights.consistency) +
        (winningRateNumeric * weights.winRate) +
        (placementRateNumeric * weights.placementRate)
}

const fetchResults = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/results/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Failed to fetch results for horseId ${horseId}:`, error.message)
        throw new Error('Failed to fetch results')
    }
}

const fetchStatistics = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/statistics/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Failed to fetch statistics for horseId ${horseId}:`, error.message)
        throw new Error('Failed to fetch statistics')
    }
}

const fetchBasicInformation = async (horseId) => {
    const url = `https://api.travsport.se/webapi/horses/basicinformation/organisation/TROT/sourceofdata/SPORT/horseid/${horseId}`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Failed to fetch basic information for horseId ${horseId}:`, error.message)
        throw new Error('Failed to fetch basic information')
    }
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

    horseData.rating = calculateHorseRating(horseData)

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
    try {
        const horse = await Horse.findOne({ id: horseId })
        if (!horse) return null
        const obj = horse.toObject()
        obj.rating = calculateHorseRating(obj)
        return obj
    } catch (error) {
        console.error(`Error retrieving horse ${horseId}:`, error.message)
        throw new Error('Failed to retrieve horse')
    }
}

const getHorseRankings = async (raceId) => {
    try {
        return await horseRanking.aggregateHorses(raceId)
    } catch (error) {
        console.error(`Error retrieving horse rankings for raceId ${raceId}:`, error.message)
        throw new Error('Failed to retrieve horse rankings')
    }
}

const getHorsesByRating = async ({ ids, minRating } = {}) => {
    const query = {}
    if (ids && ids.length) {
        query.id = { $in: ids }
    }

    const horses = await Horse.find(query)
    const weights = getWeights()
    let results = horses.map(h => {
        const obj = h.toObject()
        obj.rating = calculateHorseRating(obj, weights)
        return obj
    })
    if (typeof minRating === 'number') {
        results = results.filter(h => h.rating >= minRating)
    }
    results.sort((a, b) => b.rating - a.rating)
    return results
}

export default {
    upsertHorseData,
    getHorseData,
    getHorseRankings,
    getHorsesByRating
}
