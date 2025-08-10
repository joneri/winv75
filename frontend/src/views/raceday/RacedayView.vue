<template>
  <v-container class="main-content">
    <v-row>
      <v-col>
        <!-- Display Raceday details if available, else show error message -->
        <div v-if="racedayDetails">
          <div class="raceday-header">
            <div class="titles">
              <div class="title">{{ racedayDetails.trackName }}</div>
              <div class="subtitle">{{ formatDate(racedayDetails.firstStart) }}</div>
            </div>
            <div class="header-actions">
              <div class="games" v-if="racedayGames.length">
                <SpelformBadge v-for="g in racedayGames" :key="g" :game="g" :leg="1" />
              </div>
              <div class="buttons">
                <v-btn color="primary" @click="downloadAiList" :loading="downloading" :disabled="downloading || regenerating">Generera AI-lista</v-btn>
                <v-btn class="ml-2" color="secondary" @click="regenerateAiList" :loading="regenerating" :disabled="downloading || regenerating">Regenerera AI</v-btn>
              </div>
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
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import RaceCardComponent from './components/RaceCardComponent.vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import { useDateFormat } from '@/composables/useDateFormat.js'
import { useRoute } from 'vue-router'
import SpelformBadge from '@/components/SpelformBadge.vue'

export default {
  components: {
    RaceCardComponent,
    SpelformBadge
  },
  setup(props, { root }) {
    const route = useRoute()
    console.log('RacedayView Props:', props);
    console.log('RacedayView Route Params:', route.params);

    const racedayDetails = ref(null)
    const errorMessage = ref(null)
    const downloading = ref(false)
    const regenerating = ref(false)
    const { formatDate } = useDateFormat()
    const reactiveRouteParams = computed(() => route.params)
    const spelformer = ref({})
    const isRecentlyUpdated = (timestamp) => {
      const sixDaysAgo = new Date()
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
      const raceUpdateTime = new Date(timestamp)
      return raceUpdateTime >= sixDaysAgo
    }
    
    onMounted(async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)
        spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Error fetching raceday details. Please try again later.'
        return
      }
    })

    const racedayGames = computed(() => {
      const order = ['V75','V86','V64','V65','GS75','V5','V4','DD']
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

    const sortedRaceList = computed(() => {
      return racedayDetails.value?.raceList.sort((a, b) => a.raceNumber - b.raceNumber) || []
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
        lines.push(`Top ELO: ${r.topByElo.map(h => `${h.programNumber} ${h.name} (${h.elo})`).join(', ')}`)
        lines.push(`Form: ${r.bestForm.map(h => `${h.programNumber} ${h.name} (${h.formScore})`).join(', ')}`)
        if (r.plusPoints.length) {
          lines.push(`Pluspoäng: ${r.plusPoints.map(h => `${h.programNumber} ${h.name} [${h.points.join(', ')}]`).join('; ')}`)
        }
        lines.push(`Ranking: ${r.ranking.map(h => `${h.programNumber} ${h.name}`).join(', ')}`)
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
      racedayGames
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
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  }
  .titles .title { font-size: 1.4rem; font-weight: 700; line-height: 1.2; }
  .titles .subtitle { color: #6b7280; margin-top: 2px; }
  .header-actions { display: flex; align-items: center; gap: 12px; }
  .games { display: flex; gap: 6px; }
  .race-row { margin-bottom: 10px; }
  .error-message { color: red; font-size: 1rem; margin-top: 1rem; }
</style>
