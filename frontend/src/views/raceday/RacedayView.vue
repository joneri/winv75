<template>
  <div class="raceday-page">
    <div v-if="loading" class="loading-wrap page-panel-soft loading-panel">
      <v-skeleton-loader type="heading, text" class="mb-4" />
      <v-skeleton-loader v-for="i in 3" :key="i" type="image, text" class="mb-3" />
    </div>

    <template v-else-if="racedayDetails">
      <section class="page-hero raceday-hero">
        <div class="hero-copy">
          <div class="page-kicker">Tävlingsdag · {{ racedayDateLabel }}</div>
          <h1 class="page-title">{{ racedayDetails.trackName }}</h1>
          <div class="page-chip-row">
            <div class="shell-chip is-track">{{ totalRaces }} lopp i dagens kort</div>
            <div class="shell-chip" v-if="formattedFirstStart">{{ formattedFirstStart }}</div>
            <div class="shell-chip is-focus" v-if="racedayGames.length">{{ racedayGames.join(' · ') }}</div>
            <div class="shell-chip">{{ savedSuggestions.length }} sparade förslag</div>
          </div>
        </div>

        <div class="hero-metrics">
          <div class="language-control hero-metric-card">
            <div class="panel-title">Språk</div>
            <v-select
              v-model="selectedPropLanguage"
              :items="propLanguageOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              aria-label="Välj propositionsspråk"
            />
          </div>
          <div class="hero-metric-card">
            <div class="panel-title">Osparade</div>
            <div class="hero-metric-value">{{ sessionUnsavedSuggestions.length }}</div>
            <div class="hero-metric-label">förslag i sessionen</div>
          </div>
          <div class="hero-metric-card">
            <div class="panel-title">Avgjorda</div>
            <div class="hero-metric-value">{{ settledSuggestionCount }}</div>
            <div class="hero-metric-label">sparade förslag</div>
          </div>
        </div>
      </section>

      <section class="page-panel raceday-profile-panel">
        <div class="section-head">
          <div>
            <div class="panel-title">Dagens profil</div>
            <h2 class="section-title">KPI:er och läsning av tävlingsdagen</h2>
          </div>
          <div class="section-meta">
            <span v-if="racedayKpis?.generatedAt">Uppdaterad {{ formatDateTime(racedayKpis.generatedAt) }}</span>
          </div>
        </div>

        <div v-if="racedayKpisLoading" class="profile-loading">
          <v-skeleton-loader type="paragraph, actions" />
        </div>
        <v-alert v-else-if="racedayKpisError" type="warning" variant="tonal">
          {{ racedayKpisError }}
        </v-alert>
        <template v-else-if="racedayKpis">
          <p class="profile-narrative">{{ racedayKpis.narrative }}</p>
          <div v-if="racedayKpis.tags?.length" class="profile-tags">
            <span v-for="tag in racedayKpis.tags" :key="tag" class="profile-tag">{{ tag }}</span>
          </div>
          <div class="profile-kpi-grid">
            <article
              v-for="kpi in profileKpis"
              :key="kpi.key"
              class="profile-kpi-card"
            >
              <span>{{ kpi.label }}</span>
              <strong>{{ formatKpiValue(kpi) }}</strong>
              <small>{{ formatKpiUnit(kpi) }}</small>
            </article>
          </div>
        </template>
      </section>

      <section class="raceday-layout">
        <div class="raceday-main">
          <section class="page-panel race-stage">
            <div class="section-head">
              <div>
                <div class="panel-title">Loppöversikt</div>
                <h2 class="section-title">Dagens lopp och spelkopplingar</h2>
              </div>
              <div class="section-meta">
                <span>{{ totalRaces }} lopp</span>
                <span v-if="racedayGames.length">{{ racedayGames.join(' · ') }}</span>
              </div>
            </div>

            <div class="race-list">
              <RaceCardComponent
                v-for="race in sortedRaceList"
                :key="race.raceId || race.id"
                :race="race"
                :lastUpdatedHorseTimestamp="race.earliestUpdatedHorseTimestamp"
                :racedayId="reactiveRouteParams.racedayId"
                :games="getRaceGames(race.raceId)"
                @race-updated="refreshRaceday"
              />
            </div>
          </section>
        </div>

        <aside class="raceday-rail">
          <section class="page-panel-soft game-panel">
            <div class="section-head compact">
              <div>
                <div class="panel-title">Dagens spel</div>
                <h2 class="section-title">Förslag och procent</h2>
              </div>
            </div>

            <div class="game-stack">
              <article v-if="hasV85" class="game-card">
                <div class="game-card-top">
                  <div>
                    <div class="game-card-title">V85</div>
                    <div class="game-card-status">
                      {{ v85UpdatedLabel || 'V85-procent är inte uppdaterad ännu' }}
                    </div>
                  </div>
                  <div class="games" v-if="racedayGames.includes('V85')">
                    <SpelformBadge game="V85" :leg="1" />
                  </div>
                </div>
                <div class="game-card-actions">
                  <v-btn color="secondary" variant="elevated" @click="showV85Modal = true">
                    V85-spelförslag
                  </v-btn>
                  <v-btn color="info" variant="tonal" :loading="updatingV85" :disabled="updatingV85" @click="updateV85">
                    Uppdatera V85%
                  </v-btn>
                </div>
                <div v-if="v85UpdateMessage" class="game-card-message">
                  {{ v85UpdateMessage }}
                </div>
              </article>

              <article v-if="hasV5" class="game-card">
                <div class="game-card-top">
                  <div>
                    <div class="game-card-title">V5</div>
                    <div class="game-card-status">
                      {{ v5UpdatedLabel || 'V5-procent är inte uppdaterad ännu' }}
                    </div>
                  </div>
                  <div class="games" v-if="racedayGames.includes('V5')">
                    <SpelformBadge game="V5" :leg="1" />
                  </div>
                </div>
                <div class="game-card-actions">
                  <v-btn color="secondary" variant="elevated" @click="showV5Modal = true">
                    V5-spelförslag
                  </v-btn>
                  <v-btn color="info" variant="tonal" :loading="updatingV5" :disabled="updatingV5" @click="updateV5">
                    Uppdatera V5%
                  </v-btn>
                </div>
                <div v-if="v5UpdateMessage" class="game-card-message">
                  {{ v5UpdateMessage }}
                </div>
              </article>

              <article v-if="hasV86" class="game-card">
                <div class="game-card-top">
                  <div>
                    <div class="game-card-title">V86</div>
                    <div class="game-card-status">
                      {{ v86UpdatedLabel || 'V86-procent är inte uppdaterad ännu' }}
                    </div>
                  </div>
                  <div class="games" v-if="racedayGames.includes('V86')">
                    <SpelformBadge game="V86" :leg="1" />
                  </div>
                </div>
                <div class="game-card-actions">
                  <v-btn color="secondary" variant="elevated" @click="showV86Modal = true">
                    V86-spelförslag
                  </v-btn>
                  <v-btn color="info" variant="tonal" :loading="updatingV86" :disabled="updatingV86" @click="updateV86">
                    Uppdatera V86%
                  </v-btn>
                </div>
                <div v-if="v86UpdateMessage" class="game-card-message">
                  {{ v86UpdateMessage }}
                </div>
              </article>

              <article v-if="hasDD" class="game-card">
                <div class="game-card-top">
                  <div>
                    <div class="game-card-title">Dagens Dubbel</div>
                    <div class="game-card-status">
                      {{ ddStatusLabel }}
                    </div>
                  </div>
                  <div class="games" v-if="racedayGames.includes('DD')">
                    <SpelformBadge game="DD" :leg="1" />
                    <SpelformBadge game="DD" :leg="2" />
                  </div>
                </div>
                <div class="game-card-actions">
                  <v-btn color="secondary" variant="elevated" @click="showDdModal = true">
                    DD-förslag
                  </v-btn>
                </div>
              </article>

              <div v-if="!hasV85 && !hasV5 && !hasV86 && !hasDD" class="empty-rail-message">
                Inga stödda spelformer hittades för den här tävlingsdagen.
              </div>
            </div>
          </section>

          <section class="page-panel-soft session-panel">
            <div class="saved-header">
              <div>
                <div class="saved-title">Genererat i denna session</div>
              </div>
              <div class="session-actions">
                <v-btn
                  variant="tonal"
                  color="info"
                  size="small"
                  :disabled="!sessionUnsavedSuggestions.length"
                  :loading="savingSessionSuggestions"
                  @click="saveSessionSuggestions()"
                >
                  Spara synliga
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  color="secondary"
                  :disabled="!sessionUnsavedSuggestions.length"
                  @click="clearSessionSuggestions()"
                >
                  Rensa osparade
                </v-btn>
              </div>
            </div>

            <div v-if="sessionSuggestionsMessage" class="session-message">{{ sessionSuggestionsMessage }}</div>
            <div v-if="sessionUnsavedSuggestions.length" class="compact-list">
              <div
                v-for="entry in sessionUnsavedSuggestions"
                :key="entry.clientKey"
                class="compact-row compact-row-transient"
                role="button"
                tabindex="0"
                @click="openSessionSuggestion(entry)"
                @keydown.enter.prevent="openSessionSuggestion(entry)"
                @keydown.space.prevent="openSessionSuggestion(entry)"
              >
                <div class="compact-main">
                  <div class="compact-topline">
                    <span class="compact-game">{{ entry.gameType }}</span>
                    <span class="compact-strategy">{{ formatSessionStrategy(entry) }}</span>
                  </div>
                  <div class="compact-meta">
                    <span>{{ formatSavedDateTime(entry.suggestion.generatedAt) }}</span>
                    <span>{{ entry.suggestion.rows }} rader</span>
                    <span>{{ formatCurrency(entry.suggestion.totalCost) }} kr</span>
                  </div>
                </div>
                <div class="compact-actions">
                  <v-btn
                    variant="text"
                    size="small"
                    color="info"
                    :loading="savingSessionSuggestions"
                    @click.stop="saveSessionSuggestions([entry.clientKey])"
                  >
                    Spara
                  </v-btn>
                </div>
              </div>
            </div>
            <div v-else class="muted">
              Inga osparade förslag ligger kvar i vyn just nu.
            </div>
          </section>

          <section class="page-panel history-panel saved-suggestions-panel">
              <div class="saved-header">
                <div>
                  <div class="saved-title">Historik för tävlingsdagen</div>
                </div>
                <div class="history-actions">
                  <v-btn
                    variant="text"
                    color="error"
                    :disabled="!savedSuggestions.length || deletingSavedSuggestions"
                    :loading="deletingSavedSuggestions"
                    @click="deleteAllSavedSuggestions"
                  >
                    Rensa sparade
                  </v-btn>
                  <v-btn variant="text" color="secondary" :to="{ name: 'SuggestionAnalytics' }">
                    Analysöversikt
                  </v-btn>
                </div>
              </div>

            <div v-if="savedSuggestionsLoading" class="saved-loading">
              <v-skeleton-loader type="list-item-three-line" />
            </div>
            <template v-else>
              <div class="summary-strip">
                <div class="summary-pill summary-pill-total">
                  <span class="summary-pill-label">Totalt</span>
                  <strong>{{ savedSuggestions.length }}</strong>
                </div>
                <div
                  v-for="summary in strategySummaryStrip"
                  :key="summary.key"
                  class="summary-pill"
                >
                  <span class="summary-pill-label">{{ summary.label }}</span>
                  <strong>{{ summary.count }}</strong>
                </div>
                <div class="summary-pill summary-pill-best" v-if="bestSavedSuggestion">
                  <span class="summary-pill-label">Bäst hittills</span>
                  <strong>{{ formatSavedSettlement(bestSavedSuggestion) }}</strong>
                </div>
              </div>

              <div class="browse-controls">
                <v-select
                  v-model="savedStrategyFilter"
                  :items="strategyFilterOptions"
                  item-title="label"
                  item-value="value"
                  label="Strategi"
                  density="comfortable"
                  hide-details
                  variant="underlined"
                />
                <v-select
                  v-model="savedResultFilter"
                  :items="resultFilterOptions"
                  item-title="label"
                  item-value="value"
                  label="Resultat"
                  density="comfortable"
                  hide-details
                  variant="underlined"
                />
                <v-select
                  v-model="savedSort"
                  :items="sortOptions"
                  item-title="label"
                  item-value="value"
                  label="Sortera"
                  density="comfortable"
                  hide-details
                  variant="underlined"
                />
                <v-text-field
                  v-model="savedSearch"
                  label="Sök variant eller mall"
                  density="comfortable"
                  hide-details
                  clearable
                  variant="underlined"
                />
              </div>

              <div v-if="groupedSavedSuggestions.length" class="strategy-groups">
                <section
                  v-for="group in groupedSavedSuggestions"
                  :key="group.key"
                  class="strategy-group"
                >
                  <div class="strategy-group-header">
                    <div>
                      <div class="strategy-group-title">{{ group.label }}</div>
                      <div class="muted">{{ group.items.length }} sparade förslag</div>
                    </div>
                  </div>
                  <div class="compact-list">
                    <router-link
                      v-for="item in group.items"
                      :key="item.id"
                      class="compact-row compact-row-saved"
                      :to="{ name: 'SuggestionDetail', params: { racedayId: route.params.racedayId, suggestionId: item.id } }"
                    >
                      <div class="compact-main">
                        <div class="compact-topline">
                          <span class="compact-game">{{ item.gameType }}</span>
                          <span class="compact-strategy">{{ formatSavedStrategy(item) }}</span>
                        </div>
                        <div class="compact-meta">
                          <span>{{ formatSavedDateTime(item.generatedAt) }}</span>
                          <span>{{ item.rowCount }} rader</span>
                          <span>{{ formatCurrency(item.totalCost) }} kr</span>
                          <span>{{ formatSavedSettlement(item) }}</span>
                        </div>
                      </div>
                      <div class="compact-side">
                        <div class="compact-note">
                          {{ item.settlement?.summary || 'Inväntar resultat' }}
                        </div>
                        <v-btn
                          variant="text"
                          size="small"
                          color="error"
                          :loading="deletingSuggestionId === item.id"
                          @click.prevent.stop="deleteSavedSuggestion(item)"
                        >
                          Ta bort
                        </v-btn>
                      </div>
                    </router-link>
                  </div>
                </section>
              </div>
              <div v-else class="muted">
                Inga sparade förslag matchar filtret just nu.
              </div>
            </template>

            <div v-if="savedSuggestionsMessage" class="history-message">
              {{ savedSuggestionsMessage }}
            </div>
            <div v-if="savedSuggestionsError" class="error-message">
              {{ savedSuggestionsError }}
            </div>
          </section>
        </aside>
      </section>
    </template>

    <div v-else-if="errorMessage" class="page-panel-soft error-panel">
      {{ errorMessage }}
    </div>
  </div>
  <V85SuggestionModal
    :model-value="showV85Modal"
    @update:modelValue="showV85Modal = $event"
    @generated="handleGeneratedSuggestions"
    :raceday-id="route.params.racedayId"
  />
  <V5SuggestionModal
    :model-value="showV5Modal"
    @update:modelValue="showV5Modal = $event"
    @generated="handleGeneratedSuggestions"
    :raceday-id="route.params.racedayId"
  />
  <V86SuggestionModal
    :model-value="showV86Modal"
    @update:modelValue="showV86Modal = $event"
    @generated="handleGeneratedSuggestions"
    :raceday-id="route.params.racedayId"
  />
  <DdSuggestionModal
    :model-value="showDdModal"
    @update:modelValue="showDdModal = $event"
    @generated="handleGeneratedSuggestions"
    :raceday-id="route.params.racedayId"
  />
  <v-dialog
    :model-value="sessionPreviewOpen"
    max-width="960"
    @update:model-value="sessionPreviewOpen = $event"
  >
    <v-card class="session-preview-card" v-if="sessionPreviewEntry">
      <div class="session-preview-hero">
        <div>
          <div class="preview-eyebrow">{{ sessionPreviewEntry.gameType }} · Osparat förslag</div>
          <div class="preview-title">{{ formatSessionStrategy(sessionPreviewEntry) }}</div>
          <div class="preview-meta">
            <span>{{ formatSavedDateTime(sessionPreviewEntry.suggestion.generatedAt) }}</span>
            <span>{{ sessionPreviewEntry.suggestion.rows }} rader</span>
            <span>{{ formatCurrency(sessionPreviewEntry.suggestion.totalCost) }} kr</span>
          </div>
        </div>
        <div class="preview-actions">
          <v-btn
            variant="elevated"
            color="primary"
            :loading="savingSessionSuggestions"
            @click="savePreviewSuggestion"
          >
            Spara detta förslag
          </v-btn>
          <v-btn variant="text" color="secondary" @click="sessionPreviewOpen = false">Stäng</v-btn>
        </div>
      </div>

      <div class="preview-shell">
        <div class="preview-summary">
          <div class="preview-pill">
            <span>Variant</span>
            <strong>{{ sessionPreviewEntry.suggestion.variant?.label || sessionPreviewEntry.suggestion.variant?.strategyLabel || 'Ingen variantetikett' }}</strong>
          </div>
          <div class="preview-pill">
            <span>Insats per rad</span>
            <strong>{{ formatCurrency(sessionPreviewEntry.suggestion.stakePerRow) }} kr</strong>
          </div>
          <div class="preview-pill">
            <span>Budget</span>
            <strong>{{ sessionPreviewBudgetLabel }}</strong>
          </div>
        </div>

        <div class="preview-legs">
          <article
            v-for="leg in sessionPreviewEntry.suggestion.legs"
            :key="`${sessionPreviewEntry.clientKey}-${leg.leg}`"
            class="preview-leg"
          >
            <div class="preview-leg-top">
              <div class="preview-leg-number">Avd {{ leg.leg }}</div>
              <div class="preview-leg-type" :class="previewTypeClass(leg.type)">{{ leg.type || 'Val' }}</div>
            </div>
            <div class="preview-leg-meta">
              <span>Lopp {{ leg.raceNumber }}</span>
              <span v-if="leg.trackName">{{ leg.trackName }}</span>
            </div>
            <div class="preview-selections">
              <span
                v-for="selection in leg.selections"
                :key="`${leg.leg}-${selection.id}`"
                class="preview-selection"
                :class="{ 'preview-selection-user': selection.isUserPick }"
              >
                <span class="preview-selection-number">{{ selection.programNumber || '–' }}</span>
                <span>{{ selection.name }}</span>
              </span>
            </div>
          </article>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import RaceCardComponent from './components/RaceCardComponent.vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import SuggestionService from '@/views/suggestion/services/SuggestionService.js'
import { useRoute } from 'vue-router'
import SpelformBadge from '@/components/SpelformBadge.vue'
import V5SuggestionModal from './components/V5SuggestionModal.vue'
import V85SuggestionModal from './components/V85SuggestionModal.vue'
import V86SuggestionModal from './components/V86SuggestionModal.vue'
import DdSuggestionModal from './components/DdSuggestionModal.vue'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
  components: {
    RaceCardComponent,
    SpelformBadge,
    V5SuggestionModal,
    V85SuggestionModal,
    V86SuggestionModal,
    DdSuggestionModal
  },
  props: {
    racedayId: {
      type: [String, Number],
      default: null
    }
  },
  setup(props) {
    const route = useRoute()

    const applyPlaceholderBreadcrumb = () => {
      const id = route.params.racedayId
      if (id != null) {
        setBreadcrumbLabel('Raceday', `Tävlingsdag ${id}`)
      }
    }
    applyPlaceholderBreadcrumb()

    const racedayDetails = ref(null)
    const errorMessage = ref(null)
    const updatingV5 = ref(false)
    const updatingV85 = ref(false)
    const updatingV86 = ref(false)
    const showV5Modal = ref(false)
    const showV85Modal = ref(false)
    const showV86Modal = ref(false)
    const showDdModal = ref(false)
    const ddGameView = ref(null)
    const v86GameView = ref(null)
    const loading = ref(true)
    const sessionSuggestions = ref([])
    const savingSessionSuggestions = ref(false)
    const sessionSuggestionsMessage = ref('')
    const sessionPreviewOpen = ref(false)
    const sessionPreviewEntry = ref(null)
    const savedSuggestions = ref([])
    const savedSuggestionsLoading = ref(false)
    const savedSuggestionsError = ref('')
    const savedSuggestionsMessage = ref('')
    const savedStrategyFilter = ref('all')
    const savedResultFilter = ref('all')
    const savedSort = ref('latest')
    const savedSearch = ref('')
    const deletingSavedSuggestions = ref(false)
    const deletingSuggestionId = ref('')
    const reactiveRouteParams = computed(() => route.params)
    const spelformer = ref({})
    const v5UpdateMessage = ref('')
    const v85UpdateMessage = ref('')
    const v86UpdateMessage = ref('')
    const selectedPropLanguage = ref('sv')
    const racedayKpis = ref(null)
    const racedayKpisLoading = ref(false)
    const racedayKpisError = ref('')
    const propLanguageOptions = [
      { label: 'Svenska', value: 'sv' },
      { label: 'Finska', value: 'fi' },
      { label: 'Engelska', value: 'en' }
    ]
    const normalizeGameCode = (value) => {
      const upper = String(value || '').toUpperCase()
      return upper === 'DD' ? 'DD' : upper
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
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId, selectedPropLanguage.value)
        await loadRacedayKpis()
        spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
        await loadDdGameView()
        await loadV86GameView()
        await refreshSavedSuggestions()
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Kunde inte hämta tävlingsdagen just nu. Försök igen om en stund.'
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
      const keys = [...new Set(Object.keys(spelformer.value || {}).map(normalizeGameCode))]
      return keys.sort((a,b) => (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b)))
    })

    const refreshRaceday = async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId, selectedPropLanguage.value)
        await loadRacedayKpis()
        spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
        await loadDdGameView()
        await loadV86GameView()
        await refreshSavedSuggestions()
      } catch (error) {
        console.error('Error refreshing raceday details:', error)
      }
    }

    watch(selectedPropLanguage, async () => {
      await refreshRaceday()
    })

    const refreshSavedSuggestions = async () => {
      try {
        savedSuggestionsLoading.value = true
        savedSuggestionsError.value = ''
        savedSuggestionsMessage.value = ''
        const result = await SuggestionService.fetchRacedaySuggestions(route.params.racedayId)
        savedSuggestions.value = Array.isArray(result?.items) ? result.items : []
      } catch (error) {
        console.error('Failed to load saved suggestions', error)
        savedSuggestionsError.value = error?.response?.data?.error || 'Kunde inte hämta sparade spelförslag.'
      } finally {
        savedSuggestionsLoading.value = false
      }
    }

    const loadRacedayKpis = async () => {
      try {
        racedayKpisLoading.value = true
        racedayKpisError.value = ''
        racedayKpis.value = await RacedayService.fetchRacedayKpis(route.params.racedayId)
      } catch (error) {
        console.error('Failed to load raceday KPI profile', error)
        racedayKpis.value = null
        racedayKpisError.value = 'Kunde inte hämta tävlingsdagens KPI-profil.'
      } finally {
        racedayKpisLoading.value = false
      }
    }

    const strategyKeyOf = (mode) => {
      const lower = String(mode || '').toLowerCase()
      if (lower === 'balanced') return 'balanced'
      if (lower === 'value') return 'value'
      if (lower === 'public') return 'public'
      if (lower === 'mix') return 'mix'
      return lower || 'other'
    }

    const strategyLabelOf = (mode) => {
      const key = strategyKeyOf(mode)
      if (key === 'balanced') return 'Balanced'
      if (key === 'value') return 'Value'
      if (key === 'public') return 'Public'
      if (key === 'mix') return 'MIX'
      return mode || 'Övrigt'
    }

    const handleGeneratedSuggestions = (payload) => {
      const gameType = String(payload?.gameType || '')
      const requestSnapshot = payload?.requestSnapshot || {}
      const items = Array.isArray(payload?.suggestions) ? payload.suggestions : []

      sessionSuggestions.value = [
        ...sessionSuggestions.value.filter(entry => entry.gameType !== gameType),
        ...items.map(item => ({
          clientKey: item.clientKey,
          gameType,
          requestSnapshot,
          suggestion: item,
          isSaved: Boolean(item?.isSaved)
        }))
      ]
    }

    const sessionUnsavedSuggestions = computed(() => sessionSuggestions.value.filter(entry => !entry?.isSaved))

    const saveSessionSuggestions = async (clientKeys = null) => {
      const targets = sessionUnsavedSuggestions.value.filter(entry => !Array.isArray(clientKeys) || clientKeys.includes(entry.clientKey))
      if (!targets.length) return

      try {
        savingSessionSuggestions.value = true
        sessionSuggestionsMessage.value = ''
        await SuggestionService.saveSuggestionSelections(route.params.racedayId, targets.map(entry => ({
          clientKey: entry.clientKey,
          gameType: entry.gameType,
          suggestion: entry.suggestion,
          requestSnapshot: entry.requestSnapshot
        })))
        sessionSuggestions.value = sessionSuggestions.value.filter(entry => !targets.some(target => target.clientKey === entry.clientKey))
        if (sessionPreviewEntry.value && targets.some(target => target.clientKey === sessionPreviewEntry.value?.clientKey)) {
          sessionPreviewOpen.value = false
          sessionPreviewEntry.value = null
        }
        sessionSuggestionsMessage.value = targets.length === 1 ? 'Förslaget sparades till historiken.' : `${targets.length} förslag sparades till historiken.`
        await refreshSavedSuggestions()
      } catch (error) {
        console.error('Failed to save session suggestions', error)
        sessionSuggestionsMessage.value = error?.response?.data?.error || 'Kunde inte spara de valda förslagen.'
      } finally {
        savingSessionSuggestions.value = false
      }
    }

    const clearSessionSuggestions = (gameType = null) => {
      sessionSuggestions.value = sessionSuggestions.value.filter(entry => entry.isSaved || (gameType && entry.gameType !== gameType))
      if (sessionPreviewEntry.value && !sessionSuggestions.value.some(entry => entry.clientKey === sessionPreviewEntry.value?.clientKey)) {
        sessionPreviewOpen.value = false
        sessionPreviewEntry.value = null
      }
      sessionSuggestionsMessage.value = 'Osparade förslag togs bort från sessionvyn.'
    }

    const openSessionSuggestion = (entry) => {
      if (!entry?.suggestion) return
      sessionPreviewEntry.value = entry
      sessionPreviewOpen.value = true
    }

    const savePreviewSuggestion = async () => {
      if (!sessionPreviewEntry.value?.clientKey) return
      await saveSessionSuggestions([sessionPreviewEntry.value.clientKey])
    }

    const confirmDelete = (message) => {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        return window.confirm(message)
      }
      return true
    }

    const deleteSavedSuggestion = async (item) => {
      if (!item?.id) return
      if (!confirmDelete('Ta bort det sparade förslaget från historiken?')) return

      try {
        deletingSuggestionId.value = item.id
        savedSuggestionsError.value = ''
        savedSuggestionsMessage.value = ''
        await SuggestionService.deleteSuggestion(item.id)
        savedSuggestions.value = savedSuggestions.value.filter(entry => entry.id !== item.id)
        savedSuggestionsMessage.value = 'Förslaget togs bort från historiken.'
      } catch (error) {
        console.error('Failed to delete saved suggestion', error)
        savedSuggestionsError.value = error?.response?.data?.error || 'Kunde inte ta bort spelförslaget.'
      } finally {
        deletingSuggestionId.value = ''
      }
    }

    const deleteAllSavedSuggestions = async () => {
      if (!savedSuggestions.value.length) return
      if (!confirmDelete('Ta bort alla sparade förslag för den här tävlingsdagen?')) return

      try {
        deletingSavedSuggestions.value = true
        savedSuggestionsError.value = ''
        savedSuggestionsMessage.value = ''
        const result = await SuggestionService.deleteRacedaySuggestions(route.params.racedayId)
        savedSuggestions.value = []
        const deletedCount = Number(result?.deletedCount || 0)
        savedSuggestionsMessage.value = deletedCount > 0
          ? `${deletedCount} sparade förslag togs bort.`
          : 'Det fanns inga sparade förslag att ta bort.'
      } catch (error) {
        console.error('Failed to delete raceday suggestions', error)
        savedSuggestionsError.value = error?.response?.data?.error || 'Kunde inte rensa sparade spelförslag.'
      } finally {
        deletingSavedSuggestions.value = false
      }
    }

    const formatSessionStrategy = (entry) => {
      const strategy = entry?.suggestion?.modeLabel || entry?.suggestion?.mode || ''
      const variant = entry?.suggestion?.variant?.label || entry?.suggestion?.variant?.strategyLabel || ''
      return [strategyLabelOf(strategy), variant].filter(Boolean).join(' · ')
    }

    const loadV86GameView = async () => {
      try {
        v86GameView.value = await RacedayService.fetchV86GameView(route.params.racedayId)
      } catch (error) {
        console.error('Failed to load V86 game view', error)
        v86GameView.value = null
      }
    }

    const loadDdGameView = async () => {
      try {
        ddGameView.value = await RacedayService.fetchDdGameView(route.params.racedayId)
      } catch (error) {
        console.error('Failed to load DD game view', error)
        ddGameView.value = null
      }
    }

    const formatDateTime = (value) => {
      try {
        return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
      } catch (e) {
        return ''
      }
    }

    const v5UpdatedLabel = computed(() => {
      const ts = racedayDetails.value?.v5Info?.updatedAt
      if (!ts) return ''
      return `V5% uppdaterad ${formatDateTime(ts)}`
    })

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
    const hasV5 = computed(() => Array.isArray(spelformer.value?.V5) && spelformer.value.V5.length > 0)
    const hasV86 = computed(() => {
      if (Array.isArray(spelformer.value?.V86) && spelformer.value.V86.length > 0) return true
      return v86GameView.value?.status === 'ok'
    })
    const hasDD = computed(() => {
      if (Array.isArray(spelformer.value?.DD) && spelformer.value.DD.length > 0) return true
      if (Array.isArray(spelformer.value?.dd) && spelformer.value.dd.length > 0) return true
      return ddGameView.value?.status === 'ok'
    })

    const ddStatusLabel = computed(() => {
      if (ddGameView.value?.status === 'ok' && ddGameView.value?.gameId) {
        return `DD-omgång ${ddGameView.value.gameId}`
      }
      return 'DD-omgången hämtas när förslaget öppnas'
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

    const sortedRaceList = computed(() => {
      const races = Array.isArray(racedayDetails.value?.raceList) ? [...racedayDetails.value.raceList] : []
      return races.sort((a, b) => a.raceNumber - b.raceNumber)
    })

    const totalRaces = computed(() => sortedRaceList.value.length)
    const racedayDateLabel = computed(() => {
      const value = racedayDetails.value?.raceDayDate || racedayDetails.value?.firstStart
      return value ? formatBreadcrumbDate(value) : 'Okänt datum'
    })
    const formattedFirstStart = computed(() => {
      const ts = racedayDetails.value?.firstStart
      return ts ? `Start ${formatTimeShort(ts)}` : ''
    })
    const settledSuggestionCount = computed(() => savedSuggestions.value.filter(item => item?.settlement?.resultsAvailable).length)

    const getRaceGames = raceId => {
      const res = []
      const raceKey = String(raceId)
      const v86Leg = v86LegByRaceId.value.get(raceKey)
      if (Number.isFinite(v86Leg)) {
        res.push({ game: 'V86', leg: v86Leg })
      }
      for (const [game, ids] of Object.entries(spelformer.value)) {
        const normalizedGame = normalizeGameCode(game)
        if (normalizedGame === 'V86') continue
        const idx = ids.findIndex(id => String(id) === raceKey)
        if (idx !== -1) res.push({ game: normalizedGame, leg: idx + 1 })
      }
      return res
    }

    const updateV5 = async () => {
      try {
        if (!hasV5.value) return
        updatingV5.value = true
        v5UpdateMessage.value = ''
        await RacedayService.updateV5Distribution(route.params.racedayId)
        await refreshRaceday()
        v5UpdateMessage.value = v5UpdatedLabel.value || 'V5% uppdaterad.'
      } catch (error) {
        console.error('Failed to update V5%', error)
        v5UpdateMessage.value = error?.error || 'Misslyckades att uppdatera V5%'
      } finally {
        updatingV5.value = false
      }
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

    const profileKpis = computed(() => {
      const preferred = [
        'classIndex',
        'formTemperature',
        'competitiveness',
        'singleCandidateCount',
        'upsetRisk',
        'fieldSize',
        'driverStrength',
        'driverChangeCount',
        'shoeChangeRate',
        'withdrawnCount',
        'dominantDistance',
        'ratingCoverage'
      ]
      const items = Array.isArray(racedayKpis.value?.kpis) ? racedayKpis.value.kpis : []
      const byKey = new Map(items.map((item) => [item.key, item]))
      return preferred.map((key) => byKey.get(key)).filter(Boolean)
    })

    const formatKpiValue = (kpi) => {
      const value = Number(kpi?.value)
      if (!Number.isFinite(value)) return '–'
      if (String(kpi?.unit || '').includes('%')) {
        return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} %`
      }
      return value.toLocaleString('sv-SE', {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 1
      })
    }

    const formatKpiUnit = (kpi) => {
      return String(kpi?.unit || '') === '%' ? 'andel' : kpi?.unit
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
        strategyLabelOf(item?.strategy?.modeLabel || item?.strategy?.mode),
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

    const strategyFilterOptions = computed(() => ([
      { label: 'Alla strategier', value: 'all' },
      { label: 'Balanced', value: 'balanced' },
      { label: 'Value', value: 'value' },
      { label: 'Public', value: 'public' },
      { label: 'MIX', value: 'mix' }
    ]))

    const resultFilterOptions = [
      { label: 'Alla resultat', value: 'all' },
      { label: 'Inväntar', value: 'waiting' },
      { label: 'Avgjorda', value: 'settled' }
    ]

    const sortOptions = [
      { label: 'Senaste först', value: 'latest' },
      { label: 'Bästa resultat först', value: 'best' },
      { label: 'Lägst kostnad', value: 'lowestCost' },
      { label: 'Högst kostnad', value: 'highestCost' }
    ]

    const strategySummaryStrip = computed(() => {
      const counts = new Map([['balanced', 0], ['value', 0], ['public', 0], ['mix', 0]])
      for (const item of savedSuggestions.value) {
        const key = strategyKeyOf(item?.strategy?.mode || item?.strategy?.modeLabel)
        if (counts.has(key)) {
          counts.set(key, Number(counts.get(key)) + 1)
        }
      }
      return [...counts.entries()].map(([key, count]) => ({
        key,
        label: strategyLabelOf(key),
        count
      }))
    })

    const bestSavedSuggestion = computed(() => {
      const settled = savedSuggestions.value.filter(item => item?.settlement?.resultsAvailable)
      return [...settled].sort((a, b) => {
        const diff = Number(b?.settlement?.correctLegs || 0) - Number(a?.settlement?.correctLegs || 0)
        if (diff !== 0) return diff
        return Number(a?.totalCost || 0) - Number(b?.totalCost || 0)
      })[0] || null
    })

    const filteredSavedSuggestions = computed(() => {
      const query = String(savedSearch.value || '').trim().toLowerCase()
      const items = savedSuggestions.value.filter((item) => {
        const strategyKey = strategyKeyOf(item?.strategy?.mode || item?.strategy?.modeLabel)
        if (savedStrategyFilter.value !== 'all' && strategyKey !== savedStrategyFilter.value) {
          return false
        }
        if (savedResultFilter.value === 'waiting' && item?.settlement?.resultsAvailable) {
          return false
        }
        if (savedResultFilter.value === 'settled' && !item?.settlement?.resultsAvailable) {
          return false
        }
        if (!query) return true
        const haystack = [
          item?.strategy?.variantLabel,
          item?.strategy?.variantStrategyLabel,
          item?.template?.label,
          item?.template?.key,
          item?.strategy?.modeLabel,
          item?.strategy?.mode
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(query)
      })

      const sorted = [...items]
      if (savedSort.value === 'best') {
        sorted.sort((a, b) => {
          const aResolved = Boolean(a?.settlement?.resultsAvailable)
          const bResolved = Boolean(b?.settlement?.resultsAvailable)
          if (aResolved !== bResolved) return Number(bResolved) - Number(aResolved)
          const diff = Number(b?.settlement?.correctLegs || 0) - Number(a?.settlement?.correctLegs || 0)
          if (diff !== 0) return diff
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        })
      } else if (savedSort.value === 'lowestCost') {
        sorted.sort((a, b) => Number(a?.totalCost || 0) - Number(b?.totalCost || 0))
      } else if (savedSort.value === 'highestCost') {
        sorted.sort((a, b) => Number(b?.totalCost || 0) - Number(a?.totalCost || 0))
      } else {
        sorted.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      }
      return sorted
    })

    const groupedSavedSuggestions = computed(() => {
      const groups = new Map()
      for (const item of filteredSavedSuggestions.value) {
        const key = strategyKeyOf(item?.strategy?.mode || item?.strategy?.modeLabel)
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: strategyLabelOf(item?.strategy?.modeLabel || item?.strategy?.mode),
            items: []
          })
        }
        groups.get(key).items.push(item)
      }
      return [...groups.values()]
    })

    const sessionPreviewBudgetLabel = computed(() => {
      const budget = sessionPreviewEntry.value?.suggestion?.budget || {}
      if (budget?.maxCost != null) {
        return `${formatCurrency(budget.maxCost)} kr max`
      }
      return 'Ingen gräns'
    })

    const previewTypeClass = (value) => {
      const lower = String(value || '').toLowerCase()
      if (lower.includes('spik')) return 'preview-leg-type-spik'
      if (lower.includes('lås') || lower.includes('las')) return 'preview-leg-type-lock'
      return 'preview-leg-type-guard'
    }

    return {
      racedayDetails,
      errorMessage,
      sortedRaceList,
      reactiveRouteParams,
      spelformer,
      getRaceGames,
      refreshRaceday,
      hasV85,
      hasV5,
      hasV86,
      hasDD,
      updateV5,
      updateV85,
      updateV86,
      racedayGames,
      loading,
      totalRaces,
      racedayDateLabel,
      formattedFirstStart,
      settledSuggestionCount,
      showV5Modal,
      showV85Modal,
      showV86Modal,
      showDdModal,
      route,
      updatingV5,
      updatingV85,
      updatingV86,
      v5UpdatedLabel,
      v5UpdateMessage,
      v85UpdatedLabel,
      v85UpdateMessage,
      v86UpdatedLabel,
      v86UpdateMessage,
      selectedPropLanguage,
      propLanguageOptions,
      racedayKpis,
      racedayKpisLoading,
      racedayKpisError,
      profileKpis,
      formatKpiValue,
      formatKpiUnit,
      ddStatusLabel,
      handleGeneratedSuggestions,
      sessionUnsavedSuggestions,
      sessionPreviewOpen,
      sessionPreviewEntry,
      saveSessionSuggestions,
      savingSessionSuggestions,
      clearSessionSuggestions,
      openSessionSuggestion,
      savePreviewSuggestion,
      sessionPreviewBudgetLabel,
      previewTypeClass,
      sessionSuggestionsMessage,
      formatSessionStrategy,
      savedSuggestions,
      savedSuggestionsLoading,
      savedSuggestionsError,
      savedSuggestionsMessage,
      refreshSavedSuggestions,
      deleteSavedSuggestion,
      deleteAllSavedSuggestions,
      deletingSavedSuggestions,
      deletingSuggestionId,
      formatDateTime,
      formatSavedDateTime,
      formatCurrency,
      formatSavedStrategy,
      formatSavedSettlement,
      savedStrategyFilter,
      savedResultFilter,
      savedSort,
      savedSearch,
      strategyFilterOptions,
      resultFilterOptions,
      sortOptions,
      strategySummaryStrip,
      bestSavedSuggestion,
      groupedSavedSuggestions
    }
  }
}
</script>

<style scoped>
.raceday-page {
  display: grid;
  gap: 20px;
}

.loading-wrap,
.error-panel {
  padding: 24px;
}

.muted {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.raceday-hero {
  padding: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.95fr);
  gap: 22px;
  align-items: start;
}

.hero-copy {
  display: grid;
  gap: 14px;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hero-metric-card {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  gap: 8px;
}

.hero-metric-card-wide {
  grid-column: 1 / -1;
  background:
    radial-gradient(circle at top right, rgba(245, 201, 121, 0.14), transparent 42%),
    rgba(255, 255, 255, 0.04);
}

.hero-metric-value {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  line-height: 1;
  color: var(--text-strong);
  font-weight: 800;
}

.hero-metric-label,
.hero-metric-text {
  color: var(--text-muted);
}

.raceday-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.38fr) minmax(320px, 0.82fr);
  gap: 18px;
  align-items: start;
}

.raceday-main,
.raceday-rail {
  min-width: 0;
}

.raceday-rail {
  display: grid;
  gap: 16px;
}

.race-stage,
.raceday-profile-panel,
.game-panel,
.session-panel,
.history-panel {
  padding: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.section-head.compact {
  margin-bottom: 14px;
}

.section-title {
  margin: 6px 0 0;
  font-size: 1.42rem;
}

.section-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.race-list {
  display: grid;
  gap: 14px;
}

.raceday-profile-panel {
  display: grid;
  gap: 16px;
}

.profile-loading {
  min-height: 130px;
}

.profile-narrative {
  margin: 0;
  max-width: 980px;
  color: var(--text-body);
  font-size: 1.02rem;
  line-height: 1.65;
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 211, 159, 0.12);
  border: 1px solid rgba(56, 211, 159, 0.18);
  color: #9ff4d5;
  font-size: 0.84rem;
  font-weight: 700;
}

.profile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.profile-kpi-card {
  min-height: 112px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.035);
  display: grid;
  align-content: space-between;
  gap: 8px;
}

.profile-kpi-card span {
  color: var(--text-soft);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.profile-kpi-card strong {
  color: var(--text-strong);
  font-size: 1.5rem;
  line-height: 1;
}

.profile-kpi-card small {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.game-stack {
  display: grid;
  gap: 12px;
}

.game-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at top right, rgba(89, 212, 255, 0.12), transparent 34%),
    rgba(255, 255, 255, 0.04);
  display: grid;
  gap: 14px;
}

.game-card-top,
.saved-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.game-card-title,
.saved-title {
  color: var(--text-strong);
  font-size: 1rem;
  font-weight: 700;
}

.game-card-status,
.game-card-message,
.session-message,
.history-message,
.error-message,
.empty-rail-message {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.history-actions,
.games,
.session-actions,
.game-card-actions,
.compact-actions,
.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.summary-pill {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.summary-pill-label {
  color: var(--text-soft);
  font-size: 0.83rem;
}

.summary-pill strong {
  color: var(--text-strong);
}

.summary-pill-best {
  background: rgba(56, 211, 159, 0.14);
  border-color: rgba(56, 211, 159, 0.22);
}

.browse-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.strategy-groups,
.compact-list {
  display: grid;
  gap: 10px;
}

.strategy-group {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.strategy-group-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.strategy-group-title {
  color: var(--text-strong);
  font-size: 0.98rem;
  font-weight: 700;
}

.compact-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.035);
  color: inherit;
  text-decoration: none;
}

.compact-row-transient {
  cursor: pointer;
}

.compact-row:hover,
.compact-row:focus-within {
  border-color: rgba(125, 211, 252, 0.26);
  background: rgba(255, 255, 255, 0.05);
}

.compact-main {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.compact-topline,
.compact-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.compact-game {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--focus-cyan);
}

.compact-strategy {
  color: var(--text-strong);
  font-weight: 700;
}

.compact-meta,
.compact-note {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.compact-note {
  max-width: 260px;
  text-align: right;
}

.compact-side {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.session-preview-card {
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(89, 212, 255, 0.16), transparent 30%),
    linear-gradient(180deg, rgba(10, 15, 28, 0.99), rgba(15, 23, 42, 0.99));
  color: var(--text-body);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.session-preview-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 12px;
  flex-wrap: wrap;
}

.preview-eyebrow {
  color: var(--focus-cyan);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-title {
  margin-top: 6px;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-strong);
}

.preview-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-muted);
  margin-top: 6px;
}

.preview-shell {
  padding: 0 22px 22px;
  display: grid;
  gap: 14px;
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.preview-pill {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.preview-pill span {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-soft);
}

.preview-pill strong,
.preview-leg-number {
  color: var(--text-strong);
}

.preview-legs {
  display: grid;
  gap: 10px;
}

.preview-leg {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.035);
}

.preview-leg-top,
.preview-leg-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-leg-type {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.preview-leg-type-spik {
  background: rgba(89, 212, 255, 0.16);
  color: #aeefff;
}

.preview-leg-type-lock {
  background: rgba(245, 201, 121, 0.16);
  color: #fee5b6;
}

.preview-leg-type-guard {
  background: rgba(148, 163, 184, 0.16);
  color: var(--text-body);
}

.preview-leg-meta {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.preview-selections {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preview-selection {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-body);
}

.preview-selection-user {
  border: 1px solid rgba(125, 211, 252, 0.24);
  background: rgba(89, 212, 255, 0.14);
}

.preview-selection-number {
  font-weight: 700;
}

:deep(.browse-controls .v-field) {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px 12px 0 0;
}

:deep(.browse-controls .v-field__input),
:deep(.browse-controls .v-label),
:deep(.browse-controls input) {
  color: var(--text-body) !important;
}

@media (max-width: 1180px) {
  .raceday-hero,
  .raceday-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-metrics,
  .preview-summary,
  .compact-row {
    grid-template-columns: 1fr;
  }

  .compact-note {
    text-align: left;
    max-width: none;
  }

  .compact-side {
    justify-items: start;
  }
}

@media (max-width: 720px) {
  .raceday-hero,
  .race-stage,
  .raceday-profile-panel,
  .game-panel,
  .session-panel,
  .history-panel,
  .loading-wrap,
  .error-panel {
    padding: 18px;
  }

  .section-title {
    font-size: 1.22rem;
  }
}
</style>
