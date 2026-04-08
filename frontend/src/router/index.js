import { createRouter, createWebHistory } from 'vue-router'
import RacedayInputView from '@/views/raceday-input/RacedayInputView.vue'
import RacedayView from '@/views/raceday/RacedayView.vue'
import RaceHorsesView from '@/views/race/RaceHorsesView.vue'
import HorseView from '@/views/horse/HorseView.vue'
import DriverView from '@/views/driver/DriverView.vue'
import HorseSearchView from '@/views/horses/HorseSearchView.vue'
import DriverSearchView from '@/views/drivers/DriverSearchView.vue'
import SuggestionDetailView from '@/views/suggestion/SuggestionDetailView.vue'
import SuggestionAnalyticsView from '@/views/suggestion/SuggestionAnalyticsView.vue'

const routes = [
  {
    path: '/',
    name: 'RacedayInput',
    component: RacedayInputView,
    meta: {
      title: 'Start',
      breadcrumb: {
        label: 'Start',
        to: { name: 'RacedayInput' }
      }
    }
  },
  {
    path: '/raceday/:racedayId',
    name: 'Raceday',
    component: RacedayView,
    props: true,
    meta: {
      parent: 'RacedayInput',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Tävlingsdag ${route.params?.racedayId ?? ''}`,
        to: { name: 'Raceday', params: { racedayId: route.params?.racedayId } }
      })
    }
  },
  {
    path: '/raceday/:racedayId/race/:raceId',
    name: 'RacedayRace',
    component: RaceHorsesView,
    props: true,
    meta: {
      parent: 'Raceday',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Lopp ${route.params?.raceId ?? ''}`,
        to: {
          name: 'RacedayRace',
          params: {
            racedayId: route.params?.racedayId,
            raceId: route.params?.raceId
          }
        }
      })
    }
  },
  {
    path: '/raceday/:racedayId/suggestions/:suggestionId',
    name: 'SuggestionDetail',
    component: SuggestionDetailView,
    props: true,
    meta: {
      parent: 'Raceday',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Spelförslag ${route.params?.suggestionId ?? ''}`,
        to: {
          name: 'SuggestionDetail',
          params: {
            racedayId: route.params?.racedayId,
            suggestionId: route.params?.suggestionId
          }
        }
      })
    }
  },
  {
    path: '/suggestions/analytics',
    name: 'SuggestionAnalytics',
    component: SuggestionAnalyticsView,
    meta: {
      parent: 'RacedayInput',
      breadcrumb: {
        label: 'Förslagsanalys',
        to: { name: 'SuggestionAnalytics' }
      }
    }
  },
  {
    path: '/race/:raceId',
    name: 'race',
    component: RaceHorsesView,
    props: true,
    meta: {
      parent: 'RacedayInput',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Lopp ${route.params?.raceId ?? ''}`
      })
    }
  },
  {
    path: '/horses',
    name: 'HorseSearch',
    component: HorseSearchView,
    meta: {
      parent: 'RacedayInput',
      breadcrumb: {
        label: 'Search Horses',
        to: { name: 'HorseSearch' }
      }
    }
  },
  {
    path: '/horse/:horseId',
    name: 'HorseDetail',
    component: HorseView,
    props: true,
    meta: {
      parent: 'HorseSearch',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Häst ${route.params?.horseId ?? ''}`
      })
    }
  },
  {
    path: '/drivers',
    name: 'DriverSearch',
    component: DriverSearchView,
    meta: {
      parent: 'RacedayInput',
      breadcrumb: {
        label: 'Search Drivers',
        to: { name: 'DriverSearch' }
      }
    }
  },
  {
    path: '/driver/:driverId',
    name: 'DriverDetail',
    component: DriverView,
    props: true,
    meta: {
      parent: 'DriverSearch',
      breadcrumb: (route) => ({
        label: route.meta?.breadcrumbLabel || `Kusk ${route.params?.driverId ?? ''}`
      })
    }
  }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
});

router.beforeEach((to, from) => {
  console.log('Routing from:', from.fullPath)
  console.log('Routing to:', to.fullPath)
  return true
})

export default router
