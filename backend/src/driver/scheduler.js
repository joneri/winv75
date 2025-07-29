import cron from 'node-cron'
import buildDrivers from './build-driver-collection.js'

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
}