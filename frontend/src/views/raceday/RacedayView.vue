<template>
  <v-container class="main-content">
    <v-row>
      <v-col>
        <!-- Loading state -->
        <div v-if="loading" class="loading-wrap">
          <v-skeleton-loader type="heading, text" class="mb-4" />
          <v-skeleton-loader v-for="i in 3" :key="i" type="image, text" class="mb-3" />
        </div>

        <!-- Display Raceday details if available, else show error message -->
        <div v-else-if="racedayDetails">
          <div class="raceday-header">
            <div class="titles">
              <div class="title">{{ racedayDetails.trackName }}</div>
              <div class="meta">
                <span class="muted">{{ formattedFirstStart }}</span>
                <span class="dot" aria-hidden="true">•</span>
                <span class="muted">{{ totalRaces }} lopp</span>
              </div>
            </div>
            <div class="header-actions">
              <div class="games" v-if="racedayGames.length">
                <SpelformBadge v-for="g in racedayGames" :key="g" :game="g" :leg="1" />
              </div>
              <div class="game-actions" v-if="hasV85">
                <div class="game-actions-title">V85</div>
                <div class="buttons">
                  <v-btn density="compact" class="ml-2" color="warning" variant="elevated" @click="showV85Modal = true">V85-spelförslag</v-btn>
                  <v-btn density="compact" class="ml-2" color="info" variant="tonal" @click="updateV85" :loading="updatingV85" :disabled="updatingV85">Uppdatera V85%</v-btn>
                </div>
                <div class="v85-status" v-if="v85UpdatedLabel">
                  {{ v85UpdatedLabel }}
                </div>
                <div class="v85-status muted" v-else>
                  V85% ej hämtad ännu
                </div>
                <div v-if="v85UpdateMessage" class="v85-message">{{ v85UpdateMessage }}</div>
              </div>
              <div class="game-actions" v-if="hasV86">
                <div class="game-actions-title">V86</div>
                <div class="buttons">
                  <v-btn density="compact" class="ml-2" color="warning" variant="elevated" @click="showV86Modal = true">V86-spelförslag</v-btn>
                  <v-btn density="compact" class="ml-2" color="info" variant="tonal" @click="updateV86" :loading="updatingV86" :disabled="updatingV86">Uppdatera V86%</v-btn>
                </div>
                <div class="v86-status" v-if="v86UpdatedLabel">
                  {{ v86UpdatedLabel }}
                </div>
                <div class="v86-status muted" v-else>
                  V86% ej hämtad ännu
                </div>
                <div v-if="v86UpdateMessage" class="v86-message">{{ v86UpdateMessage }}</div>
              </div>
            </div>
          </div>

          <div class="saved-suggestions-panel">
            <div class="saved-header">
              <div>
                <div class="saved-title">Sparade spelförslag</div>
                <div class="muted">Öppna tidigare biljetter för dagen och jämför hur de gick.</div>
              </div>
              <v-btn
                variant="text"
                color="secondary"
                :to="{ name: 'SuggestionAnalytics' }"
              >
                Analytics
              </v-btn>
            </div>

            <div v-if="savedSuggestionsLoading" class="saved-loading">
              <v-skeleton-loader type="list-item-three-line" />
            </div>
            <div v-else-if="savedSuggestions.length">
              <div class="saved-summary-grid">
                <div
                  v-for="summary in savedSuggestionSummary"
                  :key="summary.gameType"
                  class="saved-summary-card"
                >
                  <div class="saved-summary-top">
                    <span class="saved-summary-game">{{ summary.gameType }}</span>
                    <span class="saved-summary-count">{{ summary.count }} st</span>
                  </div>
                  <div class="saved-summary-note">{{ summary.strategies.join(', ') || 'Inga strategier ännu' }}</div>
                </div>
              </div>

              <div class="saved-list">
                <router-link
                  v-for="item in savedSuggestions"
                  :key="item.id"
                  class="saved-item"
                  :to="{ name: 'SuggestionDetail', params: { racedayId: route.params.racedayId, suggestionId: item.id } }"
                >
                  <div class="saved-item-top">
                    <span class="saved-game">{{ item.gameType }}</span>
                    <span class="saved-time">{{ formatSavedDateTime(item.generatedAt) }}</span>
                  </div>
                  <div class="saved-item-title">{{ formatSavedStrategy(item) }}</div>
                  <div class="saved-item-meta">
                    <span>{{ item.rowCount }} rader</span>
                    <span>{{ formatCurrency(item.totalCost) }} kr</span>
                    <span>{{ formatSavedSettlement(item) }}</span>
                  </div>
                  <div class="saved-item-note">{{ item.settlement?.summary || 'Inväntar resultat' }}</div>
                </router-link>
              </div>
            </div>
            <div v-else class="muted">
              Inga sparade spelförslag för den här tävlingsdagen ännu.
            </div>
            <div v-if="savedSuggestionsError" class="error-message">
              {{ savedSuggestionsError }}
            </div>
          </div>

          <div v-for="race in sortedRaceList" :key="race.id" class="race-row">
            <RaceCardComponent
              :race="race"
              :lastUpdatedHorseTimestamp="race.earliestUpdatedHorseTimestamp"
              :racedayId="reactiveRouteParams.racedayId"
              :games="getRaceGames(race.raceId)"
              @race-updated="refreshRaceday"
            />
          </div>
        </div>
        <div v-else-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </v-col>
    </v-row>
  </v-container>
  <V85SuggestionModal
    :model-value="showV85Modal"
    @update:modelValue="showV85Modal = $event"
    @generated="refreshSavedSuggestions"
    :raceday-id="route.params.racedayId"
  />
  <V86SuggestionModal
    :model-value="showV86Modal"
    @update:modelValue="showV86Modal = $event"
    @generated="refreshSavedSuggestions"
    :raceday-id="route.params.racedayId"
  />
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import RaceCardComponent from './components/RaceCardComponent.vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import SuggestionService from '@/views/suggestion/services/SuggestionService.js'
import { useDateFormat } from '@/composables/useDateFormat.js'
import { useRoute } from 'vue-router'
import SpelformBadge from '@/components/SpelformBadge.vue'
import V85SuggestionModal from './components/V85SuggestionModal.vue'
import V86SuggestionModal from './components/V86SuggestionModal.vue'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
  components: {
    RaceCardComponent,
    SpelformBadge,
    V85SuggestionModal,
    V86SuggestionModal
  },
  props: {
    racedayId: {
      type: [String, Number],
      default: null
    }
  },
  setup(props, { root }) {
    const route = useRoute()
    console.log('RacedayView Props:', props);
    console.log('RacedayView Route Params:', route.params);

    const applyPlaceholderBreadcrumb = () => {
      const id = route.params.racedayId
      if (id != null) {
        setBreadcrumbLabel('Raceday', `Tävlingsdag ${id}`)
      }
    }
    applyPlaceholderBreadcrumb()

    const racedayDetails = ref(null)
    const errorMessage = ref(null)
    const updatingV85 = ref(false)
    const updatingV86 = ref(false)
    const showV85Modal = ref(false)
    const showV86Modal = ref(false)
    const v86GameView = ref(null)
    const loading = ref(true)
    const savedSuggestions = ref([])
    const savedSuggestionSummary = ref([])
    const savedSuggestionsLoading = ref(false)
    const savedSuggestionsError = ref('')
    const { formatDate } = useDateFormat()
    const reactiveRouteParams = computed(() => route.params)
    const spelformer = ref({})
    const v85UpdateMessage = ref('')
    const v86UpdateMessage = ref('')
    const isRecentlyUpdated = (timestamp) => {
      const sixDaysAgo = new Date()
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
      const raceUpdateTime = new Date(timestamp)
      return raceUpdateTime >= sixDaysAgo
    }

    const formatTimeShort = (dateString) => {
      try {
        const d = new Date(dateString)
        return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(d)
      } catch {
        return ''
      }
    }

    const formatBreadcrumbDate = (value) => {
      if (!value) return ''
      try {
        return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(value))
      } catch {
        return ''
      }
    }

    onMounted(async () => {
      try {
        loading.value = true
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)
        spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
        await loadV86GameView()
        await refreshSavedSuggestions()
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Error fetching raceday details. Please try again later.'
        return
      } finally {
        loading.value = false
      }
    })

    watch(
      () => racedayDetails.value,
      (info) => {
        if (info?.trackName) {
          const dateLabel = formatBreadcrumbDate(info.raceDayDate || info.firstStart)
          const label = dateLabel ? `${info.trackName} (${dateLabel})` : info.trackName
          setBreadcrumbLabel('Raceday', label)
        }
      },
      { immediate: true }
    )

    watch(
      () => route.params.racedayId,
      () => {
        applyPlaceholderBreadcrumb()
      }
    )

    onBeforeUnmount(() => {
      setBreadcrumbLabel('Raceday')
    })

    const racedayGames = computed(() => {
      const order = ['V85','V86','V64','V65','GS75','V5','V4','DD']
      const keys = Object.keys(spelformer.value || {})
      return keys.sort((a,b) => (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b)))
    })

    const refreshRaceday = async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)
        spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
        await loadV86GameView()
        await refreshSavedSuggestions()
      } catch (error) {
        console.error('Error refreshing raceday details:', error)
      }
    }

    const refreshSavedSuggestions = async () => {
      try {
        savedSuggestionsLoading.value = true
        savedSuggestionsError.value = ''
        const result = await SuggestionService.fetchRacedaySuggestions(route.params.racedayId)
        savedSuggestions.value = Array.isArray(result?.items) ? result.items : []
        savedSuggestionSummary.value = Array.isArray(result?.summary) ? result.summary : []
      } catch (error) {
        console.error('Failed to load saved suggestions', error)
        savedSuggestionsError.value = error?.response?.data?.error || 'Kunde inte hämta sparade spelförslag.'
      } finally {
        savedSuggestionsLoading.value = false
      }
    }

    const loadV86GameView = async () => {
      try {
        v86GameView.value = await RacedayService.fetchV86GameView(route.params.racedayId)
      } catch (error) {
        console.error('Failed to load V86 game view', error)
        v86GameView.value = null
      }
    }

    const formatDateTime = (value) => {
      try {
        return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
      } catch (e) {
        return ''
      }
    }

    const v85UpdatedLabel = computed(() => {
      const ts = racedayDetails.value?.v85Info?.updatedAt
      if (!ts) return ''
      return `V85% uppdaterad ${formatDateTime(ts)}`
    })

    const v86UpdatedLabel = computed(() => {
      const ts = racedayDetails.value?.v86Info?.updatedAt
      if (!ts) return ''
      return `V86% uppdaterad ${formatDateTime(ts)}`
    })

    const hasV85 = computed(() => Array.isArray(spelformer.value?.V85) && spelformer.value.V85.length > 0)
    const hasV86 = computed(() => {
      if (Array.isArray(spelformer.value?.V86) && spelformer.value.V86.length > 0) return true
      return v86GameView.value?.status === 'ok'
    })

    const v86LegByRaceId = computed(() => {
      const map = new Map()
      const legs = v86GameView.value?.legs || []
      for (const leg of legs) {
        const raceId = leg?.raceId
        const legNumber = Number(leg?.legNumber ?? leg?.leg)
        if (raceId == null || !Number.isFinite(legNumber)) continue
        map.set(String(raceId), legNumber)
      }
      return map
    })

    const capabilities = computed(() => ({
      hasV85: hasV85.value,
      hasV86: hasV86.value,
      v85GameId: racedayDetails.value?.v85Info?.gameId || racedayDetails.value?.atgCalendarGamesRaw?.V85?.[0]?.id || null,
      v86GameId: v86GameView.value?.gameId || racedayDetails.value?.atgCalendarGamesRaw?.V86?.[0]?.id || null
    }))

    const sortedRaceList = computed(() => {
      return racedayDetails.value?.raceList.sort((a, b) => a.raceNumber - b.raceNumber) || []
    })

    const totalRaces = computed(() => sortedRaceList.value.length)
    const formattedFirstStart = computed(() => {
      const ts = racedayDetails.value?.firstStart
      return ts ? `Start ${formatTimeShort(ts)}` : ''
    })

    const getRaceGames = raceId => {
      const res = []
      const raceKey = String(raceId)
      const v86Leg = v86LegByRaceId.value.get(raceKey)
      if (Number.isFinite(v86Leg)) {
        res.push({ game: 'V86', leg: v86Leg })
      }
      for (const [game, ids] of Object.entries(spelformer.value)) {
        if (game === 'V86') continue
        const idx = ids.findIndex(id => String(id) === raceKey)
        if (idx !== -1) res.push({ game, leg: idx + 1 })
      }
      return res
    }

    const updateV85 = async () => {
      try {
        if (!hasV85.value) return
        updatingV85.value = true
        v85UpdateMessage.value = ''
        await RacedayService.updateV85Distribution(route.params.racedayId)
        await refreshRaceday()
        v85UpdateMessage.value = v85UpdatedLabel.value || 'V85% uppdaterad.'
      } catch (error) {
        console.error('Failed to update V85%', error)
        v85UpdateMessage.value = error?.error || 'Misslyckades att uppdatera V85%'
      } finally {
        updatingV85.value = false
      }
    }

    const updateV86 = async () => {
      try {
        if (!hasV86.value) return
        updatingV86.value = true
        v86UpdateMessage.value = ''
        const result = await RacedayService.updateV86Distribution(route.params.racedayId)
        if (result?.ok === false) {
          v86UpdateMessage.value = result?.message || 'Misslyckades att uppdatera V86%'
          return
        }
        await refreshRaceday()
        v86UpdateMessage.value = v86UpdatedLabel.value || 'V86% uppdaterad.'
      } catch (error) {
        console.error('Failed to update V86%', error)
        v86UpdateMessage.value = error?.error || 'Misslyckades att uppdatera V86%'
      } finally {
        updatingV86.value = false
      }
    }

    const formatCurrency = (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return '0'
      return new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(numeric)
    }

    const formatSavedDateTime = (value) => {
      if (!value) return ''
      return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value))
    }

    const formatSavedStrategy = (item) => {
      const parts = [
        item?.strategy?.modeLabel || item?.strategy?.mode,
        item?.strategy?.variantLabel || item?.strategy?.variantStrategyLabel
      ].filter(Boolean)
      return parts.join(' · ') || 'Okänd strategi'
    }

    const formatSavedSettlement = (item) => {
      const totalLegs = Number(item?.settlement?.totalLegs || 0)
      const correctLegs = Number(item?.settlement?.correctLegs || 0)
      if (!item?.settlement?.resultsAvailable) return 'Inväntar resultat'
      return `${correctLegs}/${totalLegs} rätt`
    }

    return {
      racedayDetails,
      errorMessage,
      formatDate,
      sortedRaceList,
      reactiveRouteParams,
      spelformer,
      getRaceGames,
      isRecentlyUpdated,
      refreshRaceday,
      hasV85,
      hasV86,
      updateV85,
      updateV86,
      racedayGames,
      loading,
      totalRaces,
      formattedFirstStart,
      showV85Modal,
      showV86Modal,
      route,
      updatingV85,
      updatingV86,
      v85UpdatedLabel,
      v85UpdateMessage,
      v86UpdatedLabel,
      v86UpdateMessage,
      capabilities,
      savedSuggestions,
      savedSuggestionSummary,
      savedSuggestionsLoading,
      savedSuggestionsError,
      refreshSavedSuggestions,
      formatSavedDateTime,
      formatCurrency,
      formatSavedStrategy,
      formatSavedSettlement
    }
  }
}
</script>

<style scoped>
  .main-content { padding-top: 70px; }
  .raceday-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    padding-bottom: 8px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .titles .title { font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
  .titles .meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
  .muted { color: #6b7280; font-size: 0.92rem; }
  .dot { color: #9ca3af; }
  .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .games { display: flex; gap: 6px; }
  .buttons { display: flex; gap: 8px; }
  .game-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px dashed rgba(0,0,0,0.12);
  }
  .game-actions-title {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4b5563;
  }
  .v85-status, .v86-status { font-size: 0.85rem; color: #1f2933; }
  .v85-status.muted, .v86-status.muted { color: #6b7280; }
  .v85-message, .v86-message { font-size: 0.82rem; color: #2563eb; }
  .race-row { margin-bottom: 10px; }
  .saved-suggestions-panel {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(15,23,42,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));
    box-shadow: 0 10px 24px rgba(15,23,42,0.05);
  }
  .saved-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .saved-title {
    font-size: 1rem;
    font-weight: 700;
  }
  .saved-loading { padding-top: 6px; }
  .saved-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-bottom: 12px;
  }
  .saved-summary-card {
    padding: 12px;
    border-radius: 12px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(15,23,42,0.08);
  }
  .saved-summary-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.92rem;
  }
  .saved-summary-game {
    font-weight: 700;
  }
  .saved-summary-count {
    color: #6b7280;
  }
  .saved-summary-note {
    margin-top: 6px;
    font-size: 0.88rem;
    color: #6b7280;
  }
  .saved-list {
    display: grid;
    gap: 10px;
  }
  .saved-item {
    display: block;
    text-decoration: none;
    color: inherit;
    padding: 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(15,23,42,0.08);
  }
  .saved-item-top,
  .saved-item-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 0.9rem;
  }
  .saved-game {
    font-weight: 700;
  }
  .saved-time,
  .saved-item-meta,
  .saved-item-note {
    color: #6b7280;
  }
  .saved-item-title {
    margin-top: 6px;
    font-weight: 700;
  }
  .saved-item-meta {
    margin-top: 6px;
  }
  .saved-item-note {
    margin-top: 6px;
    font-size: 0.9rem;
  }
  .error-message { color: #ef4444; font-size: 0.95rem; margin-top: 1rem; }
  .loading-wrap { padding-top: 24px; }

  @media (prefers-color-scheme: dark) {
    .raceday-header { border-bottom-color: rgba(255,255,255,0.08); }
    .muted { color: #9ca3af; }
    .dot { color: #6b7280; }
    .error-message { color: #f87171; }
    .game-actions { border-top-color: rgba(255,255,255,0.2); }
    .game-actions-title { color: #9ca3af; }
    .v85-status, .v86-status { color: #d1d5db; }
    .v85-status.muted, .v86-status.muted { color: #9ca3af; }
    .v85-message, .v86-message { color: #93c5fd; }
    .saved-suggestions-panel,
    .saved-summary-card,
    .saved-item {
      background: rgba(17,24,39,0.82);
      border-color: rgba(255,255,255,0.08);
    }
  }
</style>
