import raceService from './race-service.js'
import Horse from '../horse/horse-model.js'
import HorseRating from '../horse/horse-rating-model.js'
import Driver from '../driver/driver-model.js'

export async function getRaceWithRatings(raceId) {
  const race = await raceService.getRaceById(raceId)
  if (!race) {
    return null
  }

  try {
    const horseIds = (race.horses || []).map(horse => horse.id)
    if (horseIds.length) {
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

      race.horses = (race.horses || []).map(horse => {
        const base = typeof horse?.toObject === 'function' ? horse.toObject() : horse
        const rating = ratingMap.get(base.id)
        const driverId = Number(base?.driver?.licenseId ?? base?.driver?.id)
        const driver = Number.isFinite(driverId) ? driverMap.get(driverId) : null

        return {
          ...base,
          rating: rating?.rating ?? base.rating,
          eloRating: rating?.rating ?? base.eloRating,
          formRating: rating?.formRating ?? rating?.rating ?? base.formRating,
          ...(driver ? { driver: { ...base.driver, elo: driver.elo ?? null, careerElo: driver.careerElo ?? null } } : {})
        }
      })
    }
  } catch (error) {
    console.warn('Failed enriching race horses with ratings', error)
  }

  const payload = typeof race?.toObject === 'function' ? race.toObject() : JSON.parse(JSON.stringify(race))
  if (race?.horses) {
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
