import Horse from './horse-model.js'
import axios from 'axios'
import horseRanking from './horse-ranking.js'
import { calculateHorseScore } from './horse-score.js'
import { getWeights } from '../config/scoring.js'
import HorseRating from './horse-rating-model.js'
import trackService from '../track/track-service.js'
import Driver from '../driver/driver-model.js'

const HORSE_FORM_RECENCY_SCALE_DAYS = Number(process.env.HORSE_FORM_RECENCY_SCALE_DAYS || 60)
const HORSE_FORM_SAMPLE_TARGET = Number(process.env.HORSE_FORM_SAMPLE_TARGET || 2)
const HORSE_FORM_ACTIVE_WINDOW_DAYS = Number(process.env.HORSE_FORM_ACTIVE_WINDOW_DAYS || 45)
const HORSE_FORM_INACTIVITY_SPAN = Number(process.env.HORSE_FORM_INACTIVITY_SPAN || 120)
const HORSE_FORM_INACTIVITY_CAP = Number(process.env.HORSE_FORM_INACTIVITY_CAP || 65)
const HORSE_FORM_MOMENTUM_WINDOW_DAYS = Number(process.env.HORSE_FORM_MOMENTUM_WINDOW_DAYS || 75)
const HORSE_FORM_MOMENTUM_DECAY_DAYS = Number(process.env.HORSE_FORM_MOMENTUM_DECAY_DAYS || 30)
const HORSE_FORM_MOMENTUM_MULTIPLIER = Number(process.env.HORSE_FORM_MOMENTUM_MULTIPLIER || 22)
const HORSE_FORM_MOMENTUM_CAP = Number(process.env.HORSE_FORM_MOMENTUM_CAP || 55)

const daysBetween = (from, to) => {
    const start = from instanceof Date ? from : new Date(from)
    const end = to instanceof Date ? to : new Date(to)
    if (Number.isNaN(start?.getTime?.()) || Number.isNaN(end?.getTime?.())) return null
    const diff = end.getTime() - start.getTime()
    return diff / (1000 * 60 * 60 * 24)
}

const getLastRaceDate = (results = []) => {
    if (!Array.isArray(results) || !results.length) return null
    let latest = null
    for (const res of results) {
        const raw = res?.raceInformation?.date || res?.date
        if (!raw) continue
        const dt = new Date(raw)
        if (Number.isNaN(dt.getTime())) continue
        if (!latest || dt > latest) latest = dt
    }
    return latest
}

const placementMomentumValue = (placement) => {
    const plc = Number(placement)
    if (!Number.isFinite(plc)) return 0
    if (plc === 1) return 3
    if (plc === 2) return 2.4
    if (plc === 3) return 1.6
    if (plc === 4) return 0.8
    if (plc === 5) return 0
    if (plc === 6) return -0.8
    if (plc === 7) return -1.4
    if (plc === 8) return -1.8
    return -2.2
}

const computeMomentumDelta = (results = []) => {
    if (!Array.isArray(results) || !results.length) return 0
    const now = Date.now()
    let weighted = 0
    let weightSum = 0
    for (const res of results) {
        const placement = res?.placement?.sortValue ?? res?.placement?.numericalValue ?? res?.placement
        const dateRaw = res?.raceInformation?.date || res?.date
        if (!dateRaw) continue
        const raceDate = new Date(dateRaw)
        const diffDays = Number.isNaN(raceDate.getTime())
            ? null
            : (now - raceDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays == null || diffDays < 0 || diffDays > HORSE_FORM_MOMENTUM_WINDOW_DAYS) continue
        const base = placementMomentumValue(placement)
        if (base === 0) {
            // zero still contributes to weight to prevent tiny samples blowing up
            const weight = Math.exp(-diffDays / HORSE_FORM_MOMENTUM_DECAY_DAYS)
            weightSum += weight
            continue
        }
        const weight = Math.exp(-diffDays / HORSE_FORM_MOMENTUM_DECAY_DAYS)
        weighted += base * weight
        weightSum += weight
    }
    if (weightSum <= 0) return 0
    const normalized = weighted / weightSum
    const rawDelta = normalized * HORSE_FORM_MOMENTUM_MULTIPLIER
    const capped = Math.max(-HORSE_FORM_MOMENTUM_CAP, Math.min(HORSE_FORM_MOMENTUM_CAP, rawDelta))
    return capped
}

const adjustFormRating = ({ formRating, baseRating, formRaceCount = 0, results = [] }) => {
    const safeBase = Number.isFinite(baseRating) ? baseRating : formRating
    const safeForm = Number.isFinite(formRating) ? formRating : safeBase
    if (!Number.isFinite(safeBase) && !Number.isFinite(safeForm)) return 0

    const lastRace = getLastRaceDate(results)
    const recencyInfo = (() => {
        if (!lastRace) return { weight: 0, days: null }
        const diffDays = daysBetween(lastRace, new Date())
        if (diffDays == null || diffDays < 0) return { weight: 1, days: diffDays }
        return {
            weight: Math.exp(-diffDays / HORSE_FORM_RECENCY_SCALE_DAYS),
            days: diffDays
        }
    })()

    const sampleWeight = Math.min(1, Math.max(0, formRaceCount / HORSE_FORM_SAMPLE_TARGET))
    const blendedWeight = Math.min(1, Math.max(0, recencyInfo.weight * sampleWeight))

    const baseComponent = (() => {
        if (!Number.isFinite(safeBase)) return Number.isFinite(safeForm) ? safeForm * blendedWeight : 0
        if (!Number.isFinite(safeForm)) return safeBase
        const delta = safeForm - safeBase
        return safeBase + (delta * blendedWeight)
    })()

    const momentumDelta = computeMomentumDelta(results)

    let inactivityPenalty = 0
    const daysSinceLast = recencyInfo.days
    if (daysSinceLast == null) {
        inactivityPenalty = HORSE_FORM_INACTIVITY_CAP * 0.5
    } else if (daysSinceLast > HORSE_FORM_ACTIVE_WINDOW_DAYS) {
        const staleDays = daysSinceLast - HORSE_FORM_ACTIVE_WINDOW_DAYS
        const span = Math.max(1, HORSE_FORM_INACTIVITY_SPAN)
        const ratio = Math.min(1, staleDays / span)
        inactivityPenalty = ratio * HORSE_FORM_INACTIVITY_CAP
    }

    if (inactivityPenalty > 0) {
        const sparseFactor = 0.5 + 0.5 * (1 - Math.min(1, formRaceCount / (HORSE_FORM_SAMPLE_TARGET * 2)))
        inactivityPenalty *= sparseFactor
    }

    let adjusted = baseComponent + momentumDelta - inactivityPenalty
    if (!Number.isFinite(adjusted)) {
        adjusted = Number.isFinite(baseComponent) ? baseComponent : (safeBase || safeForm || 0)
    }
    return Math.round(Math.max(0, adjusted))
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
        const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? 0
        obj.rawFormRating = rawFormRating
        obj.formRating = adjustFormRating({
            formRating: rawFormRating,
            baseRating: obj.rating,
            formRaceCount,
            results: obj.results
        })
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
            const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? 0
            const driverId = Number(r?.driver?.licenseId ?? r?.driver?.id)
            const driverDoc = Number.isFinite(driverId) ? driverMap.get(driverId) : null
            const formAdjusted = adjustFormRating({
                formRating: rawForm,
                baseRating,
                formRaceCount,
                results: r.results
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
                formRating: formAdjusted,
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
        const formRaceCount = ratingDoc?.formNumberOfRaces ?? ratingDoc?.numberOfRaces ?? 0
        r.rawFormRating = rawForm
        r.formRating = adjustFormRating({
            formRating: rawForm,
            baseRating: r.rating,
            formRaceCount,
            results: r.results
        })
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
