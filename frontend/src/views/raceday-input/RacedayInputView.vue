<template>
  <div class="start-page">
    <section class="page-hero start-hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <div class="page-kicker">Tävlingsöversikt</div>
          <h1 class="page-title">Välj tävlingsdag</h1>
          <div class="page-chip-row">
            <div class="shell-chip is-track">{{ raceDays.length }} tävlingsdagar i listan</div>
            <div class="shell-chip is-focus">{{ raceDaysWithResults }} med resultat klara</div>
            <div class="shell-chip is-success" v-if="staleResultCount > 0">{{ staleResultCount }} väntar på resultat</div>
            <div class="shell-chip">{{ uniqueTracks }} banor i aktuellt urval</div>
          </div>
        </div>

        <div class="page-panel-soft fetch-panel">
          <div class="panel-title">Hämta ny tävlingsdag</div>
          <div class="fetch-panel-copy">
            Importera tävlingsdagar för valt datum.
          </div>
          <div class="fetch-form">
            <v-text-field
              v-model="fetchDate"
              type="date"
              label="Datum"
              variant="outlined"
              hide-details
            />
            <v-btn @click="fetchRacedays" color="secondary" variant="elevated" :loading="loading">
              Hämta tävlingsdagar
            </v-btn>
          </div>
          <v-alert v-if="error" type="error" variant="tonal" class="mt-3">{{ error }}</v-alert>
        </div>

        <router-link class="page-panel-soft guide-panel compact-row-link" :to="{ name: 'SpelforslagGuide' }">
          <div class="panel-title">Guide</div>
          <h2 class="guide-panel-title">Förstå spelförslagen</h2>
          <p class="guide-panel-copy">
            Läs hur prediction layer, publikandelar, mallar och budget formar kupongen.
          </p>
          <div class="guide-panel-footer">
            <span class="shell-chip is-focus">Öppna guide</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="start-layout">
      <div class="page-panel day-list-panel">
        <div class="model-status-panel">
          <div>
            <div class="panel-title">Elo</div>
            <h2 class="guide-panel-title">Modellstatus</h2>
            <p class="guide-panel-copy">
              Se när lagrad Elo senast kördes och starta en ny uppdatering av hela ratinglagret.
            </p>
          </div>

          <div class="model-status-grid">
            <div class="status-box">
              <span class="status-label">Version</span>
              <strong>{{ eloStatus?.storedEloVersion || 'Okänd' }}</strong>
            </div>
            <div class="status-box">
              <span class="status-label">Senast körd</span>
              <strong>{{ formatStatusDateTime(eloStatus?.ratingLastUpdated) }}</strong>
            </div>
            <div class="status-box">
              <span class="status-label">Senaste loppdatum</span>
              <strong>{{ formatStatusDate(eloStatus?.lastProcessedRaceDate) }}</strong>
            </div>
            <div class="status-box">
              <span class="status-label">Hästar med rating</span>
              <strong>{{ eloStatus?.totalRatedHorses ?? '–' }}</strong>
            </div>
          </div>

          <div class="model-status-actions">
            <v-btn color="secondary" variant="elevated" :loading="eloUpdating" @click="runEloUpdate">
              Uppdatera Elo
            </v-btn>
            <div v-if="eloMessage" class="model-status-message">{{ eloMessage }}</div>
          </div>
        </div>

        <div class="list-head">
          <div>
            <div class="panel-title">Aktuella tävlingsdagar</div>
            <h2 class="list-title">Senaste tävlingsdagar</h2>
          </div>
          <div class="list-summary">
            <span v-if="nextRaceday" class="summary-label">Nästa start</span>
            <strong v-if="nextRaceday">{{ nextRaceday.trackName }}</strong>
            <span v-if="nextRaceday">{{ formatDayLabel(nextRaceday.firstStart) }} kl {{ formatTime(nextRaceday.firstStart) }}</span>
            <v-btn
              v-if="staleResultCount > 0"
              color="success"
              variant="tonal"
              size="small"
              :loading="staleRefreshLoading"
              @click.stop="refreshStaleResults"
            >
              Uppdatera saknade resultat
            </v-btn>
          </div>
        </div>

        <div v-if="loading && raceDays.length === 0" class="loading-empty">
          <v-progress-circular indeterminate color="primary" />
          <span>Laddar tävlingsdagar…</span>
        </div>

        <div v-else-if="raceDays.length > 0" ref="listContainer" class="raceday-list">
          <div class="list-loading-indicator" v-if="loading">
            <v-progress-circular indeterminate color="primary" size="18" width="2" />
          </div>

          <button
            v-for="raceDay in raceDays"
            :key="raceDay._id"
            class="raceday-row"
            type="button"
            @click="navigateToRaceDay(raceDay._id)"
          >
            <div class="raceday-row-main">
              <div class="raceday-row-top">
                <span class="raceday-date">
                  <span
                    v-if="raceDay.hasResults"
                    class="result-pill"
                    title="Resultat klara"
                  >
                    <span class="dot dot-success"></span>
                    Klara
                  </span>
                  <span
                    v-else-if="isPastWithoutResults(raceDay)"
                    class="result-pill result-pill-pending"
                    title="Passerat datum utan klara resultat"
                  >
                    <span class="dot dot-pending"></span>
                    Saknas
                  </span>
                  {{ formatDayLabel(raceDay.firstStart) }}
                </span>
                <span class="raceday-time">{{ formatTime(raceDay.firstStart) }}</span>
              </div>
              <div class="raceday-track">{{ raceDay.trackName }}</div>
            </div>
            <div class="raceday-row-meta">
              <span>{{ typeof raceDay.raceCount === 'number' ? `${raceDay.raceCount} lopp` : 'Tävlingsdag' }}</span>
              <span class="row-link">Öppna</span>
            </div>
          </button>

          <div ref="sentinel" class="sentinel">
            <v-progress-circular v-if="loading && hasMore" indeterminate color="primary" size="24" />
            <div v-else-if="!hasMore" class="end-marker">Alla inlästa dagar visas nu</div>
          </div>
        </div>

        <v-alert v-else type="info" variant="tonal" class="empty-alert">
          Inga tävlingsdagar hittades i den aktuella listan.
        </v-alert>
      </div>

    </section>
  </div>

  <v-snackbar v-model="showSnackbar" top color="success">
    {{ successMessage }}
    <v-btn variant="text" @click="showSnackbar = false">
      Stäng
    </v-btn>
  </v-snackbar>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDateFormat } from '@/composables/useDateFormat.js';
import { fetchEloStatus, triggerEloUpdate } from '@/api'

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const { formatDate } = useDateFormat();

    const formatDayLabel = (dateString) => {
      try {
        return new Intl.DateTimeFormat('sv-SE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date(dateString)).toUpperCase()
      } catch {
        return formatDate(dateString)
      }
    }

    const formatTime = (dateString) => {
      const d = new Date(dateString)
      const h = String(d.getUTCHours()).padStart(2, '0')
      const m = String(d.getUTCMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }

    const fetchDate = ref('');
    const showSnackbar = ref(false);
    const eloStatus = ref(null)
    const eloUpdating = ref(false)
    const eloMessage = ref('')

    const error = computed(() => store.state.racedayInput.error);
    const raceDays = computed(() => store.state.racedayInput.raceDays);
    const raceDaysPage = computed(() => store.state.racedayInput.raceDaysPage);
    const raceDaysPageSize = computed(() => store.state.racedayInput.raceDaysPageSize);
    const raceDaysTotal = computed(() => store.state.racedayInput.raceDaysTotal);
    const hasMore = computed(() => store.state.racedayInput.raceDaysHasMore);
    const loading = computed(() => store.state.racedayInput.loading);
    const successMessage = computed(() => store.state.racedayInput.successMessage);
    const raceDaysWithResults = computed(() => raceDays.value.filter(day => day?.hasResults).length);
    const uniqueTracks = computed(() => new Set(raceDays.value.map(day => day?.trackName).filter(Boolean)).size);
    const nextRaceday = computed(() => raceDays.value[0] || null);
    const staleRefreshSummary = computed(() => store.state.racedayInput.staleRefreshSummary);

    const listContainer = ref(null);
    const sentinel = ref(null);
    let observer = null;
    let removeScroll = null;

    const toDateOnlyValue = (value) => {
      if (!value) return null
      const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value
      const dt = new Date(normalized)
      return Number.isNaN(dt.getTime()) ? null : dt
    }

    const isPastWithoutResults = (raceDay) => {
      if (!raceDay || raceDay.hasResults) return false
      const raceDate = toDateOnlyValue(raceDay.raceDayDate || raceDay.firstStart)
      if (!raceDate) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return raceDate.getTime() < today.getTime()
    }

    const staleResultCount = computed(() => raceDays.value.filter(day => isPastWithoutResults(day)).length)
    const staleRaceDayIds = computed(() => raceDays.value
      .filter(day => isPastWithoutResults(day))
      .map(day => Number(day.raceDayId))
      .filter(id => Number.isFinite(id)))
    const staleRefreshLoading = computed(() => loading.value && staleResultCount.value > 0)

    // Helper to get the actual scrollable DOM element from the v-list component
    const getRootEl = () => {
      const v = listContainer.value
      return v && (v.$el || v)
    }

    const fetchRacedays = async () => {
      if (!fetchDate.value) return
      // Fetch from external API -> upsert into backend
      await store.dispatch('racedayInput/fetchRacedaysFromAPI', fetchDate.value)
      // Reload summary from page 1 so new items are visible and correctly sorted
      await store.dispatch('racedayInput/fetchRacedays', { page: 1 })
      await nextTick()
      const el = getRootEl()
      if (el) el.scrollTop = 0
      setupObserver()
    };

    const refreshStaleResults = async () => {
      await store.dispatch('racedayInput/refreshStaleResults', staleRaceDayIds.value)
      await nextTick()
      setupObserver()
    }

    const loadEloStatus = async () => {
      const response = await fetchEloStatus()
      if (response.ok) {
        eloStatus.value = response.data
      }
    }

    const runEloUpdate = async () => {
      eloUpdating.value = true
      eloMessage.value = ''
      const response = await triggerEloUpdate()
      eloUpdating.value = false

      if (!response.ok) {
        eloMessage.value = response.error || 'Kunde inte uppdatera Elo.'
        return
      }

      const updated = response.data?.updatedHorseCount
      const races = response.data?.raceCount
      eloMessage.value = `Elo uppdaterad${Number.isFinite(updated) ? `, ${updated} hästar` : ''}${Number.isFinite(races) ? `, ${races} lopp` : ''}.`
      await loadEloStatus()
    }

    const navigateToRaceDay = (raceDayId) => {
      router.push({ name: 'Raceday', params: { racedayId: raceDayId } });
    };

    // Fallback scroll handler (helps Safari/Edge quirks)
    const onScroll = () => {
      const el = getRootEl()
      if (!el || loading.value || !hasMore.value) return
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200
      if (nearBottom) loadNextPage()
    }

    const loadNextPage = () => {
      if (!hasMore.value || loading.value) return
      store.dispatch('racedayInput/fetchRacedays', { page: raceDaysPage.value + 1 })
    }

    const setupObserver = () => {
      // Cleanup prior
      if (observer) observer.disconnect()
      if (removeScroll) { removeScroll(); removeScroll = null }

      const rootEl = getRootEl()

      observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          loadNextPage()
        }
      }, { root: rootEl || null, rootMargin: '200px', threshold: 0 })

      if (sentinel.value) observer.observe(sentinel.value)

      // Attach scroll fallback if we have a root element
      if (rootEl) {
        rootEl.addEventListener('scroll', onScroll, { passive: true })
        removeScroll = () => rootEl.removeEventListener('scroll', onScroll)
      }
    }

    onMounted(async () => {
      await store.dispatch('racedayInput/fetchRacedays', { page: 1 })
      await loadEloStatus()
      await nextTick()
      setupObserver()
    });

    onBeforeUnmount(() => {
      if (observer) observer.disconnect()
      if (removeScroll) removeScroll()
    })

    return {
      formatDate,
      formatDayLabel,
      formatTime,
      fetchDate,
      showSnackbar,
      error,
      raceDays,
      raceDaysPage,
      raceDaysPageSize,
      raceDaysTotal,
      hasMore,
      loading,
      successMessage,
      raceDaysWithResults,
      uniqueTracks,
      nextRaceday,
      staleRefreshSummary,
      staleResultCount,
      staleRaceDayIds,
      staleRefreshLoading,
      eloStatus,
      eloUpdating,
      eloMessage,
      fetchRacedays,
      refreshStaleResults,
      isPastWithoutResults,
      runEloUpdate,
      navigateToRaceDay,
      listContainer,
      sentinel,
      formatStatusDate: formatDate,
      formatStatusDateTime: (value) => {
        if (!value) return '–'
        const dt = new Date(value)
        if (Number.isNaN(dt.getTime())) return '–'
        return new Intl.DateTimeFormat('sv-SE', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(dt)
      }
    };
  }
}
</script>

<style scoped>
.start-page {
  padding: 0;
}

.start-hero {
  padding: 28px;
  margin-bottom: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
  gap: 20px;
  align-items: start;
}

.hero-copy {
  display: grid;
  gap: 14px;
}

.fetch-panel {
  padding: 20px;
}

.guide-panel {
  display: grid;
  gap: 12px;
  padding: 20px;
  color: var(--text-body);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.guide-panel:hover {
  transform: translateY(-1px);
  border-color: rgba(89, 212, 255, 0.24);
  background: linear-gradient(180deg, rgba(18, 31, 54, 0.96), rgba(12, 21, 38, 0.94));
}

.guide-panel-title {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-strong);
}

.guide-panel-copy {
  margin: 0;
  color: var(--text-muted);
}

.guide-panel-footer {
  display: flex;
  justify-content: flex-start;
}

.fetch-panel-copy {
  color: var(--text-muted);
  margin-top: 8px;
}

.fetch-form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.start-layout {
  display: block;
}

.day-list-panel {
  padding: 22px;
}

.model-status-panel {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.model-status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.status-box {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.status-label {
  color: var(--text-soft);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.model-status-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.model-status-message {
  color: var(--text-muted);
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.list-title,
.guide-title {
  margin: 6px 0 0;
  font-size: 1.5rem;
}

.list-summary {
  display: grid;
  gap: 4px;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-body);
}

.summary-label {
  color: var(--track-amber);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.loading-empty {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.raceday-list {
  max-height: 72vh;
  overflow-y: auto;
  position: relative;
  display: grid;
  gap: 10px;
}

.list-loading-indicator {
  position: sticky;
  top: 0;
  justify-self: end;
  z-index: 2;
}

.raceday-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-body);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.raceday-row:hover {
  transform: translateY(-1px);
  border-color: rgba(89, 212, 255, 0.24);
  background: rgba(89, 212, 255, 0.06);
}

.raceday-row-main {
  min-width: 0;
}

.raceday-row-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.raceday-date {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-weight: 700;
  color: var(--text-strong);
}

.raceday-time {
  color: var(--track-amber);
  font-weight: 600;
}

.raceday-track {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 1.02rem;
}

.raceday-row-meta {
  display: grid;
  justify-items: end;
  gap: 6px;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.row-link {
  color: var(--focus-cyan);
  font-weight: 700;
}

.empty-alert {
  margin-top: 8px;
}

.sentinel {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.end-marker {
  color: var(--text-soft);
  font-size: 0.92rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot-success {
  background-color: var(--success-emerald);
  box-shadow: 0 0 0 4px rgba(56, 211, 159, 0.18);
}

.dot-pending {
  background-color: var(--track-amber);
  box-shadow: 0 0 0 4px rgba(245, 201, 121, 0.18);
}

.result-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 211, 159, 0.28);
  background: var(--success-emerald-soft);
  color: var(--success-emerald);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.result-pill-pending {
  border-color: rgba(245, 201, 121, 0.24);
  background: var(--track-amber-soft);
  color: var(--track-amber);
}

:deep(.fetch-form .v-field) {
  background: rgba(255, 255, 255, 0.03);
}

:deep(.fetch-form .v-field__input),
:deep(.fetch-form .v-label),
:deep(.fetch-form input) {
  color: var(--text-body) !important;
}

@media (max-width: 1080px) {
  .hero-grid,
  .start-layout {
    grid-template-columns: 1fr;
  }

  .model-status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .start-hero,
  .day-list-panel {
    padding: 18px;
  }

  .raceday-row {
    grid-template-columns: 1fr;
  }

  .raceday-row-meta {
    justify-items: start;
  }

  .model-status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
