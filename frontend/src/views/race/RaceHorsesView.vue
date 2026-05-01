<template>
    <v-container class="tabbed-view-container">
        <RaceHeader
          :current-race="currentRace"
          :raceday-track-name="racedayTrackName"
          :race-meta-string="raceMetaString"
          :track-meta-string="trackMetaString"
          :race-games="raceGames"
          @navigate-to-raceday="navigateToRaceDay"
        />
        <RaceNavigation
          v-if="raceList.length"
          :previous-race-id="previousRaceId"
          :next-race-id="nextRaceId"
          @navigate="goToRace"
        />
        <section
          v-if="raceProfile || raceProfileLoading || raceProfileError"
          class="race-profile-block"
          aria-labelledby="race-profile-title"
        >
          <div class="race-profile-head">
            <div>
              <div class="race-profile-eyebrow">Lopprofil</div>
              <h2 id="race-profile-title">Vad påverkar loppet?</h2>
            </div>
            <div v-if="raceProfile?.topHorse" class="race-profile-favorite" aria-label="Modellens favorit">
              <span>Modellfavorit</span>
              <strong>{{ raceProfile.topHorse.name }}</strong>
              <small>
                Modell {{ formatElo(raceProfile.topHorse.modelElo || raceProfile.topHorse.effectiveElo) }}
                · Class {{ formatElo(raceProfile.topHorse.classElo) }}
                · Form {{ formatElo(raceProfile.topHorse.formElo) }}
              </small>
            </div>
          </div>
          <div v-if="raceProfileLoading" class="race-profile-muted">Laddar lopprofil…</div>
          <div v-else-if="raceProfileError" class="race-profile-muted">{{ raceProfileError }}</div>
          <template v-else>
            <p class="race-profile-narrative">{{ raceProfile.narrative }}</p>
            <div class="race-profile-kpis">
              <div
                v-for="kpi in profileKpis"
                :key="kpi.key"
                class="race-profile-kpi"
                :class="profileKpiClass(kpi)"
                :aria-label="`${kpi.label}: ${formatProfileKpiValue(kpi)}`"
              >
                <span>{{ kpi.label }}</span>
                <strong>{{ formatProfileKpiValue(kpi) }}</strong>
              </div>
            </div>
            <div class="race-profile-details">
              <div class="race-profile-detail">
                <h3>Distans och tillägg</h3>
                <div v-if="raceProfile.distanceTiers?.length" class="race-profile-list">
                  <div v-for="tier in raceProfile.distanceTiers" :key="tier.distance" class="race-profile-list-row">
                    <span class="race-profile-main">{{ tier.distance }} m</span>
                    <strong class="race-profile-value">
                      {{ tier.starters }} start{{ tier.starters === 1 ? '' : 'er' }}
                      <template v-if="tier.handicapMeters > 0"> · +{{ tier.handicapMeters }} m</template>
                    </strong>
                    <small v-if="tier.topHorse">Bäst på nivån: {{ tier.topHorse.name }}</small>
                  </div>
                </div>
                <div v-else class="race-profile-muted">Ingen distansprofil tillgänglig.</div>
              </div>
              <div class="race-profile-detail">
                <h3>Spår och lägesbild</h3>
                <div v-if="raceProfile.laneSignals?.items?.length" class="race-profile-list">
                  <div v-for="signal in raceProfile.laneSignals.items" :key="signal.id" class="race-profile-list-row">
                    <span class="race-profile-main">{{ signal.name }}</span>
                    <strong class="race-profile-value" :class="{ positive: signal.deltaElo > 0, negative: signal.deltaElo < 0 }">
                      {{ formatSigned(signal.deltaElo) }} Elo
                    </strong>
                    <small>Spår {{ signal.startPosition || 'okänt' }} · {{ signal.sampleSize || 0 }} historiska träffar</small>
                  </div>
                </div>
                <div v-else class="race-profile-muted">Spårhistoriken ger ingen tydlig aktiv signal.</div>
              </div>
              <div class="race-profile-detail">
                <h3>Spikfrågan</h3>
                <p class="race-profile-verdict">{{ spikeVerdictText }}</p>
                <div v-if="raceProfile.handicapPenalties?.length" class="race-profile-list compact">
                  <div v-for="penalty in raceProfile.handicapPenalties" :key="penalty.id" class="race-profile-list-row">
                    <span class="race-profile-main">{{ penalty.name }}</span>
                    <strong class="race-profile-value">{{ penalty.handicapMeters }} m tillägg</strong>
                    <small>{{ formatSigned(penalty.deltaElo) }} Elo i modellen</small>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
        <section class="start-list-modern" aria-labelledby="start-list-title">
          <div class="start-list-header">
            <div>
              <div class="race-profile-eyebrow">Startlista</div>
              <h2 id="start-list-title">Hästar och modellvärden</h2>
            </div>
            <span class="start-list-count">{{ tableItems.length }} startande</span>
          </div>
          <div class="start-sort-bar" aria-label="Sortera startlistan">
            <button
              v-for="option in startSortOptions"
              :key="option.key"
              type="button"
              class="start-sort-button"
              :class="{ active: startSortKey === option.key }"
              :aria-pressed="startSortKey === option.key"
              @click="setStartSort(option.key)"
            >
              <span>{{ option.label }}</span>
              <small v-if="startSortKey === option.key">{{ startSortDirection === 'asc' ? '↑' : '↓' }}</small>
            </button>
          </div>
          <article
            v-for="horse in sortedTableItems"
            :key="horse.id || horse.programNumber"
            class="horse-card-modern"
            :class="{ withdrawn: horse?.columns?.horseWithdrawn || horse?.horseWithdrawn }"
          >
            <div class="horse-card-start">
              <div class="horse-number">#{{ horse.programNumber || '—' }}</div>
              <div class="horse-start-meta">{{ startPositionLabel(horse) }}</div>
              <div class="horse-start-distance" v-if="horse.actualDistance || currentRace.distance">
                {{ horse.actualDistance || currentRace.distance }} m
              </div>
              <span
                v-if="handicapLabel(horse)"
                class="start-badge"
                :class="{ longer: Number(horse.actualDistance) > Number(currentRace.distance), shorter: Number(horse.actualDistance) < Number(currentRace.distance) }"
              >
                {{ handicapLabel(horse) }}
              </span>
            </div>

            <div class="horse-card-main">
              <div class="horse-card-title-row">
                <template v-if="horseLink(horse)">
                  <router-link class="horse-card-name horse-link" :to="horseLink(horse)">
                    {{ horse.name || '—' }}
                  </router-link>
                </template>
                <template v-else>
                  <span class="horse-card-name">{{ horse.name || '—' }}</span>
                </template>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="eloFreshnessColor(horse)"
                  :title="eloFreshnessTooltip(horse)"
                >
                  {{ eloFreshnessLabel(horse) }}
                </v-chip>
              </div>

              <div class="horse-card-metrics" aria-label="Elo och modellvärden">
                <div class="horse-metric">
                  <span>Class Elo</span>
                  <strong>{{ formatElo(getEloFor(horse)) }}</strong>
                </div>
                <div class="horse-metric">
                  <span>Form Elo</span>
                  <strong>{{ formatElo(getFormEloFor(horse)) }}</strong>
                  <small v-if="hasFormDelta(horse)">Δ {{ formatFormDelta(getFormDeltaFor(horse)) }}</small>
                </div>
                <div class="horse-metric model">
                  <span>Modell Elo</span>
                  <strong>{{ formatElo(getModelEloFor(horse)) }}</strong>
                  <small v-if="hasModelDelta(horse)" :class="{ negative: getModelDeltaFor(horse) < 0 }">
                    Δ {{ formatFormDelta(getModelDeltaFor(horse)) }}
                  </small>
                </div>
                <div class="horse-metric">
                  <span>Kusk Form Elo</span>
                  <strong>{{ formatElo(getDriverEloFor(horse)) }}</strong>
                </div>
              </div>

              <div class="horse-card-past" aria-label="Senaste resultat">
                <div
                  v-for="(line, idx) in buildUnifiedPastDisplay(horse.id, recentCoreFor(horse)).slice(0, 4)"
                  :key="idx"
                  class="past-line"
                >
                  {{ line }}
                </div>
                <div v-if="buildUnifiedPastDisplay(horse.id, recentCoreFor(horse)).length === 0" class="past-line">
                  Inga tidigare starter tillgängliga
                </div>
              </div>
            </div>

            <aside class="horse-card-side" aria-label="Hästfakta">
              <div class="horse-side-section">
                <span class="horse-side-label">Kusk</span>
                <template v-if="driverLink(horse)">
                  <router-link class="driver-link" :to="driverLink(horse)">
                    {{ horse?.driver?.name || horse.driverName || '—' }}
                  </router-link>
                </template>
                <template v-else>
                  <strong>{{ horse?.driver?.name || horse.driverName || '—' }}</strong>
                </template>
              </div>

              <div class="horse-side-section">
                <span class="horse-side-label">Stats</span>
                <div class="form-row">
                  <span class="form-label">Form {{ formatFormValue(horse?.statsDetails?.formScore) }}/10</span>
                  <div class="form-bar" :class="formColorClass(Number(horse?.statsDetails?.formScore))">
                    <div class="form-fill" :style="{ width: ((Number(horse?.statsDetails?.formScore) || 0) * 10) + '%' }"></div>
                  </div>
                </div>
                <div class="stats-row">
                  <span class="stats-pair">{{ formatWinsStarts(horse?.statsDetails) }}</span>
                  <span
                    class="sep"
                    v-if="formatWinsStarts(horse?.statsDetails) !== '—' && formatPlaceWinPct(horse?.statsDetails) !== '—'"
                  >•</span>
                  <span class="pct">{{ formatPlaceWinPct(horse?.statsDetails) }}</span>
                </div>
              </div>

              <div class="horse-side-section" v-if="getAdvantages(horse).length">
                <span class="horse-side-label">Fördelar</span>
                <div class="advantages-wrap">
                  <template v-for="chip in getAdvantages(horse).slice(0, maxAdvChips)" :key="chip.key">
                    <v-chip size="x-small" variant="tonal" class="mr-1 mb-1" :title="chip.tip">
                      <span class="mr-1">{{ chip.icon }}</span>{{ chip.label }}
                    </v-chip>
                  </template>
                  <v-chip
                    v-if="getAdvantages(horse).length > maxAdvChips"
                    size="x-small"
                    variant="outlined"
                    class="mr-1 mb-1"
                    :title="overflowTooltip(horse)"
                  >
                    +{{ getAdvantages(horse).length - maxAdvChips }}
                  </v-chip>
                </div>
              </div>

              <div class="horse-side-section">
                <span class="horse-side-label">Skor</span>
                <strong :title="startListShoeTooltip(horse) || null">
                  {{ formatStartListShoe(horse) || horse.shoeOption || '—' }}
                </strong>
              </div>
            </aside>
          </article>
        </section>
        <v-row v-if="raceList.length" class="race-navigation">
            <v-col class="d-flex justify-space-between">
                <v-btn variant="text" @click="goToRace(previousRaceId)" :disabled="!previousRaceId">⟵ Previous race</v-btn>
                <v-btn variant="text" @click="goToRace(nextRaceId)" :disabled="!nextRaceId">Next race ⟶</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useRaceMeta } from '@/composables/useRaceMeta.js'
import { getTrackName, getTrackCodeFromName } from '@/utils/track'
import RaceHeader from './components/RaceHeader.vue'
import RaceNavigation from './components/RaceNavigation.vue'
import {
    fetchRaceFromRaceId,
    fetchRaceProfile,
    fetchHorseScores
} from '@/views/race/services/RaceHorsesService.js'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import TrackService from '@/views/race/services/TrackService.js'
import { formatElo, formatStartPosition } from '@/utils/formatters.js'
import { formatStartListShoe, startListShoeTooltip } from '@/composables/useShoes.js'
import { useStartAdvantages } from '@/composables/useStartAdvantages.js'
import { buildUnifiedPastDisplay } from '@/composables/usePastDisplay.js'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

export default {
    name: 'RaceHorsesView',
  props: {
    racedayId: {
      type: [String, Number],
      default: null
    },
    raceId: {
      type: [String, Number],
      default: null
    }
  },
    components: { RaceHeader, RaceNavigation },

  setup() {
        const route = useRoute()
        const router = useRouter()
        const store = useStore()

        const formatBreadcrumbDate = (value) => {
            if (!value) return ''
            try {
                return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
            } catch {
                return ''
            }
        }

        const getCrumbKey = () => (route.name === 'race' ? 'race' : 'RacedayRace')
        const activeCrumbKey = ref(getCrumbKey())
        const hasRacedayCrumb = ref(route.name === 'RacedayRace')

        const applyRacePlaceholder = () => {
            const key = getCrumbKey()
            const raceId = route.params.raceId
            if (raceId != null) setBreadcrumbLabel(key, `Lopp ${raceId}`)
        }

        const applyRacedayPlaceholder = () => {
            if (route.name === 'RacedayRace') {
                const racedayId = route.params.racedayId
                if (racedayId != null) setBreadcrumbLabel('Raceday', `Tävlingsdag ${racedayId}`)
            }
        }

        applyRacePlaceholder()
        applyRacedayPlaceholder()

        // raceday / track context
        const racedayDetails = ref(null)
        const racedayTrackName = ref('')
        const racedayTrackCode = ref('')
        const trackMeta = ref({})
        const spelformer = ref({})
        const v86GameView = ref(null)

        const currentRace = computed(() => store.state.raceHorses.currentRace)
        const rankedHorses = computed(() => store.getters['raceHorses/getRankedHorses'])
        const rankedMap = computed(() => new Map((rankedHorses.value || []).map(r => [r.id, r])))
        const raceProfile = ref(null)
        const raceProfileLoading = ref(false)
        const raceProfileError = ref('')
        const startSortKey = ref('programNumber')
        const startSortDirection = ref('asc')

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

        watch(
          () => route.params.raceId,
          () => {
            applyRacePlaceholder()
          }
        )

        watch(
          () => route.params.racedayId,
          () => {
            applyRacedayPlaceholder()
          }
        )

        watch(
          () => route.name,
          () => {
            activeCrumbKey.value = getCrumbKey()
            hasRacedayCrumb.value = route.name === 'RacedayRace'
            applyRacePlaceholder()
            applyRacedayPlaceholder()
          }
        )

        watch(
          () => racedayDetails.value,
          (details) => {
            if (route.name !== 'RacedayRace') return
            if (!details?.trackName) return
            const dateLabel = formatBreadcrumbDate(details.raceDayDate || details.firstStart)
            const label = dateLabel ? `${details.trackName} (${dateLabel})` : details.trackName
            setBreadcrumbLabel('Raceday', label)
          }
        )

        watch(
          () => currentRace.value,
          (race) => {
            if (!race) return
            const key = getCrumbKey()
            const raceNumber = race.raceNumber ?? race.number
            const baseLabel = raceNumber ? `Lopp ${raceNumber}` : (race.name || `Lopp ${route.params?.raceId ?? ''}`)
            const details = []
            if (race.distance) details.push(`${race.distance} m`)
            const timeLabel = formatBreadcrumbDate(race.startTime || race.startDateTime)
            if (timeLabel) details.push(timeLabel)
            const label = details.length ? `${baseLabel} (${details.join(' • ')})` : baseLabel
            setBreadcrumbLabel(key, label)

            if (route.name === 'RacedayRace') {
              const track = racedayDetails.value?.trackName || race.trackName || racedayTrackName.value
              if (track) {
                const dateLabel = formatBreadcrumbDate(racedayDetails.value?.raceDayDate || racedayDetails.value?.firstStart || race.startTime)
                const trackLabel = dateLabel ? `${track} (${dateLabel})` : track
                setBreadcrumbLabel('Raceday', trackLabel)
              }
            }
          },
          { immediate: true }
        )

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

        const customKeySort = computed(() => ({
          formRating: (valA, valB, itemA, itemB) => {
            const rowA = itemA?.raw ?? itemA
            const rowB = itemB?.raw ?? itemB
            const deltaA = Number(getFormDeltaFor(rowA))
            const deltaB = Number(getFormDeltaFor(rowB))

            const aFinite = Number.isFinite(deltaA)
            const bFinite = Number.isFinite(deltaB)
            if (aFinite || bFinite) {
              if (aFinite && bFinite && deltaA !== deltaB) {
                return deltaA - deltaB
              }
              if (aFinite && !bFinite) return 1
              if (!aFinite && bFinite) return -1
            }
            const numA = Number(valA ?? 0)
            const numB = Number(valB ?? 0)
            if (Number.isFinite(numA) && Number.isFinite(numB)) {
              return numA - numB
            }
            return 0
          },
          // Sort Stats by numeric form score (0–10)
          statsScore: (a, b) => Number(a || 0) - Number(b || 0)
        }))

        const startSortOptions = [
          { label: '# / Start', key: 'programNumber', type: 'number' },
          { label: 'Häst', key: 'name', type: 'string' },
          { label: 'Class Elo', key: 'eloRating', type: 'number' },
          { label: 'Form Elo', key: 'formRating', type: 'number' },
          { label: 'Modell Elo', key: 'modelElo', type: 'number' },
          { label: 'Elo-status', key: 'eloFreshness', type: 'number' },
          { label: 'Kusk', key: 'driverName', type: 'string' },
          { label: 'Kusk Form Elo', key: 'driverElo', type: 'number' },
          { label: 'Stats', key: 'statsScore', type: 'number' },
          { label: 'Fördelar', key: 'advantagesCount', type: 'number' },
          { label: 'Skor', key: 'shoeLabel', type: 'string' },
        ]

        const profileKpis = computed(() => {
          const hidden = new Set(['spikeVerdict'])
          return (raceProfile.value?.kpis || []).filter(kpi => !hidden.has(kpi.key))
        })

        const spikeVerdictText = computed(() => {
          const verdict = (raceProfile.value?.kpis || []).find(kpi => kpi.key === 'spikeVerdict')
          return verdict?.value || 'Ingen spikbedömning tillgänglig.'
        })

        const formatProfileKpiValue = (kpi) => {
          if (!kpi) return '—'
          if (kpi.unit === 'bool') return kpi.value ? 'Ja' : 'Nej'
          if (kpi.value == null || kpi.value === '') return '—'
          const numeric = Number(kpi.value)
          const value = Number.isFinite(numeric)
            ? new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(numeric)
            : String(kpi.value)
          if (!kpi.unit || kpi.unit === 'text') return value
          return `${value} ${kpi.unit}`
        }

        const profileKpiClass = (kpi) => ({
          'is-warning': ['hasHandicap', 'maxHandicap'].includes(kpi?.key) && Boolean(kpi?.value),
          'is-positive': ['topGap', 'spikeConfidence'].includes(kpi?.key) && Number(kpi?.value) >= 70
        })

        const formatSigned = (value) => {
          const numeric = Number(value)
          if (!Number.isFinite(numeric)) return '—'
          const formatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(numeric)
          return numeric > 0 ? `+${formatted}` : formatted
        }

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

        function getFormDeltaFor(horse) {
          if (!horse) return null
          let val = horse?.formDelta ?? horse?.columns?.formDelta

          if (!(Number.isFinite(Number(val)))) {
            const ranked = rankedMap.value.get(horse.id)
            val = ranked?.formDelta ?? ranked?.columns?.formDelta
          }

          if (Number.isFinite(Number(val))) {
            return Number(Number(val).toFixed(2))
          }

          const form = getFormEloFor(horse)
          const base = getEloFor(horse)
          if (Number.isFinite(form) && Number.isFinite(base)) {
            return Number((form - base).toFixed(2))
          }

          return null
        }

        function getModelEloFor(horse) {
          if (!horse) return 0
          let val = horse?.effectiveElo ?? horse?.modelElo ?? horse?.columns?.modelElo

          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            const ranked = rankedMap.value.get(horse.id)
            val = ranked?.effectiveElo ?? ranked?.modelElo ?? ranked?.columns?.modelElo
          }

          if (!(Number.isFinite(Number(val)) && Number(val) > 0)) {
            val = getEloFor(horse)
          }

          return Number(val) || 0
        }

        function getModelDeltaFor(horse) {
          if (!horse) return null
          const model = getModelEloFor(horse)
          const classElo = getEloFor(horse)
          if (Number.isFinite(model) && Number.isFinite(classElo)) {
            return Number((model - classElo).toFixed(2))
          }
          return null
        }

        const hasModelDelta = (horse) => Number.isFinite(Number(getModelDeltaFor(horse)))

        const modelEloTooltip = (horse) => {
          const model = getModelEloFor(horse)
          const classElo = getEloFor(horse)
          const formElo = getFormEloFor(horse)
          const driverElo = getDriverEloFor(horse)
          return `Modell Elo: ${formatElo(model)}. Bygger på Class Elo ${formatElo(classElo)}, Form Elo ${formatElo(formElo)}, Kusk Form Elo ${formatElo(driverElo)} och loppvillkor som spår, distans, bana, balans och tillägg.`
        }

        const startPositionLabel = (horse) => {
          if (!horse) return 'Startläge oklart'
          const position = horse.actualStartPosition ?? horse.startPosition
          if (raceStartMethod.value === 'Autostart') {
            return position ? `Spår ${formatStartPosition(position)}` : 'Spår oklart'
          }
          if (horse.actualStartPosition) return `Volte ${formatStartPosition(horse.actualStartPosition)}`
          if (horse.startPosition) return `Startpos ${formatStartPosition(horse.startPosition)}`
          return 'Startläge oklart'
        }

        const handicapLabel = (horse) => {
          const actualDistance = Number(horse?.actualDistance)
          const baseDistance = Number(currentRace.value?.distance)
          if (!Number.isFinite(actualDistance) || !Number.isFinite(baseDistance) || actualDistance === baseDistance) return ''
          if (actualDistance > baseDistance) return `Tillägg +${actualDistance - baseDistance}`
          return `Försprång −${baseDistance - actualDistance}`
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

        function horseLink(row) {
          const id = row?.id ?? row?.horseId ?? row?.columns?.horseId
          if (id == null) return null
          return { name: 'HorseDetail', params: { horseId: id } }
        }

        function driverLink(row) {
          const driver = row?.driver || {}
          const id = driver?.licenseId ?? driver?.id ?? row?.driverId
          if (id == null) return null
          return { name: 'DriverDetail', params: { driverId: id } }
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
              ratingLastUpdated: h0.ratingLastUpdated ?? rm.ratingLastUpdated ?? null,
              formRatingLastUpdated: h0.formRatingLastUpdated ?? rm.formRatingLastUpdated ?? null,
              ratingLastRaceDate: h0.ratingLastRaceDate ?? rm.ratingLastRaceDate ?? null,
              formRatingLastRaceDate: h0.formRatingLastRaceDate ?? rm.formRatingLastRaceDate ?? null,
              storedEloVersion: h0.storedEloVersion ?? rm.storedEloVersion ?? null,
            }
            const statsDetails = getStatsDetails(merged)
            return {
              ...merged,
              eloRating: getEloFor(merged),
              formRating: getFormEloFor(merged),
              modelElo: getModelEloFor(merged),
              formDelta: getFormDeltaFor(merged),
              driverElo: getDriverEloFor(merged),
              eloFreshness: getEloFreshness(merged).sortValue,
              driverName: merged?.driver?.name || '—',
              v85Percent: Number.isFinite(Number(merged?.v85Percent)) ? Number(merged.v85Percent) : null,
              v86Percent: Number.isFinite(Number(merged?.v86Percent)) ? Number(merged.v86Percent) : null,
              statsScore: statsDetails.formScore ?? computeFormLast5(merged) ?? 0,
              advantagesCount: getAdvantages(merged).length,
              shoeLabel: formatStartListShoe(merged) || merged.shoeOption || '',
              statsDetails,
              statsText: getStatsFormatted(merged),
              // No precomputed stats string stored; use getter in slot
            }
          })
        })

        const sortedTableItems = computed(() => {
          const option = startSortOptions.find(item => item.key === startSortKey.value) || startSortOptions[0]
          const direction = startSortDirection.value === 'asc' ? 1 : -1
          return [...tableItems.value].sort((left, right) => {
            const leftValue = left?.[option.key]
            const rightValue = right?.[option.key]
            if (option.type === 'string') {
              return String(leftValue || '').localeCompare(String(rightValue || ''), 'sv-SE') * direction
            }
            const leftNumber = Number(leftValue)
            const rightNumber = Number(rightValue)
            const leftValid = Number.isFinite(leftNumber)
            const rightValid = Number.isFinite(rightNumber)
            if (leftValid && rightValid && leftNumber !== rightNumber) return (leftNumber - rightNumber) * direction
            if (leftValid && !rightValid) return -1
            if (!leftValid && rightValid) return 1
            return String(left?.name || '').localeCompare(String(right?.name || ''), 'sv-SE')
          })
        })

        const setStartSort = (key) => {
          if (startSortKey.value === key) {
            startSortDirection.value = startSortDirection.value === 'asc' ? 'desc' : 'asc'
            return
          }
          startSortKey.value = key
          startSortDirection.value = key === 'programNumber' || key === 'name' || key === 'driverName' || key === 'shoeLabel'
            ? 'asc'
            : 'desc'
        }

        const latestDate = (...values) => {
          const timestamps = values
            .map(value => {
              if (!value) return null
              const time = new Date(value).getTime()
              return Number.isNaN(time) ? null : time
            })
            .filter(value => value != null)

          if (!timestamps.length) return null
          return new Date(Math.max(...timestamps)).toISOString()
        }

        const daysSince = (value) => {
          if (!value) return null
          const time = new Date(value).getTime()
          if (Number.isNaN(time)) return null
          return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)))
        }

        const formatShortDate = (value) => {
          if (!value) return ''
          const date = new Date(value)
          if (Number.isNaN(date.getTime())) return ''
          return new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' }).format(date)
        }

        const getEloFreshness = (horse) => {
          const updatedAt = latestDate(horse?.ratingLastUpdated, horse?.formRatingLastUpdated)
          const raceDate = latestDate(horse?.ratingLastRaceDate, horse?.formRatingLastRaceDate)
          const age = daysSince(updatedAt)
          const version = horse?.storedEloVersion || null

          if (!updatedAt && !raceDate && !version) {
            return {
              label: 'Okänd',
              color: 'grey',
              detail: 'saknar datum',
              tooltip: 'Ingen lagrad Elo-färskhet hittades för hästen.',
              sortValue: 9999
            }
          }

          if (age != null && age <= 7) {
            return {
              label: 'Färsk',
              color: 'success',
              detail: raceDate ? `t.o.m. ${formatShortDate(raceDate)}` : 'ny körning',
              tooltip: `Senaste Elo-körning: ${updatedAt ? new Date(updatedAt).toLocaleString('sv-SE') : 'okänd'}${raceDate ? `. Bearbetad t.o.m: ${new Date(raceDate).toLocaleDateString('sv-SE')}` : ''}${version ? `. Version: ${version}` : ''}`,
              sortValue: age
            }
          }

          if (age != null && age <= 30) {
            return {
              label: 'Varning',
              color: 'warning',
              detail: `${age} dagar`,
              tooltip: `Senaste Elo-körning: ${new Date(updatedAt).toLocaleString('sv-SE')}${raceDate ? `. Bearbetad t.o.m: ${new Date(raceDate).toLocaleDateString('sv-SE')}` : ''}${version ? `. Version: ${version}` : ''}`,
              sortValue: age
            }
          }

          return {
            label: 'Äldre',
            color: 'warning',
            detail: age != null ? `${age} dagar` : (raceDate ? `t.o.m. ${formatShortDate(raceDate)}` : 'delvis känt'),
            tooltip: `${updatedAt ? `Senaste Elo-körning: ${new Date(updatedAt).toLocaleString('sv-SE')}. ` : ''}${raceDate ? `Bearbetad t.o.m: ${new Date(raceDate).toLocaleDateString('sv-SE')}. ` : ''}${version ? `Version: ${version}.` : ''}`,
            sortValue: age ?? 999
          }
        }

        const eloFreshnessLabel = (horse) => getEloFreshness(horse).label
        const eloFreshnessColor = (horse) => getEloFreshness(horse).color
        const eloFreshnessDetail = (horse) => getEloFreshness(horse).detail
        const eloFreshnessTooltip = (horse) => getEloFreshness(horse).tooltip

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

        const formatFormValue = (value) => {
          const num = Number(value)
          return Number.isFinite(num) ? num : '—'
        }

        const formatFormDelta = (value) => {
          const num = Number(value)
          if (!Number.isFinite(num)) return '—'
          const decimals = Math.abs(num) >= 10 ? 0 : 1
          const formatted = new Intl.NumberFormat('sv-SE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(num)
          return num > 0 && !formatted.startsWith('+') ? `+${formatted}` : formatted
        }

        const formatWinsStarts = (stats) => {
          if (!stats) return '—'
          const wins = Number(stats.wins)
          const starts = Number(stats.starts)
          if (Number.isFinite(wins) && Number.isFinite(starts) && starts > 0) {
            return `${wins}/${starts}`
          }
          if (Number.isFinite(starts) && starts > 0) {
            return `${starts} starter`
          }
          return '—'
        }

        const formatPlaceWinPct = (stats) => {
          if (!stats) return '—'
          const place = Number(stats.placePct)
          const win = Number(stats.winPct)
          if (Number.isFinite(place)) return `${Math.round(place)}% plats`
          if (Number.isFinite(win)) return `${Math.round(win)}% vinst`
          return '—'
        }

        const formatV85Percent = (value) => {
          const num = Number(value)
          if (!Number.isFinite(num)) return null
          return `${(Math.round(num * 10) / 10).toFixed(1)}%`
        }

        const formatV86Percent = (value) => {
          const num = Number(value)
          if (!Number.isFinite(num)) return null
          return `${(Math.round(num * 10) / 10).toFixed(1)}%`
        }

        // Structured stats for pretty rendering in the Stats column
        function getStatsDetails(horse) {
          if (!horse) return { starts: null, wins: null, placePct: null, winPct: null, formScore: null, v85Percent: null, v86Percent: null }
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
            v85Percent: Number.isFinite(Number(horse.v85Percent)) ? Number(horse.v85Percent) : null,
            v86Percent: Number.isFinite(Number(horse.v86Percent)) ? Number(horse.v86Percent) : null
          }
        }

        const hasFormDelta = (horse) => {
          const delta = getFormDeltaFor(horse)
          return Number.isFinite(Number(delta))
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

          const v85PercentRaw = Number.isFinite(Number(horse.v85Percent)) ? Number(horse.v85Percent) : null
          if (Number.isFinite(v85PercentRaw)) {
            parts.push(`V85 ${(Math.round(v85PercentRaw * 10) / 10).toFixed(1)}%`)
          }

          const v86PercentRaw = Number.isFinite(Number(horse.v86Percent)) ? Number(horse.v86Percent) : null
          if (Number.isFinite(v86PercentRaw)) {
            parts.push(`V86 ${(Math.round(v86PercentRaw * 10) / 10).toFixed(1)}%`)
          }

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

        const fetchRaceProfileData = async (raceId) => {
          if (!raceId) {
            raceProfile.value = null
            return
          }
          raceProfileLoading.value = true
          raceProfileError.value = ''
          try {
            raceProfile.value = await fetchRaceProfile(raceId)
          } catch (error) {
            raceProfile.value = null
            raceProfileError.value = 'Kunde inte hämta lopprofilen just nu.'
          } finally {
            raceProfileLoading.value = false
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
          v86LegByRaceId,
        })

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

        const fetchV86GameView = async () => {
            if (!route.params.racedayId) {
                v86GameView.value = null
                return
            }
            try {
                v86GameView.value = await RacedayService.fetchV86GameView(route.params.racedayId)
            } catch (error) {
                console.error('Failed to fetch V86 game view:', error)
                v86GameView.value = null
            }
        }

        onMounted(async () => {
            const raceId = route.params.raceId
            await Promise.all([
              fetchDataAndUpdate(raceId),
              fetchRaceProfileData(raceId)
            ])
            await fetchTrackInfo()
            await fetchSpelformer()
            await fetchV86GameView()
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.raceId, async (newRaceId) => {
            store.commit('raceHorses/clearRankedHorses')
            store.commit('raceHorses/clearCurrentRace')
            await Promise.all([
              fetchDataAndUpdate(newRaceId),
              fetchRaceProfileData(newRaceId)
            ])
            await fetchTrackInfo()
            await fetchSpelformer()
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.racedayId, async () => {
            await fetchTrackInfo()
            await fetchSpelformer()
            await fetchV86GameView()
        })

        onBeforeUnmount(() => {
            setBreadcrumbLabel(activeCrumbKey.value)
            if (hasRacedayCrumb.value) {
                setBreadcrumbLabel('Raceday')
            }
        })

        return {
            // core
            racedayTrackName,
            navigateToRaceDay,
            currentRace,
            raceList,
            previousRaceId,
            nextRaceId,
            goToRace,
            raceStartMethod,
            hasHandicap,
            raceProfile,
            raceProfileLoading,
            raceProfileError,
            profileKpis,
            spikeVerdictText,
            formatProfileKpiValue,
            profileKpiClass,
            formatSigned,
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
            tableItems,
            sortedTableItems,
            startSortOptions,
            startSortKey,
            startSortDirection,
            setStartSort,
            // past display
            buildUnifiedPastDisplay,
            recentCoreFor,
            hasEnoughStarts,
            getEloFor,
            getFormEloFor,
            getFormDeltaFor,
            getModelEloFor,
            getModelDeltaFor,
            getDriverEloFor,
            hasModelDelta,
            modelEloTooltip,
            startPositionLabel,
            handicapLabel,
            hasFormDelta,
            formatFormDelta,
            eloFreshnessLabel,
            eloFreshnessColor,
            eloFreshnessDetail,
            eloFreshnessTooltip,
            raceMetaString,
            trackMetaString,
            raceGames,
            // stats
            getStatsFormatted,
            getStatsDetails,
            formColorClass,
            formatFormValue,
            formatWinsStarts,
            formatPlaceWinPct,
            formatV85Percent,
            formatV86Percent,
            slotRow,
            slotVal,
            horseLink,
            driverLink,
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
.elo-cell { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1; }
.elo-main { font-weight: 600; }
.elo-delta { font-size: 0.75rem; color: #16a34a; }
.elo-delta.negative { color: #f59e0b; }
.model-elo-cell .elo-main { color: #5eead4; }
.freshness-cell { display: grid; gap: 3px; align-items: start; }
.freshness-detail { color: #6b7280; font-size: 0.75rem; line-height: 1.1; }
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

.start-list-modern {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.start-list-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 2px;
}

.start-list-header h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.22rem;
  line-height: 1.2;
}

.start-list-count {
  color: #94a3b8;
  font-size: 0.92rem;
}

.start-sort-bar {
  display: grid;
  grid-template-columns: 90px minmax(150px, 1.2fr) repeat(3, minmax(108px, 0.8fr)) minmax(100px, 0.8fr) minmax(130px, 1fr) minmax(120px, 0.8fr) minmax(95px, 0.7fr) minmax(95px, 0.7fr) minmax(90px, 0.7fr);
  gap: 6px;
  padding: 8px;
  border: 1px solid #243244;
  border-radius: 8px;
  background: #0b1322;
  overflow-x: auto;
}

.start-sort-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0;
  text-align: left;
  text-transform: uppercase;
}

.start-sort-button:hover,
.start-sort-button:focus-visible {
  border-color: #155e75;
  color: #e5e7eb;
  outline: none;
}

.start-sort-button.active {
  border-color: #155e75;
  background: #083344;
  color: #5eead4;
}

.start-sort-button small {
  color: inherit;
  font-size: 0.85rem;
  line-height: 1;
}

.horse-card-modern {
  display: grid;
  grid-template-columns: 118px minmax(360px, 1fr) minmax(260px, 340px);
  gap: 18px;
  padding: 16px;
  border: 1px solid #243244;
  border-radius: 8px;
  background: #0f172a;
  color: #e5e7eb;
}

.horse-card-modern.withdrawn {
  opacity: 0.6;
  text-decoration: none;
}

.horse-card-modern.withdrawn .horse-card-name {
  text-decoration: line-through;
}

.horse-card-start {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
}

.horse-number {
  color: #f8fafc;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1;
}

.horse-start-meta {
  color: #cbd5e1;
  font-size: 0.92rem;
}

.horse-start-distance {
  color: #94a3b8;
  font-size: 0.9rem;
}

.horse-card-main {
  display: grid;
  gap: 13px;
  min-width: 0;
}

.horse-card-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.horse-card-name {
  color: #f8fafc;
  font-size: 1.16rem;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.horse-card-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(112px, 1fr));
  gap: 8px;
}

.horse-metric {
  display: grid;
  gap: 3px;
  min-height: 70px;
  padding: 10px;
  border: 1px solid #243244;
  border-radius: 8px;
  background: #111c2e;
}

.horse-metric span {
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.horse-metric strong {
  color: #f8fafc;
  font-size: 1.22rem;
  line-height: 1.1;
}

.horse-metric small {
  color: #86efac;
  font-size: 0.78rem;
  line-height: 1.15;
}

.horse-metric small.negative {
  color: #fbbf24;
}

.horse-metric.model {
  border-color: #155e75;
  background: #083344;
}

.horse-metric.model strong {
  color: #5eead4;
}

.horse-card-past {
  display: grid;
  gap: 5px;
  max-width: 920px;
}

.horse-card-past .past-line {
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.38;
}

.horse-card-side {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
}

.horse-side-section {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 10px;
  border: 1px solid #243244;
  border-radius: 8px;
  background: #111c2e;
}

.horse-side-label {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.horse-side-section strong,
.horse-side-section .driver-link {
  color: #f8fafc;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.horse-side-section .form-row {
  grid-template-columns: minmax(70px, auto) 1fr;
}

.horse-card-modern .stats-row,
.horse-card-modern .stats-pair {
  color: #cbd5e1;
}

.horse-card-modern .pct,
.horse-card-modern .sep {
  color: #94a3b8;
}

@media (max-width: 1180px) {
  .horse-card-modern {
    grid-template-columns: 100px minmax(0, 1fr);
  }

  .horse-card-side {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .start-list-header {
    align-items: start;
    flex-direction: column;
  }

  .horse-card-modern {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .horse-card-start {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .horse-number {
    font-size: 1.25rem;
  }

  .horse-card-metrics,
  .horse-card-side {
    grid-template-columns: 1fr;
  }

  .start-sort-bar {
    display: flex;
    gap: 8px;
    margin: 0 -2px;
    padding: 8px 2px;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    background: transparent;
  }

  .start-sort-button {
    flex: 0 0 auto;
    min-width: 112px;
    background: #111c2e;
    border-color: #243244;
  }
}

.race-profile-block {
  margin: 18px 0 22px;
  padding: 20px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  color: #111827;
}

.race-profile-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.race-profile-eyebrow {
  margin-bottom: 3px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.race-profile-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  line-height: 1.2;
}

.race-profile-favorite {
  display: grid;
  gap: 2px;
  min-width: 180px;
  padding: 10px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  text-align: left;
}

.race-profile-favorite span {
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.race-profile-favorite strong {
  color: #1e3a8a;
  font-size: 0.98rem;
  line-height: 1.2;
}

.race-profile-favorite small {
  color: #475569;
  font-size: 0.78rem;
  line-height: 1.35;
}

.race-profile-narrative {
  max-width: 1120px;
  margin: 0 0 16px;
  color: #334155;
  font-size: 1rem;
  line-height: 1.55;
}

.race-profile-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.race-profile-kpi {
  display: grid;
  gap: 5px;
  min-height: 82px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.race-profile-kpi span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.race-profile-kpi strong {
  color: #0f172a;
  font-size: 1.25rem;
  line-height: 1.1;
}

.race-profile-kpi.is-warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.race-profile-kpi.is-positive {
  border-color: #22c55e;
  background: #f0fdf4;
}

.race-profile-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.race-profile-detail {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.race-profile-detail h3 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 0.96rem;
  line-height: 1.25;
}

.race-profile-detail p {
  margin: 0;
  color: #334155;
  line-height: 1.45;
}

.race-profile-verdict {
  font-weight: 600;
}

.race-profile-list {
  display: grid;
  gap: 8px;
}

.race-profile-list.compact {
  margin-top: 12px;
}

.race-profile-list-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  padding: 9px 0;
  border-top: 1px solid #edf2f7;
}

.race-profile-list-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.race-profile-main,
.race-profile-value {
  min-width: 0;
  color: #111827;
  font-size: 0.94rem;
  line-height: 1.25;
}

.race-profile-main {
  overflow-wrap: anywhere;
}

.race-profile-value {
  text-align: right;
  white-space: nowrap;
}

.race-profile-list-row small {
  grid-column: 1 / -1;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.25;
}

.race-profile-value.positive {
  color: #15803d;
}

.race-profile-value.negative {
  color: #b45309;
}

.race-profile-muted {
  color: #64748b;
  font-size: 0.95rem;
}

@media (max-width: 1080px) {
  .race-profile-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .race-profile-block {
    padding: 14px;
  }

  .race-profile-head {
    display: grid;
  }

  .race-profile-favorite {
    min-width: 0;
  }
}

/* Simple layout for chips area */
.advantages-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* Unified Start cell styling */
.start-cell { display: grid; grid-auto-rows: min-content; line-height: 1.1; }
.horse-info-line { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.horse-link,
.driver-link {
  color: inherit;
  text-decoration: underline;
  text-decoration-style: dotted;
}
.horse-link:hover,
.driver-link:hover {
  text-decoration-style: solid;
}
.start-line1 { font-weight: 600; }
.start-line2 { font-size: 0.85rem; color: #6b7280; }
.start-line3 { font-size: 0.85rem; color: #6b7280; display: flex; align-items: center; gap: 6px; }
.start-badge { font-size: 0.72rem; padding: 1px 6px; border-radius: 999px; border: 1px solid #e5e7eb; }
.start-badge.longer { background: #fff7ed; color: #9a3412; border-color: #fdba74; }
.start-badge.shorter { background: #ecfeff; color: #155e75; border-color: #67e8f9; }

/* Highlight star */
.hl-star { color: #f59e0b; margin-left: 4px; }

@media (prefers-color-scheme: dark) {
  .race-profile-block {
    border-color: #243244;
    background: #0f172a;
    color: #e5e7eb;
  }

  .race-profile-eyebrow {
    color: #5eead4;
  }

  .race-profile-head h2,
  .race-profile-kpi strong,
  .race-profile-detail h3,
  .race-profile-main,
  .race-profile-value {
    color: #f8fafc;
  }

  .race-profile-narrative,
  .race-profile-detail p {
    color: #cbd5e1;
  }

  .race-profile-favorite {
    border-color: #155e75;
    background: #083344;
  }

  .race-profile-favorite span {
    color: #5eead4;
  }

  .race-profile-favorite strong {
    color: #ecfeff;
  }

  .race-profile-favorite small {
    color: #a7f3d0;
  }

  .race-profile-kpi,
  .race-profile-detail {
    border-color: #243244;
    background: #111c2e;
  }

  .race-profile-kpi span,
  .race-profile-muted,
  .race-profile-list-row small {
    color: #94a3b8;
  }

  .race-profile-kpi.is-warning {
    border-color: #92400e;
    background: #2b2113;
  }

  .race-profile-kpi.is-positive {
    border-color: #166534;
    background: #10251b;
  }

  .race-profile-list-row {
    border-top-color: #243244;
  }

  .race-profile-value.positive {
    color: #86efac;
  }

  .race-profile-value.negative {
    color: #fbbf24;
  }

  .start-line2, .start-line3 { color: #9ca3af; }
  .start-badge { border-color: #374151; }
  .start-badge.longer { background: #3b2518; color: #fdba74; border-color: #7c2d12; }
  .start-badge.shorter { background: #082f35; color: #67e8f9; border-color: #164e63; }
}

.v-theme--dark .race-profile-block {
  border-color: #243244;
  background: #0f172a;
  color: #e5e7eb;
}

.v-theme--dark .race-profile-eyebrow {
  color: #5eead4;
}

.v-theme--dark .race-profile-head h2,
.v-theme--dark .race-profile-kpi strong,
.v-theme--dark .race-profile-detail h3,
.v-theme--dark .race-profile-main,
.v-theme--dark .race-profile-value {
  color: #f8fafc;
}

.v-theme--dark .race-profile-narrative,
.v-theme--dark .race-profile-detail p {
  color: #cbd5e1;
}

.v-theme--dark .race-profile-favorite {
  border-color: #155e75;
  background: #083344;
}

.v-theme--dark .race-profile-favorite span {
  color: #5eead4;
}

.v-theme--dark .race-profile-favorite strong {
  color: #ecfeff;
}

.v-theme--dark .race-profile-favorite small {
  color: #a7f3d0;
}

.v-theme--dark .race-profile-kpi,
.v-theme--dark .race-profile-detail {
  border-color: #243244;
  background: #111c2e;
}

.v-theme--dark .race-profile-kpi span,
.v-theme--dark .race-profile-muted,
.v-theme--dark .race-profile-list-row small {
  color: #94a3b8;
}

.v-theme--dark .race-profile-kpi.is-warning {
  border-color: #92400e;
  background: #2b2113;
}

.v-theme--dark .race-profile-kpi.is-positive {
  border-color: #166534;
  background: #10251b;
}

.v-theme--dark .race-profile-list-row {
  border-top-color: #243244;
}

.v-theme--dark .race-profile-value.positive {
  color: #86efac;
}

.v-theme--dark .race-profile-value.negative {
  color: #fbbf24;
}

.race-profile-block {
  border-color: #243244;
  background: #0f172a;
  color: #e5e7eb;
}

.race-profile-eyebrow {
  color: #5eead4;
}

.race-profile-head h2,
.race-profile-kpi strong,
.race-profile-detail h3,
.race-profile-main,
.race-profile-value {
  color: #f8fafc;
}

.race-profile-narrative,
.race-profile-detail p {
  color: #cbd5e1;
}

.race-profile-favorite {
  border-color: #155e75;
  background: #083344;
}

.race-profile-favorite span {
  color: #5eead4;
}

.race-profile-favorite strong {
  color: #ecfeff;
}

.race-profile-kpi,
.race-profile-detail {
  border-color: #243244;
  background: #111c2e;
}

.race-profile-kpi span,
.race-profile-muted,
.race-profile-list-row small {
  color: #94a3b8;
}

.race-profile-kpi.is-warning {
  border-color: #92400e;
  background: #2b2113;
}

.race-profile-kpi.is-positive {
  border-color: #166534;
  background: #10251b;
}

.race-profile-list-row {
  border-top-color: #243244;
}

.race-profile-value.positive {
  color: #86efac;
}

.race-profile-value.negative {
  color: #fbbf24;
}
.ai-preset { margin-top: 4px; }

/* Stats column UI */
.stats-cell { display: grid; gap: 4px; }
.stats-text { font-size: 0.85rem; color: #111827; }
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
.v85-row { font-size: 0.82rem; color: #166534; }
.v86-row { font-size: 0.82rem; color: #1d4ed8; }

@media (prefers-color-scheme: dark) {
  .stats-text { color: #e5e7eb; }
  .form-bar { background: #374151; }
  .form-bar.bar-good { background: #065f46; }
  .form-bar.bar-ok { background: #78350f; }
  .form-bar.bar-bad { background: #7f1d1d; }
  .form-fill { background: linear-gradient(90deg, #93c5fd, #60a5fa); }
  .stats-row { color: #9ca3af; }
  .stats-pair { color: #e5e7eb; }
  .v85-row { color: #86efac; }
  .v86-row { color: #93c5fd; }
}
</style>
