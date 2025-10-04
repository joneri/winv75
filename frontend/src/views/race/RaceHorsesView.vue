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
                    <v-window-item :value="0">
                    <v-data-table :headers="headers" :items="tableItems" :items-per-page="16"
                            :custom-key-sort="customKeySort"
                            :must-sort="false"
                            :multi-sort="false"
                            class="elevation-1">
                            <template v-slot:[`item.ai`]="slotProps">
                              <AiTierCell :ai="aiById[(slotProps?.value ?? slotRow(slotProps)?.id)]" />
                            </template>
                            <template v-slot:[`item.programNumber`]="slotProps">
                              <div class="start-cell">
                                <div class="start-line1">#{{ (slotProps?.value ?? slotRow(slotProps)?.programNumber) }} <span v-if="aiById[slotRow(slotProps)?.id]?.highlight" class="hl-star" title="Highlight">★</span></div>
                                <div class="start-line2">
                                  <template v-if="raceStartMethod === 'Autostart'">
                                    <span>
                                      {{ (slotRow(slotProps)?.actualStartPosition ?? slotRow(slotProps)?.startPosition) ? `Spår ${formatStartPosition(slotRow(slotProps)?.actualStartPosition ?? slotRow(slotProps)?.startPosition)}` : 'oklart' }}
                                    </span>
                                  </template>
                                  <template v-else>
                                    <span v-if="slotRow(slotProps)?.actualStartPosition">
                                      {{ `Volte ${formatStartPosition(slotRow(slotProps)?.actualStartPosition)}` }}
                                    </span>
                                    <span v-else-if="slotRow(slotProps)?.startPosition">
                                      {{ `Startpos ${formatStartPosition(slotRow(slotProps)?.startPosition)}` }}
                                    </span>
                                    <span v-else>oklart</span>
                                  </template>
                                </div>
                                <div class="start-line3" v-if="(slotRow(slotProps)?.actualDistance || currentRace.distance)">
                                  <span>
                                    {{ (slotRow(slotProps)?.actualDistance || currentRace.distance) ? `${(slotRow(slotProps)?.actualDistance || currentRace.distance)} m` : '' }}
                                  </span>
                                  <template v-if="slotRow(slotProps)?.actualDistance && currentRace.distance && slotRow(slotProps)?.actualDistance !== currentRace.distance">
                                    <span class="start-badge" :class="{ longer: slotRow(slotProps)?.actualDistance > currentRace.distance, shorter: slotRow(slotProps)?.actualDistance < currentRace.distance }">
                                      <template v-if="slotRow(slotProps)?.actualDistance > currentRace.distance">
                                        Handicap +{{ slotRow(slotProps)?.actualDistance - currentRace.distance }}
                                      </template>
                                      <template v-else>
                                        Försprång −{{ currentRace.distance - slotRow(slotProps)?.actualDistance }}
                                      </template>
                                    </span>
                                  </template>
                                </div>
                              </div>
                            </template>
                            <template v-slot:[`item.eloRating`]="slotProps">
                                <div :class="{ withdrawn: slotRow(slotProps)?.columns?.horseWithdrawn }">
                                    <template v-if="true">
                                      <div>
                                        {{ slotRow(slotProps)?.name || '—' }} – {{ formatElo(Number(slotProps?.value ?? getEloFor(slotRow(slotProps) || {}))) }}
                                      </div>
                                    </template>
                                    <!-- Unified past performances: Date, Track, Placement, Comment -->
                                    <div class="mt-1">
                                      <div
                                        v-for="(line, idx) in buildUnifiedPastDisplay(slotRow(slotProps)?.id, recentCoreFor(slotRow(slotProps) || {}))"
                                        :key="idx"
                                        class="text-caption past-line"
                                      >
                                        {{ line }}
                                      </div>
                                      <div v-if="buildUnifiedPastDisplay(slotRow(slotProps)?.id, recentCoreFor(slotRow(slotProps) || {})).length === 0" class="text-caption past-line">
                                        Inga tidigare starter tillgängliga
                                      </div>
                                    </div>
                                    <!-- AI summary block remains -->
                                    <div class="mt-2">
                                      <v-btn
                                        size="x-small"
                                        variant="outlined"
                                        :loading="aiSummaryLoading[slotRow(slotProps)?.id]"
                                        @click="onGenerateSummary(slotRow(slotProps) || null)"
                                      >
                                        AI-sammanfattning
                                      </v-btn>
                                      <div v-if="aiSummary[slotRow(slotProps)?.id] || slotRow(slotProps)?.aiSummary" class="ai-summary-block mt-1">
                                        <strong>AI:</strong>
                                        <span style="white-space: pre-line">
                                          {{ (aiSummary[slotRow(slotProps)?.id] || slotRow(slotProps)?.aiSummary)?.split(/(?<=\.|!|\?)\s+/).join('\n') }}
                                        </span>
                                        <span v-if="(aiSummaryMeta[slotRow(slotProps)?.id]?.generatedAt)" class="text-caption text-success ml-2">(sparad)</span>
                                        <span v-else class="text-caption text-warning ml-2">(ny)</span>
                                        <div v-if="aiSummaryMeta[slotRow(slotProps)?.id]?.context" class="text-caption mt-1">
                                          Kontext: ELO {{ aiSummaryMeta[slotRow(slotProps)?.id].context.eloRating || '—' }}, fält {{ aiSummaryMeta[slotRow(slotProps)?.id].context.fieldElo?.median || '—' }}, start {{ aiSummaryMeta[slotRow(slotProps)?.id].context.startMethod || '—' }} {{ aiSummaryMeta[slotRow(slotProps)?.id].context.startPosition || '—' }}, distans {{ aiSummaryMeta[slotRow(slotProps)?.id].context.actualDistance || aiSummaryMeta[slotRow(slotProps)?.id].context.baseDistance || '—' }}<template v-if="aiSummaryMeta[slotRow(slotProps)?.id].context.hasOpenStretch"> • open stretch (x{{ aiSummaryMeta[slotRow(slotProps)?.id].context.openStretchLanes || 1 }})</template>
                                         </div>
                                      </div>
                                      <div v-if="aiSummaryError[slotRow(slotProps)?.id]" class="text-error mt-1">
                                        {{ aiSummaryError[slotRow(slotProps)?.id] }}
                                      </div>
                                    </div>
                                </div>
                            </template>
                            <template v-slot:[`item.formRating`]="slotProps">
                              {{ formatElo(Number(slotProps?.value ?? getFormEloFor(slotRow(slotProps)))) }}
                            </template>
                            <template v-slot:[`item.driverName`]="slotProps">
                              {{ (slotProps?.value ?? slotRow(slotProps)?.driver?.name) || '—' }}
                            </template>
                            <template v-slot:[`item.driverElo`]="slotProps">
                              {{ formatElo(Number(slotProps?.value ?? getDriverEloFor(slotRow(slotProps)))) }}
                            </template>
                            <template v-slot:[`item.statsScore`]="slotProps">
                                <div class="stats-cell">
                                  <div class="form-row">
                                    <span class="form-label">Form {{ (Number(slotProps?.value ?? getStatsDetails(slotRow(slotProps)).formScore) ?? '—') }}/10</span>
                                    <div class="form-bar" :class="formColorClass(Number(slotProps?.value ?? getStatsDetails(slotRow(slotProps)).formScore))">
                                      <div class="form-fill" :style="{ width: ((Number(slotProps?.value ?? getStatsDetails(slotRow(slotProps)).formScore) || 0) * 10) + '%' }"></div>
                                    </div>
                                  </div>
                                  <div class="stats-row">
                                    <span class="stats-pair"><strong>{{ getStatsDetails(slotRow(slotProps)).wins ?? '—' }}</strong>/{{ getStatsDetails(slotRow(slotProps)).starts ?? '—' }}</span>
                                    <span class="sep">•</span>
                                    <span class="pct">{{ getStatsDetails(slotRow(slotProps)).placePct != null ? (Math.round(getStatsDetails(slotRow(slotProps)).placePct) + '% plats') : (getStatsDetails(slotRow(slotProps)).winPct != null ? (Math.round(getStatsDetails(slotRow(slotProps)).winPct) + '% vinst') : '—') }}</span>
                                  </div>
                                </div>
                            </template>
                            <template v-slot:[`item.advantages`]="slotProps">
                                <div class="advantages-wrap">
                                    <template v-if="getAdvantages(slotRow(slotProps)).length">
                                        <template v-for="(chip, idx) in getAdvantages(slotRow(slotProps)).slice(0, maxAdvChips)" :key="chip.key">
                                            <v-chip size="x-small" variant="tonal" class="mr-1 mb-1" :title="chip.tip">
                                                <span class="mr-1">{{ chip.icon }}</span>{{ chip.label }}
                                            </v-chip>
                                        </template>
                                        <template v-if="getAdvantages(slotRow(slotProps)).length > maxAdvChips">
                                            <v-chip size="x-small" variant="outlined" class="mr-1 mb-1" :title="overflowTooltip(slotRow(slotProps))">
                                                +{{ getAdvantages(slotRow(slotProps)).length - maxAdvChips }}
                                            </v-chip>
                                        </template>
                                    </template>
                                    <template v-else>
                                        —
                                    </template>
                                </div>
                            </template>
                            <template v-slot:[`item.shoeOption`]="slotProps">
                                <span :title="startListShoeTooltip(slotRow(slotProps)) || null">
                                    {{ formatStartListShoe(slotRow(slotProps)) || (slotProps?.value ?? '—') }}
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
    fetchRaceAiList
} from '@/views/race/services/RaceHorsesService.js'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import TrackService from '@/views/race/services/TrackService.js'
import { fetchHorseSummary, fetchSavedHorseSummary } from '@/ai/horseSummaryClient.js'
import AiProfiles from '@/views/Admin/services/AiProfilesService.js'
import { formatElo, formatStartPosition } from '@/utils/formatters.js'
import { formatStartListShoe, startListShoeTooltip } from '@/composables/useShoes.js'
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
        const activeTab = ref(0)

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
        const { maxAdvChips, getAdvantages, overflowTooltip } = useStartAdvantages({
          rankedMap,
          racedayTrackCode,
          getTrackName,
          currentRace,
          trackMeta,
        })

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
          },
          // Sort Stats by numeric form score (0–10)
          statsScore: (a, b) => Number(a || 0) - Number(b || 0)
        }))

        // Data-table headers used by the Start List
        const headers = [
          { title: 'AI', key: 'ai', sortable: true, width: 84 },
          { title: '# / Start', key: 'programNumber', sortable: true, width: 120 },
          { title: 'Häst och info', key: 'eloRating', sortable: true, width: 520 },
          { title: 'Form Elo', key: 'formRating', sortable: true, align: 'end', width: 110 },
          { title: 'Kusk', key: 'driverName', sortable: false, width: 160 },
          { title: 'Kusk Form Elo', key: 'driverElo', sortable: true, align: 'end', width: 130 },
          { title: 'Stats', key: 'statsScore', sortable: true, width: 220 },
          { title: 'Fördelar', key: 'advantages', sortable: false, width: 220 },
          { title: 'Skor', key: 'shoeOption', sortable: false, width: 110 },
        ]

        // Helper to normalize Vuetify 3 data-table slot item to raw row
        const slotRow = (slotItem) => {
          // Prefer the full row over a cell value to avoid blank cells when key has a primitive value
          // Common shapes across Vuetify versions/builds:
          // - slotProps.item or slotProps.item.raw is the full row
          // - slotProps.raw
          // - slotProps.internalItem.raw
          // Fallbacks last: internalItem.value, value, item.value
          return slotItem?.item?.raw
            ?? slotItem?.raw
            ?? slotItem?.internalItem?.raw
            ?? slotItem?.item
            ?? slotItem?.internalItem?.value
            ?? slotItem?.value
            ?? slotItem?.item?.value
            ?? slotItem
        }

        // Helper to get the primitive cell value from a slot (when available)
        const slotVal = (slotItem) => slotItem?.value ?? slotItem?.item?.value ?? slotItem?.internalItem?.value ?? null

        // NOTE: Use function declarations so they are hoisted and available to computed/template
        function getEloFor(horse) {
          if (!horse) return 0
          // Prefer values on the row/horse first
          let val = horse?.columns?.eloRating
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) val = horse?.columns?.rating
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) val = horse?.eloRating
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) val = horse?.rating
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) val = horse?.stats?.eloRating

          // Fallback to ranked map for this horse
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            const ranked = rankedMap.value.get(horse.id)
            val = ranked?.columns?.eloRating
              ?? ranked?.columns?.rating
              ?? ranked?.eloRating
              ?? ranked?.rating
          }

          return Number(val) || 0
        }

        function getFormEloFor(horse) {
          if (!horse) return 0
          // Prefer formRating on row/columns
          let val = horse?.formRating ?? horse?.columns?.formRating

          // Fallback to ranked map
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            const ranked = rankedMap.value.get(horse.id)
            val = ranked?.formRating ?? ranked?.columns?.formRating
          }

          return Number(val) || 0
        }

        function getDriverEloFor(horse) {
          if (!horse) return 0
          let val = horse?.driver?.elo ?? horse?.driverElo
          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) val = horse?.columns?.driverElo

          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            const ranked = rankedMap.value.get(horse.id)
            val = ranked?.driverElo ?? ranked?.driver?.elo ?? ranked?.columns?.driverElo
          }

          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            const fromRace = currentRace.value?.horses?.find(h => h.id === horse.id)
            val = fromRace?.driver?.elo
          }

          return Number(val) || 0
        }

        const tableItems = computed(() => {
          const arr = currentRace.value?.horses || []
          const rmap = rankedMap.value
          return arr.map(h0 => {
            const rm = rmap.get(h0.id) || {}
            const driverFromRace = h0.driver || null
            const driverFromRanking = rm.driver || null
            let mergedDriver = driverFromRace ? { ...driverFromRace } : (driverFromRanking ? { ...driverFromRanking } : null)
            if (driverFromRanking) {
              if (driverFromRanking.elo != null) mergedDriver = { ...(mergedDriver || {}), elo: driverFromRanking.elo }
              if (driverFromRanking.careerElo != null) mergedDriver = { ...(mergedDriver || {}), careerElo: driverFromRanking.careerElo }
            }
            const merged = {
              ...h0,
              // Fill from ranked data when missing in race.horses
              name: h0.name || rm.name || h0.name,
              programNumber: h0.programNumber ?? rm.programNumber ?? h0.programNumber,
              driver: mergedDriver || h0.driver || rm.driver,
            }
            return {
              ...merged,
              ai: merged.id,
              eloRating: getEloFor(merged),
              formRating: getFormEloFor(merged),
              driverElo: getDriverEloFor(merged),
              driverName: merged?.driver?.name || '—',
              statsScore: computeFormLast5(merged) ?? 0,
              // No precomputed stats string stored; use getter in slot
            }
          })
        })

        // Helpers: past results source resolution and starts threshold
        const recentFromExtended = (horseOrId) => {
          try {
            const raw = currentRace.value?.atgExtendedRaw || {}
            let starts = []
            if (Array.isArray(raw.starts)) starts = raw.starts
            else if (Array.isArray(raw.races)) {
              // flatten all starts from races[]
              starts = raw.races.flatMap(r => Array.isArray(r?.starts) ? r.starts : [])
            }
            if (!Array.isArray(starts) || !starts.length) return []

            const id = typeof horseOrId === 'object' ? horseOrId.id : horseOrId
            const name = typeof horseOrId === 'object' ? (horseOrId.name || '') : ''
            const prog = typeof horseOrId === 'object' ? (horseOrId.programNumber || horseOrId.startNumber || null) : null

            let st = starts.find(s => String(s?.horse?.id) === String(id))
            if (!st && prog != null) st = starts.find(s => String(s?.number) === String(prog))
            if (!st && name) st = starts.find(s => String(s?.horse?.name || '').toLowerCase() === String(name).toLowerCase())
            if (!st) return []
            const res = st.horse?.results || st.results || raw?.horseResults
            // Case A: Array of past results
            if (Array.isArray(res) && res.length) {
              return res
                .filter(r => {
                  const type = (r?.race?.type || r?.type || '').toLowerCase()
                  return !type.includes('qual')
                })
                .map(r => {
                  // Try to surface a meaningful comment from records if present
                  let comment = ''
                  const recs = Array.isArray(r?.records) ? r.records : []
                  const withComment = recs.find(x => x?.trMediaInfo?.comment?.trim())
                  if (withComment) comment = String(withComment.trMediaInfo.comment).trim()
                  return {
                    date: r?.race?.date || r?.date || r?.startTime,
                    trackName: r?.race?.track?.name || r?.race?.track || r?.track,
                    placement: r?.place || r?.placement || r?.position,
                    time: r?.time || r?.kmTime || r?.resultTime,
                    distance: r?.race?.distance || r?.distance,
                    comment,
                  }
                })
                .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                .slice(0, 5)
            }
            // Case B: Object with records[] only (no past results array)
            if (res && typeof res === 'object' && Array.isArray(res.records) && res.records.length) {
              return res.records
                .map(rec => ({
                  date: rec?.date,
                  trackName: null,
                  placement: rec?.place ?? null,
                  time: null,
                  distance: null,
                  comment: rec?.trMediaInfo?.comment?.trim() || '',
                }))
                .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                .slice(0, 5)
            }
            return []
          } catch {
            return []
          }
        }
        const recentCoreFor = (horse) => {
          if (!horse) return []
          const a = horse.recentResultsCore
          if (Array.isArray(a) && a.length) return a
          const b = horse.recentResults
          if (Array.isArray(b) && b.length) return b
          const c = horse.recentStarts || horse.pastResults || horse.results
          if (Array.isArray(c) && c.length) return c
          // Final fallback: derive from extended race data stored at race level
          return recentFromExtended(horse)
        }
        const getNumberOfStarts = (horse) => {
          if (!horse) return 0
          const ranked = rankedMap.value.get(horse.id)
          const raw = ranked?.numberOfStarts ?? horse.numberOfStarts ?? horse.stats?.numberOfStarts ?? 0
          let num = Number(raw)
          if (!Number.isFinite(num)) {
            const digits = parseInt(String(raw).replace(/[^0-9]/g, ''), 10)
            num = Number.isFinite(digits) ? digits : 0
          }
          return num
        }
        const hasEnoughStarts = (horse) => getNumberOfStarts(horse) >= 5

        // Compute 0–10 form based on last 5 valid placements (1st=3p, 2nd=2p, 3rd=1p)
        function computeFormLast5(horse) {
           const recent = recentCoreFor(horse)
           if (!Array.isArray(recent) || !recent.length) return null

           // Robust parser for placement-like values
           const toPlace = (val) => {
             if (val == null) return null
             if (typeof val === 'number') {
               const n = Number(val)
               return Number.isFinite(n) && n > 0 && n < 99 ? n : null
             }
             if (typeof val === 'string') {
               // Extract first group of digits (e.g., "1", "1/2140", "np/99")
               const m = val.match(/\d+/)
               if (!m) return null
               const n = parseInt(m[0], 10)
               return Number.isFinite(n) && n > 0 && n < 99 ? n : null
             }
             if (typeof val === 'object') {
               // Common nested patterns
               const cand = [val.sortValue, val.place, val.value]
               for (const c of cand) {
                 const n = toPlace(c)
                 if (n != null) return n
               }
               return null
             }
             return null
           }

           const extractPlace = (e) => {
             // Direct primitive entry
             if (typeof e === 'number' || typeof e === 'string') return toPlace(e)
             if (!e || typeof e !== 'object') return null
             const cand = [
               e.placement?.sortValue,
               e.placement?.place,
               e.placement,            // may be a primitive ("1")
               e.place?.sortValue,
               e.place,
               e.position?.sortValue,
               e.position,
               e.pos?.sortValue,
               e.pos
             ]
             for (const c of cand) {
               const n = toPlace(c)
               if (n != null) return n
             }
             return null
           }

           const places = []
           for (const entry of recent) {
             const p = extractPlace(entry)
             if (p != null) places.push(p)
             if (places.length >= 5) break
           }
           if (!places.length) return null

           let points = 0
           for (const p of places) {
             if (p === 1) points += 3
             else if (p === 2) points += 2
             else if (p === 3) points += 1
           }
           const maxPoints = 5 * 3
           const score = Math.round((points / maxPoints) * 10)
           return score
        }

        // Structured stats for pretty rendering in the Stats column
        function getStatsDetails(horse) {
          if (!horse) return { starts: null, wins: null, placePct: null, winPct: null, formScore: null }
          const ranked = rankedMap.value.get(horse.id) || {}
          const stats = horse.stats || {}

          const toNum = (v) => {
            if (v == null) return NaN
            if (typeof v === 'string') {
              const cleaned = v.replace(/%/g, '').trim()
              const n = Number(cleaned)
              return Number.isFinite(n) ? n : NaN
            }
            const n = Number(v)
            return Number.isFinite(n) ? n : NaN
          }

          const starts = toNum(ranked.numberOfStarts ?? horse.numberOfStarts ?? stats.numberOfStarts)
          const placementsStr = ranked.placements ?? stats.placements
          let wins = null
          if (typeof placementsStr === 'string' && placementsStr.includes('-')) {
            const [a] = placementsStr.split('-')
            const an = parseInt(a, 10)
            if (Number.isFinite(an)) wins = an
          }
          if (wins == null) {
            const maybeWins = toNum(stats.wins ?? ranked.wins)
            if (Number.isFinite(maybeWins)) wins = maybeWins
          }

          const placePct = toNum(ranked.placementRatesNumeric ?? ranked.placementRates ?? stats.placePct ?? stats.placementRate)
          const winPct = toNum(ranked.winningRateNumeric ?? stats.winPct)

          const formScore = computeFormLast5(horse)

          return {
            starts: Number.isFinite(starts) ? starts : null,
            wins: Number.isFinite(wins) ? wins : null,
            placePct: Number.isFinite(placePct) ? placePct : null,
            winPct: Number.isFinite(winPct) ? winPct : null,
            formScore: Number.isFinite(formScore) ? formScore : null,
          }
        }

        function formColorClass(score) {
          const s = Number(score)
          if (!Number.isFinite(s)) return 'bar-none'
          if (s >= 7) return 'bar-good'
          if (s >= 4) return 'bar-ok'
          return 'bar-bad'
        }

        // Stats formatter: wins/starts and place % or win % when available + last-5 form
        const getStatsFormatted = (horse) => {
          if (!horse) return '—'
          const ranked = rankedMap.value.get(horse.id) || {}
          const stats = horse.stats || {}

          const toNum = (v) => {
            if (v == null) return NaN
            if (typeof v === 'string') {
              const cleaned = v.replace(/%/g, '').trim()
              const n = Number(cleaned)
              return Number.isFinite(n) ? n : NaN
            }
            const n = Number(v)
            return Number.isFinite(n) ? n : NaN
          }

          // Starts
          const starts = toNum(ranked.numberOfStarts ?? horse.numberOfStarts ?? stats.numberOfStarts)

          // Placements string like "A-B-C"
          const placementsStr = ranked.placements ?? stats.placements
          let wins = null
          if (typeof placementsStr === 'string' && placementsStr.includes('-')) {
            const [a] = placementsStr.split('-')
            const an = parseInt(a, 10)
            if (Number.isFinite(an)) wins = an
          }

          // Fallback wins if present as numeric somewhere
          if (wins == null) {
            const maybeWins = toNum(stats.wins ?? ranked.wins)
            if (Number.isFinite(maybeWins)) wins = maybeWins
          }

          // Place/top3 percent may exist precomputed
          const placePct = toNum(ranked.placementRatesNumeric ?? ranked.placementRates ?? stats.placePct ?? stats.placementRate)
          const winPct0to100 = toNum(ranked.winningRateNumeric ?? stats.winPct)

          const parts = []
          if (Number.isFinite(wins) && Number.isFinite(starts) && starts > 0) {
            parts.push(`${wins}/${starts}`)
          } else if (Number.isFinite(starts) && starts > 0) {
            parts.push(`${starts} start${starts === 1 ? '' : 'er'}`)
          }

          if (Number.isFinite(placePct)) {
            parts.push(`${Math.round(placePct)}% plats`)
          } else if (Number.isFinite(winPct0to100)) {
            parts.push(`${Math.round(winPct0to100)}% vinst`)
          }

          const form5 = computeFormLast5(horse)
          if (Number.isFinite(form5)) parts.push(`Form ${form5}/10`)

          return parts.length ? parts.join(' • ') : '—'
        }

        // Fetch race, ratings and set into store
        const fetchDataAndUpdate = async (raceId) => {
          if (!raceId) return
          try {
            const race = await fetchRaceFromRaceId(raceId)
            store.commit('raceHorses/setCurrentRace', race)
            const horseIds = (race.horses || []).map(h => h.id)
            // Preload ratings and scores (kept for parity; backend may use cached values)
            try { await fetchHorseScores(horseIds) } catch {}
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
            aiSummary,
            aiSummaryLoading,
            aiSummaryError,
            aiSummaryMeta,
            headers,
            racedayTrackName,
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
            // advantages
            maxAdvChips,
            getAdvantages,
            overflowTooltip,
            // number/pct formatters for AI block
            formatElo,
            formatStartPosition,
            customKeySort,
            aiById,
            aiRankConfig,
            aiPresetKey,
            aiPresetLabel,
            activeProfile,
            tableItems,
            // past display
            buildUnifiedPastDisplay,
            recentCoreFor,
            hasEnoughStarts,
            getEloFor,
            getFormEloFor,
            raceMetaString,
            trackMetaString,
            raceGames,
            onGenerateSummary,
            // stats
            getStatsFormatted,
            getStatsDetails,
            formColorClass,
            slotRow,
            slotVal,
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

/* Stats column UI */
.stats-cell { display: grid; gap: 4px; }
.form-row { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 8px; }
.form-label { font-weight: 600; font-size: 0.9rem; }
.form-bar { position: relative; height: 6px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.form-bar.bar-good { background: #d1fae5; }
.form-bar.bar-ok { background: #fef3c7; }
.form-bar.bar-bad { background: #fee2e2; }
.form-bar.bar-none { background: #e5e7eb; }
.form-fill { height: 100%; background: linear-gradient(90deg, #60a5fa, #3b82f6); }
.stats-row { display: flex; align-items: center; gap: 8px; color: #6b7280; font-size: 0.9rem; }
.stats-pair { color: #111827; }
.sep { color: #9ca3af; }

@media (prefers-color-scheme: dark) {
  .form-bar { background: #374151; }
  .form-bar.bar-good { background: #065f46; }
  .form-bar.bar-ok { background: #78350f; }
  .form-bar.bar-bad { background: #7f1d1d; }
  .form-fill { background: linear-gradient(90deg, #93c5fd, #60a5fa); }
  .stats-row { color: #9ca3af; }
  .stats-pair { color: #e5e7eb; }
}
</style>
