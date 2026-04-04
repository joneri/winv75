import { startRatingsCronJob } from '../rating/ratings-scheduler.js'
import { startDriverCronJob } from '../driver/scheduler.js'

export const ACTIVE_SCHEDULERS = [
  {
    name: 'horse ratings',
    start: startRatingsCronJob
  },
  {
    name: 'driver ratings',
    start: startDriverCronJob
  }
]

export function startActiveSchedulers() {
  for (const scheduler of ACTIVE_SCHEDULERS) {
    scheduler.start()
  }
}

export default startActiveSchedulers
