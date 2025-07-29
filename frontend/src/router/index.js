import { createRouter, createWebHistory } from 'vue-router'
import RacedayInputView from '@/views/RacedayInput/RacedayInputView.vue'
import RacedayView from '@/views/Raceday/RacedayView.vue'
import RaceHorsesView from '@/views/RaceHorses/RaceHorsesView.vue'
import DevRatingsView from '@/views/DevRatingsView.vue'
import AdminView from '@/views/Admin/AdminView.vue'

const routes = [
  {
    path: '/',
    name: 'RacedayInput',
    component: RacedayInputView,
  },
  {
    path: '/raceday/:racedayId',
    name: 'Raceday',
    component: RacedayView,
    props: true
  },
  {
    path: '/raceday/:racedayId/race/:raceId',
    name: 'RacedayRace',
    component: RaceHorsesView,
    props: true
  },
  {
    path: '/race/:raceId',
    name: 'race',
    component: RaceHorsesView,
    props: true
  },
  {
    path: '/dev/ratings',
    name: 'DevRatings',
    component: DevRatingsView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
});

// Debugging guard
router.beforeEach((to, from, next) => {
  console.log('Routing from:', from.fullPath);
  console.log('Routing to:', to.fullPath);
  next();
});

export default router
