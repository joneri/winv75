<template>
  <v-container class="pt-12">
    <v-row>
      <v-col>
        <h1>Admin</h1>
        <v-btn color="primary" class="mr-2" @click="updateRatings" :loading="updatingRatings">Update Ratings (Full)</v-btn>
        <v-btn color="secondary" class="mr-2" @click="precomputeAI" :loading="precomputing">Precompute Jonas AI (3 days)</v-btn>
        <v-btn color="info" class="mr-2" @click="loadMetrics" :loading="loadingMetrics">Load AI Metrics</v-btn>
        <v-card class="mt-4" v-if="metrics" variant="tonal">
          <v-card-title>AI Metrics</v-card-title>
          <v-card-text>
            <pre class="pre-json">{{ metrics }}</pre>
          </v-card-text>
        </v-card>
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
          <div class="eval-actions">
            <v-btn color="primary" @click="runEval" :loading="evalLoading">Run</v-btn>
          </div>
        </div>
        <v-progress-linear v-if="evalLoading" class="mt-3" color="primary" indeterminate rounded height="4" />
        <v-card class="mt-4" v-if="evalResult" variant="tonal">
          <v-card-title>Evaluation Result</v-card-title>
          <v-card-text>
            <pre class="pre-json">{{ evalResult }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref } from 'vue'
import AdminService from './services/AdminService.js'

export default {
  name: 'AdminView',
  setup() {
    const metrics = ref(null)
    const loadingMetrics = ref(false)
    const updatingRatings = ref(false)
    const precomputing = ref(false)
    const snackbar = ref({ show: false, text: '', color: 'success' })

    const updateRatings = async () => {
      try {
        updatingRatings.value = true
        await AdminService.triggerRatingsUpdate(true) // full rebuild
        snackbar.value = { show: true, text: 'Ratings fully rebuilt', color: 'success' }
      } catch (error) {
        console.error('Manual rating update failed', error)
        snackbar.value = { show: true, text: 'Failed to update ratings', color: 'error' }
      } finally {
        updatingRatings.value = false
      }
    }

    const precomputeAI = async () => {
      try {
        precomputing.value = true
        await AdminService.precomputeRacedayAI(3)
        snackbar.value = { show: true, text: 'Precompute started', color: 'success' }
      } catch (e) {
        console.error('Precompute failed', e)
        snackbar.value = { show: true, text: 'Failed to precompute', color: 'error' }
      } finally {
        precomputing.value = false
      }
    }

    const loadMetrics = async () => {
      try {
        loadingMetrics.value = true
        const res = await fetch(`${import.meta.env.VITE_BE_URL}/api/_metrics`)
        const data = await res.json()
        metrics.value = JSON.stringify(data, null, 2)
      } catch (e) {
        console.error('Failed to load metrics', e)
        snackbar.value = { show: true, text: 'Failed to load metrics', color: 'error' }
      } finally {
        loadingMetrics.value = false
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
        snackbar.value = { show: true, text: 'Evaluation complete', color: 'success' }
      } catch (e) {
        console.error('Eval failed', e)
        snackbar.value = { show: true, text: 'Evaluation failed', color: 'error' }
      } finally {
        evalLoading.value = false
      }
    }

    return { updateRatings, precomputeAI, loadMetrics, metrics, from, to, kClassMultiplier, classMin, classMax, classRef, runEval, evalResult, evalLoading, loadingMetrics, updatingRatings, precomputing, snackbar }
  }
}
</script>

<style scoped>
.pt-12 { padding-top: 70px; }
.pre-json { background: #f7f7f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; overflow: auto; }
.eval-form { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; align-items: end; }
.eval-actions { display: flex; align-items: center; }
@media (prefers-color-scheme: dark) {
  .pre-json { background: #0b1021; color: #e5e7eb; }
}
</style>
