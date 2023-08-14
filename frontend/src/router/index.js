import { createRouter, createWebHistory } from 'vue-router'
import RacedayInputView from '@/views/RacedayInput/RacedayInputView.vue'
import RacedayView from '@/views/Raceday/RacedayView.vue'
import RaceHorsesView from '@/views/RaceHorses/RaceHorsesView.vue'

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
    props: true  // This will pass route params as props to the component
  },
  {
    path: '/race/:raceId', 
    name: 'race',
    component: RaceHorsesView,
    props: true  // This will pass route params as props to the component
  }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
});

export default router