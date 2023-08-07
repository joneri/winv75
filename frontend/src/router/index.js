import { createRouter, createWebHistory } from 'vue-router'
import StartlistView from '../views/Startlist/StartlistView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: StartlistView,
  },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
  });

export default router