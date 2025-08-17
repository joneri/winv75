<template>
    <v-container class="tabbed-view-container">
        <RaceHeader
          :current-race="currentRace"
          :raceday-track-name="racedayTrackName"
          :race-meta-string="raceMetaString"
          :track-meta-string="trackMetaString"
          :race-games="raceGames"
          :ai-preset-key="aiPresetKey"
          :ai-preset-label="aiPresetLabel"
          :active-profile="activeProfile"
          :ai-rank-config="aiRankConfig"
          @navigate-to-raceday="navigateToRaceDay"
        />
        <RaceNavigation
          v-if="raceList.length"
          :previous-race-id="previousRaceId"
          :next-race-id="nextRaceId"
          @navigate="goToRace"
        />
        <v-row>
            <v-col>
                <v-tabs v-model="activeTab">
                    <v-tab>Start List</v-tab>
                </v-tabs>
                <v-window v-model="activeTab">
                    <v-window-item value="0">
                    <v-data-table :headers="headers" :items="tableItems" :items-per-page="16"
                            :custom-key-sort="customKeySort"
                            class="elevation-1">
                            <template #item.ai="{ item }">
                              <AiTierCell :ai="aiById[item.raw.id]" />
                            </template>
                            <template #item.programNumber="{ item }">
                              <div class="start-cell">
                                <div class="start-line1">#{{ item.raw.programNumber }} <span v-if="aiById[item.raw.id]?.highlight" class="hl-star" title="Highlight">★</span></div>
                                <div class="start-line2">
                                  <template v-if="raceStartMethod === 'Autostart'">
                                    <span>
                                      {{ (item.raw.actualStartPosition ?? item.raw.startPosition) ? `Spår ${formatStartPosition(item.raw.actualStartPosition ?? item.raw.startPosition)}` : 'oklart' }}
                                    </span>
                                  </template>
                                  <template v-else>
                                    <span v-if="item.raw.actualStartPosition">
                                      {{ `Volte ${formatStartPosition(item.raw.actualStartPosition)}` }}
                                    </span>
                                    <span v-else-if="item.raw.startPosition">
                                      {{ `Startpos ${formatStartPosition(item.raw.startPosition)}` }}
                                    </span>
                                    <span v-else>oklart</span>
                                  </template>
                                </div>
                                <div class="start-line3" v-if="(item.raw.actualDistance || currentRace.distance)">
                                  <span>
                                    {{ (item.raw.actualDistance || currentRace.distance) ? `${(item.raw.actualDistance || currentRace.distance)} m` : '' }}
                                  </span>
                                  <template v-if="item.raw.actualDistance && currentRace.distance && item.raw.actualDistance !== currentRace.distance">
                                    <span class="start-badge" :class="{ longer: item.raw.actualDistance > currentRace.distance, shorter: item.raw.actualDistance < currentRace.distance }">
                                      <template v-if="item.raw.actualDistance > currentRace.distance">
                                        Handicap +{{ item.raw.actualDistance - currentRace.distance }}
                                      </template>
                                      <template v-else>
                                        Försprång −{{ currentRace.distance - item.raw.actualDistance }}
                                      </template>
                                    </span>
                                  </template>
                                </div>
                              </div>
                            </template>
                            <template v-slot:item.numberOfStarts="{ item }">
                                {{ item.raw.numberOfStarts }}
                            </template>
                            <template v-slot:item.eloRating="{ item }">
                                <div :class="{ withdrawn: item.columns.horseWithdrawn }">
                                    <div v-if="(item.raw.numberOfStarts ?? 0) >= 5">
                                        {{ item.raw.name }} – {{ formatElo(item.columns.eloRating) }}
                                    </div>
                                    <div v-else>
                                        {{ item.raw.name }} – För få starter.
                                    </div>
                                    <!-- Unified past performances: Date, Track, Placement, Comment -->
                                    <div class="mt-1">
                                      <div
                                        v-for="(line, idx) in buildUnifiedPastDisplay(item.raw.id, item.raw.recentResultsCore)"
                                        :key="idx"
                                        class="text-caption past-line"
                                      >
                                        {{ line }}
                                      </div>
                                      <div v-if="!buildUnifiedPastDisplay(item.raw.id, item.raw.recentResultsCore).length" class="text-caption past-line">
                                        Inga tidigare starter tillgängliga
                                      </div>
                                    </div>
                                    <!-- AI summary block remains -->
                                    <div class="mt-2">
                                      <v-btn
                                        size="x-small"
                                        variant="outlined"
                                        :loading="aiSummaryLoading[item.raw.id]"
                                        @click="onGenerateSummary(item.raw)"
                                      >
                                        AI-sammanfattning
                                      </v-btn>
                                      <div v-if="aiSummary[item.raw.id] || item.raw.aiSummary" class="ai-summary-block mt-1">
                                        <strong>AI:</strong>
                                        <span style="white-space: pre-line">
                                          {{ (aiSummary[item.raw.id] || item.raw.aiSummary)?.split(/(?<=\.|!|\?)\s+/).join('\n') }}
                                        </span>
                                        <span v-if="(aiSummaryMeta[item.raw.id]?.generatedAt)" class="text-caption text-success ml-2">(sparad)</span>
                                        <span v-else class="text-caption text-warning ml-2">(ny)</span>
                                        <div v-if="aiSummaryMeta[item.raw.id]?.context" class="text-caption mt-1">
                                          Kontext: ELO {{ aiSummaryMeta[item.raw.id].context.eloRating || '—' }}, fält {{ aiSummaryMeta[item.raw.id].context.fieldElo?.median || '—' }}, start {{ aiSummaryMeta[item.raw.id].context.startMethod || '—' }} {{ aiSummaryMeta[item.raw.id].context.startPosition || '—' }}, distans {{ aiSummaryMeta[item.raw.id].context.actualDistance || aiSummaryMeta[item.raw.id].context.baseDistance || '—' }}<template v-if="aiSummaryMeta[item.raw.id].context.hasOpenStretch"> • open stretch (x{{ aiSummaryMeta[item.raw.id].context.openStretchLanes || 1 }})</template>
                                         </div>
                                      </div>
                                      <div v-if="aiSummaryError[item.raw.id]" class="text-error mt-1">
                                        {{ aiSummaryError[item.raw.id] }}
                                      </div>
                                    </div>
                                </div>
                            </template>
                            <template v-slot:item.formRating="{ item }">
                                {{ formatElo(item.raw.formRating ?? item.columns.formRating) }}
                            </template>
                            <template v-slot:item.driverElo="{ item }">
                                {{ item.raw.driver?.name || '—' }} – {{ formatElo(item.columns.driverElo) }}
                            </template>
                            <template v-slot:item.stats="{ item }">
                                {{ item.raw.statsFormatted || '—' }}
                            </template>
                            <template #item.advantages="{ item }">
                                <div class="advantages-wrap">
                                    <template v-if="getAdvantages(item.raw).length">
                                        <template v-for="(chip, idx) in getAdvantages(item.raw).slice(0, maxAdvChips)" :key="chip.key">
                                            <v-chip size="x-small" variant="tonal" class="mr-1 mb-1" :title="chip.tip">
                                                <span class="mr-1">{{ chip.icon }}</span>{{ chip.label }}
                                            </v-chip>
                                        </template>
                                        <template v-if="getAdvantages(item.raw).length > maxAdvChips">
                                            <v-chip size="x-small" variant="outlined" class="mr-1 mb-1" :title="overflowTooltip(item.raw)">
                                                +{{ getAdvantages(item.raw).length - maxAdvChips }}
                                            </v-chip>
                                        </template>
                                    </template>
                                    <template v-else>
                                        —
                                    </template>
                                </div>
                            </template>
                            <template v-slot:item.shoeOption="{ item }">
                                <span :title="startListShoeTooltip(item.raw) || null">
                                    {{ formatStartListShoe(item.raw) }}
                                </span>
                            </template>
                        </v-data-table>
                    </v-window-item>
                </v-window>
            </v-col>
        </v-row>
        <v-row v-if="raceList.length" class="race-navigation">
            <v-col class="d-flex justify-space-between">
                <v-btn variant="text" @click="goToRace(previousRaceId)" :disabled="!previousRaceId">⟵ Previous race</v-btn>
                <v-btn variant="text" @click="goToRace(nextRaceId)" :disabled="!nextRaceId">Next race ⟶</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useRaceMeta } from '@/composables/useRaceMeta.js'
import { getTrackName, getTrackCodeFromName } from '@/utils/track'
import RaceHeader from './components/RaceHeader.vue'
import RaceNavigation from './components/RaceNavigation.vue'
import AiTierCell from './components/AiTierCell.vue'
import {
    fetchRaceFromRaceId,
    fetchHorseScores,
    fetchDriverRatings,
    fetchRaceAiList
} from '@/views/race/services/RaceHorsesService.js'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import TrackService from '@/views/race/services/TrackService.js'
import { fetchHorseSummary, fetchSavedHorseSummary } from '@/ai/horseSummaryClient.js'
import AiProfiles from '@/views/Admin/services/AiProfilesService.js'
import { formatElo, formatStartPosition, formatPct, formatNum } from '@/utils/formatters.js'
import { getShoeById, getShoeTooltipById, formatShoe, shoeTooltip, formatStartListShoe, startListShoeTooltip } from '@/composables/useShoes.js'
import { useStartAdvantages } from '@/composables/useStartAdvantages.js'
import { buildUnifiedPastDisplay } from '@/composables/usePastDisplay.js'

export default {
    name: 'RaceHorsesView',
    components: { RaceHeader, RaceNavigation, AiTierCell },

    setup() {
        const route = useRoute()
        const router = useRouter()
        const store = useStore()

        // raceday / track context
        const racedayDetails = ref(null)
        const racedayTrackName = ref('')
        const racedayTrackCode = ref('')
        const trackMeta = ref({})
        const spelformer = ref({})
        const activeTab = ref('0')

        // --- AI summary state and handler ---
        const aiSummary = ref({})
        const aiSummaryLoading = ref({})
        const aiSummaryError = ref({})
        const aiSummaryMeta = ref({})
        const userId = ref('anon')

        // Per-race AI insights state
        const aiInsights = ref(null)
        const aiById = computed(() => {
          const map = {}
          const list = aiInsights.value?.ranking || []
          for (const h of list) map[h.id] = h
          return map
        })
        const aiRankConfig = computed(() => aiInsights.value?.rankConfig || null)
        const aiPresetKey = computed(() => aiRankConfig.value?.preset || null)

        // Active profile + all profiles (for label/key mapping)
        const activeProfile = ref(null)
        const profiles = ref([])
        const aiPresetLabel = computed(() => {
          const key = aiPresetKey.value
          if (!key) return null
          const p = profiles.value.find(p => p.key === key)
          if (p) return `${p.label} (${key})`
          if (activeProfile.value && activeProfile.value.key === key) return `${activeProfile.value.label} (${key})`
          return null
        })

        const currentRace = computed(() => store.state.raceHorses.currentRace)
        const rankedHorses = computed(() => store.getters['raceHorses/getRankedHorses'])
        const rankedMap = computed(() => new Map((rankedHorses.value || []).map(r => [r.id, r])))

        // Race meta helpers
        const raceStartMethod = computed(() => currentRace.value?.startMethod || currentRace.value?.raceType?.text || '')
        const hasHandicap = computed(() => {
          const base = Number(currentRace.value?.distance || 0)
          const horses = currentRace.value?.horses || []
          return horses.some(h => Number(h.actualDistance || 0) !== base)
        })

        // Advantages builder via composable (same behavior)
        const { maxAdvChips, buildConditionAdvantages, buildPlusAdvantages, getAdvantages, overflowTooltip, getConditionLines } = useStartAdvantages({
          rankedMap,
          racedayTrackCode,
          getTrackName,
          currentRace,
        })

        const tierColor = (tier) => tier === 'A' ? 'green' : tier === 'B' ? 'orange' : 'grey'

        // Custom sort: AI column by A/B/C tier, then probability
        const tierOrderMap = { A: 3, B: 2, C: 1 }
        const customKeySort = computed(() => ({
          // We store horse.id in each row's `ai` field and look up details from aiById
          ai: (idA, idB) => {
            const A = (aiById.value && aiById.value[idA]) || {}
            const B = (aiById.value && aiById.value[idB]) || {}
            const tA = tierOrderMap[A.tier] || 0
            const tB = tierOrderMap[B.tier] || 0
            if (tA !== tB) return tA - tB // ascending: C < B < A
            const pA = Number(A.prob || 0)
            const pB = Number(B.prob || 0)
            if (pA !== pB) return pA - pB // ascending by prob
            return 0
          }
        }))

        // Data-table headers used by the Start List
        const headers = [
          { title: 'AI', key: 'ai', sortable: true, width: 84 },
          { title: '# / Start', key: 'programNumber', sortable: true, width: 120 },
          { title: 'Häst och info', key: 'eloRating', sortable: true, width: 520 },
          { title: 'Form Elo', key: 'formRating', align: 'end', width: 110 },
          { title: 'Kusk', key: 'driverElo', align: 'end', width: 110 },
          { title: 'Stats', key: 'stats', sortable: false, width: 180 },
          { title: 'Fördelar', key: 'advantages', sortable: false, width: 220 },
          { title: 'Skor', key: 'shoeOption', sortable: false, width: 110 },
        ]

        const tableItems = computed(() => {
          const arr = currentRace.value?.horses || []
          return arr.map(h => ({ ...h, ai: h.id }))
        })

        // Fetch race, ratings and set into store
        const fetchDataAndUpdate = async (raceId) => {
          if (!raceId) return
          try {
            const race = await fetchRaceFromRaceId(raceId)
            store.commit('raceHorses/setCurrentRace', race)
            const horseIds = (race.horses || []).map(h => h.id)
            // Preload ratings and scores (kept for parity; backend may use cached values)
            try { await fetchHorseScores(horseIds) } catch {}
            try { await fetchDriverRatings((race.horses || []).map(h => h.driverId).filter(Boolean)) } catch {}
            // Rank horses for this race
            await store.dispatch('raceHorses/rankHorses', raceId)
          } catch (e) {
            console.error('Failed to fetch race', e)
          }
        }

        // AI summary generator
        const onGenerateSummary = async (horse) => {
          if (!horse || !currentRace.value?.raceId) return
          const hid = horse.id
          try {
            aiSummaryLoading.value[hid] = true
            aiSummaryError.value[hid] = ''
            const summary = await fetchHorseSummary({
              eloRating: horse.columns?.eloRating ?? horse.eloRating,
              numberOfStarts: horse.numberOfStarts,
              startMethod: raceStartMethod.value,
              startPosition: horse.actualStartPosition || horse.startPosition || null,
              actualDistance: horse.actualDistance || null,
              baseDistance: currentRace.value?.distance || null,
              hasOpenStretch: !!trackMeta.value?.hasOpenStretch,
              openStretchLanes: trackMeta.value?.openStretchLanes || 1,
            }, currentRace.value.raceId, hid, userId.value)
            aiSummary.value[hid] = summary
            aiSummaryMeta.value[hid] = {
              generatedAt: new Date().toISOString(),
              context: {
                eloRating: horse.columns?.eloRating ?? horse.eloRating,
                fieldElo: { median: (rankedHorses.value || []).reduce((acc, h, _, arr) => acc + (((h.columns?.eloRating ?? h.eloRating) || 0) / (arr.length || 1)), 0) },
                startMethod: raceStartMethod.value,
                startPosition: horse.actualStartPosition || horse.startPosition || null,
                actualDistance: horse.actualDistance || null,
                baseDistance: currentRace.value?.distance || null,
                hasOpenStretch: !!trackMeta.value?.hasOpenStretch,
                openStretchLanes: trackMeta.value?.openStretchLanes || 1,
              }
            }
          } catch (e) {
            console.error('AI summary failed', e)
            aiSummaryError.value[hid] = 'AI-summary misslyckades. Försök igen.'
          } finally {
            aiSummaryLoading.value[hid] = false
          }
        }

        // Race meta strings and games badges
        const { raceMetaString, trackMetaString, raceGames } = useRaceMeta({
          currentRace,
          trackMeta,
          spelformer,
          racedayTrackCode,
          raceStartMethod,
          hasHandicap,
        })

        const fetchAi = async () => {
          try {
            const raceId = route.params.raceId
            if (!raceId) return
            aiInsights.value = await fetchRaceAiList(raceId)
          } catch (e) {
            console.warn('Failed to fetch AI insights', e)
          }
        }

        const fetchActiveProfile = async () => {
          try {
            activeProfile.value = await AiProfiles.active()
          } catch (e) {
            // ignore
          }
        }
        const fetchProfiles = async () => {
          try {
            profiles.value = await AiProfiles.list()
          } catch {}
        }

        const navigateToRaceDay = (raceDayId) => {
            const currentPath = router.currentRoute.value.fullPath
            const segments = currentPath.split('/')
            const derivedId = segments[2]
            const id = raceDayId || derivedId
            if (id) router.push(`/raceday/${id}`)
        }

        const raceList = computed(() => {
            return racedayDetails.value?.raceList?.sort((a, b) => a.raceNumber - b.raceNumber) || []
        })
        const currentRaceIndex = computed(() => {
            return raceList.value.findIndex(r => String(r.raceId) === String(route.params.raceId))
        })
        const previousRaceId = computed(() => {
            return currentRaceIndex.value > 0 ? raceList.value[currentRaceIndex.value - 1].raceId : null
        })
        const nextRaceId = computed(() => {
            return currentRaceIndex.value !== -1 && currentRaceIndex.value < raceList.value.length - 1
                ? raceList.value[currentRaceIndex.value + 1].raceId
                : null
        })
        const scrollPosition = ref(0)

        const goToRace = (raceId) => {
            if (!raceId) return
            const racedayId = route.params.racedayId
            if (racedayId) router.push(`/raceday/${racedayId}/race/${raceId}`)
            else router.push(`/race/${raceId}`)
        }

        const fetchTrackInfo = async () => {
            if (route.params.racedayId) {
                try {
                    const details = await RacedayService.fetchRacedayDetails(route.params.racedayId)
                    racedayDetails.value = details
                    racedayTrackName.value = details.trackName
                    racedayTrackCode.value = getTrackCodeFromName(details.trackName)
                } catch (error) {
                    console.error('Failed to fetch raceday details:', error)
                }
            } else if (currentRace.value.trackName) {
                racedayTrackName.value = currentRace.value.trackName
                racedayTrackCode.value = getTrackCodeFromName(currentRace.value.trackName)
            } else if (currentRace.value.trackCode) {
                racedayTrackCode.value = currentRace.value.trackCode
                racedayTrackName.value = getTrackName(currentRace.value.trackCode)
            }

            if (racedayTrackCode.value) {
                try {
                    trackMeta.value = await TrackService.getTrackByCode(racedayTrackCode.value) || {}
                } catch (error) {
                    console.error('Failed to fetch track metadata:', error)
                    trackMeta.value = {}
                }
            } else {
                trackMeta.value = {}
            }
        }

        const fetchSpelformer = async () => {
            if (route.params.racedayId) {
                try {
                    spelformer.value = await RacedayService.fetchSpelformer(route.params.racedayId)
                } catch (error) {
                    console.error('Failed to fetch spelformer:', error)
                }
            }
        }

        onMounted(async () => {
            const raceId = route.params.raceId
            await fetchDataAndUpdate(raceId)
            await fetchTrackInfo()
            await fetchSpelformer()
            await fetchAi()
            // Preload saved AI summaries for horses in this race
            try {
              const horses = currentRace.value?.horses || []
              for (const h of horses) {
                const saved = await fetchSavedHorseSummary(raceId, h.id)
                if (saved.summary) aiSummary.value[h.id] = saved.summary
                if (saved.meta) aiSummaryMeta.value[h.id] = saved.meta
              }
            } catch {}
            await fetchActiveProfile()
            await fetchProfiles()
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.raceId, async (newRaceId) => {
            store.commit('raceHorses/clearRankedHorses')
            store.commit('raceHorses/clearCurrentRace')
            aiSummary.value = {}
            aiSummaryMeta.value = {}
            aiInsights.value = null
            await fetchDataAndUpdate(newRaceId)
            await fetchTrackInfo()
            await fetchSpelformer()
            await fetchAi()
            try {
              const horses = currentRace.value?.horses || []
              for (const h of horses) {
                const saved = await fetchSavedHorseSummary(newRaceId, h.id)
                if (saved.summary) aiSummary.value[h.id] = saved.summary
                if (saved.meta) aiSummaryMeta.value[h.id] = saved.meta
              }
            } catch {}
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.racedayId, async () => {
            await fetchTrackInfo()
            await fetchSpelformer()
        })

        return {
            // core
            route,
            router,
            store,
            aiSummary,
            aiSummaryLoading,
            aiSummaryError,
            aiSummaryMeta,
            headers,
            racedayTrackName,
            racedayTrackCode,
            navigateToRaceDay,
            currentRace,
            activeTab,
            raceList,
            previousRaceId,
            nextRaceId,
            goToRace,
            raceStartMethod,
            hasHandicap,
            // shoe helpers
            formatStartListShoe,
            startListShoeTooltip,
            formatShoe,
            shoeTooltip,
            getShoeById,
            getShoeTooltipById,
            // advantages
            getConditionLines,
            maxAdvChips,
            getAdvantages,
            overflowTooltip,
            // number/pct formatters for AI block
            formatElo,
            formatPct,
            formatNum,
            formatStartPosition,
            tierColor,
            customKeySort,
            aiById,
            aiRankConfig,
            aiPresetKey,
            aiPresetLabel,
            activeProfile,
            profiles,
            tableItems,
            // past display
            buildUnifiedPastDisplay,
            raceMetaString,
            trackMetaString,
            raceGames,
            onGenerateSummary,
        }
    }
}
</script>

<style>
.tabbed-view-container {
    margin-top: 64px;
}

.race-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
.race-header .titles { display: grid; gap: 2px; }
.race-header .title { font-size: 1.35rem; font-weight: 700; line-height: 1.2; }
.race-header .subtitle { color: #6b7280; }
.race-header .meta, .race-header .meta2 { color: #6b7280; font-size: 0.95rem; }
.race-header .games { display: flex; gap: 6px; }
.ai-coverage { font-size: 0.85rem; }
.coverage-bar { position: relative; height: 6px; width: 120px; background: #e5e7eb; border-radius: 999px; margin-top: 4px; }
.coverage-fill { height: 100%; background: #10b981; border-radius: 999px; }

/* AI cell: tier chip + probability bar */
.ai-cell { display: grid; gap: 4px; align-items: center; }
.tier-chip { min-width: 28px; justify-content: center; }
.tier-chip.highlight { border: 1px solid #f59e0b; background: rgba(245, 158, 11, 0.1); color: #92400e; }
.prob-bar { height: 6px; width: 76px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.prob-bar.a { background: #d1fae5; }
.prob-bar.hl { box-shadow: inset 0 0 0 1px #f59e0b, inset 0 0 10px rgba(245, 158, 11, 0.35); }
.prob-fill { height: 100%; background: #60a5fa; }

/* AI summary panel: compact, scrollable, theme-aware */
.ai-summary-block {
  max-height: 140px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.35;
  padding: 8px;
  background: #f9fafb;      /* light bg */
  color: #111827;            /* light fg */
  border: 1px solid #e5e7eb; /* light border */
  border-radius: 6px;
}

/* Past races readability */
.past-line { color: #374151; }

/* Prefer dark overrides (OS setting) */
@media (prefers-color-scheme: dark) {
  .ai-summary-block {
    background: #000;       /* pure black per user preference */
    color: #e5e7eb;         /* light gray text */
    border-color: #222;     /* subtle dark border */
  }
  .prob-bar { background: #374151; }
  .prob-bar.a { background: #064e3b; }
  .prob-bar.hl { box-shadow: inset 0 0 0 1px #f59e0b, inset 0 0 10px rgba(245, 158, 11, 0.45); }
  .prob-fill { background: #60a5fa; }
  .tier-chip.highlight { border-color: #fbbf24; background: rgba(251, 191, 36, 0.12); color: #fde68a; }
  .past-line { color: #cbd5e1; }
}

/* Vuetify dark theme override (app-level) */
.v-theme--dark .ai-summary-block {
  background: #000;       /* pure black */
  color: #e5e7eb;         /* readable text */
  border-color: #222;     /* subtle border */
}

.race-meta { margin-top: 4px; margin-bottom: 8px; }
.track-meta { margin-bottom: 12px; }
.race-navigation { margin-top: 16px; }
.withdrawn { text-decoration: line-through; }

/* Simple layout for chips area */
.advantages-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* Unified Start cell styling */
.start-cell { display: grid; grid-auto-rows: min-content; line-height: 1.1; }
.start-line1 { font-weight: 600; }
.start-line2 { font-size: 0.85rem; color: #6b7280; }
.start-line3 { font-size: 0.85rem; color: #6b7280; display: flex; align-items: center; gap: 6px; }
.start-badge { font-size: 0.72rem; padding: 1px 6px; border-radius: 999px; border: 1px solid #e5e7eb; }
.start-badge.longer { background: #fff7ed; color: #9a3412; border-color: #fdba74; }
.start-badge.shorter { background: #ecfeff; color: #155e75; border-color: #67e8f9; }

/* Highlight star */
.hl-star { color: #f59e0b; margin-left: 4px; }

@media (prefers-color-scheme: dark) {
  .start-line2, .start-line3 { color: #9ca3af; }
  .start-badge { border-color: #374151; }
  .start-badge.longer { background: #3b2518; color: #fdba74; border-color: #7c2d12; }
  .start-badge.shorter { background: #082f35; color: #67e8f9; border-color: #164e63; }
}
.ai-preset { margin-top: 4px; }
</style>
