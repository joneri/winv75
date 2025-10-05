<template>
  <v-container class="search-view" fluid>
    <div class="page-header">
      <h1 class="text-h4 mb-2">Hästar</h1>
      <p class="text-body-2 text-medium-emphasis">Sorterat efter form ELO</p>
    </div>

    <v-text-field
      v-model="searchTerm"
      label="Sök häst"
      density="comfortable"
      variant="outlined"
      clearable
      prepend-inner-icon="mdi-magnify"
      class="mb-4"
    />

    <v-card elevation="0" class="list-card">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-list ref="listRef" class="scroll-list" lines="two">
        <div v-if="items.length === 0 && !loading" class="empty-state">
          <v-icon size="32" class="mb-2" color="primary">mdi-horse-variant</v-icon>
          <div>Inga hästar hittades.</div>
        </div>

        <template v-for="horse in items" :key="horse.id">
          <v-list-item
            class="list-row"
            :title="horse.name || 'Okänd häst'"
            @click="goToHorse(horse.id)"
          >
            <template #subtitle>
              <div class="subtitle-row">
                <span>Form ELO {{ formatNumber(horse.formRating) }}</span>
                <span v-if="isFiniteNumber(horse.formDelta)">Δ {{ formatSigned(horse.formDelta) }}</span>
                <span v-if="horse.rating">Class ELO {{ formatNumber(horse.rating) }}</span>
                <span v-if="winningText(horse)">{{ winningText(horse) }}</span>
                <span v-if="horse.trainerName">Tränare {{ horse.trainerName }}</span>
              </div>
            </template>
            <template #append>
              <div class="append-data">
                <div class="append-primary">{{ formatNumber(horse.formRating) }}</div>
                <div class="append-label">Form ELO</div>
                <div v-if="isFiniteNumber(horse.formDelta)" class="append-secondary">Δ {{ formatSigned(horse.formDelta) }}</div>
              </div>
            </template>
          </v-list-item>
          <v-divider />
        </template>

        <div ref="sentinelRef" class="sentinel">
          <v-progress-circular v-if="loading && hasMore" indeterminate size="24" color="primary" />
          <div v-else-if="!hasMore && items.length" class="end-marker">Alla hästar har laddats</div>
        </div>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { HorseListItem } from '@/api'
import { fetchHorseList } from '@/api'

const router = useRouter()

const searchTerm = ref('')
const items = ref<HorseListItem[]>([])
const loading = ref(false)
const hasMore = ref(true)
const nextCursor = ref<string | null>(null)
const error = ref('')

const listRef = ref<any>(null)
const sentinelRef = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let fetchToken = 0
let activeController: AbortController | null = null

const getRootEl = () => {
  const list = listRef.value
  return list ? (list.$el || list) : null
}

const clearObserver = () => {
  if (observer) observer.disconnect()
  observer = null
}

const cancelPending = () => {
  if (activeController) {
    activeController.abort()
    activeController = null
  }
}

const setupObserver = () => {
  removeScrollListener()
  clearObserver()
  const root = getRootEl()
  if (!root || !sentinelRef.value) return

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting) {
      loadMore()
    }
  }, { root, rootMargin: '240px', threshold: 0 })

  observer.observe(sentinelRef.value)

  root.addEventListener('scroll', onScroll, { passive: true })
}

const removeScrollListener = () => {
  const root = getRootEl()
  if (!root) return
  root.removeEventListener('scroll', onScroll)
}

const onScroll = () => {
  const root = getRootEl()
  if (!root || loading.value || !hasMore.value) return
  if (root.scrollTop + root.clientHeight >= root.scrollHeight - 200) {
    loadMore()
  }
}

const resetAndLoad = async () => {
  cancelPending()
  fetchToken += 1
  items.value = []
  hasMore.value = true
  nextCursor.value = null
  error.value = ''
  await nextTick()
  setupObserver()
  loadMore()
}

const winningText = (horse: HorseListItem) => {
  const win = formatPercent(horse.winningRate)
  const place = formatPercent(horse.placementRate)
  if (win && place) return `Seger ${win} • Plats ${place}`
  if (win) return `Seger ${win}`
  if (place) return `Plats ${place}`
  return ''
}

const formatNumber = (value: number | null | undefined) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(num)
}

const isFiniteNumber = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'number') return Number.isFinite(value)
  const num = Number(value)
  return Number.isFinite(num)
}

const formatSigned = (value: number | null | undefined) => {
  if (!isFiniteNumber(value)) return '–'
  const num = Number(value)
  const decimals = Math.abs(num) >= 10 ? 0 : 1
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
  return num > 0 && !formatted.startsWith('+') ? `+${formatted}` : formatted
}

const formatPercent = (value: string | number | null | undefined) => {
  if (value == null) return ''
  const rawString = String(value)
    .replace('%', '')
    .replace(/,/g, '.')
    .trim()
  const raw = Number(rawString)
  if (!Number.isFinite(raw) || raw <= 0) return ''
  let normalised = raw
  if (normalised <= 1) normalised *= 100
  while (normalised > 100) {
    normalised /= 10
  }
  return `${normalised.toFixed(normalised >= 10 ? 0 : 1)} %`
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  const token = ++fetchToken
  cancelPending()
  activeController = new AbortController()

  const params: Record<string, any> = {}
  if (searchTerm.value.trim()) params.q = searchTerm.value.trim()
  if (nextCursor.value) params.cursor = nextCursor.value

  const res = await fetchHorseList(params, activeController.signal)
  activeController = null

  if (token !== fetchToken) {
    loading.value = false
    return
  }

  if (!res.ok) {
    if (!res.aborted) {
      error.value = res.error || 'Ett fel inträffade'
      hasMore.value = false
    }
    loading.value = false
    return
  }

  const data = res.data
  if (!nextCursor.value) {
    items.value = data.items
  } else {
    items.value = [...items.value, ...data.items]
  }
  nextCursor.value = data.nextCursor
  hasMore.value = data.hasMore
  loading.value = false
}

const goToHorse = (id: number) => {
  router.push({ name: 'HorseDetail', params: { horseId: id } })
}

watch(
  () => searchTerm.value,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      resetAndLoad()
    }, 300)
  }
)

onMounted(async () => {
  await nextTick()
  resetAndLoad()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  cancelPending()
  clearObserver()
  removeScrollListener()
})

watch(
  () => sentinelRef.value,
  async () => {
    await nextTick()
    setupObserver()
  }
)

watch(
  () => listRef.value,
  async () => {
    await nextTick()
    setupObserver()
  }
)

</script>

<style scoped>
.search-view {
  max-width: 960px;
  padding-top: 70px;
}

.page-header {
  margin-bottom: 12px;
}

.list-card {
  border-radius: 12px;
  overflow: hidden;
}

.scroll-list {
  max-height: calc(100vh - 220px);
  overflow: auto;
}

.list-row {
  cursor: pointer;
}

.list-row:hover {
  background-color: rgba(15, 118, 110, 0.08);
}

.subtitle-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: rgba(17, 24, 39, 0.72);
}

.append-data {
  text-align: right;
  min-width: 72px;
}

.append-primary {
  font-weight: 600;
}

.append-label {
  font-size: 0.75rem;
  color: rgba(107, 114, 128, 0.9);
}

.append-secondary {
  font-size: 0.75rem;
  color: rgba(22, 163, 74, 0.95);
}

.sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.end-marker {
  font-size: 0.85rem;
  color: rgba(107, 114, 128, 0.9);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: rgba(107, 114, 128, 0.9);
}

@media (max-width: 960px) {
  .scroll-list {
    max-height: calc(100vh - 260px);
  }
}
</style>
