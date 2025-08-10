import Horse from '../horse/horse-model.js'
import { processRace, DEFAULT_K, DEFAULT_DECAY_DAYS } from './elo-engine.js'
import { seedFromHorseDoc } from './rating-seed.js'
import { classFactorFromPurse } from './class-factor.js'
import { rmse } from './elo-utils.js'

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

  // Build race set from horse results (robust to non-array results and string dates)
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
        points: '$points'
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
        points: 1
      }
    },
    { $match: { withdrawn: { $ne: true }, raceDate: { $gte: fromDate, $lte: toDate } } },
    { $match: { raceId: { $nin: [null, ''] } } },
    {
      $group: {
        _id: '$raceId',
        raceDate: { $first: '$raceDate' },
        topPrize: { $max: '$prize' },
        horses: { $push: { horseId: '$horseId', placement: '$placement' } }
      }
    },
    { $sort: { raceDate: 1 } }
  ]

  const races = await Horse.aggregate(pipeline)

  // Collect unique horseIds to seed
  const ids = new Set()
  for (const r of races) for (const h of r.horses) ids.add(h.horseId)
  const idArr = Array.from(ids)
  const horseDocs = await Horse.find({ id: { $in: idArr } }, { id: 1, points: 1 }).lean()
  // Use string keys to avoid Number/String mismatches
  const pointsMap = new Map(horseDocs.map(h => [String(h.id), Number(h.points || 0)]))

  // Ratings state (in-memory)
  const ratings = new Map()

  // Helper get rating with lazy seed from points
  const getRating = (hid) => {
    const key = String(hid)
    let entry = ratings.get(key)
    if (!entry) {
      const seed = seedFromHorseDoc({ id: key, points: pointsMap.get(key) || 0 })
      entry = { rating: seed, numberOfRaces: 0, seedRating: seed }
      ratings.set(key, entry)
    }
    return entry.rating
  }

  const perRaceRMSE = []
  let horsesConsidered = 0
  let prizeKnown = 0

  for (const race of races) {
    const list = race.horses.filter(h => h.placement != null && h.placement > 0)
    if (list.length < 2) continue

    // predicted order: by current rating desc
    const withPred = list.map(h => ({ id: h.horseId, placement: h.placement, rating: getRating(h.horseId) }))
    withPred.sort((a, b) => b.rating - a.rating)

    // Build arrays aligning predicted rank to actual placement
    const predictedRanks = withPred.map((_, idx) => idx + 1)
    const actualPlacements = withPred.map(h => h.placement)

    const r = rmse(actualPlacements, predictedRanks)
    if (Number.isFinite(r)) {
      perRaceRMSE.push({ rmse: r, topPrize: race.topPrize || 0 })
      horsesConsidered += list.length
    }

    // Update ratings using class factor overrides
    const placements = {}
    for (const h of race.horses) placements[h.horseId] = h.placement
    const classFactor = classFactorFromPurse(race.topPrize, { min: classMin, max: classMax, ref: classRef })
    if (race.topPrize > 0) prizeKnown++
    processRace(placements, ratings, { k, raceDate: race.raceDate, decayDays, classFactor, kClassMultiplier })
  }

  // Summaries
  const rmseValues = perRaceRMSE.map(x => x.rmse)
  const meanRMSE = rmseValues.length ? (rmseValues.reduce((a, b) => a + b, 0) / rmseValues.length) : NaN
  const topPrizes = perRaceRMSE.map(x => x.topPrize).filter(x => x > 0).sort((a, b) => a - b)
  const dist = topPrizes.length ? {
    min: topPrizes[0],
    p50: topPrizes[Math.floor(topPrizes.length * 0.5)],
    p90: topPrizes[Math.floor(topPrizes.length * 0.9)],
    max: topPrizes[topPrizes.length - 1]
  } : null

  return {
    racesEvaluated: perRaceRMSE.length,
    horsesConsidered,
    meanRMSE: Number.isFinite(meanRMSE) ? Number(meanRMSE.toFixed(4)) : null,
    prizeCoverage: {
      withPrize: prizeKnown,
      total: races.length,
      coverage: races.length ? Number((prizeKnown / races.length).toFixed(3)) : null
    },
    prizeDistribution: dist
  }
}

export default { evaluateElo }
