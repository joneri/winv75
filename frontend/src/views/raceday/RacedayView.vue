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
              <div class="buttons">
                <v-btn density="compact" color="primary" @click="downloadAiList" :loading="downloading" :disabled="downloading || regenerating">Generera AI-lista</v-btn>
                <v-btn density="compact" class="ml-2" color="secondary" @click="regenerateAiList" :loading="regenerating" :disabled="downloading || regenerating">Regenerera AI</v-btn>
                <v-btn density="compact" class="ml-2" color="warning" variant="elevated" @click="showV85Modal = true">V85-spelförslag</v-btn>
                <v-btn density="compact" class="ml-2" color="info" variant="tonal" @click="updateV85" :loading="updatingV85" :disabled="updatingV85 || downloading || regenerating">Uppdatera V85%</v-btn>
              </div>
              <div class="v85-status" v-if="v85UpdatedLabel">
                {{ v85UpdatedLabel }}
              </div>
              <div class="v85-status muted" v-else>
                V85% ej hämtad ännu
              </div>
              <div v-if="v85UpdateMessage" class="v85-message">{{ v85UpdateMessage }}</div>
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
    :raceday-id="route.params.racedayId"
  />
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import RaceCardComponent from './components/RaceCardComponent.vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import { useDateFormat } from '@/composables/useDateFormat.js'
import { useRoute } from 'vue-router'
import SpelformBadge from '@/components/SpelformBadge.vue'
import V85SuggestionModal from './components/V85SuggestionModal.vue'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
  components: {
    RaceCardComponent,
    SpelformBadge,
    V85SuggestionModal
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
    const downloading = ref(false)
    const regenerating = ref(false)
    const updatingV85 = ref(false)
    const showV85Modal = ref(false)
    const loading = ref(true)
    const { formatDate } = useDateFormat()
    const reactiveRouteParams = computed(() => route.params)
    const spelformer = ref({})
    const v85UpdateMessage = ref('')
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
      } catch (error) {
        console.error('Error refreshing raceday details:', error)
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
      for (const [game, ids] of Object.entries(spelformer.value)) {
        const idx = ids.indexOf(raceId)
        if (idx !== -1) res.push({ game, leg: idx + 1 })
      }
      return res
    }

    const formatGameSuffix = (games) => {
      if (!games || !games.length) return ''
      return ' ' + games.map(g => `${g.game}-${g.leg}`).join(' ')
    }

    const formatInsights = (data) => {
      const lines = []
      lines.push(`# ${data.raceday.trackName} ${data.raceday.raceDayDate}`)
      const races = [...data.races].sort((a, b) => (a.race?.raceNumber || 0) - (b.race?.raceNumber || 0))
      for (const r of races) {
        const gameSuffix = formatGameSuffix(r.games)
        lines.push(`\nLopp ${r.race.raceNumber}${gameSuffix} (${r.race.distance} m)`)      
        const topFormEloStr = r.topByElo.map(h => `${h.programNumber} ${h.name} (${h.elo})`).join(', ')
        const bestFormStr = r.bestForm.map(h => `${h.programNumber} ${h.name} (${h.formScore})`).join(', ')
        lines.push(`Top Form Elo: ${topFormEloStr}`)
        lines.push(`Form: ${bestFormStr}`)
        if (r.plusPoints.length) {
          const plusStr = r.plusPoints.map(h => `${h.programNumber} ${h.name} [${h.points.join(', ')}]`).join('; ')
          lines.push(`Pluspoäng: ${plusStr}`)
        }
        // Tier summary line
        const tiers = (r.ranking || []).reduce((acc, h) => { acc[h.tier] = (acc[h.tier]||0)+1; return acc }, {})
        const tierStr = ['A','B','C'].filter(t=>tiers[t]).map(t=>`${t}:${tiers[t]}`).join(' ')
        if (tierStr) lines.push(`Tiers: ${tierStr} (by ${r.rankConfig?.tierBy || 'formElo'})`)
        lines.push(`Ranking: ${r.ranking.map(h => `${h.programNumber} ${h.name}`).join(', ')}`)

        // Pretty console logging (browser devtools)
        try {
          if (typeof window !== 'undefined' && window.console) {
            const title = `[AI] ${data.raceday.trackName} — Lopp ${r.race.raceNumber} (${r.race.distance} m)`
            console.groupCollapsed(title)
            console.log('Top Form Elo:', topFormEloStr)
            console.log('Form:', bestFormStr)
            if (r.plusPoints.length) {
              console.log('Pluspoäng:', r.plusPoints.map(h => `${h.programNumber} ${h.name} [${h.points.join(', ')}]`).join('; '))
            }
            if (r.rankConfig) {
              console.log('Rank config:', r.rankConfig)
            }
            console.table((r.ranking || []).map(h => ({
              '#': h.rank,
              Tier: h.tier || '-',
              Nr: h.programNumber,
              Häst: h.name,
              FormElo: h.rating,
              EloTerm: Number(h.eloTerm?.toFixed ? h.eloTerm.toFixed(3) : h.eloTerm),
              Form: h.formScore,
              FormDelta: Number.isFinite(h.formDelta) ? Number(h.formDelta.toFixed ? h.formDelta.toFixed(2) : h.formDelta) : h.formDelta,
              DeltaTerm: Number(h.deltaTerm?.toFixed ? h.deltaTerm.toFixed(3) : h.deltaTerm),
              LegacyFormTerm: Number(h.legacyFormTerm?.toFixed ? h.legacyFormTerm.toFixed(3) : h.legacyFormTerm),
              WinScoreTerm: Number(h.winScoreTerm?.toFixed ? h.winScoreTerm.toFixed(3) : h.winScoreTerm),
              Bonus: Number(h.bonus?.toFixed ? h.bonus.toFixed(3) : h.bonus),
              HandicapAdj: Number(h.handicapAdj?.toFixed ? h.handicapAdj.toFixed(3) : h.handicapAdj),
              Dist: h.baseDistance ? `${h.baseDistance}${h.distanceDiff ? ` (${h.distanceDiff > 0 ? '+' : ''}${h.distanceDiff})` : ''}` : '',
              Pluspoäng: (h.plusPoints || []).join(', '),
              Composite: Number(h.compositeScore?.toFixed ? h.compositeScore.toFixed(3) : h.compositeScore)
            })))
            console.groupEnd()
          }
        } catch {}
      }
      return lines.join('\n')
    }

    const downloadAiList = async () => {
      try {
        downloading.value = true
        const data = await RacedayService.fetchRacedayAiList(route.params.racedayId)
        const text = formatInsights(data)
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.raceday.trackName}-${data.raceday.raceDayDate}-AI.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (e) {
        console.error('Failed to generate AI list', e)
      } finally {
        downloading.value = false
      }
    }

    const regenerateAiList = async () => {
      try {
        regenerating.value = true
        await RacedayService.refreshRacedayAi(route.params.racedayId)
        // Refresh UI data
        await refreshRaceday()
        // Fetch fresh list with force=true and download
        const data = await RacedayService.fetchRacedayAiList(route.params.racedayId, { force: true })
        const text = formatInsights(data)
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.raceday.trackName}-${data.raceday.raceDayDate}-AI.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (e) {
        console.error('Failed to regenerate AI list', e)
      } finally {
        regenerating.value = false
      }
    }

    const updateV85 = async () => {
      try {
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
      downloading,
      downloadAiList,
      regenerating,
      regenerateAiList,
      updateV85,
      racedayGames,
      loading,
      totalRaces,
      formattedFirstStart,
      showV85Modal,
      route,
      updatingV85,
      v85UpdatedLabel,
      v85UpdateMessage
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
  .v85-status { font-size: 0.85rem; color: #1f2933; }
  .v85-status.muted { color: #6b7280; }
  .v85-message { font-size: 0.82rem; color: #2563eb; }
  .race-row { margin-bottom: 10px; }
  .error-message { color: #ef4444; font-size: 0.95rem; margin-top: 1rem; }
  .loading-wrap { padding-top: 24px; }

  @media (prefers-color-scheme: dark) {
    .raceday-header { border-bottom-color: rgba(255,255,255,0.08); }
    .muted { color: #9ca3af; }
    .dot { color: #6b7280; }
    .error-message { color: #f87171; }
    .v85-status { color: #d1d5db; }
    .v85-status.muted { color: #9ca3af; }
    .v85-message { color: #93c5fd; }
  }
</style>
