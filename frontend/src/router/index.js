import { createRouter, createWebHistory } from 'vue-router'
import HorseView from '../views/Horse/HorseView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HorseView,
  },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes,
  });

export default router