import { createRouter, createWebHistory } from 'vue-router'
import RacedayInputView from '@/views/RacedayInput/RacedayInputView.vue'
import RacedayView from '@/views/Raceday/RacedayView.vue'
import RaceStartlistDetailsView from '@/views/RaceStartlistDetails/RaceStartlistDetailsView.vue'
import RaceStartlistView from '@/views/RaceStartlist/RaceStartlistView.vue'

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
    path: '/racestartlist/:racedayId', 
    name: 'RaceStartlist',
    component: RaceStartlistView,
    props: true
  },
  {
    path: '/racestartlist/details/:horseId',
    name: 'RaceStartlistDetails',
    component: RaceStartlistDetailsView,
    props: true
  }  
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
});

export default router