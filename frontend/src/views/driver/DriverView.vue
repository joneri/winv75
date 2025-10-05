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
              <span class="value">{{ formatNumber(driver.stats.starts) }}</span>
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
        <v-alert v-if="!completedResults.length && !upcomingResults.length" type="info" variant="tonal">
          Inga resultat hittades.
        </v-alert>

        <div v-if="completedResults.length" class="results-section">
          <h3 class="text-h6 mb-2">Genomförda lopp</h3>
          <div class="results-scroll" ref="completedContainer">
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Bana</th>
                  <th>Lopp</th>
                  <th>Spår</th>
                  <th>Häst</th>
                  <th>Placering</th>
                  <th>Odds</th>
                  <th>Pris</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="res in displayedCompletedResults"
                  :key="`${res.raceId}-${res.horseId ?? ''}-${res.date}`"
                  :class="{ 'clickable-row': hasRaceLink(res) }"
                  @click="navigateToRaceStart(res)"
                >
                  <td>{{ formatDate(res.date) }}</td>
                  <td>{{ res.trackName || '–' }}</td>
                  <td>{{ res.raceNumber ?? '–' }}</td>
                  <td>{{ formatStartSlot(res.startPosition, res.startMethod) }}</td>
                  <td>
                    <template v-if="hasHorseLink(res)">
                      <router-link :to="{ name: 'HorseDetail', params: { horseId: res.horseId } }" class="horse-link">
                        {{ res.horseName || '–' }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{ res.horseName || '–' }}
                    </template>
                  </td>
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
            <div class="infinite-footer">
              <div ref="completedSentinel" class="sentinel">
                <v-progress-circular
                  v-if="hasMoreCompletedResults"
                  indeterminate
                  size="20"
                  color="primary"
                />
                <span v-else class="end-marker">Alla resultat är laddade</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="upcomingResults.length" class="mt-8 results-section">
          <h3 class="text-h6 mb-2">Kommande / ej klara</h3>
          <div class="results-scroll" ref="upcomingContainer">
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Bana</th>
                  <th>Lopp</th>
                  <th>Spår</th>
                  <th>Häst</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="res in displayedUpcomingResults"
                  :key="`up-${res.raceId}-${res.horseId ?? ''}-${res.date}`"
                  :class="{ 'clickable-row': hasRaceLink(res) }"
                  @click="navigateToRaceStart(res)"
                >
                  <td>{{ formatDate(res.date) }}</td>
                  <td>{{ res.trackName || '–' }}</td>
                  <td>{{ res.raceNumber ?? '–' }}</td>
                  <td>{{ formatStartSlot(res.startPosition, res.startMethod) }}</td>
                  <td>
                    <template v-if="hasHorseLink(res)">
                      <router-link :to="{ name: 'HorseDetail', params: { horseId: res.horseId } }" class="horse-link">
                        {{ res.horseName || '–' }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{ res.horseName || '–' }}
                    </template>
                  </td>
                  <td>{{ formatPendingStatus(res) }}</td>
                </tr>
              </tbody>
            </v-table>
            <div class="infinite-footer">
              <div ref="upcomingSentinel" class="sentinel">
                <v-progress-circular
                  v-if="hasMoreUpcomingResults"
                  indeterminate
                  size="20"
                  color="primary"
                />
                <span v-else class="end-marker">Alla lopp är laddade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DriverDetail } from '@/api'
import { fetchDriverDetail } from '@/api'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

const route = useRoute()
const router = useRouter()

const driver = ref<DriverDetail | null>(null)
const loading = ref(false)
const error = ref('')
const DISPLAY_INCREMENT = 20
const DRIVER_RESULTS_LIMIT = 200
const completedDisplayCount = ref(DISPLAY_INCREMENT)
const upcomingDisplayCount = ref(DISPLAY_INCREMENT)
const completedSentinel = ref<HTMLElement | null>(null)
const upcomingSentinel = ref<HTMLElement | null>(null)
const completedContainer = ref<HTMLElement | null>(null)
const upcomingContainer = ref<HTMLElement | null>(null)
let completedObserver: IntersectionObserver | null = null
let upcomingObserver: IntersectionObserver | null = null

let controller: AbortController | null = null

const driverId = computed(() => route.params.driverId as string | number | undefined)

const completedResults = computed(() => {
  if (!driver.value?.recentResults) return []
  return driver.value.recentResults.filter(res => !shouldDisplayInUpcoming(res))
})

const displayedCompletedResults = computed(() => completedResults.value.slice(0, completedDisplayCount.value))
const hasMoreCompletedResults = computed(() => completedResults.value.length > displayedCompletedResults.value.length)

const upcomingResults = computed(() => {
  if (!driver.value?.recentResults) return []
  return driver.value.recentResults.filter(res => shouldDisplayInUpcoming(res))
})

const displayedUpcomingResults = computed(() => upcomingResults.value.slice(0, upcomingDisplayCount.value))
const hasMoreUpcomingResults = computed(() => upcomingResults.value.length > displayedUpcomingResults.value.length)

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
  resetResultPagination()
  setBreadcrumbLabel('DriverDetail', `Kusk ${id}`)

  controller = new AbortController()
  const res = await fetchDriverDetail(id, controller.signal, { resultsLimit: DRIVER_RESULTS_LIMIT })
  controller = null

  if (!res.ok) {
    error.value = res.status === 404 ? 'Kusken hittades inte.' : 'Kunde inte hämta kuskdata.'
    loading.value = false
    return
  }

  driver.value = res.data
  if (driver.value?.name) {
    setBreadcrumbLabel('DriverDetail', driver.value.name)
  }
  nextTick(() => {
    setupCompletedObserver()
    setupUpcomingObserver()
  })
  loading.value = false
}

watch(driverId, () => {
  resetResultPagination()
  loadDriver()
}, { immediate: true })

watch(
  () => driver.value?.name,
  (name) => {
    if (name) setBreadcrumbLabel('DriverDetail', name)
  }
)

onMounted(() => {
  nextTick(() => {
    setupCompletedObserver()
    setupUpcomingObserver()
  })
})

watch(() => completedSentinel.value, () => {
  nextTick(() => setupCompletedObserver())
})

watch(() => completedContainer.value, () => {
  nextTick(() => setupCompletedObserver())
})

watch(() => completedResults.value.length, () => {
  nextTick(() => setupCompletedObserver())
})

watch(() => upcomingSentinel.value, () => {
  nextTick(() => setupUpcomingObserver())
})

watch(() => upcomingContainer.value, () => {
  nextTick(() => setupUpcomingObserver())
})

watch(() => upcomingResults.value.length, () => {
  nextTick(() => setupUpcomingObserver())
})

onBeforeUnmount(() => {
  abortOngoing()
  if (completedObserver) {
    completedObserver.disconnect()
    completedObserver = null
  }
  if (upcomingObserver) {
    upcomingObserver.disconnect()
    upcomingObserver = null
  }
  setBreadcrumbLabel('DriverDetail')
})

function formatNumber(value: number | null | undefined) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(num)
}

function formatPercent(value: number | null | undefined) {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return '–'
  let normalised = raw
  if (normalised <= 1) normalised *= 100
  while (normalised > 100) normalised /= 10
  return `${normalised.toFixed(normalised >= 10 ? 0 : 1)} %`
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
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return num.toFixed(2)
}

function formatPrize(value: number | null | undefined, display?: string | null) {
  if (display) return display
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(num)} kr`
}

function placementClass(value: number | null | undefined) {
  if (value === 1) return 'placement-first'
  if (value && value <= 3) return 'placement-podium'
  return ''
}

function hasHorseLink(res: any) {
  return Number.isFinite(Number(res?.horseId))
}

function hasRaceLink(res: any) {
  return Boolean(res?.raceId && res?.racedayId)
}

function navigateToRaceStart(res: any) {
  if (!hasRaceLink(res)) return
  router.push({ name: 'RacedayRace', params: { racedayId: res.racedayId, raceId: res.raceId } })
}

function loadMoreCompletedResults() {
  if (!hasMoreCompletedResults.value) return
  completedDisplayCount.value += DISPLAY_INCREMENT
}

function loadMoreUpcomingResults() {
  if (!hasMoreUpcomingResults.value) return
  upcomingDisplayCount.value += DISPLAY_INCREMENT
}

function resetResultPagination() {
  completedDisplayCount.value = DISPLAY_INCREMENT
  upcomingDisplayCount.value = DISPLAY_INCREMENT
  if (completedContainer.value) completedContainer.value.scrollTop = 0
  if (upcomingContainer.value) upcomingContainer.value.scrollTop = 0
}

function setupCompletedObserver() {
  if (completedObserver) completedObserver.disconnect()
  if (!completedSentinel.value) return
  completedObserver = new IntersectionObserver(entries => {
    const entry = entries[0]
    if (entry?.isIntersecting) {
      loadMoreCompletedResults()
    }
  }, { root: completedContainer.value ?? null, rootMargin: '160px', threshold: 0 })
  completedObserver.observe(completedSentinel.value)
}

function setupUpcomingObserver() {
  if (upcomingObserver) upcomingObserver.disconnect()
  if (!upcomingSentinel.value) return
  upcomingObserver = new IntersectionObserver(entries => {
    const entry = entries[0]
    if (entry?.isIntersecting) {
      loadMoreUpcomingResults()
    }
  }, { root: upcomingContainer.value ?? null, rootMargin: '160px', threshold: 0 })
  upcomingObserver.observe(upcomingSentinel.value)
}

function formatStartSlot(value: any, method?: string | null) {
  if (value && typeof value === 'object') {
    const display = value.displayValue ?? value.text
    if (display && display !== '[object Object]') return display
    const numeric = value.sortValue ?? value.value
    if (Number.isFinite(Number(numeric))) {
      return `Spår ${Number(numeric)}`
    }
  }
  if (value == null || value === '' || value === '[object Object]') {
    return method || '–'
  }
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return `Spår ${numeric}`
  }
  const str = String(value).trim()
  if (str.match(/^\d+$/)) {
    return `Spår ${str}`
  }
  return str
}

function shouldDisplayInUpcoming(res: any) {
  if (!res) return false

  const placement = Number(res?.placement)
  if (Number.isFinite(placement) && placement > 0) {
    return false
  }

  const eventDate = getResultEventDate(res)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  if (eventDate) {
    if (eventDate.getTime() >= startOfToday.getTime()) {
      return true
    }
    return false
  }

  if (res?.pending) return true
  if (res?.withdrawn) return true

  return false
}

function getResultEventDate(res: any) {
  const sources = [res?.startTime, res?.raceDayDate, res?.date]
  for (const value of sources) {
    if (!value) continue
    const dt = new Date(value)
    if (!Number.isNaN(dt.getTime())) return dt
  }
  return null
}

function formatPendingStatus(res: any) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const eventDate = getResultEventDate(res)

  if (res?.withdrawn) return 'Struken'
  if (eventDate && eventDate.getTime() >= startOfToday.getTime()) {
    return 'Kommande start'
  }
  if (res?.pending) return 'Inväntar resultat'
  const placement = Number(res?.placement)
  if (Number.isFinite(placement) && placement > 0) return `Placering ${placement}`
  return 'Ej klart'
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
  background: #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111827;
}

.meta-item .label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4b5563;
  display: block;
}

.meta-item .value {
  font-size: 1.2rem;
  font-weight: 600;
  display: block;
  margin-top: 4px;
}

.results-section {
  margin-top: 12px;
}

.results-scroll {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.placement-first {
  color: #047857;
  font-weight: 700;
}

.placement-podium {
  color: #2563eb;
  font-weight: 600;
}

.infinite-footer {
  display: flex;
  justify-content: center;
  padding: 8px 0 16px;
}

.infinite-footer .sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  color: #6b7280;
  font-size: 0.85rem;
}

.infinite-footer .end-marker {
  color: #6b7280;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: rgba(15, 118, 110, 0.08);
}

.horse-link {
  color: inherit;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.horse-link:hover {
  text-decoration-style: solid;
}

@media (prefers-color-scheme: dark) {
  .meta-item {
    background: rgba(255, 255, 255, 0.08);
    color: #f9fafb;
  }
  .meta-item .label {
    color: #cbd5f5;
  }
  .results-scroll {
    border-color: rgba(148, 163, 184, 0.35);
  }
}

@media (prefers-color-scheme: dark) {
  .meta-item {
    background: rgba(255, 255, 255, 0.08);
    color: #f9fafb;
  }
  .meta-item .label {
    color: #cbd5f5;
  }
}
</style>
