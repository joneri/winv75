<template>
  <v-container class="pt-12">
    <v-row>
      <v-col>
        <h1>Admin</h1>
        <v-btn color="primary" class="mr-2" @click="updateRatings">Update Ratings</v-btn>
        <v-btn color="secondary" class="mr-2" @click="precomputeAI">Precompute Jonas AI (3 days)</v-btn>
        <v-btn color="info" @click="loadMetrics">Load AI Metrics</v-btn>
        <pre v-if="metrics" class="mt-4">{{ metrics }}</pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from 'vue'
import AdminService from './services/AdminService.js'

export default {
  name: 'AdminView',
  setup() {
    const metrics = ref(null)

    const updateRatings = async () => {
      try {
        await AdminService.triggerRatingsUpdate()
      } catch (error) {
        console.error('Manual rating update failed', error)
      }
    }

    const precomputeAI = async () => {
      try {
        await AdminService.precomputeRacedayAI(3)
      } catch (e) {
        console.error('Precompute failed', e)
      }
    }

    const loadMetrics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BE_URL}/api/_metrics`)
        const data = await res.json()
        metrics.value = JSON.stringify(data, null, 2)
      } catch (e) {
        console.error('Failed to load metrics', e)
      }
    }

    return { updateRatings, precomputeAI, loadMetrics, metrics }
  }
}
</script>

<style scoped>
.pt-12 {
  padding-top: 70px;
}
pre { background: #f7f7f7; padding: 12px; border-radius: 6px; }
</style>
