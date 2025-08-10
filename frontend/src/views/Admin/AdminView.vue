<template>
  <v-container class="pt-12">
    <v-row>
      <v-col>
        <h1>Admin</h1>
        <v-btn color="primary" class="mr-2" @click="updateRatings">Update Ratings</v-btn>
        <v-btn color="secondary" class="mr-2" @click="precomputeAI">Precompute Jonas AI (3 days)</v-btn>
        <v-btn color="info" class="mr-2" @click="loadMetrics">Load AI Metrics</v-btn>
        <pre v-if="metrics" class="mt-4">{{ metrics }}</pre>
      </v-col>
    </v-row>
    <v-row class="mt-6">
      <v-col>
        <h2>Elo Evaluation (RMSE)</h2>
        <div class="eval-form">
          <v-text-field v-model="from" label="From (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="to" label="To (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model.number="kClassMultiplier" label="ELO_K_CLASS_MULTIPLIER" type="number" density="compact" />
          <v-text-field v-model.number="classMin" label="ELO_CLASS_MIN" type="number" density="compact" />
          <v-text-field v-model.number="classMax" label="ELO_CLASS_MAX" type="number" density="compact" />
          <v-text-field v-model.number="classRef" label="ELO_CLASS_REF" type="number" density="compact" />
          <v-btn color="primary" @click="runEval" :loading="evalLoading">Run</v-btn>
        </div>
        <pre v-if="evalResult" class="mt-4">{{ evalResult }}</pre>
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

    // Elo eval controls
    const from = ref('')
    const to = ref('')
    const kClassMultiplier = ref(1)
    const classMin = ref(30000)
    const classMax = ref(300000)
    const classRef = ref(100000)
    const evalResult = ref('')
    const evalLoading = ref(false)

    const runEval = async () => {
      evalLoading.value = true
      try {
        const params = { from: from.value || undefined, to: to.value || undefined, kClassMultiplier: kClassMultiplier.value, classMin: classMin.value, classMax: classMax.value, classRef: classRef.value }
        const res = await AdminService.evalElo(params)
        evalResult.value = JSON.stringify(res, null, 2)
      } catch (e) {
        console.error('Eval failed', e)
      } finally {
        evalLoading.value = false
      }
    }

    return { updateRatings, precomputeAI, loadMetrics, metrics, from, to, kClassMultiplier, classMin, classMax, classRef, runEval, evalResult, evalLoading }
  }
}
</script>

<style scoped>
.pt-12 { padding-top: 70px; }
pre { background: #f7f7f7; padding: 12px; border-radius: 6px; }
.eval-form { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; align-items: end; }
</style>
