import cron from 'node-cron'
import HorseRating from '../horse/horse-rating-model.js'
import { refreshHorseRating } from './rating-service.js'

export const startRatingsCronJob = () => {
    cron.schedule('0 * * * *', async () => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const outdated = await HorseRating.find({ lastUpdated: { $lt: cutoff } })
        for (const hr of outdated) {
            try {
                await refreshHorseRating(hr)
            } catch (err) {
                console.error('Rating refresh failed for horseId', hr.horseId, err)
            }
        }
    })
}
