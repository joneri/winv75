import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'
import { calculateHorseScore } from './horse-score.js'
import { getWeights } from '../config/scoring.js'
import HorseRating from './horse-rating-model.js'
import trackService from '../track/track-service.js'
import Driver from '../driver/driver-model.js'
import Raceday from '../raceday/raceday-model.js'
import {
    attachFieldProbabilities,
    buildHorseEloPrediction,
    getLaneBiasStore
} from '../rating/horse-elo-prediction.js'

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

const loadRaceContext = async (raceId) => {
    const numericRaceId = Number(raceId)
    if (!Number.isFinite(numericRaceId)) {
        return {}
    }

    const raceday = await Raceday.findOne(
        { 'raceList.raceId': numericRaceId },
        {
            trackName: 1,
            raceDayDate: 1,
            raceList: { $elemMatch: { raceId: numericRaceId } }
        }
    ).lean()

    const race = raceday?.raceList?.[0]
    if (!race) {
        return {}
    }

    const track = raceday?.trackName
        ? await trackService.getTrackByName(raceday.trackName)
        : null

    return {
        raceDate: race.startDateTime ?? raceday?.raceDayDate ?? null,
        startMethod: race.startMethod ?? race.raceType?.text ?? null,
        distance: race.distance ?? null,
        trackName: raceday?.trackName ?? null,
        trackCode: track?.trackCode ?? null
    }
}

const buildDriverPayload = (baseDriver, driverDoc) => {
    if (!driverDoc) return baseDriver

    const enriched = {
        ...(baseDriver || {}),
        elo: driverDoc.elo ?? null,
        formElo: driverDoc.elo ?? null,
        careerElo: driverDoc.careerElo ?? null
    }

    if (!enriched.displayName && driverDoc.name) {
        enriched.displayName = driverDoc.name
    }

    return enriched
}

const applyPredictionFields = (entity, prediction) => ({
    ...entity,
    rating: prediction.careerElo,
    careerElo: prediction.careerElo,
    ratingLastUpdated: entity?.lastUpdated ?? null,
    ratingLastRaceDate: entity?.lastRaceDate ?? null,
    rawFormRating: prediction.storedFormElo,
    storedFormElo: prediction.storedFormElo,
    formRating: prediction.formElo,
    formElo: prediction.formElo,
    formRatingLastUpdated: entity?.formLastUpdated ?? null,
    formRatingLastRaceDate: entity?.formLastRaceDate ?? null,
    formDelta: prediction.debug.formDelta,
    effectiveElo: prediction.effectiveElo,
    modelProbability: prediction.modelProbability ?? null,
    winProbability: prediction.modelProbability ?? null,
    winScore: prediction.effectiveElo,
    formGapMetric: prediction.debug.daysSinceLast,
    formModelVersion: prediction.version,
    eloVersion: prediction.version,
    storedEloVersion: entity?.eloVersion ?? null,
    eloWeights: prediction.weights,
    formComponents: prediction.debug,
    eloDebug: prediction.debug,
    compositeScore: prediction.effectiveElo,
    prediction
})

const getHorseData = async (horseId) => {
    try {
        const horse = await Horse.findOne({ id: horseId })
        if (!horse) return null
        const obj = horse.toObject()
        obj.score = calculateHorseScore(obj)
        const ratingDoc = await HorseRating.findOne({ horseId })
        if (ratingDoc) {
            obj.lastUpdated = ratingDoc.lastUpdated ?? null
            obj.lastRaceDate = ratingDoc.lastRaceDate ?? null
            obj.eloVersion = ratingDoc.eloVersion ?? null
            obj.formLastUpdated = ratingDoc.formLastUpdated ?? null
            obj.formLastRaceDate = ratingDoc.formLastRaceDate ?? null
        }
        const laneBiasStore = await getLaneBiasStore()
        const prediction = buildHorseEloPrediction({
            horse: obj,
            ratingDoc,
            laneBiasStore
        })
        return applyPredictionFields(obj, prediction)
    } catch (error) {
        console.error(`Error retrieving horse ${horseId}:`, error.message)
        throw new Error('Failed to retrieve horse')
    }
}

const getHorseRankings = async (raceId) => {
    try {
        const ranked = await horseRanking.aggregateHorses(raceId)
        const raceContext = await loadRaceContext(raceId)
        const laneBiasStore = await getLaneBiasStore()
        const horseIds = ranked.map(r => r.id)
        const ratingDocs = await HorseRating.find({ horseId: { $in: ranked.map(r => r.id) } })
        const docMap = new Map(ratingDocs.map(r => [r.horseId, r]))
        const horseDocs = horseIds.length
            ? await Horse.find({ id: { $in: horseIds } }, { id: 1, results: 1, rating: 1, formRating: 1 }).lean()
            : []
        const horseMap = new Map(horseDocs.map(doc => [doc.id, doc]))
        const driverIds = ranked
            .map(r => {
                const driverId = r?.driver?.licenseId ?? r?.driver?.id
                const num = Number(driverId)
                return Number.isFinite(num) ? num : null
            })
            .filter(id => id != null)
        const driverDocs = driverIds.length
            ? await Driver.find({ _id: { $in: driverIds } }, { _id: 1, elo: 1, careerElo: 1 }).lean()
            : []
        const driverMap = new Map(driverDocs.map(d => [Number(d._id), d]))
        const predictions = ranked.map(r => {
            const horseDoc = horseMap.get(r.id) || {}
            const ratingDoc = docMap.get(r.id)
            const driverId = Number(r?.driver?.licenseId ?? r?.driver?.id)
            const driverDoc = Number.isFinite(driverId) ? driverMap.get(driverId) : null
            const prediction = buildHorseEloPrediction({
                horse: {
                    ...r,
                    results: horseDoc?.results || []
                },
                ratingDoc,
                driver: driverDoc,
                raceContext,
                laneBiasStore
            })

            return applyPredictionFields({
                ...r,
                results: horseDoc?.results || [],
                driver: buildDriverPayload(r.driver, driverDoc)
            }, prediction)
        })

        return attachFieldProbabilities(predictions)
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
    const docMap = new Map(ratingDocs.map(r => [r.horseId, r]))
    const laneBiasStore = await getLaneBiasStore()
    results.forEach(r => {
        const ratingDoc = docMap.get(r.id)
        const prediction = buildHorseEloPrediction({
            horse: r,
            ratingDoc,
            laneBiasStore
        })
        Object.assign(r, applyPredictionFields(r, prediction))
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
