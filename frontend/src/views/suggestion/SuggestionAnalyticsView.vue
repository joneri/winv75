<template>
  <v-container class="analytics-page">
    <div v-if="loading" class="loading-wrap">
      <v-skeleton-loader type="heading, text, table, article" />
    </div>

    <div v-else-if="analytics" class="analytics-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow">Förslagsanalys</div>
          <h1 class="title">Resultat över tid</h1>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Sparade förslag</div>
            <div class="summary-value">{{ analytics.summary?.totalSuggestions || 0 }}</div>
            <div class="summary-note">{{ analytics.summary?.settledSuggestions || 0 }} avgjorda</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Snitt rätt</div>
            <div class="summary-value">{{ analytics.summary?.avgCorrect ?? '–' }}</div>
            <div class="summary-note">Över avgjorda förslag</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">8 / 7 / 6 rätt</div>
            <div class="summary-value">{{ hitTierLabel }}</div>
            <div class="summary-note">När hela kupongen kan avgöras</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Spikträff</div>
            <div class="summary-value">{{ percentLabel(analytics.summary?.spikHitRate) }}</div>
            <div class="summary-note">AI-topp: {{ percentLabel(analytics.summary?.topRankWinRate) }}</div>
          </div>
        </div>
      </section>

      <section class="analytics-layout">
        <div class="analytics-panel chart-panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Snitt rätt över tid</div>
            </div>
          </div>

          <div class="chart-wrap" v-if="timelinePoints.length">
            <svg viewBox="0 0 920 260" class="chart">
              <line x1="56" y1="220" x2="884" y2="220" class="axis-line" />
              <line x1="56" y1="24" x2="56" y2="220" class="axis-line" />
              <polyline :points="pointString" class="metric-line" />
              <g v-for="marker in chartMarkers" :key="marker.id || marker.label">
                <line :x1="marker.x" y1="24" :x2="marker.x" y2="220" class="marker-line" />
                <text :x="marker.x + 4" y="36" class="marker-label">{{ marker.label }}</text>
              </g>
              <g v-for="point in timelinePoints" :key="point.date">
                <circle :cx="point.x" :cy="point.y" r="4.5" class="metric-dot" />
              </g>
              <text x="56" y="242" class="axis-label">{{ timelineStartLabel }}</text>
              <text x="884" y="242" text-anchor="end" class="axis-label">{{ timelineEndLabel }}</text>
              <text x="18" y="28" class="axis-label">8</text>
              <text x="18" y="224" class="axis-label">0</text>
            </svg>
          </div>
          <div v-else class="muted empty-state">
            Inga avgjorda förslag finns ännu att rita ut.
          </div>

          <div v-if="visibleMarkers.length" class="marker-list">
            <div
              v-for="marker in visibleMarkers"
              :key="marker._id || marker.id || `${marker.label}-${marker.occurredAt}`"
              class="marker-row"
            >
              <div>
                <div class="marker-row-label">{{ marker.label }}</div>
                <div class="marker-row-meta">{{ formatDateTime(marker.occurredAt) }} · {{ marker.category }}</div>
              </div>
              <div class="marker-row-note">{{ marker.description || 'Ingen extra beskrivning' }}</div>
            </div>
          </div>
        </div>

        <div class="side-stack">
          <div class="analytics-panel">
            <div class="panel-header">
              <div class="panel-title">Lägg till markor</div>
            </div>
            <div class="marker-form">
              <v-text-field v-model="markerForm.label" label="Namn" density="comfortable" variant="outlined" />
              <v-select
                v-model="markerForm.category"
                :items="markerCategories"
                label="Kategori"
                density="comfortable"
                variant="outlined"
              />
              <v-text-field
                v-model="markerForm.occurredAt"
                label="Datum och tid"
                type="datetime-local"
                density="comfortable"
                variant="outlined"
              />
              <v-textarea
                v-model="markerForm.description"
                label="Beskrivning"
                rows="3"
                auto-grow
                variant="outlined"
              />
              <v-btn color="primary" variant="elevated" :loading="savingMarker" @click="saveMarker">
                Spara markör
              </v-btn>
              <div v-if="markerMessage" class="form-message">{{ markerMessage }}</div>
            </div>
          </div>

          <div class="analytics-panel compact-panel">
            <div class="panel-header">
              <div class="panel-title">Speltyper</div>
            </div>
            <div class="stats-table">
              <div class="stats-row stats-head">
                <span>Speltyp</span>
                <span>Förslag</span>
                <span>Snitt rätt</span>
              </div>
              <div class="stats-row" v-for="row in analytics.gameTypeStats || []" :key="row.label">
                <span>{{ row.label }}</span>
                <span>{{ row.totalSuggestions }}</span>
                <span>{{ row.avgCorrect ?? '–' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="tables-grid">
        <div class="analytics-panel">
          <div class="panel-header">
            <div class="panel-title">Strategier</div>
          </div>
          <div class="stats-table">
            <div class="stats-row stats-head">
              <span>Strategi</span>
              <span>Förslag</span>
              <span>Snitt rätt</span>
            </div>
            <div class="stats-row" v-for="row in analytics.strategyStats || []" :key="row.label">
              <span>{{ row.label }}</span>
              <span>{{ row.totalSuggestions }}</span>
              <span>{{ row.avgCorrect ?? '–' }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-panel">
          <div class="panel-header">
            <div class="panel-title">Versioner</div>
          </div>
          <div class="stats-table stats-table-version">
            <div class="stats-row stats-head">
              <span>Version</span>
              <span>Förslag</span>
              <span>Snitt rätt</span>
            </div>
            <div class="stats-row" v-for="row in analytics.versionStats || []" :key="row.label">
              <span class="version-label">{{ row.label }}</span>
              <span>{{ row.totalSuggestions }}</span>
              <span>{{ row.avgCorrect ?? '–' }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-panel recent-panel">
          <div class="panel-header">
            <div class="panel-title">Senaste sparade biljetter</div>
          </div>
          <div class="recent-list">
            <router-link
              v-for="item in analytics.recentSuggestions || []"
              :key="item.id"
              class="recent-link"
              :to="{ name: 'SuggestionDetail', params: { racedayId: item.racedayObjectId, suggestionId: item.id } }"
            >
              <div class="recent-top">
                <span>{{ item.gameType }}</span>
                <span>{{ formatDateTime(item.generatedAt) }}</span>
              </div>
              <div class="recent-title">{{ item.strategy?.modeLabel || item.strategy?.mode || 'Okänd strategi' }}</div>
              <div class="recent-meta">
                <span>{{ item.rowCount }} rader</span>
                <span>{{ item.totalCost }} kr</span>
                <span>{{ item.settlement?.resultsAvailable ? `${item.settlement?.correctLegs || 0}/${item.settlement?.totalLegs || 0} rätt` : 'Inväntar resultat' }}</span>
              </div>
              <div class="recent-note">{{ item.settlement?.summary || 'Inväntar resultat' }}</div>
            </router-link>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="error-state">{{ errorMessage }}</div>
  </v-container>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import SuggestionService from './services/SuggestionService.js'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
  name: 'SuggestionAnalyticsView',
  setup() {
    const loading = ref(true)
    const analytics = ref(null)
    const errorMessage = ref('')
    const savingMarker = ref(false)
    const markerMessage = ref('')
    const markerCategories = ['Elo', 'strategy', 'data', 'UI', 'other']
    const markerForm = ref({
      label: '',
      description: '',
      category: 'strategy',
      occurredAt: new Date().toISOString().slice(0, 16)
    })

    const isSmokeTestMarker = (marker) => {
      const label = String(marker?.label || '').trim()
      const description = String(marker?.description || '').trim()
      return /^smoke marker\b/i.test(label) || /created by smoke test/i.test(description)
    }

    const load = async () => {
      try {
        loading.value = true
        errorMessage.value = ''
        analytics.value = await SuggestionService.fetchSuggestionAnalytics()
      } catch (error) {
        console.error('Failed to load suggestion analytics', error)
        errorMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte hämta analytics för spelförslag.'
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      setBreadcrumbLabel('SuggestionAnalytics', 'Förslagsanalys')
      await load()
    })

    const hitTierLabel = computed(() => {
      const summary = analytics.value?.summary || {}
      return `${summary.right8 || 0} / ${summary.right7 || 0} / ${summary.right6 || 0}`
    })

    const percentLabel = (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return '–'
      return `${Math.round(numeric * 100)}%`
    }

    const formatDateTime = (value) => {
      if (!value) return ''
      return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value))
    }

    const timelineSource = computed(() => Array.isArray(analytics.value?.timeline) ? analytics.value.timeline : [])
    const timelineDates = computed(() => timelineSource.value.map((item) => new Date(item.date)))
    const minDate = computed(() => timelineDates.value.length ? Math.min(...timelineDates.value.map((date) => date.getTime())) : null)
    const maxDate = computed(() => timelineDates.value.length ? Math.max(...timelineDates.value.map((date) => date.getTime())) : null)

    const scaleX = (value) => {
      if (minDate.value == null || maxDate.value == null) return 56
      if (minDate.value === maxDate.value) return 470
      return 56 + ((value - minDate.value) / (maxDate.value - minDate.value)) * 828
    }

    const scaleY = (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return 220
      return 220 - (Math.max(0, Math.min(8, numeric)) / 8) * 196
    }

    const timelinePoints = computed(() => timelineSource.value
      .filter((item) => Number.isFinite(Number(item?.avgCorrect)))
      .map((item) => {
        const date = new Date(item.date)
        return {
          ...item,
          x: scaleX(date.getTime()),
          y: scaleY(item.avgCorrect)
        }
      }))

    const pointString = computed(() => timelinePoints.value.map((point) => `${point.x},${point.y}`).join(' '))

    const visibleMarkers = computed(() => (analytics.value?.markers || []).filter((marker) => !isSmokeTestMarker(marker)))

    const chartMarkers = computed(() => {
      return visibleMarkers.value
        .map((marker) => {
          const time = new Date(marker.occurredAt).getTime()
          if (!Number.isFinite(time)) return null
          return {
            ...marker,
            x: scaleX(time)
          }
        })
        .filter(Boolean)
    })

    const timelineStartLabel = computed(() => timelineSource.value[0]?.date || '')
    const timelineEndLabel = computed(() => timelineSource.value[timelineSource.value.length - 1]?.date || '')

    const saveMarker = async () => {
      try {
        if (!markerForm.value.label.trim()) {
          markerMessage.value = 'Namn krävs för att spara en markör.'
          return
        }
        savingMarker.value = true
        markerMessage.value = ''
        await SuggestionService.createSuggestionMarker({
          ...markerForm.value,
          occurredAt: markerForm.value.occurredAt ? new Date(markerForm.value.occurredAt).toISOString() : new Date().toISOString()
        })
        markerMessage.value = 'Markoren sparades.'
        await load()
      } catch (error) {
        console.error('Failed to save marker', error)
        markerMessage.value = error?.response?.data?.error || error?.message || 'Kunde inte spara markoren.'
      } finally {
        savingMarker.value = false
      }
    }

    return {
      loading,
      analytics,
      errorMessage,
      savingMarker,
      markerMessage,
      markerForm,
      markerCategories,
      hitTierLabel,
      percentLabel,
      formatDateTime,
      timelinePoints,
      pointString,
      visibleMarkers,
      chartMarkers,
      timelineStartLabel,
      timelineEndLabel,
      saveMarker
    }
  }
}
</script>

<style scoped>
.analytics-page {
  padding-top: 70px;
}
.loading-wrap {
  padding-top: 24px;
}
.analytics-shell {
  display: grid;
  gap: 18px;
}
.hero-panel,
.analytics-panel {
  border-radius: 22px;
  border: 1px solid rgba(148,163,184,0.14);
  background:
    radial-gradient(circle at top right, rgba(14,165,233,0.14), transparent 32%),
    linear-gradient(180deg, rgba(10,15,28,0.98), rgba(15,23,42,0.98));
  color: #e5eefc;
  box-shadow: 0 20px 40px rgba(2,6,23,0.24);
}
.hero-panel {
  padding: 22px;
}
.hero-copy {
  margin-bottom: 16px;
}
.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7dd3fc;
}
.title {
  margin-top: 6px;
  font-size: 2rem;
  line-height: 1.05;
}
.muted {
  color: #94a3b8;
}
.hero-note {
  max-width: 720px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.summary-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(15,23,42,0.48);
}
.summary-label,
.panel-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}
.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 8px;
}
.summary-note {
  color: #cbd5e1;
  margin-top: 6px;
}
.analytics-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 18px;
}
.side-stack,
.tables-grid {
  display: grid;
  gap: 18px;
}
.tables-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.analytics-panel {
  padding: 18px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.chart-wrap {
  width: 100%;
  overflow-x: auto;
}
.chart {
  width: 100%;
  min-height: 260px;
}
.axis-line {
  stroke: rgba(148,163,184,0.22);
  stroke-width: 1.2;
}
.metric-line {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 3;
}
.metric-dot {
  fill: #22d3ee;
}
.marker-line {
  stroke: rgba(168,85,247,0.5);
  stroke-width: 1.5;
  stroke-dasharray: 6 5;
}
.marker-label,
.axis-label {
  fill: #94a3b8;
  font-size: 12px;
}
.marker-form {
  display: grid;
  gap: 12px;
}
.form-message {
  color: #cbd5e1;
}
.marker-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}
.marker-row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(15,23,42,0.42);
}
.marker-row-label {
  font-weight: 700;
  color: #f8fafc;
}
.marker-row-meta,
.marker-row-note {
  color: #94a3b8;
  font-size: 0.9rem;
}
.stats-table {
  display: grid;
  gap: 8px;
}
.stats-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 80px 90px;
  gap: 12px;
  align-items: center;
  font-size: 0.95rem;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15,23,42,0.36);
  color: #e2e8f0;
}
.stats-head {
  font-weight: 700;
  background: rgba(59,130,246,0.12);
  color: #bfdbfe;
}
.stats-table-version .stats-row {
  grid-template-columns: minmax(0, 1.8fr) 80px 90px;
}
.version-label {
  color: #cbd5e1;
  word-break: break-word;
}
.recent-list {
  display: grid;
  gap: 10px;
}
.recent-link {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(15,23,42,0.46);
}
.recent-link:hover {
  border-color: rgba(56,189,248,0.32);
  background: rgba(15,23,42,0.62);
}
.recent-top,
.recent-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.84rem;
  flex-wrap: wrap;
}
.recent-title {
  margin-top: 6px;
  font-weight: 700;
  color: #f8fafc;
}
.recent-meta {
  margin-top: 6px;
}
.recent-note {
  margin-top: 6px;
  color: #cbd5e1;
}
.error-state {
  color: #f87171;
  padding-top: 24px;
}
.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
}

:deep(.analytics-panel .v-field) {
  background: rgba(15,23,42,0.48);
  border-radius: 14px;
}
:deep(.analytics-panel .v-field__input),
:deep(.analytics-panel .v-label),
:deep(.analytics-panel input),
:deep(.analytics-panel textarea) {
  color: #e2e8f0 !important;
}

@media (max-width: 1180px) {
  .summary-grid,
  .tables-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .summary-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
  .stats-row,
  .stats-table-version .stats-row {
    grid-template-columns: minmax(0, 1fr) 70px 80px;
  }
  .marker-row {
    grid-template-columns: 1fr;
  }
}
</style>
