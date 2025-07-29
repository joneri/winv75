import cron from 'node-cron'
import buildDrivers from './build-driver-collection.js'
import updateDriverEloRatings from './update-driver-elo-ratings.js'

export function startDriverCronJob() {
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Updating driver collection...')
    try {
      await buildDrivers()
      console.log('[Cron] Driver collection updated')
    } catch (err) {
      console.error('[Cron] Driver update failed:', err)
    }
  })

  cron.schedule('30 3 * * *', async () => {
    console.log('[Cron] Updating driver Elo ratings...')
    try {
      await updateDriverEloRatings()
      console.log('[Cron] Driver Elo ratings updated')
    } catch (err) {
      console.error('[Cron] Driver Elo rating update failed:', err)
    }
  })
}
