import horseRoutes from '../horse/horse-routes.js'
import racedayRoutes from '../raceday/raceday-routes.js'
import raceRoutes from '../race/race-routes.js'
import trackRoutes from '../track/track-routes.js'
import eloRoutes from '../rating/elo-routes.js'
import driverRoutes from '../driver/driver-routes.js'
import gameRoutes from '../game/game-routes.js'
import searchRoutes from '../search/search-routes.js'

export const API_ROUTE_GROUPS = [
  {
    name: 'protected core',
    routes: [
      ['/api/horses', horseRoutes],
      ['/api/raceday', racedayRoutes],
      ['/api/race', raceRoutes],
      ['/api/driver', driverRoutes],
      ['/api/rating', eloRoutes]
    ]
  },
  {
    name: 'supporting catalogues',
    routes: [
      ['/api/track', trackRoutes],
      ['/api/spelformer', gameRoutes],
      ['/api/search', searchRoutes]
    ]
  }
]

export function registerApiRoutes(app) {
  for (const group of API_ROUTE_GROUPS) {
    for (const [path, router] of group.routes) {
      app.use(path, router)
    }
  }
}

export default registerApiRoutes
