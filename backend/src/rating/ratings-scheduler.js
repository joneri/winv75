import cron from 'node-cron'
import updateRatings from '../horse/update-elo-ratings.js'

export const startRatingsCronJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            await updateRatings()
        } catch (err) {
            console.error('Scheduled rating update failed', err)
        }
    })
}
