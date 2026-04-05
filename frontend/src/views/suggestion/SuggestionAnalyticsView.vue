<template>
  <v-container class="main-content">
    <div v-if="loading" class="loading-wrap">
      <v-skeleton-loader type="heading, text, table, article" />
    </div>

    <div v-else-if="analytics" class="analytics-wrap">
      <div class="page-header">
        <div>
          <div class="eyebrow">Suggestion analytics</div>
          <h1 class="title">Resultat över tid</h1>
          <div class="muted">Sparade biljetter, settlement och versionsmarkorer i samma vy.</div>
        </div>
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
          <div class="summary-note">Bara när 8 lopp är avgjorda</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Spikträff</div>
          <div class="summary-value">{{ percentLabel(analytics.summary?.spikHitRate) }}</div>
          <div class="summary-note">AI-topp: {{ percentLabel(analytics.summary?.topRankWinRate) }}</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="panel chart-panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Snitt rätt över tid</div>
              <div class="muted">Vertikala markorer visar större modellskiften.</div>
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
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Lägg till markor</div>
          </div>
          <div class="marker-form">
            <v-text-field v-model="markerForm.label" label="Label" density="comfortable" />
            <v-select
              v-model="markerForm.category"
              :items="markerCategories"
              label="Kategori"
              density="comfortable"
            />
            <v-text-field v-model="markerForm.occurredAt" label="Datum och tid" type="datetime-local" density="comfortable" />
            <v-textarea v-model="markerForm.description" label="Beskrivning" rows="3" auto-grow />
            <v-btn color="primary" variant="elevated" :loading="savingMarker" @click="saveMarker">
              Spara markor
            </v-btn>
            <div v-if="markerMessage" class="muted">{{ markerMessage }}</div>
          </div>
        </div>
      </div>

      <div class="tables-grid">
        <div class="panel">
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

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Versioner</div>
          </div>
          <div class="stats-table">
            <div class="stats-row stats-head">
              <span>Version</span>
              <span>Förslag</span>
              <span>Snitt rätt</span>
            </div>
            <div class="stats-row" v-for="row in analytics.versionStats || []" :key="row.label">
              <span>{{ row.label }}</span>
              <span>{{ row.totalSuggestions }}</span>
              <span>{{ row.avgCorrect ?? '–' }}</span>
            </div>
          </div>
        </div>

        <div class="panel recent-panel">
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
              <div class="recent-note">{{ item.settlement?.summary || 'Inväntar resultat' }}</div>
            </router-link>
          </div>
        </div>
      </div>
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
      setBreadcrumbLabel('SuggestionAnalytics', 'Suggestion analytics')
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

    const chartMarkers = computed(() => {
      return (analytics.value?.markers || [])
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
          markerMessage.value = 'Label krävs för att spara en markor.'
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
      chartMarkers,
      timelineStartLabel,
      timelineEndLabel,
      saveMarker
    }
  }
}
</script>

<style scoped>
.main-content { padding-top: 70px; }
.loading-wrap { padding-top: 24px; }
.page-header { margin-bottom: 18px; }
.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0f766e;
}
.title {
  margin-top: 4px;
  font-size: 1.8rem;
}
.muted { color: #6b7280; }
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.summary-card,
.panel {
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,247,250,0.96));
  border: 1px solid rgba(15,23,42,0.08);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(15,23,42,0.06);
}
.summary-label,
.panel-title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}
.summary-value {
  font-size: 1.35rem;
  font-weight: 700;
  margin-top: 8px;
}
.summary-note { color: #6b7280; margin-top: 4px; }
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 18px;
  margin-bottom: 18px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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
  stroke: rgba(15,23,42,0.15);
  stroke-width: 1.25;
}
.metric-line {
  fill: none;
  stroke: #0891b2;
  stroke-width: 3;
}
.metric-dot {
  fill: #0f766e;
}
.marker-line {
  stroke: rgba(124,58,237,0.45);
  stroke-width: 1.5;
  stroke-dasharray: 6 5;
}
.marker-label,
.axis-label {
  fill: #6b7280;
  font-size: 12px;
}
.marker-form {
  display: grid;
  gap: 12px;
}
.tables-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
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
}
.stats-head {
  font-weight: 700;
  color: #374151;
}
.recent-list {
  display: grid;
  gap: 10px;
}
.recent-link {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(15,23,42,0.08);
  background: #fff;
}
.recent-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #6b7280;
  font-size: 0.85rem;
}
.recent-title {
  margin-top: 6px;
  font-weight: 700;
}
.recent-note {
  margin-top: 4px;
  color: #6b7280;
}
.error-state {
  color: #b91c1c;
  padding-top: 24px;
}
.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
}

@media (max-width: 1100px) {
  .summary-grid,
  .tables-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .summary-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: minmax(0, 1fr) 70px 80px;
  }
}
</style>
