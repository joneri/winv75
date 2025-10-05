<template>
  <v-container class="search-view" fluid>
    <div class="page-header">
      <h1 class="text-h4 mb-2">Kuskar</h1>
      <p class="text-body-2 text-medium-emphasis">Sorterat efter form ELO</p>
    </div>

    <v-text-field
      v-model="searchTerm"
      label="Sök kusk"
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
          <v-icon size="32" class="mb-2" color="primary">mdi-account</v-icon>
          <div>Inga kuskar hittades.</div>
        </div>

        <template v-for="driver in items" :key="driver.id">
          <v-list-item
            class="list-row"
            :title="driver.name || 'Okänd kusk'"
            @click="goToDriver(driver.id)"
          >
            <template #subtitle>
              <div class="subtitle-row">
                <span>Form ELO {{ formatNumber(driver.elo) }}</span>
                <span v-if="driver.careerElo">Karriär-ELO {{ formatNumber(driver.careerElo) }}</span>
                <span v-if="driver.stats.starts">Starter {{ formatNumber(driver.stats.starts) }}</span>
                <span v-if="driver.stats.winRate">Seger {{ formatPercent(driver.stats.winRate) }}</span>
                <span v-if="driver.stats.top3Rate">Topp-3 {{ formatPercent(driver.stats.top3Rate) }}</span>
              </div>
            </template>
            <template #append>
              <div class="append-data">
                <div class="append-primary">{{ formatNumber(driver.elo) }}</div>
                <div class="append-label">Form ELO</div>
              </div>
            </template>
          </v-list-item>
          <v-divider />
        </template>

        <div ref="sentinelRef" class="sentinel">
          <v-progress-circular v-if="loading && hasMore" indeterminate size="24" color="primary" />
          <div v-else-if="!hasMore && items.length" class="end-marker">Alla kuskar har laddats</div>
        </div>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DriverListItem } from '@/api'
import { fetchDriverList } from '@/api'

const router = useRouter()

const searchTerm = ref('')
const items = ref<DriverListItem[]>([])
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

const removeScrollListener = () => {
  const root = getRootEl()
  if (!root) return
  root.removeEventListener('scroll', onScroll)
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

const formatNumber = (value: number | null | undefined) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '–'
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(num)
}

const formatPercent = (value: number | string | null | undefined) => {
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

  const res = await fetchDriverList(params, activeController.signal)
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

const goToDriver = (id: number) => {
  router.push({ name: 'DriverDetail', params: { driverId: id } })
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
