<template>
  <v-container class="horse-view" fluid>
    <v-btn variant="text" class="mb-4" icon="mdi-arrow-left" @click="goBack" />

    <v-card v-if="loading" class="pa-6 d-flex justify-center align-center">
      <v-progress-circular indeterminate color="primary" size="36" />
      <span class="ml-3">Laddar hästdata…</span>
    </v-card>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card v-else-if="horse" class="pa-6" elevation="1">
      <v-row>
        <v-col cols="12" md="8">
          <h1 class="text-h4 mb-2">{{ horse.name || 'Okänd häst' }}</h1>
          <p v-if="horse.statistics?.length" class="mb-2">
            {{ horse.statistics.join(' • ') }}
          </p>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="label">Class ELO</span>
              <span class="value">{{ formatNumber(horse.rating) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Form ELO</span>
              <span class="value">{{ formatNumber(horse.formRating ?? horse.rawFormRating) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Score</span>
              <span class="value">{{ formatNumber(horse.score) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Seger%</span>
              <span class="value">{{ formatPercent(horse.winningRate) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Plats%</span>
              <span class="value">{{ formatPercent(horse.placementRate) }}</span>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-alert v-if="nextStart" type="info" variant="tonal">
            <div class="text-caption text-uppercase mb-1">Nästa start</div>
            <div class="text-body-1 font-weight-medium">{{ nextStart.track }}</div>
            <div>{{ nextStart.date }}</div>
            <div v-if="nextStart.race">Lopp {{ nextStart.race }}</div>
          </v-alert>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <div>
        <h2 class="text-h5 mb-3">Senaste resultaten</h2>
        <v-alert v-if="!recentResults.length" type="info" variant="tonal">
          Inga resultat hittades.
        </v-alert>
        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Bana</th>
              <th>Lopp</th>
              <th>Placering</th>
              <th>Kusk</th>
              <th>Distans</th>
              <th>Notering</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in recentResults" :key="`${res.raceId}-${res.programNumber ?? res.startNumber ?? ''}`">
              <td>{{ res.date }}</td>
              <td>{{ res.track || '–' }}</td>
              <td>{{ res.raceNumber ?? '–' }}</td>
              <td>
                <span :class="placementClass(res.placementValue)">
                  {{ res.placementDisplay || res.placementValue || '–' }}
                </span>
              </td>
              <td>{{ res.driverName || '–' }}</td>
              <td>{{ res.distance ? `${res.distance} m` : '–' }}</td>
              <td>{{ res.note || '–' }}</td>
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
import type { HorseDetail, HorseResult } from '@/api'
import { fetchHorseDetail } from '@/api'

const route = useRoute()
const router = useRouter()

const horse = ref<HorseDetail | null>(null)
const loading = ref(false)
const error = ref('')

let controller: AbortController | null = null

const horseId = computed(() => route.params.horseId as string | number | undefined)

function abortOngoing() {
  if (controller) {
    controller.abort()
    controller = null
  }
}

async function loadHorse() {
  abortOngoing()
  const id = horseId.value
  if (!id) {
    error.value = 'Ogiltigt häst-id'
    horse.value = null
    return
  }

  loading.value = true
  error.value = ''
  horse.value = null

  controller = new AbortController()
  const res = await fetchHorseDetail(id, controller.signal)
  controller = null

  if (!res.ok) {
    error.value = res.status === 404 ? 'Hästen hittades inte.' : 'Kunde inte hämta hästdata.'
    loading.value = false
    return
  }

  horse.value = res.data
  loading.value = false
}

watch(horseId, () => {
  loadHorse()
}, { immediate: true })

onBeforeUnmount(() => abortOngoing())

const recentResults = computed(() => {
  const list = Array.isArray(horse.value?.results) ? horse.value?.results : []
  if (!list) return []
  const sorted = [...list].sort((a, b) => {
    const da = new Date(a?.raceInformation?.date ?? a?.date ?? 0).getTime()
    const db = new Date(b?.raceInformation?.date ?? b?.date ?? 0).getTime()
    return db - da
  })
  return sorted.slice(0, 12).map(normalizeResult)
})

const nextStart = computed(() => {
  const upcoming = horse.value?.results?.find(res => {
    const date = res?.raceInformation?.date ?? res?.date
    if (!date) return false
    const dt = new Date(date)
    return dt.getTime() >= Date.now()
  })
  if (!upcoming) return null
  const dateStr = formatDate(upcoming?.raceInformation?.date ?? upcoming?.date)
  return {
    track: upcoming?.raceInformation?.track?.name || upcoming?.raceInformation?.trackName || 'Kommande start',
    date: dateStr,
    race: upcoming?.raceInformation?.raceNumber ?? upcoming?.raceNumber ?? null
  }
})

function normalizeResult(res: HorseResult) {
  const info = res?.raceInformation || {}
  const placement = Number(res?.placement?.sortValue ?? res?.placement)
  return {
    raceId: info?.raceId ?? res.raceId ?? null,
    track: info?.trackName || info?.track?.name || res?.trackName || null,
    raceNumber: info?.raceNumber ?? res?.raceNumber ?? null,
    date: formatDate(info?.date ?? res?.date),
    driverName: res?.driver?.name || info?.driver?.name || null,
    placementValue: Number.isFinite(placement) ? placement : null,
    placementDisplay: res?.placement?.displayValue ?? res?.placement?.display ?? null,
    distance: info?.distance ?? res?.distance ?? null,
    note: res?.note ?? res?.prizeMoney?.displayValue ?? res?.prizeMoney?.display ?? null,
    programNumber: info?.programNumber ?? res?.programNumber ?? null,
    startNumber: res?.startNumber ?? null
  }
}

function formatNumber(value?: number | null) {
  if (!Number.isFinite(Number(value))) return '–'
  return Math.round(Number(value)).toString()
}

function formatPercent(value?: number | null) {
  if (!Number.isFinite(Number(value))) return '–'
  return `${(Number(value) * 100).toFixed(1)} %`
}

function formatDate(value: string | undefined | null) {
  if (!value) return '–'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '–'
  return dt.toLocaleDateString('sv-SE')
}

function placementClass(value: number | null) {
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
.horse-view {
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
