<template>
  <v-container class="detail-page">
    <div v-if="loading" class="loading-wrap">
      <v-skeleton-loader type="heading, text, article" />
    </div>

    <div v-else-if="item" class="detail-shell">
      <section class="hero-band">
        <div class="hero-main">
          <div class="eyebrow">{{ item.gameType }} · Sparad biljett</div>
          <h1 class="hero-title">{{ strategyLabel }}</h1>
          <div class="hero-meta">
            <span>{{ generatedLabel }}</span>
            <span class="dot">•</span>
            <span>{{ item.trackName }} {{ item.raceDayDate }}</span>
            <span class="dot">•</span>
            <span>{{ item.template?.label || item.template?.key || 'Mall saknas' }}</span>
          </div>
        </div>

        <div class="hero-actions">
          <v-btn
            variant="elevated"
            color="primary"
            :loading="refreshingResults"
            @click="refreshResults"
          >
            Uppdatera resultat
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            :to="{ name: 'Raceday', params: { racedayId: item.racedayObjectId } }"
          >
            Till tävlingsdagen
          </v-btn>
          <v-btn
            variant="text"
            color="secondary"
            :to="{ name: 'SuggestionAnalytics' }"
          >
            Analys
          </v-btn>
          <v-btn
            variant="text"
            color="error"
            :loading="deletingSuggestion"
            @click="deleteCurrentSuggestion"
          >
            Ta bort förslag
          </v-btn>
        </div>

        <div class="hero-summary">
          <div class="hero-pill hero-pill-result">
            <span class="hero-pill-label">Resultat</span>
            <strong>{{ settlementLabel }}</strong>
          </div>
          <div class="hero-pill">
            <span class="hero-pill-label">Kostnad</span>
            <strong>{{ formatCurrency(item.totalCost) }} kr</strong>
          </div>
          <div class="hero-pill">
            <span class="hero-pill-label">Spikar</span>
            <strong>{{ spikeRateLabel }}</strong>
          </div>
          <div class="hero-pill hero-pill-note">
            <span class="hero-pill-label">Snabbnotis</span>
            <strong>{{ missSummary }}</strong>
          </div>
        </div>
        <div v-if="refreshMessage" class="hero-message">{{ refreshMessage }}</div>
      </section>

      <div class="detail-layout">
        <section class="ticket-panel">
          <div class="section-bar">
            <div>
              <div class="section-title">Biljett</div>
            </div>
            <div class="ticket-nav">
              <router-link
                v-if="previousSuggestion"
                class="nav-link"
                :to="{ name: 'SuggestionDetail', params: { racedayId: previousSuggestion.racedayObjectId, suggestionId: previousSuggestion.id } }"
              >
                Nyare
              </router-link>
              <router-link
                v-if="nextSuggestion"
                class="nav-link"
                :to="{ name: 'SuggestionDetail', params: { racedayId: nextSuggestion.racedayObjectId, suggestionId: nextSuggestion.id } }"
              >
                Äldre
              </router-link>
            </div>
          </div>

          <div class="leg-grid">
            <article
              v-for="leg in legsWithSettlement"
              :key="leg.leg"
              class="leg-card"
              :class="leg.cardClass"
            >
              <div class="leg-head">
                <div class="leg-head-left">
                  <div class="leg-index">Avd {{ leg.leg }}</div>
                  <div class="leg-meta">
                    <span v-if="leg.raceNumber">Lopp {{ leg.raceNumber }}</span>
                    <span class="leg-type" :class="leg.typeClass">{{ leg.type || 'Okänd typ' }}</span>
                  </div>
                </div>
                <div class="leg-status" :class="leg.statusClass">{{ leg.statusLabel }}</div>
              </div>

              <div class="winner-band" v-if="leg.winner">
                <span class="winner-tag">Vinnare</span>
                <span class="winner-name">
                  {{ leg.winner.horseName }}
                  <span v-if="leg.winner.startPosition">({{ leg.winner.startPosition }})</span>
                </span>
              </div>
              <div class="winner-band winner-band-pending" v-else>
                Inväntar resultat för avdelningen.
              </div>

              <div class="selection-grid">
                <span
                  v-for="selection in leg.selections"
                  :key="`${leg.leg}-${selection.id}-${selection.programNumber}`"
                  class="selection-chip"
                  :class="selection.className"
                >
                  <span class="selection-number">{{ selection.programNumber || '–' }}</span>
                  <span class="selection-name">{{ selection.name }}</span>
                </span>
              </div>

              <div class="leg-foot">
                <router-link
                  v-if="leg.raceId && leg.raceDayId"
                  class="race-link"
                  :to="{ name: 'RacedayRace', params: { racedayId: leg.raceDayId, raceId: leg.raceId } }"
                >
                  Öppna lopp
                </router-link>
                <span v-if="leg.aiTopName" class="muted">AI-topp: {{ leg.aiTopName }}</span>
              </div>
            </article>
          </div>
        </section>

        <aside class="side-panel">
          <div class="section-bar section-bar-side">
            <div>
              <div class="section-title">Samma tävlingsdag</div>
            </div>
          </div>

          <div class="related-list" v-if="sameDaySuggestions.length">
            <router-link
              v-for="relatedItem in sameDaySuggestions"
              :key="relatedItem.id"
              class="related-row"
              :class="{ active: relatedItem.id === item.id }"
              :to="{ name: 'SuggestionDetail', params: { racedayId: relatedItem.racedayObjectId, suggestionId: relatedItem.id } }"
            >
              <div class="related-topline">
                <span class="related-game">{{ relatedItem.gameType }}</span>
                <span class="related-time">{{ formatDateTime(relatedItem.generatedAt) }}</span>
              </div>
              <div class="related-title">{{ formatRelatedStrategy(relatedItem) }}</div>
              <div class="related-meta">
                <span>{{ relatedItem.rowCount }} rader</span>
                <span>{{ formatCurrency(relatedItem.totalCost) }} kr</span>
                <span>{{ formatSavedSettlement(relatedItem) }}</span>
              </div>
              <div class="related-note">{{ relatedItem.settlement?.summary || 'Inväntar resultat' }}</div>
            </router-link>
          </div>
          <div v-else class="muted">Inga andra sparade biljetter för dagen.</div>
        </aside>
      </div>
    </div>

    <div v-else class="error-state">
      {{ errorMessage }}
    </div>
  </v-container>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SuggestionService from './services/SuggestionService.js'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
  name: 'SuggestionDetailView',
  props: {
    suggestionId: {
      type: String,
      required: true
    }
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(true)
    const item = ref(null)
    const related = ref([])
    const errorMessage = ref('')
    const refreshingResults = ref(false)
    const refreshMessage = ref('')
    const deletingSuggestion = ref(false)

    const formatCurrency = (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return '0'
      return new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(numeric)
    }

    const formatDateTime = (value) => {
      if (!value) return ''
      return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value))
    }

    const strategyLabelOf = (mode) => {
      const lower = String(mode || '').toLowerCase()
      if (lower === 'balanced') return 'Balanced'
      if (lower === 'value') return 'Value'
      if (lower === 'public') return 'Public'
      if (lower === 'mix') return 'MIX'
      return mode || 'Övrigt'
    }

    const applyDetailPayload = (detail) => {
      item.value = detail?.item || null
      related.value = Array.isArray(detail?.related) ? detail.related : []
    }

    const load = async () => {
      try {
        loading.value = true
        errorMessage.value = ''
        refreshMessage.value = ''
        const detail = await SuggestionService.fetchSuggestionDetail(route.params.suggestionId)
        applyDetailPayload(detail)
      } catch (error) {
        console.error('Failed to load suggestion detail', error)
        errorMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte hämta det sparade spelförslaget.'
      } finally {
        loading.value = false
      }
    }

    const refreshResults = async () => {
      if (!route.params.suggestionId) return

      try {
        refreshingResults.value = true
        refreshMessage.value = ''
        const detail = await SuggestionService.refreshSuggestionResults(route.params.suggestionId)
        applyDetailPayload(detail)
        refreshMessage.value = item.value?.settlement?.resultsAvailable
          ? 'Resultatet uppdaterades från källorna och settlement kördes om.'
          : 'Källorna uppdaterades, men hela resultatet är ännu inte tillgängligt.'
      } catch (error) {
        console.error('Failed to refresh suggestion results', error)
        refreshMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte uppdatera resultatet från källorna.'
      } finally {
        refreshingResults.value = false
      }
    }

    const confirmDelete = (message) => {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        return window.confirm(message)
      }
      return true
    }

    const deleteCurrentSuggestion = async () => {
      if (!item.value?.id) return
      if (!confirmDelete('Ta bort det här sparade förslaget?')) return

      try {
        deletingSuggestion.value = true
        refreshMessage.value = ''
        await SuggestionService.deleteSuggestion(item.value.id)
        await router.push({ name: 'Raceday', params: { racedayId: item.value.racedayObjectId } })
      } catch (error) {
        console.error('Failed to delete suggestion', error)
        refreshMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte ta bort spelförslaget.'
      } finally {
        deletingSuggestion.value = false
      }
    }

    onMounted(load)
    watch(() => route.params.suggestionId, load)

    const strategyLabel = computed(() => {
      const strategy = item.value?.strategy || {}
      const parts = [
        strategyLabelOf(strategy.modeLabel || strategy.mode),
        strategy.variantLabel || strategy.variantStrategyLabel
      ].filter(Boolean)
      return parts.join(' · ') || 'Sparat spelförslag'
    })

    watch(
      () => strategyLabel.value,
      (value) => {
        setBreadcrumbLabel('SuggestionDetail', value || 'Spelförslag')
      },
      { immediate: true }
    )

    const settlementLabel = computed(() => {
      const totalLegs = Number(item.value?.settlement?.totalLegs || item.value?.ticket?.legs?.length || 0)
      const correctLegs = Number(item.value?.settlement?.correctLegs || 0)
      if (!item.value?.settlement?.resultsAvailable) return 'Inväntar resultat'
      return `${correctLegs}/${totalLegs} rätt`
    })

    const generatedLabel = computed(() => formatDateTime(item.value?.generatedAt))

    const spikeRateLabel = computed(() => {
      const stats = item.value?.settlement?.spikeStats || {}
      if (!Number(stats.total)) return 'Inga spikar'
      return `${stats.hits}/${stats.total} spikar satt`
    })

    const missSummary = computed(() => item.value?.settlement?.summary || 'Inväntar resultat')

    const settlementByLeg = computed(() => {
      const map = new Map()
      for (const leg of item.value?.settlement?.legs || []) {
        map.set(Number(leg?.leg), leg)
      }
      return map
    })

    const legsWithSettlement = computed(() => {
      return (item.value?.ticket?.legs || []).map((leg) => {
        const settlement = settlementByLeg.value.get(Number(leg?.leg)) || {}
        const winnerId = Number(settlement?.winner?.horseId)
        const selections = (leg?.selections || []).map((selection) => {
          const selectionId = Number(selection?.id)
          const isWinner = Number.isFinite(winnerId) && selectionId === winnerId
          const isSelectedWinner = Boolean(settlement?.isHit && isWinner)
          return {
            ...selection,
            className: isSelectedWinner
              ? 'is-hit'
              : (isWinner ? 'is-winning-miss' : '')
          }
        })

        const resolved = Boolean(settlement?.isResolved)
        const isHit = Boolean(settlement?.isHit)
        const typeLower = String(leg?.type || '').toLowerCase()

        return {
          ...leg,
          ...settlement,
          selections,
          aiTopName: (leg?.aiSelections || [])[0]?.name || '',
          statusLabel: !resolved ? 'Inväntar' : (isHit ? 'Träff' : 'Miss'),
          statusClass: !resolved ? 'is-pending' : (isHit ? 'is-hit' : 'is-miss'),
          cardClass: !resolved ? 'card-pending' : (isHit ? 'card-hit' : 'card-miss'),
          typeClass: typeLower.includes('spik')
            ? 'type-spik'
            : (typeLower.includes('lås') ? 'type-lock' : 'type-guard')
        }
      })
    })

    const currentIndex = computed(() => related.value.findIndex(relatedItem => relatedItem.id === item.value?.id))
    const previousSuggestion = computed(() => {
      const index = currentIndex.value
      return index > 0 ? related.value[index - 1] : null
    })
    const nextSuggestion = computed(() => {
      const index = currentIndex.value
      return index >= 0 && index < related.value.length - 1 ? related.value[index + 1] : null
    })

    const sameDaySuggestions = computed(() => related.value)

    const formatSavedSettlement = (savedItem) => {
      const totalLegs = Number(savedItem?.settlement?.totalLegs || 0)
      const correctLegs = Number(savedItem?.settlement?.correctLegs || 0)
      if (!savedItem?.settlement?.resultsAvailable) return 'Inväntar resultat'
      return `${correctLegs}/${totalLegs} rätt`
    }

    const formatRelatedStrategy = (savedItem) => {
      const parts = [
        strategyLabelOf(savedItem?.strategy?.modeLabel || savedItem?.strategy?.mode),
        savedItem?.strategy?.variantLabel || savedItem?.strategy?.variantStrategyLabel
      ].filter(Boolean)
      return parts.join(' · ') || 'Okänd strategi'
    }

    return {
      loading,
      item,
      related,
      errorMessage,
      refreshingResults,
      deletingSuggestion,
      refreshMessage,
      refreshResults,
      deleteCurrentSuggestion,
      formatCurrency,
      formatDateTime,
      strategyLabel,
      settlementLabel,
      generatedLabel,
      spikeRateLabel,
      missSummary,
      legsWithSettlement,
      previousSuggestion,
      nextSuggestion,
      sameDaySuggestions,
      formatRelatedStrategy,
      formatSavedSettlement
    }
  }
}
</script>

<style scoped>
.detail-page {
  padding-top: 70px;
}
.loading-wrap {
  padding-top: 24px;
}
.detail-shell {
  display: grid;
  gap: 18px;
}
.hero-band,
.ticket-panel,
.side-panel {
  border-radius: 22px;
  border: 1px solid rgba(148,163,184,0.14);
  background:
    radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 35%),
    linear-gradient(180deg, rgba(10,15,28,0.98), rgba(15,23,42,0.98));
  color: #e5eefc;
  box-shadow: 0 20px 40px rgba(2,6,23,0.28);
}
.hero-band {
  padding: 20px;
}
.hero-main {
  display: grid;
  gap: 6px;
}
.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7dd3fc;
}
.hero-title {
  margin: 0;
  font-size: 1.9rem;
  line-height: 1.05;
}
.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #94a3b8;
}
.dot {
  color: #64748b;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.hero-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.hero-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(125,211,252,0.18);
  background: rgba(15,23,42,0.52);
  color: #cbd5e1;
}
.hero-pill {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15,23,42,0.52);
  border: 1px solid rgba(148,163,184,0.12);
  display: grid;
  gap: 6px;
}
.hero-pill-label {
  color: #94a3b8;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hero-pill strong {
  color: #f8fafc;
  font-size: 1.02rem;
}
.hero-pill-result {
  border-color: rgba(59,130,246,0.24);
}
.hero-pill-note {
  border-color: rgba(16,185,129,0.22);
}
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 18px;
}
.ticket-panel,
.side-panel {
  padding: 18px;
}
.section-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}
.section-title {
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #cbd5f5;
}
.section-subtitle {
  color: #94a3b8;
  margin-top: 4px;
}
.ticket-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.nav-link,
.race-link {
  color: #7dd3fc;
  text-decoration: none;
  font-weight: 700;
}
.leg-grid,
.related-list {
  display: grid;
  gap: 10px;
}
.leg-card {
  border-radius: 16px;
  padding: 14px;
  border: 1px solid rgba(148,163,184,0.12);
  background: rgba(15,23,42,0.46);
}
.card-hit { border-color: rgba(16,185,129,0.28); }
.card-miss { border-color: rgba(248,113,113,0.24); }
.card-pending { border-color: rgba(96,165,250,0.2); }
.leg-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.leg-index {
  font-weight: 700;
  font-size: 1rem;
  color: #f8fafc;
}
.leg-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 0.88rem;
}
.leg-type {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.78rem;
  font-weight: 700;
}
.type-spik {
  background: rgba(14,165,233,0.14);
  color: #7dd3fc;
}
.type-lock {
  background: rgba(250,204,21,0.14);
  color: #fde68a;
}
.type-guard {
  background: rgba(148,163,184,0.14);
  color: #dbeafe;
}
.leg-status {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 700;
}
.leg-status.is-hit {
  background: rgba(16,185,129,0.16);
  color: #bbf7d0;
}
.leg-status.is-miss {
  background: rgba(248,113,113,0.16);
  color: #fecaca;
}
.leg-status.is-pending {
  background: rgba(96,165,250,0.16);
  color: #bfdbfe;
}
.winner-band {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: #e5eefc;
}
.winner-band-pending {
  color: #94a3b8;
}
.winner-tag {
  color: #fde68a;
  font-weight: 700;
}
.selection-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.selection-chip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  color: #dbeafe;
}
.selection-chip.is-hit {
  background: rgba(16,185,129,0.18);
  color: #bbf7d0;
}
.selection-chip.is-winning-miss {
  background: rgba(248,113,113,0.18);
  color: #fecaca;
}
.selection-number {
  font-weight: 700;
}
.leg-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.muted,
.related-note,
.related-meta,
.related-time {
  color: #94a3b8;
}
.related-row {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,0.12);
  background: rgba(15,23,42,0.42);
  padding: 12px;
}
.related-row.active {
  border-color: rgba(96,165,250,0.36);
  background: rgba(30,41,59,0.78);
}
.related-topline,
.related-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.related-game {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7dd3fc;
}
.related-title {
  margin-top: 6px;
  font-weight: 700;
  color: #f8fafc;
}
.related-meta {
  margin-top: 6px;
  font-size: 0.9rem;
}
.related-note {
  margin-top: 6px;
  font-size: 0.9rem;
}
.error-state {
  padding-top: 24px;
  color: #fecaca;
}

@media (max-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .hero-summary {
    grid-template-columns: 1fr;
  }
}
</style>
