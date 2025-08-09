import cron from 'node-cron'
import updateRatings from '../horse/update-elo-ratings.js'

export const startRatingsCronJob = () => {
  const schedule = process.env.ELO_CRON || '0 * * * *' // hourly default
  cron.schedule(schedule, async () => {
    try {
      const k = process.env.ELO_K ? Number(process.env.ELO_K) : undefined
      const decayDays = process.env.RATING_DECAY_DAYS ? Number(process.env.RATING_DECAY_DAYS) : undefined
      await updateRatings(k, decayDays, true)
      console.log('Ratings cron: updated successfully')
    } catch (err) {
      console.error('Ratings cron: update failed', err)
    }
  })
}
