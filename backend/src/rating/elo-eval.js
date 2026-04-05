import Horse from '../horse/horse-model.js'
import { processRace, DEFAULT_K, DEFAULT_DECAY_DAYS, ELO_PROFILES } from './elo-engine.js'
import { seedFromHorseDoc } from './rating-seed.js'
import { classFactorFromPurse } from './class-factor.js'
import { rmse } from './elo-utils.js'
import { processDriverRace } from '../driver/driver-elo-service.js'
import { buildHorseEloPrediction, getLaneBiasStore } from './horse-elo-prediction.js'

const DEFAULT_DRIVER_RATING = Number(process.env.DRIVER_DEFAULT_RATING || 900)
const DEFAULT_FORM_DECAY_DAYS = Number(process.env.FORM_RATING_DECAY_DAYS || 90)
const DEFAULT_DRIVER_FORM_DECAY_DAYS = Number(process.env.DRIVER_FORM_DECAY_DAYS || 45)

const toRaceDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const mean = (values = []) => {
  if (!values.length) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4))
}

const predictRmseForRace = (raceEntries = [], rankResolver) => {
  const ranked = [...raceEntries].sort((left, right) => rankResolver(right) - rankResolver(left))
  const predictedRanks = ranked.map((_, index) => index + 1)
  const actualPlacements = ranked.map((entry) => entry.placement)
  const score = rmse(actualPlacements, predictedRanks)
  return Number.isFinite(score) ? score : null
}

const getHorseState = (state, pointsMap, horseId) => {
  const key = String(horseId)
  let entry = state.get(key)
  if (!entry) {
    const seed = seedFromHorseDoc({ id: key, points: pointsMap.get(key) || 0 })
    entry = { rating: seed, numberOfRaces: 0, seedRating: seed, lastRaceDate: null }
    state.set(key, entry)
  }
  return entry
}

const getDriverState = (state, driverId) => {
  const key = String(driverId)
  let entry = state.get(key)
  if (!entry) {
    entry = { rating: DEFAULT_DRIVER_RATING, numberOfRaces: 0 }
    state.set(key, entry)
  }
  return entry
}

export async function evaluateElo({
  from,
  to,
  k = DEFAULT_K,
  decayDays = DEFAULT_DECAY_DAYS,
  classMin,
  classMax,
  classRef,
  kClassMultiplier
} = {}) {
  const fromDate = from ? new Date(from) : new Date(0)
  const toDate = to ? new Date(to) : new Date()

  const pipeline = [
    {
      $project: {
        id: '$id',
        points: '$points',
        resultsArr: {
          $cond: [{ $isArray: '$results' }, '$results', []]
        }
      }
    },
    { $unwind: '$resultsArr' },
    {
      $project: {
        horseId: '$id',
        raceId: '$resultsArr.raceInformation.raceId',
        raceDateRaw: '$resultsArr.raceInformation.date',
        placementSort: '$resultsArr.placement.sortValue',
        withdrawn: '$resultsArr.withdrawn',
        prize: '$resultsArr.prizeMoney.sortValue',
        driverId: '$resultsArr.driver.id',
        startMethod: '$resultsArr.startMethod',
        distance: '$resultsArr.distance.sortValue',
        trackCode: '$resultsArr.trackCode'
      }
    },
    {
      $project: {
        horseId: 1,
        raceId: 1,
        raceDate: {
          $convert: { input: '$raceDateRaw', to: 'date', onError: null, onNull: null }
        },
        placement: {
          $cond: [{ $eq: ['$placementSort', 99] }, null, '$placementSort']
        },
        withdrawn: 1,
        prize: 1,
        driverId: 1,
        startMethod: 1,
        distance: 1,
        trackCode: 1
      }
    },
    { $match: { withdrawn: { $ne: true }, raceDate: { $gte: fromDate, $lte: toDate } } },
    { $match: { raceId: { $nin: [null, ''] } } },
    {
      $group: {
        _id: '$raceId',
        raceDate: { $first: '$raceDate' },
        topPrize: { $max: '$prize' },
        startMethod: { $first: '$startMethod' },
        distance: { $first: '$distance' },
        trackCode: { $first: '$trackCode' },
        horses: {
          $push: {
            horseId: '$horseId',
            placement: '$placement',
            driverId: '$driverId'
          }
        }
      }
    },
    { $sort: { raceDate: 1 } }
  ]

  const races = await Horse.aggregate(pipeline)
  const laneBiasStore = await getLaneBiasStore()

  const ids = new Set()
  for (const race of races) {
    for (const horse of race.horses || []) {
      ids.add(horse.horseId)
    }
  }

  const idArr = Array.from(ids)
  const horseDocs = await Horse.find(
    { id: { $in: idArr } },
    { id: 1, points: 1, results: 1 }
  ).lean()

  const horseMap = new Map(horseDocs.map(horse => [horse.id, horse]))
  const pointsMap = new Map(horseDocs.map(horse => [String(horse.id), Number(horse.points || 0)]))

  const careerRatings = new Map()
  const formRatings = new Map()
  const driverCareerRatings = new Map()
  const driverFormRatings = new Map()

  const baselineRmse = []
  const effectiveRmse = []
  let horsesConsidered = 0
  let prizeKnown = 0

  for (const race of races) {
    const list = (race.horses || []).filter(horse => Number.isFinite(Number(horse?.placement)) && Number(horse.placement) > 0)
    if (list.length < 2) continue

    const raceDate = toRaceDate(race.raceDate) || new Date()

    const raceEntries = list.map((horse) => {
      const horseState = getHorseState(careerRatings, pointsMap, horse.horseId)
      const formState = formRatings.get(String(horse.horseId)) || horseState
      const driverId = Number(horse?.driverId)
      const driverCareer = Number.isFinite(driverId) ? getDriverState(driverCareerRatings, driverId) : null
      const driverForm = Number.isFinite(driverId) ? (driverFormRatings.get(String(driverId)) || driverCareer) : null
      const horseDoc = horseMap.get(horse.horseId) || { id: horse.horseId, results: [] }
      const prediction = buildHorseEloPrediction({
        horse: horseDoc,
        ratingDoc: {
          rating: horseState.rating,
          formRating: formState.rating
        },
        driver: driverForm
          ? { elo: driverForm.rating, careerElo: driverCareer?.rating ?? null }
          : {},
        raceContext: {
          raceDate,
          startMethod: race.startMethod,
          distance: race.distance,
          trackCode: race.trackCode
        },
        laneBiasStore
      })

      return {
        horseId: horse.horseId,
        driverId,
        placement: Number(horse.placement),
        careerRating: horseState.rating,
        effectiveElo: prediction.effectiveElo
      }
    })

    const baselineScore = predictRmseForRace(raceEntries, (entry) => Number(entry.careerRating) || 0)
    const effectiveScore = predictRmseForRace(raceEntries, (entry) => Number(entry.effectiveElo) || 0)

    if (baselineScore != null) {
      baselineRmse.push(baselineScore)
      horsesConsidered += raceEntries.length
    }
    if (effectiveScore != null) {
      effectiveRmse.push(effectiveScore)
    }

    const placements = {}
    const driverPlacements = {}
    for (const horse of list) {
      placements[horse.horseId] = {
        placement: horse.placement,
        withdrawn: false,
        date: raceDate
      }
      const driverId = Number(horse?.driverId)
      if (Number.isFinite(driverId)) {
        driverPlacements[driverId] = horse.placement
      }
    }

    const classFactor = classFactorFromPurse(race.topPrize, { min: classMin, max: classMax, ref: classRef })
    if (race.topPrize > 0) prizeKnown++

    const careerSnapshot = new Map(
      list.map((horse) => {
        const state = getHorseState(careerRatings, pointsMap, horse.horseId)
        return [String(horse.horseId), { ...state }]
      })
    )

    processRace(placements, careerRatings, {
      k,
      raceDate,
      referenceDate: raceDate,
      decayDays,
      classFactor,
      kClassMultiplier,
      profile: ELO_PROFILES.career
    })

    processRace(placements, formRatings, {
      k,
      raceDate,
      referenceDate: raceDate,
      decayDays: DEFAULT_FORM_DECAY_DAYS,
      classFactor,
      kClassMultiplier,
      profile: ELO_PROFILES.form,
      anchorRatings: careerSnapshot
    })

    processDriverRace(driverPlacements, driverCareerRatings, driverFormRatings, {
      raceDate,
      k,
      formK: k,
      decayDays,
      formDecayDays: DEFAULT_DRIVER_FORM_DECAY_DAYS
    })
  }

  const topPrizes = races
    .map(race => Number(race.topPrize || 0))
    .filter(value => value > 0)
    .sort((left, right) => left - right)

  const prizeDistribution = topPrizes.length ? {
    min: topPrizes[0],
    p50: topPrizes[Math.floor(topPrizes.length * 0.5)],
    p90: topPrizes[Math.floor(topPrizes.length * 0.9)],
    max: topPrizes[topPrizes.length - 1]
  } : null

  const baselineMeanRMSE = mean(baselineRmse)
  const effectiveMeanRMSE = mean(effectiveRmse)

  return {
    version: 'elo-eval-v2',
    racesEvaluated: effectiveRmse.length,
    horsesConsidered,
    meanRMSE: effectiveMeanRMSE,
    baselineMeanRMSE,
    effectiveMeanRMSE,
    improvementVsCareer: baselineMeanRMSE != null && effectiveMeanRMSE != null
      ? Number((baselineMeanRMSE - effectiveMeanRMSE).toFixed(4))
      : null,
    prizeCoverage: {
      withPrize: prizeKnown,
      total: races.length,
      coverage: races.length ? Number((prizeKnown / races.length).toFixed(3)) : null
    },
    prizeDistribution,
    comparison: {
      baseline: {
        label: 'career_elo_only',
        meanRMSE: baselineMeanRMSE
      },
      effective: {
        label: 'effective_elo_blend',
        meanRMSE: effectiveMeanRMSE
      }
    }
  }
}

export default { evaluateElo }
