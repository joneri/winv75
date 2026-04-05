import raceService from './race-service.js'
import Horse from '../horse/horse-model.js'
import HorseRating from '../horse/horse-rating-model.js'
import Driver from '../driver/driver-model.js'
import trackService from '../track/track-service.js'
import {
  attachFieldProbabilities,
  buildHorseEloPrediction,
  getLaneBiasStore
} from '../rating/horse-elo-prediction.js'

export async function getRaceWithRatings(raceId) {
  const race = await raceService.getRaceById(raceId)
  if (!race) {
    return null
  }

  let enrichedHorses = null

  try {
    const laneBiasStore = await getLaneBiasStore()
    const track = race?.trackCode
      ? { trackCode: race.trackCode }
      : await trackService.getTrackByName(race?.trackName ?? null)

    const horseIds = (race.horses || []).map(horse => horse.id)
    if (horseIds.length) {
      const horseDocs = await Horse.find(
        { id: { $in: horseIds } },
        { id: 1, results: 1, rating: 1, formRating: 1 }
      ).lean()
      const horseMap = new Map(horseDocs.map(horse => [horse.id, horse]))
      const ratingDocs = await HorseRating.find({ horseId: { $in: horseIds } }).lean()
      const ratingMap = new Map(ratingDocs.map(rating => [rating.horseId, rating]))

      const driverIds = (race.horses || [])
        .map(horse => {
          const driverId = horse?.driver?.licenseId ?? horse?.driver?.id
          const parsed = Number(driverId)
          return Number.isFinite(parsed) ? parsed : null
        })
        .filter(driverId => driverId != null)

      const driverDocs = driverIds.length
        ? await Driver.find({ _id: { $in: driverIds } }, { _id: 1, elo: 1, careerElo: 1 }).lean()
        : []
      const driverMap = new Map(driverDocs.map(driver => [Number(driver._id), driver]))

      const raceContext = {
        raceDate: race.startDateTime ?? null,
        startMethod: race.startMethod ?? race.raceType?.text ?? null,
        distance: race.distance ?? null,
        trackName: race.trackName ?? null,
        trackCode: track?.trackCode ?? null
      }

      const enriched = (race.horses || []).map(horse => {
        const base = typeof horse?.toObject === 'function' ? horse.toObject() : horse
        const horseDoc = horseMap.get(base.id) || {}
        const rating = ratingMap.get(base.id)
        const driverId = Number(base?.driver?.licenseId ?? base?.driver?.id)
        const driver = Number.isFinite(driverId) ? driverMap.get(driverId) : null
        const prediction = buildHorseEloPrediction({
          horse: {
            ...base,
            results: horseDoc?.results || []
          },
          ratingDoc: rating,
          driver,
          raceContext,
          laneBiasStore
        })

        return {
          ...base,
          rating: prediction.careerElo,
          careerElo: prediction.careerElo,
          eloRating: prediction.careerElo,
          rawFormRating: prediction.storedFormElo,
          storedFormElo: prediction.storedFormElo,
          formRating: prediction.formElo,
          formElo: prediction.formElo,
          effectiveElo: prediction.effectiveElo,
          modelProbability: null,
          winProbability: null,
          winScore: prediction.effectiveElo,
          formDelta: prediction.debug.formDelta,
          formGapMetric: prediction.debug.daysSinceLast,
          formModelVersion: prediction.version,
          eloVersion: prediction.version,
          eloWeights: prediction.weights,
          formComponents: prediction.debug,
          eloDebug: prediction.debug,
          prediction,
          ...(driver ? {
            driver: {
              ...(base.driver || {}),
              elo: driver.elo ?? null,
              formElo: driver.elo ?? null,
              careerElo: driver.careerElo ?? null
            }
          } : {})
        }
      })

      const probabilities = attachFieldProbabilities(enriched)
      const byHorseId = new Map(probabilities.map(horse => [horse.id, horse]))
      enrichedHorses = (race.horses || []).map(horse => {
        const base = typeof horse?.toObject === 'function' ? horse.toObject() : horse
        return byHorseId.get(base.id) || base
      })
    }
  } catch (error) {
    console.warn('Failed enriching race horses with ratings', error)
  }

  const payload = typeof race?.toObject === 'function' ? race.toObject() : JSON.parse(JSON.stringify(race))
  if (enrichedHorses) {
    payload.horses = enrichedHorses
  } else if (race?.horses) {
    payload.horses = race.horses
  }
  return payload
}

export async function getHorsePastComments(horseId) {
  const horse = await Horse.findOne({ id: Number(horseId) }, { atgPastComments: 1 }).lean()
  return horse?.atgPastComments || []
}

export default {
  getRaceWithRatings,
  getHorsePastComments
}
