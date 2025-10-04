<template>
  <v-container class="driver-view" fluid>
    <v-btn variant="text" class="mb-4" icon="mdi-arrow-left" @click="goBack" />

    <v-card v-if="loading" class="pa-6 d-flex justify-center align-center">
      <v-progress-circular indeterminate color="primary" size="36" />
      <span class="ml-3">Laddar kuskdata…</span>
    </v-card>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card v-else-if="driver" class="pa-6" elevation="1">
      <v-row>
        <v-col cols="12" md="8">
          <h1 class="text-h4 mb-2">{{ driver.name }}</h1>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="label">Form ELO</span>
              <span class="value">{{ formatNumber(driver.elo) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Karriär-ELO</span>
              <span class="value">{{ formatNumber(driver.careerElo) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Starter</span>
              <span class="value">{{ driver.stats.starts }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Seger%</span>
              <span class="value">{{ formatPercent(driver.stats.winRate) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Topp-3%</span>
              <span class="value">{{ formatPercent(driver.stats.top3Rate) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Snittplacering</span>
              <span class="value">{{ formatAverage(driver.stats.averagePlacement) }}</span>
            </div>
          </div>
          <div class="text-caption mt-2" v-if="driver.eloUpdatedAt">
            Uppdaterad {{ formatDate(driver.eloUpdatedAt) }}
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-alert v-if="driver.stats.lastStart" type="info" variant="tonal">
            <div class="text-caption text-uppercase mb-1">Senaste start</div>
            <div>{{ formatDate(driver.stats.lastStart) }}</div>
          </v-alert>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <div>
        <h2 class="text-h5 mb-3">Senaste resultaten</h2>
        <v-alert v-if="!driver.recentResults.length" type="info" variant="tonal">
          Inga resultat hittades.
        </v-alert>
        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Bana</th>
              <th>Lopp</th>
              <th>Häst</th>
              <th>Placering</th>
              <th>Odds</th>
              <th>Pris</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in driver.recentResults" :key="`${res.raceId}-${res.horseId ?? ''}-${res.date}`">
              <td>{{ formatDate(res.date) }}</td>
              <td>{{ res.trackName || '–' }}</td>
              <td>{{ res.raceNumber ?? '–' }}</td>
              <td>{{ res.horseName || '–' }}</td>
              <td>
                <span :class="placementClass(res.placement)">
                  {{ res.placementDisplay || res.placement || (res.withdrawn ? 'Struken' : '–') }}
                </span>
              </td>
              <td>{{ formatOdds(res.odds, res.oddsDisplay) }}</td>
              <td>{{ formatPrize(res.prizeMoney, res.prizeDisplay) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DriverDetail } from '@/api'
import { fetchDriverDetail } from '@/api'

const route = useRoute()
const router = useRouter()

const driver = ref<DriverDetail | null>(null)
const loading = ref(false)
const error = ref('')

let controller: AbortController | null = null

const driverId = computed(() => route.params.driverId as string | number | undefined)

function abortOngoing() {
  if (controller) {
    controller.abort()
    controller = null
  }
}

async function loadDriver() {
  abortOngoing()
  const id = driverId.value
  if (!id) {
    error.value = 'Ogiltigt kusk-id'
    driver.value = null
    return
  }

  loading.value = true
  error.value = ''
  driver.value = null

  controller = new AbortController()
  const res = await fetchDriverDetail(id, controller.signal)
  controller = null

  if (!res.ok) {
    error.value = res.status === 404 ? 'Kusken hittades inte.' : 'Kunde inte hämta kuskdata.'
    loading.value = false
    return
  }

  driver.value = res.data
  loading.value = false
}

watch(driverId, () => {
  loadDriver()
}, { immediate: true })

onBeforeUnmount(() => abortOngoing())

function formatNumber(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return '–'
  return Math.round(Number(value)).toString()
}

function formatPercent(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return '–'
  return `${(Number(value) * 100).toFixed(1)} %`
}

function formatAverage(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return '–'
  return Number(value).toFixed(1)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '–'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '–'
  return dt.toLocaleDateString('sv-SE')
}

function formatOdds(value: number | null | undefined, display?: string | null) {
  if (display) return display
  if (!Number.isFinite(Number(value))) return '–'
  return Number(value).toFixed(2)
}

function formatPrize(value: number | null | undefined, display?: string | null) {
  if (display) return display
  if (!Number.isFinite(Number(value))) return '–'
  return `${Math.round(Number(value))} kr`
}

function placementClass(value: number | null | undefined) {
  if (value === 1) return 'placement-first'
  if (value && value <= 3) return 'placement-podium'
  return ''
}

function goBack() {
  if (router.options.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.driver-view {
  max-width: 1100px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.meta-item {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 10px 12px;
}

.meta-item .label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.54);
}

.meta-item .value {
  font-size: 1.2rem;
  font-weight: 600;
}

.placement-first {
  color: #047857;
  font-weight: 700;
}

.placement-podium {
  color: #2563eb;
  font-weight: 600;
}
</style>
