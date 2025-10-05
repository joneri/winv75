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
          <div v-if="statisticsChips.length" class="mb-3 stats-chips">
            <v-chip
              v-for="chip in statisticsChips"
              :key="chip.key"
              size="small"
              variant="tonal"
              class="mr-2 mb-2"
            >
              {{ chip.text }}
            </v-chip>
          </div>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="label">Class ELO</span>
              <span class="value">{{ formatNumber(horse.rating) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Form ELO</span>
              <span class="value">{{ formatNumber(horse.formRating ?? horse.rawFormRating) }}</span>
            </div>
            <div class="meta-item" v-if="isFiniteNumber(horse.formDelta)">
              <span class="label">Form Δ</span>
              <span class="value">{{ formatSigned(horse.formDelta) }}</span>
            </div>
            <div class="meta-item" v-if="isFiniteNumber(horse.winProbability)">
              <span class="label">Vinstchans</span>
              <span class="value">{{ formatProbability(horse.winProbability) }}</span>
            </div>
            <div class="meta-item" v-if="hasGapMetric">
              <span class="label">Vilodagar</span>
              <span class="value">{{ formatGapDays(horse.formComponents?.daysSinceLast ?? horse.formGapMetric) }}</span>
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
                  <th>Placering</th>
                  <th>Kusk</th>
                  <th>Distans</th>
                  <th>Notering</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="res in displayedCompletedResults"
                  :key="`${res.raceId}-${res.programNumber ?? res.startNumber ?? ''}`"
                  :class="{ 'clickable-row': hasRaceLink(res) }"
                  @click="navigateToRaceStart(res)"
                >
                  <td>{{ res.date }}</td>
                  <td>{{ res.track || '–' }}</td>
                  <td>{{ res.raceNumber ?? '–' }}</td>
                  <td>{{ formatStartSlot(res.startPosition, res.startMethod) }}</td>
                  <td>
                    <span :class="placementClass(res.placementValue)">
                      {{ res.placementDisplay || res.placementValue || '–' }}
                    </span>
                  </td>
                  <td>{{ res.driverName || '–' }}</td>
                  <td>{{ res.distance || '–' }}</td>
                  <td>{{ res.note || '–' }}</td>
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
                  <th>Kusk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="res in displayedUpcomingResults"
                  :key="`up-${res.raceId}-${res.programNumber ?? res.startNumber ?? ''}`"
                  :class="{ 'clickable-row': hasRaceLink(res) }"
                  @click="navigateToRaceStart(res)"
                >
                  <td>{{ res.date }}</td>
                  <td>{{ res.track || '–' }}</td>
                  <td>{{ res.raceNumber ?? '–' }}</td>
                  <td>{{ formatStartSlot(res.startPosition, res.startMethod) }}</td>
                  <td>{{ res.driverName || '–' }}</td>
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
import type { HorseDetail, HorseResult } from '@/api'
import { fetchHorseDetail } from '@/api'
import { getTrackName } from '@/utils/track'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

const route = useRoute()
const router = useRouter()

const horse = ref<HorseDetail | null>(null)
const loading = ref(false)
const error = ref('')
const DISPLAY_INCREMENT = 20
const completedDisplayCount = ref(DISPLAY_INCREMENT)
const upcomingDisplayCount = ref(DISPLAY_INCREMENT)
const completedSentinel = ref<HTMLElement | null>(null)
const upcomingSentinel = ref<HTMLElement | null>(null)
const completedContainer = ref<HTMLElement | null>(null)
const upcomingContainer = ref<HTMLElement | null>(null)
let completedObserver: IntersectionObserver | null = null
let upcomingObserver: IntersectionObserver | null = null

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
  resetResultPagination()
  setBreadcrumbLabel('HorseDetail', `Häst ${id}`)

  controller = new AbortController()
  const res = await fetchHorseDetail(id, controller.signal)
  controller = null

  if (!res.ok) {
    error.value = res.status === 404 ? 'Hästen hittades inte.' : 'Kunde inte hämta hästdata.'
    loading.value = false
    return
  }

  horse.value = res.data
  if (horse.value?.name) {
    setBreadcrumbLabel('HorseDetail', horse.value.name)
  }
  loading.value = false
}

watch(horseId, () => {
  loadHorse()
}, { immediate: true })

watch(
  () => horse.value?.name,
  (name) => {
    if (name) {
      setBreadcrumbLabel('HorseDetail', name)
    }
  }
)

const statisticsChips = computed(() => {
  const chips: Array<{ key: string | number; text: string }> = []

  if (isFiniteNumber(horse.value?.formDelta)) {
    chips.push({ key: 'form-delta', text: `Form Δ ${formatSigned(horse.value?.formDelta)}` })
  }

  if (isFiniteNumber(horse.value?.winProbability)) {
    chips.push({ key: 'form-pwin', text: `pWin ${formatProbability(horse.value?.winProbability)}` })
  }

  if (typeof horse.value?.formModelVersion === 'string' && horse.value.formModelVersion.length) {
    chips.push({ key: 'form-model', text: horse.value.formModelVersion })
  }

  const stats = Array.isArray(horse.value?.statistics) ? horse.value.statistics : []
  if (!stats.length) return chips

  const statChips = stats.slice(0, 6).map((stat, idx) => {
    if (!stat || typeof stat !== 'object') {
      return { key: idx, text: String(stat) }
    }
    const parts: string[] = []
    if (stat.year) parts.push(stat.year)
    if (stat.numberOfStarts) parts.push(`${stat.numberOfStarts} starter`)
    if (stat.placements) parts.push(stat.placements)
    if (stat.prizeMoney) {
      const prizeText = String(stat.prizeMoney)
      parts.push(prizeText.toLowerCase().includes('kr') ? prizeText : `${prizeText} kr`)
    }
    return { key: `${stat.year || ''}-${idx}`, text: parts.filter(Boolean).join(' • ') || 'Statistik' }
  })

  return [...chips, ...statChips]
})

const hasGapMetric = computed(() => {
  const comp = horse.value?.formComponents
  if (comp && isFiniteNumber(comp.daysSinceLast)) {
    return true
  }
  return isFiniteNumber(horse.value?.formGapMetric)
})

const recentResults = computed(() => {
  const list = Array.isArray(horse.value?.results) ? horse.value?.results : []
  if (!list) return []
  const sorted = [...list].sort((a, b) => {
    const da = new Date(a?.raceInformation?.date ?? a?.date ?? 0).getTime()
    const db = new Date(b?.raceInformation?.date ?? b?.date ?? 0).getTime()
    return db - da
  })
  return sorted.map(normalizeResult)
})

const completedResults = computed(() => recentResults.value.filter(res => !shouldDisplayInUpcoming(res)))
const upcomingResults = computed(() => recentResults.value.filter(res => shouldDisplayInUpcoming(res)))

const displayedCompletedResults = computed(() => completedResults.value.slice(0, completedDisplayCount.value))
const hasMoreCompletedResults = computed(() => completedResults.value.length > displayedCompletedResults.value.length)

const displayedUpcomingResults = computed(() => upcomingResults.value.slice(0, upcomingDisplayCount.value))
const hasMoreUpcomingResults = computed(() => upcomingResults.value.length > displayedUpcomingResults.value.length)

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
  const trackInfo = info?.track || res?.track || {}

  const eventDateRaw = info?.date ?? res?.date ?? null
  const eventDateObj = eventDateRaw ? new Date(eventDateRaw) : null
  const eventDateIso = eventDateObj && !Number.isNaN(eventDateObj.getTime()) ? eventDateObj.toISOString() : null

  const rawPlacement = Number(res?.placement?.sortValue ?? res?.placement)
  const placement = Number.isFinite(rawPlacement) && rawPlacement > 0 && rawPlacement < 99 ? rawPlacement : null

  const resolveTrack = () => {
    const nameCandidates = [
      info?.trackName,
      trackInfo?.name,
      trackInfo?.trackName,
      res?.trackName,
      typeof trackInfo === 'string' ? trackInfo : null
    ]
    let name = nameCandidates.find(v => typeof v === 'string' && v.trim().length) || null
    if (name) return name

    const codeCandidates = [
      info?.trackCode,
      trackInfo?.code,
      res?.trackCode,
      info?.track?.code,
      typeof trackInfo === 'string' ? null : trackInfo?.trackCode
    ]
    const code = codeCandidates.find(v => typeof v === 'string' && v.trim().length)
    if (code) {
      const mapped = getTrackName(code)
      if (mapped) return mapped
      return code
    }
    return null
  }

  const resolveDistance = () => {
    const sources = [info?.distance, res?.distance]
    for (const src of sources) {
      if (!src) continue
      if (typeof src === 'object') {
        const display = src.displayValue || src.text
        if (display && display !== '[object Object]') {
          return display.includes('m') ? display : `${display} m`
        }
        const numeric = Number(src.sortValue ?? src.value ?? src.amount)
        if (Number.isFinite(numeric) && numeric > 0) {
          return `${numeric} m`
        }
      }
      if (typeof src === 'string' && src.trim() && src !== '[object Object]') {
        return src.includes('m') ? src : `${src} m`
      }
      const numeric = Number(src)
      if (Number.isFinite(numeric) && numeric > 0) {
        return `${numeric} m`
      }
    }
    return '–'
  }

  const resolvePrize = () => {
    const prizeSources = [res?.prizeMoney, info?.prizeMoney]
    for (const prize of prizeSources) {
      if (!prize) continue
      if (typeof prize === 'object') {
        const display = prize.display ?? prize.displayValue
        if (display && display !== '[object Object]') {
          return display.includes('kr') ? display : `${display} kr`
        }
        const numeric = prize.amount ?? prize.sortValue ?? prize.value
        if (Number.isFinite(Number(numeric))) {
          const formatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Number(numeric))
          return `${formatted} kr`
        }
      }
      if (Number.isFinite(Number(prize))) {
        const formatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Number(prize))
        return `${formatted} kr`
      }
      if (typeof prize === 'string' && prize.trim() && prize !== '[object Object]') {
        return prize.includes('kr') ? prize : `${prize} kr`
      }
    }
    if (res?.note && res.note !== '[object Object]') {
      return res.note
    }
    return '–'
  }

  const resolveStartPosition = () => {
    const sources = [
      res?.actualStartPosition,
      res?.startPosition,
      info?.startPosition,
      res?.programNumber
    ]

    for (const source of sources) {
      if (source == null) continue
      if (typeof source === 'object') {
        const display = source.displayValue ?? source.text
        if (display && display !== '[object Object]') return display
        const numeric = source.sortValue ?? source.value
        if (Number.isFinite(Number(numeric))) return Number(numeric)
      }
      if (typeof source === 'string') {
        const trimmed = source.trim()
        if (trimmed && trimmed !== '[object Object]') return trimmed
      }
      if (Number.isFinite(Number(source))) {
        return Number(source)
      }
    }
    return null
  }

  return {
    raceId: info?.raceId ?? res.raceId ?? null,
    track: resolveTrack() || '–',
    date: formatDate(eventDateRaw),
    eventDate: eventDateIso,
    startPosition: resolveStartPosition(),
    startMethod: res?.startMethod?.displayValue ?? info?.startMethod?.displayValue ?? null,
    raceNumber: info?.raceNumber ?? res?.raceNumber ?? null,
    driverName: res?.driver?.name || info?.driver?.name || null,
    placementValue: placement,
    placementDisplay: res?.placement?.displayValue ?? res?.placement?.display ?? null,
    distance: resolveDistance(),
    note: resolvePrize(),
    programNumber: info?.programNumber ?? res?.programNumber ?? null,
    startNumber: res?.startNumber ?? null,
    pending: !Number.isFinite(placement) && Number.isFinite(rawPlacement) && rawPlacement >= 900,
    withdrawn: res?.withdrawn === true,
    racedayId: info?.raceDayId ?? res?.raceDayId ?? null
  }
}

function shouldDisplayInUpcoming(res: any) {
  if (!res) return false

  const numericPlacement = Number(res?.placementValue)
  if (Number.isFinite(numericPlacement) && numericPlacement > 0) {
    return false
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const eventDate = res?.eventDate ? new Date(res.eventDate) : null
  const hasValidEventDate = eventDate && !Number.isNaN(eventDate.getTime())

  if (hasValidEventDate) {
    if (eventDate.getTime() >= startOfToday.getTime()) {
      return true
    }
    return false
  }

  if (res?.pending) return true
  if (res?.withdrawn) {
    const displayDate = res?.date ? new Date(res.date) : null
    if (!displayDate || Number.isNaN(displayDate.getTime()) || displayDate.getTime() >= startOfToday.getTime()) {
      return true
    }
  }

  return false
}

function isFiniteNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'number') return Number.isFinite(value)
  const num = Number(value)
  return Number.isFinite(num)
}

function formatSigned(value?: number | null) {
  if (!isFiniteNumber(value)) return '–'
  const num = Number(value)
  const decimals = Math.abs(num) >= 10 ? 0 : 1
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
  if (num > 0 && !formatted.startsWith('+')) {
    return `+${formatted}`
  }
  return formatted
}

function formatNumber(value?: number | null) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(num)
}

function formatProbability(value?: number | null) {
  if (!isFiniteNumber(value)) return '–'
  const num = Number(value)
  if (num < 0) return '–'
  const percent = num <= 1 ? num * 100 : num
  const decimals = percent >= 10 ? 0 : 1
  return `${percent.toFixed(decimals)} %`
}

function formatGapDays(value?: number | null) {
  if (!isFiniteNumber(value)) return '–'
  const num = Math.max(0, Number(value))
  if (num < 0.5) return '<1 dag'
  return `${Math.round(num)} dagar`
}

function formatPercent(value?: number | null) {
  const rawString = String(value ?? '')
    .replace('%', '')
    .replace(/,/g, '.')
    .trim()

  const raw = Number(rawString)
  if (!Number.isFinite(raw)) return '–'

  let normalised = raw
  if (normalised <= 1) {
    normalised *= 100
  }

  while (normalised > 100) {
    normalised /= 10
  }

  return `${normalised.toFixed(normalised >= 10 ? 0 : 1)} %`
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

function formatStartSlot(value: any, method?: string | null) {
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

function hasRaceLink(result: any) {
  return Boolean(result?.raceId && result?.racedayId)
}

function navigateToRaceStart(result: any) {
  if (!hasRaceLink(result)) return
  router.push({
    name: 'RacedayRace',
    params: {
      racedayId: result.racedayId,
      raceId: result.raceId
    }
  })
}

function goBack() {
  if (router.options.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function isUnknownResult(res: any) {
  if (!res) return true
  if (res.withdrawn === true) return true
  if (res.pending) return true
  const eventDate = res?.date ? new Date(res.date) : null
  if (eventDate && !Number.isNaN(eventDate.getTime()) && eventDate.getTime() > Date.now()) {
    return true
  }
  if (Number.isFinite(Number(res.placementValue)) && Number(res.placementValue) > 0) return false
  return true
}

function formatPendingStatus(res: any) {
  if (res?.withdrawn) return 'Struken'
  if (res?.pending) return 'Inväntar resultat'
  const eventDate = res?.date ? new Date(res.date) : null
  if (eventDate && !Number.isNaN(eventDate.getTime()) && eventDate.getTime() > Date.now()) {
    return 'Kommande start'
  }
  const placement = Number(res?.placementValue)
  if (Number.isFinite(placement) && placement > 0) return `Placering ${placement}`
  return 'Ej klart'
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
  setBreadcrumbLabel('HorseDetail')
})
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

.stats-chips {
  display: flex;
  flex-wrap: wrap;
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
  background-color: rgba(15, 118, 110, 0.08);
}

.placement-podium {
  color: #2563eb;
  font-weight: 600;
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
</style>
