<template>
  <v-container class="main-content">
    <div v-if="loading" class="loading-wrap">
      <v-skeleton-loader type="heading, text, list-item-three-line, article" />
    </div>

    <div v-else-if="item" class="detail-layout">
      <div class="detail-main">
        <div class="detail-header">
          <div>
            <div class="eyebrow">{{ item.gameType }} · Sparad biljett</div>
            <h1 class="title">{{ strategyLabel }}</h1>
            <div class="meta">
              <span>{{ generatedLabel }}</span>
              <span class="dot">•</span>
              <span>{{ item.trackName }} {{ item.raceDayDate }}</span>
            </div>
          </div>
          <div class="header-actions">
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
              Analytics
            </v-btn>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Resultat</div>
            <div class="summary-value">{{ settlementLabel }}</div>
            <div class="summary-note">{{ item.settlement?.summary || 'Inväntar resultat' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Kupong</div>
            <div class="summary-value">{{ item.rowCount }} rader</div>
            <div class="summary-note">{{ formatCurrency(item.totalCost) }} kr totalt</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Spikar</div>
            <div class="summary-value">{{ spikeLabel }}</div>
            <div class="summary-note">{{ topRankLabel }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Version</div>
            <div class="summary-value">{{ versionLabel }}</div>
            <div class="summary-note">{{ item.template?.label || item.template?.key || 'Okänd mall' }}</div>
          </div>
        </div>

        <div class="receipt-card">
          <div class="section-title">Historisk biljett</div>
          <div class="receipt-meta">
            <span>{{ item.strategy?.summary || 'Ingen variantsammanfattning' }}</span>
            <span class="dot">•</span>
            <span>{{ item.requestSnapshot?.templateKey || item.template?.key || 'Mall saknas' }}</span>
          </div>
          <div class="legs">
            <div
              v-for="leg in legsWithSettlement"
              :key="leg.leg"
              class="leg-card"
              :class="leg.cardClass"
            >
              <div class="leg-header">
                <div>
                  <div class="leg-title">Avd {{ leg.leg }}</div>
                  <div class="leg-meta">
                    <span v-if="leg.raceNumber">Lopp {{ leg.raceNumber }}</span>
                    <span v-if="leg.type">{{ leg.type }}</span>
                  </div>
                </div>
                <div class="leg-status" :class="leg.statusClass">
                  {{ leg.statusLabel }}
                </div>
              </div>

              <div class="winner-row" v-if="leg.winner">
                <span class="winner-label">Vinnare</span>
                <span class="winner-value">
                  {{ leg.winner.horseName }}
                  <span v-if="leg.winner.startPosition">({{ leg.winner.startPosition }})</span>
                </span>
              </div>
              <div class="winner-row muted" v-else>
                Inväntar resultat för avdelningen.
              </div>

              <div class="selection-chips">
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

              <div class="leg-footer">
                <router-link
                  v-if="leg.raceId && leg.raceDayId"
                  class="race-link"
                  :to="{ name: 'RacedayRace', params: { racedayId: leg.raceDayId, raceId: leg.raceId } }"
                >
                  Öppna lopp
                </router-link>
                <span v-if="leg.aiTopName" class="muted">AI-topp: {{ leg.aiTopName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="detail-side">
        <div class="side-card">
          <div class="section-title">Samma tävlingsdag</div>
          <div class="side-list" v-if="related.length">
            <router-link
              v-for="relatedItem in related"
              :key="relatedItem.id"
              class="side-link"
              :class="{ active: relatedItem.id === item.id }"
              :to="{ name: 'SuggestionDetail', params: { racedayId: relatedItem.racedayObjectId, suggestionId: relatedItem.id } }"
            >
              <div class="side-top">
                <span class="side-game">{{ relatedItem.gameType }}</span>
                <span class="side-time">{{ formatDateTime(relatedItem.generatedAt) }}</span>
              </div>
              <div class="side-title">{{ relatedItem.strategy?.modeLabel || relatedItem.strategy?.mode || 'Okänd strategi' }}</div>
              <div class="side-note">{{ relatedItem.settlement?.summary || 'Inväntar resultat' }}</div>
            </router-link>
          </div>
          <div v-else class="muted">Inga andra sparade biljetter för dagen.</div>
        </div>
      </aside>
    </div>

    <div v-else class="error-state">
      {{ errorMessage }}
    </div>
  </v-container>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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
    const loading = ref(true)
    const item = ref(null)
    const related = ref([])
    const errorMessage = ref('')

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

    const load = async () => {
      try {
        loading.value = true
        errorMessage.value = ''
        const detail = await SuggestionService.fetchSuggestionDetail(route.params.suggestionId)
        item.value = detail?.item || null
        related.value = Array.isArray(detail?.related) ? detail.related : []
      } catch (error) {
        console.error('Failed to load suggestion detail', error)
        errorMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte hämta det sparade spelförslaget.'
      } finally {
        loading.value = false
      }
    }

    onMounted(load)
    watch(() => route.params.suggestionId, load)

    const strategyLabel = computed(() => {
      const strategy = item.value?.strategy || {}
      const parts = [strategy.modeLabel || strategy.mode, strategy.variantLabel || strategy.variantStrategyLabel]
        .filter(Boolean)
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

    const spikeLabel = computed(() => {
      const stats = item.value?.settlement?.spikeStats
      if (!stats || !Number(stats.total)) return 'Inga spikar'
      return `${stats.hits}/${stats.total} spikar satt`
    })

    const topRankLabel = computed(() => {
      const stats = item.value?.settlement?.topRankStats
      if (!stats || !Number(stats.total)) return 'Ingen AI-toppdata'
      return `AI-topp vann i ${stats.wins}/${stats.total} lopp`
    })

    const versionLabel = computed(() => {
      const version = item.value?.versionSnapshot || {}
      return version.algorithmVersion || version.strategyVersion || version.eloVersion || 'Ej versionsmärkt'
    })

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

        return {
          ...leg,
          ...settlement,
          selections,
          aiTopName: (leg?.aiSelections || [])[0]?.name || '',
          statusLabel: !resolved ? 'Inväntar resultat' : (isHit ? 'Träff' : 'Miss'),
          statusClass: !resolved ? 'is-pending' : (isHit ? 'is-hit' : 'is-miss'),
          cardClass: !resolved ? 'card-pending' : (isHit ? 'card-hit' : 'card-miss')
        }
      })
    })

    return {
      loading,
      item,
      related,
      errorMessage,
      formatCurrency,
      formatDateTime,
      strategyLabel,
      settlementLabel,
      generatedLabel,
      spikeLabel,
      topRankLabel,
      versionLabel,
      legsWithSettlement
    }
  }
}
</script>

<style scoped>
.main-content { padding-top: 70px; }
.loading-wrap { padding-top: 24px; }
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c3aed;
}
.title {
  margin: 4px 0 0;
  font-size: 1.75rem;
  line-height: 1.1;
}
.meta {
  display: flex;
  gap: 8px;
  color: #6b7280;
  margin-top: 8px;
  flex-wrap: wrap;
}
.dot { color: #9ca3af; }
.header-actions {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.summary-card,
.receipt-card,
.side-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,247,250,0.96));
  border: 1px solid rgba(15,23,42,0.08);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(15,23,42,0.06);
}
.summary-label,
.section-title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}
.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: 10px;
}
.summary-note,
.receipt-meta,
.muted {
  color: #6b7280;
}
.receipt-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.legs {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.leg-card {
  border: 1px solid rgba(15,23,42,0.08);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}
.card-hit { border-color: rgba(16,185,129,0.35); }
.card-miss { border-color: rgba(239,68,68,0.28); }
.card-pending { border-color: rgba(59,130,246,0.22); }
.leg-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.leg-title {
  font-size: 1rem;
  font-weight: 700;
}
.leg-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 4px;
}
.leg-status {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.84rem;
  font-weight: 700;
}
.leg-status.is-hit {
  background: rgba(16,185,129,0.12);
  color: #047857;
}
.leg-status.is-miss {
  background: rgba(239,68,68,0.12);
  color: #b91c1c;
}
.leg-status.is-pending {
  background: rgba(59,130,246,0.12);
  color: #1d4ed8;
}
.winner-row {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.winner-label {
  font-weight: 700;
}
.selection-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.selection-chip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15,23,42,0.06);
}
.selection-chip.is-hit {
  background: rgba(16,185,129,0.16);
  color: #065f46;
}
.selection-chip.is-winning-miss {
  background: rgba(239,68,68,0.14);
  color: #991b1b;
}
.selection-number {
  font-weight: 700;
}
.leg-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.race-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}
.side-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}
.side-link {
  display: block;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(15,23,42,0.08);
  text-decoration: none;
  color: inherit;
  background: #fff;
}
.side-link.active {
  border-color: rgba(37,99,235,0.35);
  background: rgba(219,234,254,0.45);
}
.side-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #6b7280;
  font-size: 0.84rem;
}
.side-game {
  font-weight: 700;
  color: #1f2937;
}
.side-title {
  font-weight: 700;
  margin-top: 6px;
}
.side-note {
  color: #6b7280;
  margin-top: 4px;
  font-size: 0.9rem;
}
.error-state {
  color: #b91c1c;
  padding-top: 24px;
}

@media (max-width: 1100px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
