import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'
import { calculateHorseScore } from './horse-score.js'
import { getWeights } from '../config/scoring.js'
import HorseRating from './horse-rating-model.js'
import trackService from '../track/track-service.js'
import Driver from '../driver/driver-model.js'
import { computeHorseFormMetrics } from './horse-form-metrics.js'

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
        const baseRating = ratingDoc?.rating ?? obj.rating
        if (Number.isFinite(baseRating)) obj.rating = baseRating
        const rawFormRating = ratingDoc?.formRating ?? ratingDoc?.rating ?? obj.formRating
        const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? obj.results?.length ?? 0
        const metrics = computeHorseFormMetrics({
            baseRating: obj.rating,
            rawFormRating,
            formRaceCount,
            results: obj.results
        })
        obj.rawFormRating = rawFormRating
        obj.formRating = metrics.formRating
        obj.formDelta = metrics.deltaForm
        obj.winScore = metrics.winScore
        obj.winProbability = metrics.pWin
        obj.formGapMetric = metrics.gapMetric
        obj.formModelVersion = metrics.modelVersion
        obj.formComponents = metrics.components
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
        const docMap = new Map(ratingDocs.map(r => [r.horseId, r]))
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
        return ranked.map(r => {
            const ratingDoc = docMap.get(r.id)
            const baseRating = ratingDoc?.rating ?? r.rating ?? 0
            const rawForm = ratingDoc?.formRating ?? ratingDoc?.rating ?? r.formRating
            const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? r.results?.length ?? 0
            const driverId = Number(r?.driver?.licenseId ?? r?.driver?.id)
            const driverDoc = Number.isFinite(driverId) ? driverMap.get(driverId) : null
            const metrics = computeHorseFormMetrics({
                baseRating,
                rawFormRating: rawForm,
                formRaceCount,
                results: r.results,
                driverElo: driverDoc?.elo ?? null
            })

            const driverEnriched = (() => {
                if (!driverDoc) return r.driver
                const enriched = {
                    ...r.driver,
                    elo: driverDoc.elo ?? null,
                    formElo: driverDoc.elo ?? null,
                    careerElo: driverDoc.careerElo ?? null
                }
                if (!enriched.displayName && driverDoc.name) {
                    enriched.displayName = driverDoc.name
                }
                return enriched
            })()

            return {
                ...r,
                rating: Number.isFinite(baseRating) ? baseRating : 0,
                rawFormRating: rawForm,
                formRating: metrics.formRating,
                formDelta: metrics.deltaForm,
                winScore: metrics.winScore,
                winProbability: metrics.pWin,
                formGapMetric: metrics.gapMetric,
                formModelVersion: metrics.modelVersion,
                formComponents: metrics.components,
                driver: driverEnriched
            }
        })
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
    results.forEach(r => {
        const ratingDoc = docMap.get(r.id)
        if (ratingDoc?.rating != null) r.rating = ratingDoc.rating
        const rawForm = ratingDoc?.formRating ?? ratingDoc?.rating ?? r.formRating
        const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? r.results?.length ?? 0
        const metrics = computeHorseFormMetrics({
            baseRating: r.rating,
            rawFormRating: rawForm,
            formRaceCount,
            results: r.results
        })
        r.rawFormRating = rawForm
        r.formRating = metrics.formRating
        r.formDelta = metrics.deltaForm
        r.winScore = metrics.winScore
        r.winProbability = metrics.pWin
        r.formGapMetric = metrics.gapMetric
        r.formModelVersion = metrics.modelVersion
        r.formComponents = metrics.components
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
