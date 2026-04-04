import express from 'express'
import racedayCoreRoutes from './raceday-core-routes.js'
import racedayBettingRoutes from './raceday-betting-routes.js'

const router = express.Router()

router.use(racedayBettingRoutes)
router.use(racedayCoreRoutes)

export default router
