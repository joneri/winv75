import cron from 'node-cron'
import racedayService from './raceday-service.js'

export const startRacedayAICron = () => {
  const schedule = process.env.AI_RACEDAY_CRON || '15 6 * * *' // every day at 06:15
  const daysAhead = process.env.AI_RACEDAY_DAYS_AHEAD ? Number(process.env.AI_RACEDAY_DAYS_AHEAD) : 3
  cron.schedule(schedule, async () => {
    try {
      const res = await racedayService.precomputeUpcomingAiLists(daysAhead)
      console.log(`[AI] Precomputed ${res.count} upcoming raceday AI lists`)
    } catch (e) {
      console.error('[AI] Precompute job failed', e)
    }
  })
}

export default { startRacedayAICron }
