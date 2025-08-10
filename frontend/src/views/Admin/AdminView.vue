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
          <v-text-field v-model.number="kClassMultiplier" label="ELO_K_CLASS_MULTIPLIER" type="number" density="compact" :hint="`Current: ${kClassMultiplier}`" persistent-hint />
          <v-text-field v-model.number="classMin" label="ELO_CLASS_MIN" type="number" density="compact" :hint="`Current: ${classMin}`" persistent-hint />
          <v-text-field v-model.number="classMax" label="ELO_CLASS_MAX" type="number" density="compact" :hint="`Current: ${classMax}`" persistent-hint />
          <v-text-field v-model.number="classRef" label="ELO_CLASS_REF" type="number" density="compact" :hint="`Current: ${classRef}`" persistent-hint />
          <!-- Global K -->
          <div>
            <v-text-field
              v-model.number="eloK"
              label="Global K (ELO_K)"
              type="number"
              density="compact"
              :min="4"
              :max="64"
              :step="1"
              :hint="`Current: ${eloK}`"
              persistent-hint
            />
            <div class="quick-picks">
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="eloK = 16">16</v-btn>
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="eloK = 20">20</v-btn>
              <v-btn size="x-small" variant="tonal" @click="eloK = 24">24</v-btn>
            </div>
          </div>
          <!-- Rating recency -->
          <div>
            <v-text-field
              v-model.number="decayDays"
              label="Rating recency (days) (RATING_DECAY_DAYS)"
              type="number"
              density="compact"
              :min="30"
              :max="1095"
              :step="10"
              :hint="`Current: ${decayDays}`"
              persistent-hint
            />
            <div class="quick-picks">
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="decayDays = 180">180</v-btn>
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="decayDays = 365">365</v-btn>
              <v-btn size="x-small" variant="tonal" @click="decayDays = 540">540</v-btn>
            </div>
          </div>
          <div class="eval-actions">
            <v-btn color="primary" @click="runEval" :loading="evalLoading">Run</v-btn>
          </div>
        </div>
        <v-progress-linear v-if="evalLoading" class="mt-3" color="primary" indeterminate rounded height="4" />
        <v-card class="mt-4" v-if="evalResult" variant="tonal">
          <v-card-title>Evaluation Result</v-card-title>
          <v-card-text>
            <pre class="pre-json">{{ evalResult }}</pre>
            <div class="query-url" v-if="lastEvalUrl">
              <strong>Query:</strong>
              <div><code>{{ lastEvalUrl }}</code></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-10">
      <v-col>
        <h2>Auto-tune</h2>
        <div class="grid-form">
          <v-text-field v-model="autoFrom" label="From (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="autoTo" label="To (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="grid.classMin" label="classMin (comma-separated)" density="compact" :hint="'e.g. 0.3,0.5,0.8'" persistent-hint />
          <v-text-field v-model="grid.classMax" label="classMax (comma-separated)" density="compact" :hint="'e.g. 1.4,1.5,1.6'" persistent-hint />
          <v-text-field v-model="grid.kClassMultiplier" label="kClassMultiplier (comma-separated)" density="compact" :hint="'e.g. 1.0,1.1,1.3'" persistent-hint />
          <v-text-field v-model="grid.k" label="k (comma-separated)" density="compact" :hint="'e.g. 8,10,12'" persistent-hint />
          <v-text-field v-model="grid.decayDays" label="decayDays (comma-separated)" density="compact" :hint="'e.g. 150,180,270'" persistent-hint />
          <v-text-field v-model.number="grid.classRef" label="classRef (single)" type="number" density="compact" />
          <div class="grid-actions">
            <v-btn color="primary" :loading="autoRunning" @click="runAutoTune">Run auto-tune</v-btn>
            <v-btn color="error" class="ml-2" :disabled="!autoRunning" @click="cancelAutoTune">Cancel</v-btn>
            <v-btn color="secondary" class="ml-2" :disabled="!autoBest" @click="applyBest">Apply best</v-btn>
          </div>
        </div>
        <div v-if="autoRunning || autoStatus" class="mt-3">
          <div class="progress-line">Processed {{ autoProcessed }} / {{ autoTotal }} ({{ autoPercent }}%)</div>
          <v-progress-linear :model-value="autoPercent" height="6" rounded color="primary" />
        </div>
        <v-card class="mt-4" v-if="autoResultsSorted.length" variant="tonal">
          <v-card-title>Top Results</v-card-title>
          <v-card-text>
            <div class="results-table">
              <div class="row header">
                <div>RMSE</div>
                <div>Min</div>
                <div>Max</div>
                <div>Mult</div>
                <div>Ref</div>
                <div>K</div>
                <div>Days</div>
                <div>URL</div>
                <div></div>
              </div>
              <div class="row" v-for="(r, idx) in autoResultsSorted" :key="idx">
                <div>{{ fmt(r.meanRMSE) }}</div>
                <div>{{ r.classMin }}</div>
                <div>{{ r.classMax }}</div>
                <div>{{ r.kClassMultiplier }}</div>
                <div>{{ r.classRef }}</div>
                <div>{{ r.k }}</div>
                <div>{{ r.decayDays }}</div>
                <div class="url"><a :href="r.url" target="_blank" rel="noopener">Open</a></div>
                <div><v-btn size="x-small" variant="tonal" @click="applyRow(r)">Apply</v-btn></div>
              </div>
            </div>
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
import { ref, onMounted, watch, computed } from 'vue'
import AdminService from './services/AdminService.js'
import AutoTune from './services/AutoTuneService.js'

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
    const eloK = ref(20)
    const decayDays = ref(365)

    // Restore persisted values
    onMounted(() => {
      const getNum = (k, def) => {
        const v = localStorage.getItem(k)
        const n = v != null ? Number(v) : def
        return Number.isFinite(n) ? n : def
      }
      kClassMultiplier.value = getNum('ELO_K_CLASS_MULTIPLIER', 1)
      classMin.value = getNum('ELO_CLASS_MIN', 30000)
      classMax.value = getNum('ELO_CLASS_MAX', 300000)
      classRef.value = getNum('ELO_CLASS_REF', 100000)
      eloK.value = getNum('ELO_K', 20)
      decayDays.value = getNum('RATING_DECAY_DAYS', 365)
    })

    // Persist on change
    watch(kClassMultiplier, v => localStorage.setItem('ELO_K_CLASS_MULTIPLIER', String(v)))
    watch(classMin, v => localStorage.setItem('ELO_CLASS_MIN', String(v)))
    watch(classMax, v => localStorage.setItem('ELO_CLASS_MAX', String(v)))
    watch(classRef, v => localStorage.setItem('ELO_CLASS_REF', String(v)))
    watch(eloK, v => localStorage.setItem('ELO_K', String(v)))
    watch(decayDays, v => localStorage.setItem('RATING_DECAY_DAYS', String(v)))

    const evalResult = ref('')
    const evalLoading = ref(false)
    const lastEvalUrl = ref('')

    const runEval = async () => {
      // Validation: no NaN allowed
      const nums = [kClassMultiplier.value, classMin.value, classMax.value, classRef.value, eloK.value, decayDays.value]
      if (nums.some(n => !Number.isFinite(Number(n)))) {
        snackbar.value = { show: true, text: 'Invalid input: numbers required', color: 'error' }
        return
      }

      evalLoading.value = true
      try {
        const params = {
          from: from.value || undefined,
          to: to.value || undefined,
          kClassMultiplier: kClassMultiplier.value,
          classMin: classMin.value,
          classMax: classMax.value,
          classRef: classRef.value,
          k: eloK.value,
          decayDays: decayDays.value
        }
        // Build the exact URL used
        const base = `${import.meta.env.VITE_BE_URL}/api/rating/eval`
        const qs = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
        })
        lastEvalUrl.value = `${base}?${qs.toString()}`

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

    // Auto-tune state
    const autoFrom = ref('')
    const autoTo = ref('')
    const grid = ref({
      classMin: '0.3,0.5,0.8',
      classMax: '1.4,1.5,1.6',
      kClassMultiplier: '1.0,1.1,1.3',
      k: '8,10,12',
      decayDays: '150,180,270',
      classRef: 35000
    })
    const autoJobId = ref('')
    const autoStatus = ref(null)
    const autoRunning = ref(false)
    const autoTimer = ref(null)

    const parseCsv = (s) => String(s || '')
      .split(',')
      .map(x => x.trim())
      .filter(x => x.length > 0)
      .map(Number)

    const validateGridUi = () => {
      const arrs = ['classMin','classMax','kClassMultiplier','k','decayDays']
      for (const k of arrs) {
        const vals = parseCsv(grid.value[k])
        if (!vals.length || vals.some(v => !Number.isFinite(v))) return `Invalid values for ${k}`
      }
      const minVals = parseCsv(grid.value.classMin)
      const maxVals = parseCsv(grid.value.classMax)
      if (minVals.some(m => maxVals.some(M => !(m < M)))) return 'classMin must be < classMax'
      if (!Number.isFinite(Number(grid.value.classRef))) return 'Invalid classRef'
      return null
    }

    const persistAuto = () => {
      localStorage.setItem('auto_from', autoFrom.value)
      localStorage.setItem('auto_to', autoTo.value)
      localStorage.setItem('auto_grid', JSON.stringify(grid.value))
      localStorage.setItem('auto_results', JSON.stringify(autoResults.value))
    }

    const restoreAuto = () => {
      const f = localStorage.getItem('auto_from'); if (f) autoFrom.value = f
      const t = localStorage.getItem('auto_to'); if (t) autoTo.value = t
      const g = localStorage.getItem('auto_grid'); if (g) {
        try { grid.value = { ...grid.value, ...JSON.parse(g) } } catch {}
      }
      const r = localStorage.getItem('auto_results'); if (r) {
        try { autoResults.value = JSON.parse(r) || [] } catch {}
      }
    }

    onMounted(() => {
      // prefill with current evaluation window if present
      if (from.value) autoFrom.value = from.value
      if (to.value) autoTo.value = to.value
      restoreAuto()
      // if a job was running, we can't recover its id after refresh in this simple impl
    })

    watch([autoFrom, autoTo, grid], persistAuto, { deep: true })

    const autoResults = ref([])
    const autoResultsSorted = ref([])
    const autoBest = ref(null)

    const recomputeSorted = () => {
      const sorted = [...autoResults.value].sort((a, b) => {
        const ar = Number.isFinite(a.meanRMSE) ? a.meanRMSE : Infinity
        const br = Number.isFinite(b.meanRMSE) ? b.meanRMSE : Infinity
        return ar - br
      })
      autoResultsSorted.value = sorted.slice(0, 50) // show top 50
      autoBest.value = sorted.length ? sorted[0] : null
    }

    watch(autoResults, () => { recomputeSorted(); persistAuto() }, { deep: true })

    const pollStatus = async () => {
      if (!autoJobId.value) return
      try {
        const st = await AutoTune.status(autoJobId.value)
        autoStatus.value = st
        autoRunning.value = st.state === 'running'
        if (st.results) autoResults.value = st.results
        if (!autoRunning.value) {
          clearInterval(autoTimer.value)
          autoTimer.value = null
          snackbar.value = { show: true, text: `Auto-tune ${st.state}`, color: st.state === 'done' ? 'success' : (st.state === 'cancelled' ? 'warning' : 'error') }
        }
      } catch (e) {
        console.error('Poll failed', e)
      }
    }

    const runAutoTune = async () => {
      const err = validateGridUi()
      if (err) { snackbar.value = { show: true, text: err, color: 'error' }; return }
      try {
        autoResults.value = []
        autoStatus.value = null
        autoBest.value = null
        autoRunning.value = true
        const payload = {
          from: autoFrom.value || undefined,
          to: autoTo.value || undefined,
          classMin: parseCsv(grid.value.classMin),
          classMax: parseCsv(grid.value.classMax),
          kClassMultiplier: parseCsv(grid.value.kClassMultiplier),
          k: parseCsv(grid.value.k),
          decayDays: parseCsv(grid.value.decayDays),
          classRef: Number(grid.value.classRef)
        }
        const { jobId, total } = await AutoTune.start(payload)
        autoJobId.value = jobId
        autoStatus.value = { processed: 0, total, state: 'running' }
        autoTimer.value = setInterval(pollStatus, 1000)
      } catch (e) {
        console.error('Failed to start auto-tune', e)
        snackbar.value = { show: true, text: e?.response?.data?.error || 'Failed to start auto-tune', color: 'error' }
        autoRunning.value = false
      }
    }

    const cancelAutoTune = async () => {
      try {
        if (autoJobId.value) await AutoTune.cancel(autoJobId.value)
      } catch {}
      finally {
        autoRunning.value = false
      }
    }

    const applyRow = (r) => {
      kClassMultiplier.value = r.kClassMultiplier
      classMin.value = r.classMin
      classMax.value = r.classMax
      classRef.value = r.classRef
      eloK.value = r.k
      decayDays.value = r.decayDays
      snackbar.value = { show: true, text: 'Applied to form', color: 'success' }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const applyBest = () => { if (autoBest.value) applyRow(autoBest.value) }

    const autoProcessed = computed(() => autoStatus?.value?.processed || 0)
    const autoTotal = computed(() => autoStatus?.value?.total || 0)
    const autoPercent = computed(() => autoTotal.value ? Math.round((autoProcessed.value / autoTotal.value) * 100) : 0)

    const fmt = (v) => (Number.isFinite(v) ? v.toFixed(3) : '-')

    return {
      updateRatings,
      precomputeAI,
      loadMetrics,
      metrics,
      from,
      to,
      kClassMultiplier,
      classMin,
      classMax,
      classRef,
      eloK,
      decayDays,
      runEval,
      evalResult,
      lastEvalUrl,
      evalLoading,
      loadingMetrics,
      updatingRatings,
      precomputing,
      snackbar,
      // Auto-tune
      autoFrom, autoTo, grid,
      autoRunning, autoStatus, autoResults, autoResultsSorted, autoBest,
      runAutoTune, cancelAutoTune, applyBest, applyRow,
      autoProcessed, autoTotal, autoPercent,
      fmt
    }
  }
}
</script>

<style scoped>
.pt-12 { padding-top: 70px; }
.pre-json { background: #f7f7f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; overflow: auto; }
.eval-form { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; }
.eval-actions { display: flex; align-items: center; }
.quick-picks { margin-top: -6px; margin-bottom: 2px; }
.query-url { margin-top: 8px; font-size: 0.85rem; }
.grid-form { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; }
.results-table { display: grid; grid-template-columns: 100%; gap: 4px; }
.results-table .row { display: grid; grid-template-columns: 90px 70px 70px 70px 80px 60px 70px 1fr 70px; gap: 8px; align-items: center; padding: 6px 8px; border-bottom: 1px dashed rgba(125,125,125,0.2); }
.results-table .row.header { font-weight: 600; }
.results-table .row .url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (prefers-color-scheme: dark) {
  .pre-json { background: #0b1021; color: #e5e7eb; }
}
</style>
