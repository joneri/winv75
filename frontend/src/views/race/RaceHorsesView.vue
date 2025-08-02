<template>
    <v-container class="tabbed-view-container">
        <v-row>
            <v-col>
                <button @click="navigateToRaceDay(raceDayId)">Go to Race Day</button>
            </v-col>
        </v-row>
        <v-row>
          <v-col>
            <h1>
              Race Number: {{ currentRace.raceNumber }} - {{ currentRace.propTexts?.[0]?.text }} {{ currentRace.propTexts?.[1]?.text }}
              <SpelformBadge v-for="g in raceGames" :key="g.game" :game="g.game" :leg="g.leg" />
            </h1>
            <div v-if="racedayTrackName" class="text-h6">
              {{ racedayTrackName }}
            </div>
            <div class="race-meta text-subtitle-1">
              {{ raceMetaString }}
            </div>
            <div class="track-meta text-subtitle-2">
              {{ trackMetaString }}
            </div>
          </v-col>
        </v-row>
        <v-row v-if="raceList.length" class="race-navigation">
            <v-col class="d-flex justify-space-between">
                <v-btn variant="text" @click="goToRace(previousRaceId)" :disabled="!previousRaceId">⟵ Previous race</v-btn>
                <v-btn variant="text" @click="goToRace(nextRaceId)" :disabled="!nextRaceId">Next race ⟶</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-tabs v-model="activeTab">
                    <v-tab>Start List</v-tab>
                    <v-tab :disabled="!allHorsesUpdated">Ranked Horses</v-tab>
                </v-tabs>
                <v-window v-model="activeTab">
                    <v-window-item value="0">
                    <v-data-table :headers="headers" :items="currentRace.horses" :items-per-page="16"
                            class="elevation-1">
                            <template v-if="showStartPositionColumn" v-slot:item.startPosition="{ item }">
                                <span title="Startposition i volten">
                                    {{ formatStartPosition(item.columns.actualStartPosition ?? item.columns.startPosition) }}
                                </span>
                            </template>
                            <template v-if="hasHandicap" v-slot:item.actualDistance="{ item }">
                                {{ item.columns.actualDistance ? `${item.columns.actualDistance} m` : '—' }}
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
                                    <HorseCommentBlock
                                      :comment="item.raw.comment"
                                      :past-race-comments="item.raw.pastRaceComments"
                                      :withdrawn="item.columns.horseWithdrawn"
                                    />
                                </div>
                            </template>
                            <template v-slot:item.driverElo="{ item }">
                                {{ item.raw.driver?.name || '—' }} – {{ formatElo(item.columns.driverElo) }}
                            </template>
                            <template v-slot:item.stats="{ item }">
                                {{ item.raw.statsFormatted || 'Ingen data' }}
                            </template>
                            <template v-slot:item.bestTrack="{ item }">
                                {{ item.raw.bestTrack }}
                            </template>
                            <template v-slot:item.preferredDistance="{ item }">
                                {{ item.raw.preferredDistance }}
                            </template>
                            <template v-slot:item.autostartStats="{ item }">
                                {{ item.raw.autostartStats }}
                                <span v-if="item.raw.preferredStartMethod === 'A'">⭐</span>
                            </template>
                            <template v-slot:item.voltstartStats="{ item }">
                                {{ item.raw.voltstartStats }}
                                <span v-if="item.raw.preferredStartMethod === 'V'">⭐</span>
                            </template>
                            <template v-slot:item.shoeOption="{ item }">
                                <span :title="startListShoeTooltip(item.raw) || null">
                                    {{ formatStartListShoe(item.raw) }}
                                </span>
                            </template>
                        </v-data-table>
                    </v-window-item>
                    <v-window-item value="1">
                        <v-data-table :headers="rankedHeaders" :items="rankedHorses" :items-per-page="16" class="elevation-1">
                            <template v-slot:item.favoriteIndicator="{ item }">
                                <!-- Intentionally left blank: star moved to track column -->
                            </template>
                            <template v-if="showStartPositionColumn" v-slot:item.startPosition="{ item }">
                                <span title="Startposition i volten">
                                    {{ formatStartPosition(item.columns.actualStartPosition ?? item.columns.startPosition) }}
                                </span>
                            </template>
                            <template v-slot:item.favoriteTrack="{ item }">
                                {{ getTrackName(item.columns.favoriteTrack) }}
                                <span v-if="item.columns.favoriteTrack === racedayTrackCode">⭐</span>
                            </template>
                            <template v-slot:item.favoriteStartMethod="{ item }">
                                {{ item.columns.favoriteStartMethod }}
                                <span v-if="item.columns.favoriteStartMethod && item.columns.favoriteStartMethod.toUpperCase() === raceStartMethodCode.toUpperCase()" title="Favorite start method match" class="ml-1">⭐</span>
                            </template>
                            <template v-slot:item.shoeOption="{ item }">
                                <span :title="getShoeTooltipById(item.raw.id) || null">
                                    {{ getShoeById(item.raw.id) }}
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
import {
    checkIfUpdatedRecently,
    fetchRaceFromRaceId,
    fetchHorseScores,
    fetchDriverRatings,
    triggerRatingsUpdate
} from '@/views/race/services/RaceHorsesService.js'
import RacedayService from '@/views/raceday/services/RacedayService.js'
import TrackService from '@/views/race/services/TrackService.js'
import HorseService from '@/views/race/services/HorseService.js'
import SpelformBadge from '@/components/SpelformBadge.vue'
import HorseCommentBlock from './components/HorseCommentBlock.vue'

export default {
    name: 'RaceHorsesView',
    components: { SpelformBadge, HorseCommentBlock },

    setup() {
        // Helper to parse start method and handicaps from propTexts
        const parseStartMethodFromPropTexts = (propTexts = []) => {
          const text = propTexts
            .filter(pt => pt.typ === 'T' && pt.text)
            .map(pt => pt.text)
            .join(' ');

          let method = 'Voltstart';
          let code = 'V';
          if (/Autostart/i.test(text)) {
            method = 'Autostart';
            code = 'A';
          } else if (/Voltstart/i.test(text)) {
            method = 'Voltstart';
            code = 'V';
          }

          const handicap = /\btillägg\b|\b\d{2,3}\s*m\b/i.test(text);

          return { method, code, handicap };
        };

        const startInfo = computed(() =>
          parseStartMethodFromPropTexts(currentRace.value?.propTexts || [])
        );

        const raceStartMethod = computed(() => startInfo.value.method);
        const raceStartMethodCode = computed(() => startInfo.value.code);
        const hasHandicap = computed(() => startInfo.value.handicap);

        const showStartPositionColumn = computed(() => {
          const horses = currentRace.value?.horses || [];
          const anyDiff = horses.some(h => {
            const pos = h.actualStartPosition ?? h.startPosition;
            return pos && pos !== h.programNumber;
          });
          return raceStartMethod.value === 'Voltstart' || anyDiff;
        });

        const displayStartMethod = computed(() => {
          if (raceStartMethod.value === 'Voltstart' && hasHandicap.value) {
            return 'Voltstart med tillägg';
          }
          return raceStartMethod.value;
        });

        const displayDistance = computed(() => {
          const d = currentRace.value?.distance;
          return d ? `${d} m` : '—';
        });

        const displayRaceType = computed(() => {
          if (currentRace.value?.propositionName) return currentRace.value.propositionName;
          const p1 = currentRace.value?.propTexts?.[0]?.text || '';
          const p2 = currentRace.value?.propTexts?.[1]?.text || '';
          const combined = `${p1} ${p2}`.trim();
          return combined || '—';
        });

        const displayPrizeMoney = computed(() => {
          const prize = currentRace.value?.totalPrizeMoney;
          if (typeof prize === 'number' && prize > 0) {
            return `${prize.toLocaleString('sv-SE')} kr`;
          }
          const prizeObj = currentRace.value?.propTexts?.find(pt => pt.typ === 'P');
          if (prizeObj?.text) {
            return prizeObj.text.replace(/\./g, ' ');
          }
          return '—';
        });

        const raceMetaString = computed(() => {
          return `Start: ${displayStartMethod.value} | Distance: ${displayDistance.value} | ${displayPrizeMoney.value}`;
        });

        const displayTrackLength = computed(() => {
          const len = trackMeta.value?.trackLength
          return typeof len === 'number' ? `${len} m` : '—'
        });

        const displayTrackRecord = computed(() => {
          return trackMeta.value?.trackRecord || '—'
        });

        const displayFavStartPos = computed(() => {
          const pos = trackMeta.value?.favouriteStartingPosition
          return typeof pos === 'number' ? pos : '—'
        });

        const trackMetaString = computed(() => {
          const name = getTrackName(racedayTrackCode.value)
          return `Track: ${name} | Length: ${displayTrackLength.value} | Fav. pos: ${displayFavStartPos.value} | Record: ${displayTrackRecord.value}`
        });
        const raceGames = computed(() => {
            const res = []
            const raceId = currentRace.value?.raceId
            if (!raceId) return res
            for (const [game, ids] of Object.entries(spelformer.value)) {
                const idx = ids.indexOf(raceId)
                if (idx !== -1) res.push({ game, leg: idx + 1 })
            }
            return res
        });
        const store = useStore()
        const route = useRoute()
        const router = useRouter()
        const navigateToRaceDay = () => {
            const currentPath = router.currentRoute.value.fullPath
            const segments = currentPath.split('/')
            const raceDayId = segments[2]
            router.push(`/raceday/${raceDayId}`)
        }

        const currentRace = computed(() => store.state.raceHorses.currentRace)
        const rankedHorses = computed(() => store.getters['raceHorses/getRankedHorses'])
        const rankHorses = async () => {
            const raceId = route.params.raceId
            await store.dispatch('raceHorses/rankHorses', raceId)
        }
        const allHorsesUpdated = computed(() => {
            const horses = currentRace.value.horses || []
            const allUpdated = horses.every(horse => updatedHorses.value.includes(horse.id))
            console.log("All horses updated?", allUpdated)
            return allUpdated
        })
        const activeTab = ref(0) // Default tab
        const items = ['Start List', 'Ranked Horses'] // Tabs
        const updatedHorses = ref([]) // A list to store IDs of updated horses
        const racedayTrackName = ref('')
        const racedayTrackCode = ref('')
        const trackMeta = ref({})
        const spelformer = ref({})
        const racedayDetails = ref(null)
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

        const getTrackCodeFromName = (name) => {
            for (const [code, n] of Object.entries(trackNames)) {
                if (n === name) return code
            }
            return ''
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

        const formatStats = (stats) => {
            if (!stats || stats.totalStarts === 0) return ''
            const wins = stats.wins ?? 0
            const top3 = stats.top3 ?? 0
            const avg = typeof stats.averagePlacing === 'number' ? stats.averagePlacing.toFixed(1) : '—'
            const form = typeof stats.formScore === 'number' ? stats.formScore : '—'
            return `${wins} segrar • ${top3} topp-3 • Snitt: ${avg} • Form: ${form}`
        }

        const fetchDataAndUpdate = async (raceId) => {
            try {
                const responseData = await fetchRaceFromRaceId(raceId)
                const horseIds = (responseData.horses || []).map(h => h.id)
                // Collect driver IDs even if the API returns them as strings
                const driverIds = (responseData.horses || [])
                    .map(h => h.driver?.licenseId ?? h.driver?.id)
                    .filter(id => id != null)
                let scores = []
                let driverRatings = []
                if (horseIds.length) {
                    scores = await fetchHorseScores(horseIds)
                }
                if (driverIds.length) {
                    driverRatings = await fetchDriverRatings(driverIds)
                }
                const scoreMap = {}
                const ratingMap = {}
                const numberOfStartsMap = {}
                const driverRatingMap = {}
                scores.forEach(r => {
                    scoreMap[r.id] = r.score
                    ratingMap[r.id] = r.rating
                    numberOfStartsMap[r.id] = parseInt(r.statistics?.[0]?.numberOfStarts) || 0
                })
                driverRatings.forEach(d => {
                    // Use string keys to avoid number/string mismatches
                    driverRatingMap[String(d.id)] = d.elo
                })
                // Stats based on Travsport data (horse.results[]). ATG past-race
                // objects may expose a `.records` property, so handle both
                // shapes when gathering result data.
                const statsFor = (horse) => {

                    const results = Array.isArray(horse.results?.records)
                        ? [...horse.results.records]
                        : Array.isArray(horse.results)
                            ? [...horse.results]
                            : []
                    // Sort most recent first so that form is calculated on the
                    // latest starts. Travsport results expose the race date
                    // under `raceInformation.date` whereas some ATG payloads
                    // may use `startTime`.
                    results.sort((a, b) =>
                        new Date(b.raceInformation?.date || b.startTime || 0) -
                        new Date(a.raceInformation?.date || a.startTime || 0)
                    )
                    let totalStarts = 0
                    let wins = 0
                    let seconds = 0
                    let thirds = 0
                    let sumPlacings = 0
                    let racesWithPlace = 0
                    let formScore = 0

                    const driverCounts = {}
                    let favDriver = ''
                    let favCount = 0

                    const trackStats = {}
                    const distanceStats = {
                        '1600-1800': { starts: 0, wins: 0, sumPlacings: 0, placements: 0 },
                        '1801-2200': { starts: 0, wins: 0, sumPlacings: 0, placements: 0 },
                        '2201-2600': { starts: 0, wins: 0, sumPlacings: 0, placements: 0 },
                        '2601+': { starts: 0, wins: 0, sumPlacings: 0, placements: 0 },
                    }
                    const methodStats = {
                        A: { starts: 0, wins: 0, top3: 0, sumPlacings: 0, placements: 0 },
                        V: { starts: 0, wins: 0, top3: 0, sumPlacings: 0, placements: 0 },
                    }

                    const getDistanceBucket = (dist) => {
                        if (dist >= 1600 && dist <= 1800) return '1600-1800'
                        if (dist >= 1801 && dist <= 2200) return '1801-2200'
                        if (dist >= 2201 && dist <= 2600) return '2201-2600'
                        if (dist >= 2601) return '2601+'
                        return null
                    }

                    results.forEach((r, idx) => {
                        if (r.withdrawn) return
                        totalStarts++

                        // Travsport stores placing under `placement.sortValue`
                        // while other data sources might expose `place`.
                        const placement = parseInt(
                            r?.placement?.sortValue ?? r?.place ?? 0,
                            10
                        )
                        if (!Number.isNaN(placement) && placement > 0) {
                            if (placement === 1) wins++
                            else if (placement === 2) seconds++
                            else if (placement === 3) thirds++

                            sumPlacings += placement
                            racesWithPlace++
                        }

                        if (idx < 5) {
                            if (placement === 1) formScore += 3
                            else if (placement === 2) formScore += 2
                            else if (placement === 3) formScore += 1
                        }

                        const driverObj = r?.driver || {}
                        const dName =
                            driverObj.name ||
                            [driverObj.firstName, driverObj.lastName]
                                .filter(Boolean)
                                .join(' ')
                                .trim()
                        if (dName) {
                            driverCounts[dName] = (driverCounts[dName] || 0) + 1
                            if (driverCounts[dName] > favCount) {
                                favCount = driverCounts[dName]
                                favDriver = dName
                            }
                        }

                        const track = r.track?.code || r.trackCode
                        if (track) {
                            if (!trackStats[track]) {
                                trackStats[track] = { starts: 0, wins: 0, sumPlacings: 0, placements: 0 }
                            }
                            const t = trackStats[track]
                            t.starts++
                            if (placement === 1) t.wins++
                            if (!Number.isNaN(placement) && placement > 0) {
                                t.sumPlacings += placement
                                t.placements++
                            }
                        }

                        // Distance is provided as an object with `sortValue`
                        // in Travsport data.
                        const dist = Number(r.distance?.sortValue ?? r.distance ?? 0)
                        const bucket = getDistanceBucket(dist)
                        if (bucket) {
                            const b = distanceStats[bucket]
                            b.starts++
                            if (placement === 1) b.wins++
                            if (!Number.isNaN(placement) && placement > 0) {
                                b.sumPlacings += placement
                                b.placements++
                            }
                        }

                        const method = r.startMethod
                        if (method && methodStats[method]) {
                            const m = methodStats[method]
                            m.starts++
                            if (placement === 1) m.wins++
                            if (placement >= 1 && placement <= 3) m.top3++
                            if (!Number.isNaN(placement) && placement > 0) {
                                m.sumPlacings += placement
                                m.placements++
                            }
                        }
                    })

                    const top3 = wins + seconds + thirds

                    let bestTrackCode = null
                    let bestTrackWins = -1
                    let bestTrackAvg = Infinity
                    Object.entries(trackStats).forEach(([code, s]) => {
                        const avg = s.placements ? s.sumPlacings / s.placements : Infinity
                        if (s.wins > bestTrackWins || (s.wins === bestTrackWins && avg < bestTrackAvg)) {
                            bestTrackCode = code
                            bestTrackWins = s.wins
                            bestTrackAvg = avg
                        }
                    })

                    let bestDistanceLabel = null
                    let bestDistanceWins = -1
                    let bestDistanceAvg = Infinity
                    Object.entries(distanceStats).forEach(([label, s]) => {
                        if (!s.starts) return
                        const avg = s.placements ? s.sumPlacings / s.placements : Infinity
                        if (s.wins > bestDistanceWins || (s.wins === bestDistanceWins && avg < bestDistanceAvg)) {
                            bestDistanceLabel = label
                            bestDistanceWins = s.wins
                            bestDistanceAvg = avg
                        }
                    })
                    const bestDistanceStats = bestDistanceLabel ? distanceStats[bestDistanceLabel] : null

                    const formatMethodStats = (s) => {
                        const winPct = s.starts ? (s.wins / s.starts) * 100 : 0
                        const top3Pct = s.starts ? (s.top3 / s.starts) * 100 : 0
                        const avg = s.placements ? (s.sumPlacings / s.placements) : null
                        return { winPct, top3Pct, avg, starts: s.starts }
                    }
                    const autoStats = formatMethodStats(methodStats.A)
                    const voltStats = formatMethodStats(methodStats.V)

                    let preferredStartMethod = null
                    if (autoStats.starts || voltStats.starts) {
                        if (autoStats.winPct > voltStats.winPct) preferredStartMethod = 'A'
                        else if (voltStats.winPct > autoStats.winPct) preferredStartMethod = 'V'
                        else if (autoStats.avg !== null && voltStats.avg !== null) {
                            preferredStartMethod = autoStats.avg <= voltStats.avg ? 'A' : 'V'
                        }
                    }

                    const averagePlacing = racesWithPlace ? (sumPlacings / racesWithPlace) : null

                    return {
                        totalStarts,
                        wins,
                        seconds,
                        thirds,
                        top3,
                        winPercentage: totalStarts ? (wins / totalStarts) * 100 : 0,
                        top3Percentage: totalStarts ? (top3 / totalStarts) * 100 : 0,
                        averagePlacing,
                        formScore,
                        favDriver,
                        favCount,
                        bestTrackCode,
                        bestTrackWins,
                        bestTrackStarts: bestTrackCode ? trackStats[bestTrackCode]?.starts : 0,
                        bestDistanceLabel,
                        bestDistanceStats: bestDistanceStats
                            ? {
                                winPct: bestDistanceStats.starts ? (bestDistanceStats.wins / bestDistanceStats.starts) * 100 : 0,
                                avg: bestDistanceStats.placements ? (bestDistanceStats.sumPlacings / bestDistanceStats.placements) : null,
                                starts: bestDistanceStats.starts,
                                wins: bestDistanceStats.wins,
                            }
                            : null,
                        autoStats,
                        voltStats,
                        preferredStartMethod,
                    }
                }

                const formatMethodDisplay = (stat) => {
                    if (!stat.starts) return '—'
                    const parts = []
                    parts.push(`${Math.round(stat.winPct)}% win`)
                    parts.push(`${Math.round(stat.top3Pct)}% top3`)
                    if (typeof stat.avg === 'number') parts.push(`avg ${stat.avg.toFixed(1)}`)
                    return parts.join(', ')
                }

                const formatDistanceDisplay = (label, stat) => {
                    if (!stat) return label
                    if (stat.winPct) return `${label} (${Math.round(stat.winPct)}% win)`
                    if (typeof stat.avg === 'number') return `${label} (avg ${stat.avg.toFixed(1)})`
                    return label
                }

                responseData.horses = await Promise.all((responseData.horses || []).map(async h => {
                    const driverId = h.driver?.licenseId ?? h.driver?.id
                    const driverElo = driverRatingMap[String(driverId)]
                    const fullHorse = await HorseService.getHorseById(h.id)
                    const stats = statsFor(fullHorse)
                    const enriched = {
                        ...h,
                        stats,
                        statsFormatted: formatStats(stats),
                        score: scoreMap[h.id],
                        rating: ratingMap[h.id],
                        eloRating: ratingMap[h.id],
                        numberOfStarts: numberOfStartsMap[h.id] ?? 0,
                        statsWinPercentage: stats.winPercentage,
                        statsTop3Percentage: stats.top3Percentage,
                        averagePlacing: stats.averagePlacing,
                        formScoreDisplay: stats.formScore !== null ? `${stats.formScore} / 15` : '—',
                        favoriteDriverDisplay: stats.favDriver ? `${stats.favDriver} (${stats.favCount}x)` : '—',
                        statsTotalStarts: stats.totalStarts,
                        bestTrack: stats.totalStarts >= 5 && stats.bestTrackCode
                            ? `${getTrackName(stats.bestTrackCode)}${stats.bestTrackWins ? ` (${stats.bestTrackWins}x win)` : ''}`
                            : 'För få lopp',
                        preferredDistance: stats.totalStarts >= 5 && stats.bestDistanceLabel
                            ? formatDistanceDisplay(stats.bestDistanceLabel, stats.bestDistanceStats)
                            : 'För få lopp',
                        autostartStats: stats.totalStarts >= 5
                            ? formatMethodDisplay(stats.autoStats)
                            : 'För få lopp',
                        voltstartStats: stats.totalStarts >= 5
                            ? formatMethodDisplay(stats.voltStats)
                            : 'För få lopp',
                        preferredStartMethod: stats.totalStarts >= 5 ? stats.preferredStartMethod : null,
                        driverElo,
                        driver: {
                            ...h.driver,
                            id: driverId,
                            elo: driverElo,
                        }
                    }
                    return enriched
                }))
                store.commit('raceHorses/setCurrentRace', responseData)
                await fetchUpdatedHorses()

                if (allHorsesUpdated.value) {
                    await store.dispatch('raceHorses/rankHorses', raceId)
                }

            } catch (error) {
                console.error('Failed to fetch data:', error)
            }
        };

        onMounted(async () => {
            const raceId = route.params.raceId
            await fetchDataAndUpdate(raceId)
            await fetchTrackInfo()
            await fetchSpelformer()
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.raceId, async (newRaceId) => {
            store.commit('raceHorses/clearRankedHorses')
            store.commit('raceHorses/clearCurrentRace')
            await fetchDataAndUpdate(newRaceId)
            await fetchTrackInfo()
            await fetchSpelformer()
            await nextTick()
            window.scrollTo(0, scrollPosition.value)
        })

        watch(() => route.params.racedayId, async () => {
            await fetchTrackInfo()
            await fetchSpelformer()
        })

        watch(allHorsesUpdated, async (newValue) => {
            if (newValue && typeof updatedHorses !== 'undefined') {
                const raceId = route.params.raceId
                if (raceId) {
                    await store.dispatch('raceHorses/rankHorses', raceId)
                }
            }
        }, { immediate: true })

        watch(currentRace, async () => {
            if (allHorsesUpdated.value) {
                const raceId = route.params.raceId
                await store.dispatch('raceHorses/rankHorses', raceId)
            }
        }, { immediate: true })

        const headers = computed(() => {
            const base = [
                { title: '#', key: 'programNumber', width: '50px' },
                { title: '# Starts', key: 'numberOfStarts', sortable: false },
            ]
            if (showStartPositionColumn.value) {
                base.push({ title: 'Pos', key: 'startPosition', width: '50px' })
            }
            if (hasHandicap.value) {
                base.push({ title: 'Distans', key: 'actualDistance' })
            }
            base.push({ title: 'Horse (Elo)', key: 'eloRating' })
            base.push({ title: 'Driver (Elo)', key: 'driverElo' })
            base.push({ title: 'Stats', key: 'stats', sortable: false })
            base.push({
                title: '🏁 Conditions',
                children: [
                    { title: 'Best Track', key: 'bestTrack', sortable: false },
                    { title: 'Pref. Distance', key: 'preferredDistance', sortable: false },
                    { title: 'Autostart', key: 'autostartStats', sortable: false },
                    { title: 'Voltstart', key: 'voltstartStats', sortable: false },
                ],
            })
            base.push({ title: 'Shoe', key: 'shoeOption', sortable: false })
            base.push({ key: 'horseWithdrawn' })
            return base
        })

        const rankedHeaders = computed(() => {
            const base = [
                { title: '', key: 'favoriteIndicator', sortable: false },
                { title: 'Programnummer', key: 'programNumber' },
                { title: 'Driver Name', key: 'driver.name' },
                { title: 'Name', key: 'name' },
                { title: 'Sko', key: 'shoeOption', sortable: false },
                { title: 'Elo Rating', key: 'rating' },
                { title: 'Favorite Start Position', key: 'favoriteStartPosition' },
                { title: 'Avg Top 3 Odds', key: 'avgTop3Odds' },
                { title: 'Consistency Score', key: 'consistencyScore' },
                { title: 'Favorite Start Method', key: 'favoriteStartMethod' },
                { title: 'Favorite Track', key: 'favoriteTrack' },
                { title: 'Horse Label', key: 'horseLabel' },
                { title: 'Placements', key: 'placements' },
                { title: 'Total Score', key: 'totalScore' },
            ]
            if (showStartPositionColumn.value) {
                base.splice(2, 0, { title: 'Startposition', key: 'startPosition' })
            }
            return base
        })

        const trackNames = {
            'Ar': 'Arvika',
            'Ax': 'Axevalla',
            'Bo': 'Bodentravet',
            'Bs': 'Bollnäs',
            'B': 'Bergsåker',
            'C': 'Charlottenlund',
            'D': 'Dannero',
            'E': 'Eskilstuna',
            'F': 'Färjestad',
            'G': 'Gävle',
            'H': 'Hagmyren',
            'Ha': 'Hagmyren',
            'Hd': 'Halmstad',
            'Hg': 'Hoting',
            'J': 'Jägersro',
            'Kr': 'Kalmar',
            'Ka': 'Kalmar',
            'Kh': 'Karlshamn',
            'L': 'Lindesberg',
            'Ly': 'Lycksele',
            'Mp': 'Mantorp',
            'Ov': 'Oviken',
            'Ro': 'Romme',
            'Rä': 'Rättvik',
            'Rm': 'Roma',
            'S': 'Solvalla',
            'Sk': 'Skellefteå',
            'Sä': 'Solänget',
            'T': 'Tingsryd',
            'Ti': 'Tingsryd',
            'U': 'Umåker',
            'Vg': 'Vaggeryd',
            'Vi': 'Visby',
            'Å': 'Åby',
            'Ål': 'Åland',
            'Åm': 'Åmål',
            'År': 'Årjäng',
            'Ö': 'Örebro',
            'Ös': 'Östersund'
        }

        const getTrackName = (trackCode) => {
            return trackNames[trackCode] || trackCode
        }

        const fetchUpdatedHorses = async () => {
            const horses = currentRace.value.horses || []
            for (let horse of horses) {
                const updated = await checkIfUpdatedRecently(horse.id)
                if (updated) {
                    updatedHorses.value.push(horse.id)
                }
            }
        }

        const shoeMap = {
            4: { label: '', emoji: '👟👟👟👟' },
            3: { label: '', emoji: '🦶🦶👟👟' },
            2: { label: '', emoji: '👟👟🦶🦶' },
            1: { label: '', emoji: '🦶🦶🦶🦶' },
        }

        const startListShoeMap = {
            4: '👟👟',
            3: '🦶👟',
            2: '👟🦶',
            1: '🦶🦶',
        }

        const formatStartListShoe = (horse) => {
            const code = horse?.shoeOption?.code
            if (code === undefined || code === null) return '—'
            const prev = horse?.previousShoeOption?.code
            const changed = prev !== undefined && prev !== null && prev !== code
            const emoji = startListShoeMap[code] || ''
            return changed ? `${emoji} 🔁` : emoji
        }

        const startListShoeTooltip = (horse) => {
            const code = horse?.shoeOption?.code
            const prev = horse?.previousShoeOption?.code
            const changed = prev !== undefined && prev !== null && prev !== code
            if (!changed) return ''
            const prevEmoji = startListShoeMap[prev] || ''
            return `Changed from: ${prevEmoji}`
        }

        const formatShoe = (horse) => {
            const code = horse?.shoeOption?.code
            if (code === undefined || code === null) return '—'
            const prev = horse?.previousShoeOption?.code
            const changed = prev !== undefined && prev !== null && prev !== code
            const mapping = shoeMap[code] || { label: code, emoji: '' }
            const text = `${mapping.emoji} ${mapping.label}`.trim()
            return changed ? `${text} 🔁` : text
        }

        const shoeTooltip = (horse) => {
            const code = horse?.shoeOption?.code
            const prev = horse?.previousShoeOption?.code
            const changed = prev !== undefined && prev !== null && prev !== code
            if (!changed) return ''
            const prevMapping = shoeMap[prev] || { label: prev, emoji: '' }
            const prevText = `${prevMapping.emoji} ${prevMapping.label}`.trim()
            return `Changed from: ${prevText}`
        }

        const getShoeById = (horseId) => {
            const horse = currentRace.value?.horses?.find(h => h.id === horseId)
            return horse ? formatShoe(horse) : '—'
        }

        const getShoeTooltipById = (horseId) => {
            const horse = currentRace.value?.horses?.find(h => h.id === horseId)
            return horse ? shoeTooltip(horse) : ''
        }

        const formatStartPosition = (value) => {
            if (value === undefined || value === null) return '—'
            return typeof value === 'number' ? `${value}` : value
        }

        const formatElo = (value) => {
          return typeof value === 'number' ? Math.round(value) : '—'
        }
        const goToRace = (raceId) => {
            if (!raceId) return
            scrollPosition.value = window.scrollY
            router.push(`/raceday/${route.params.racedayId}/race/${raceId}`)
        }

        return {
            headers,
            rankHorses,
            getTrackName,
            racedayTrackName,
            racedayTrackCode,
            navigateToRaceDay,
            currentRace,
            allHorsesUpdated,
            items,
            activeTab,
            rankedHeaders,
            rankedHorses,
            raceStartMethodCode,
            raceStartMethod,
            hasHandicap,
            showStartPositionColumn,
            displayStartMethod,
            raceMetaString,
            trackMetaString,
            raceGames,
            formatStartPosition,
            formatElo,
            formatStartListShoe,
            startListShoeTooltip,
            formatShoe,
            shoeTooltip,
            getShoeById,
            getShoeTooltipById,
            raceList,
            previousRaceId,
            nextRaceId,
            goToRace,
        }
    },
}
</script>

<style>
.tabbed-view-container {
    margin-top: 64px;
}

.race-meta {
    margin-top: 4px;
    margin-bottom: 8px;
}

.track-meta {
    margin-bottom: 12px;
}

.race-navigation {
    margin-top: 16px;
}

.withdrawn {
    text-decoration: line-through;
}
</style>
