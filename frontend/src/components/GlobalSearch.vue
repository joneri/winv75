<template>
  <div class="global-search">
    <v-text-field
      v-model="query"
      label="Sök"
      density="compact"
      hide-details
      clearable
    />
    <v-menu v-model="menu" activator="parent" transition="fade-transition" :close-on-content-click="false">
      <v-card min-width="360">
        <v-list>
          <template v-if="errorMessage">
            <v-list-item>
              <v-list-item-title>Inget svar från servern</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else>
            <template v-if="isLoading">
              <v-list-item>
                <v-list-item-title>Söker…</v-list-item-title>
              </v-list-item>
            </template>
            <template v-else>
              <template v-if="hasAnyResults">
                <template v-if="horseItems.length">
                  <v-subheader>Hästar</v-subheader>
                  <v-list-item
                    v-for="horse in horseItems"
                    :key="`h-${horse.id ?? horse._id ?? horse.name}`"
                    :to="horse._link || undefined"
                    :disabled="!horse._link"
                    @click="handleSelect(horse._link)"
                  >
                    <v-list-item-title>{{ horse.name }}</v-list-item-title>
                  </v-list-item>
                </template>
                <template v-if="driverItems.length">
                  <v-subheader>Kuskar</v-subheader>
                  <v-list-item
                    v-for="driver in driverItems"
                    :key="`dvr-${driver._id ?? driver.name}`"
                    :to="driver._link || undefined"
                    :disabled="!driver._link"
                    @click="handleSelect(driver._link)"
                  >
                    <v-list-item-title>{{ driver.name }}</v-list-item-title>
                  </v-list-item>
                </template>
                <template v-if="upcomingRaces.length">
                  <v-subheader>Kommande lopp</v-subheader>
                  <v-list-item
                    v-for="up in upcomingRaces"
                    :key="`u-${up.racedayId}-${up.id}-${up.horseId ?? 'x'}`"
                    :to="`/raceday/${up.racedayId}/race/${up.id}`"
                    @click="close"
                  >
                    <v-list-item-title>
                      {{ formatStart(up.startTime) }} • {{ up.trackName }} • Lopp {{ up.raceNumber }} •
                      <span :style="isMatch(up.horseName) ? 'font-weight:600' : ''">Häst: {{ up.horseName }}</span> •
                      <span :style="isMatch(up.driverName) ? 'font-weight:600' : ''">Driver: {{ up.driverName }}</span> •
                      Spår: {{ up.startPosition ?? '-' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
                <template v-if="racedays.length">
                  <v-subheader>Kommande tävlingsdagar</v-subheader>
                  <v-list-item v-for="day in racedays" :key="`d-${day.raceDayId}`" :to="`/raceday/${day.raceDayId}`" @click="close">
                    <v-list-item-title>{{ day.trackName }} {{ day.raceDayDate }}</v-list-item-title>
                  </v-list-item>
                </template>
                <template v-if="pastResults.length">
                  <v-subheader>Resultat</v-subheader>
                  <v-list-item v-for="res in pastResults" :key="`r-${res.raceDayId}`" :to="`/raceday/${res.raceDayId}`" @click="close">
                    <v-list-item-title>{{ res.trackName }} {{ res.raceDayDate }}</v-list-item-title>
                  </v-list-item>
                </template>
                <template v-if="tracks.length">
                  <v-subheader>Banor</v-subheader>
                  <v-list-item v-for="track in tracks" :key="`t-${track.trackCode}`">
                    <v-list-item-title>{{ track.trackName }}</v-list-item-title>
                  </v-list-item>
                </template>
              </template>
              <template v-else>
                <v-list-item>
                  <v-list-item-title>Inga träffar</v-list-item-title>
                </v-list-item>
              </template>
            </template>
          </template>
        </v-list>
      </v-card>
    </v-menu>
  </div>
  </template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { searchGlobal } from '@/api'

type RouterLinkTarget = { name: string; params: Record<string, any> }

const query = ref('')
const results = ref({ horses: [], drivers: [], racedays: [], raceDays: [], results: [], tracks: [] })
const menu = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let controller: AbortController | null = null

function resetResults() {
  results.value = { horses: [], drivers: [], racedays: [], raceDays: [], results: [], tracks: [] }
}

function close() {
  menu.value = false
}

function handleSelect(link?: RouterLinkTarget) {
  if (link) close()
}

const horses = computed(() => Array.isArray(results.value.horses) ? results.value.horses : [])
const drivers = computed(() => Array.isArray(results.value.drivers) ? results.value.drivers : [])
const upcomingRaces = computed(() => Array.isArray((results.value as any).upcomingRaces) ? (results.value as any).upcomingRaces : [])
const racedays = computed(() => Array.isArray((results.value as any).racedays) ? (results.value as any).racedays : (Array.isArray((results.value as any).raceDays) ? (results.value as any).raceDays : []))
const pastResults = computed(() => Array.isArray(results.value.results) ? results.value.results : [])
const tracks = computed(() => Array.isArray(results.value.tracks) ? results.value.tracks : [])

function buildHorseLink(horse: any): RouterLinkTarget | undefined {
  const id = horse?.id ?? horse?._id ?? horse?.horseId
  if (id == null) return undefined
  return { name: 'HorseDetail', params: { horseId: id } }
}

function buildDriverLink(driver: any): RouterLinkTarget | undefined {
  const id = driver?._id ?? driver?.id
  if (id == null) return undefined
  return { name: 'DriverDetail', params: { driverId: id } }
}

const horseItems = computed(() => horses.value.map(h => ({
  ...h,
  _link: buildHorseLink(h)
})))

const driverItems = computed(() => drivers.value.map(d => ({
  ...d,
  _link: buildDriverLink(d)
})))

const hasAnyResults = computed(() => {
  return (
    horses.value.length +
    drivers.value.length +
    upcomingRaces.value.length +
    racedays.value.length +
    pastResults.value.length +
    tracks.value.length
  ) > 0
})

function sortByRelevance(items, key) {
  const q = (query.value ?? '').trim().toLowerCase()
  return [...items].sort((a, b) => {
    const av = String(a[key] ?? '').toLowerCase()
    const bv = String(b[key] ?? '').toLowerCase()
    const aStarts = av.startsWith(q)
    const bStarts = bv.startsWith(q)
    if (aStarts && !bStarts) return -1
    if (!aStarts && bStarts) return 1
    // fallback lexical
    return av.localeCompare(bv)
  })
}

function norm(s: any): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

const qNorm = computed(() => norm(query.value))
function isMatch(s: any): boolean {
  const q = qNorm.value.trim()
  if (q.length < 2) return false
  return norm(s).includes(q)
}

function pad2(n: number) { return n < 10 ? `0${n}` : String(n) }
function formatStart(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

watch(
  query,
  (val) => {
    const q = (val ?? '').trim()
    // Guard: < 2 chars => no request, close dropdown
    if (q.length < 2) {
      if (debounceTimer) clearTimeout(debounceTimer)
      if (controller) controller.abort()
      controller = null
      isLoading.value = false
      errorMessage.value = ''
      menu.value = false
      resetResults()
      return
    }

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      // cancel previous in-flight
      if (controller) controller.abort()
      controller = new AbortController()
      isLoading.value = true
      errorMessage.value = ''
      menu.value = true

      const res = await searchGlobal(q, controller.signal)

      // If aborted, do nothing here (next cycle will handle)
      if (!res.ok) {
        if (res.aborted) return
        // Network/server error -> show message, keep arrays empty
        errorMessage.value = 'Inget svar från servern'
        resetResults()
        isLoading.value = false
        return
      }

      // Defensive defaults in case keys are missing
      const data: any = res.data || {}
      const safe = {
        horses: Array.isArray(data.horses) ? data.horses : [],
        drivers: Array.isArray(data.drivers) ? data.drivers : [],
        upcomingRaces: Array.isArray(data.upcomingRaces) ? data.upcomingRaces : [],
        racedays: Array.isArray(data.racedays) ? data.racedays : (Array.isArray(data.raceDays) ? data.raceDays : []),
        results: Array.isArray(data.results) ? data.results : [],
        tracks: Array.isArray(data.tracks) ? data.tracks : []
      }

      // Simple client relevance: startsWith > includes (horses, tracks)
      const sorted = {
        horses: sortByRelevance(safe.horses, 'name'),
        drivers: sortByRelevance(safe.drivers, 'name'),
        upcomingRaces: safe.upcomingRaces,
        racedays: safe.racedays,
        results: safe.results,
        tracks: sortByRelevance(safe.tracks, 'trackName')
      }

      results.value = sorted as any
      isLoading.value = false
    }, 250)
  }
)

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (controller) controller.abort()
})
</script>
