import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'
import { calculateHorseScore } from './horse-score.js'
import { getWeights } from '../config/scoring.js'
import HorseRating from './horse-rating-model.js'
import trackService from '../track/track-service.js'

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

    horseData.score = calculateHorseScore(horseData)

    let horse
    try {
        horse = await Horse.updateOne({ id: horseId }, horseData, { upsert: true })
    } catch (error) {
        console.error('Error in upsertHorseData:', error)
        throw error
    }

    const winnerTracks = new Set()
    for (const res of horseData.results) {
        if (res.placement?.sortValue === 1 && res.trackCode) {
            winnerTracks.add(res.trackCode)
        }
    }
    for (const code of winnerTracks) {
        try {
            await trackService.updateTrackStats(code)
        } catch (err) {
            console.error(`Failed to update track stats for ${code}:`, err)
        }
    }

    return horse
}

const getHorseData = async (horseId) => {
    try {
        const horse = await Horse.findOne({ id: horseId })
        if (!horse) return null
        const obj = horse.toObject()
        obj.score = calculateHorseScore(obj)
        const ratingDoc = await HorseRating.findOne({ horseId })
        obj.rating = ratingDoc ? ratingDoc.rating : obj.rating
        // expose formRating for fast reads as well
        obj.formRating = ratingDoc ? (ratingDoc.formRating ?? obj.formRating) : obj.formRating
        return obj
    } catch (error) {
        console.error(`Error retrieving horse ${horseId}:`, error.message)
        throw new Error('Failed to retrieve horse')
    }
}

const getHorseRankings = async (raceId) => {
    try {
        const ranked = await horseRanking.aggregateHorses(raceId)
        const ratingDocs = await HorseRating.find({ horseId: { $in: ranked.map(r => r.id) } })
        const ratingMap = new Map(ratingDocs.map(r => [r.horseId, r.rating]))
        const formRatingMap = new Map(ratingDocs.map(r => [r.horseId, r.formRating ?? r.rating]))
        return ranked.map(r => ({ ...r, rating: ratingMap.get(r.id) || 0, formRating: formRatingMap.get(r.id) || 0 }))
    } catch (error) {
        console.error(`Error retrieving horse rankings for raceId ${raceId}:`, error.message)
        throw new Error('Failed to retrieve horse rankings')
    }
}

const getHorsesByScore = async ({ ids, minScore } = {}) => {
    const query = {}
    if (ids && ids.length) {
        query.id = { $in: ids }
    }

    const horses = await Horse.find(query)
    const weights = getWeights()
    let results = horses.map(h => {
        const obj = h.toObject()
        obj.score = calculateHorseScore(obj, weights)
        return obj
    })
    const ratingDocs = await HorseRating.find({ horseId: { $in: results.map(r => r.id) } })
    const ratingMap = new Map(ratingDocs.map(r => [r.horseId, r.rating]))
    const formRatingMap = new Map(ratingDocs.map(r => [r.horseId, r.formRating ?? r.rating]))
    results.forEach(r => {
        r.rating = ratingMap.get(r.id) || r.rating
        r.formRating = formRatingMap.get(r.id) || r.formRating
    })
    if (typeof minScore === 'number') {
        results = results.filter(h => h.score >= minScore)
    }
    results.sort((a, b) => b.score - a.score)
    return results
}

export default {
    upsertHorseData,
    getHorseData,
    getHorseRankings,
    getHorsesByScore
}
