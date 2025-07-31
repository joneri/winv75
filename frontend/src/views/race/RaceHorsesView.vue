<template>
    <v-container class="tabbed-view-container">
        <v-row>
            <v-col>
                <button @click="navigateToRaceDay(raceDayId)">Go to Race Day</button>
            </v-col>
        </v-row>
        <v-row>
          <v-col>
            <h1>Race Number: {{ currentRace.raceNumber }} - {{ currentRace.propTexts?.[0]?.text }} {{ currentRace.propTexts?.[1]?.text }}</h1>
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
                            <template v-slot:item.name="{ item }">
                                <span :style="{ 'text-decoration': item.columns.horseWithdrawn ? 'line-through' : 'none' }">
                                    {{ item.columns.name }}
                                </span>
                            </template>
                            <template v-slot:item.eloRating="{ item }">
                                {{ formatElo(item.columns.eloRating) }}
                            </template>
                            <template v-slot:item.driverElo="{ item }">
                                {{ formatElo(item.columns.driverElo) }}
                            </template>
                            <template v-slot:item.shoeOption="{ item }">
                                {{ formatShoe(item.raw) }}
                            </template>
                        </v-data-table>
                    </v-window-item>
                    <v-window-item value="1">
                        <v-data-table :headers="rankedHeaders" :items="rankedHorses" :items-per-page="16" class="elevation-1">
                            <template v-slot:item.favoriteIndicator="{ item }">
                                <!-- Intentionally left blank: star moved to track column -->
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
                                {{ getShoeById(item.raw.id) }}
                            </template>
                        </v-data-table>
                    </v-window-item>
                </v-window>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
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

export default {
    name: 'RaceHorsesView',

    setup() {
        // Step 1: Detect start method from propTexts
        const raceStartMethod = computed(() => {
          const propTexts = (currentRace.value && currentRace.value.propTexts) || [];
          const tObj = propTexts.find(pt => pt.typ === 'T' && pt.text);
          if (!tObj) return '';
          if (/Autostart/i.test(tObj.text)) return 'Autostart';
          if (/Voltstart/i.test(tObj.text)) return 'Voltstart';
          return '';
        });

        // Step 2: Compute code 'A' or 'V' for start method
        const raceStartMethodCode = computed(() => {
          if (raceStartMethod.value === 'Autostart') return 'A';
          if (raceStartMethod.value === 'Voltstart') return 'V';
          return '';
        });

        const displayStartMethod = computed(() => {
          return currentRace.value?.startMethod || raceStartMethod.value || 'N/A';
        });

        const displayDistance = computed(() => {
          const d = currentRace.value?.distance;
          return d ? `${d} m` : 'N/A';
        });

        const displayRaceType = computed(() => {
          if (currentRace.value?.propositionName) return currentRace.value.propositionName;
          const p1 = currentRace.value?.propTexts?.[0]?.text || '';
          const p2 = currentRace.value?.propTexts?.[1]?.text || '';
          const combined = `${p1} ${p2}`.trim();
          return combined || 'N/A';
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
          return 'N/A';
        });

        const raceMetaString = computed(() => {
          return `Start: ${displayStartMethod.value} | Distance: ${displayDistance.value} | Type: ${displayRaceType.value} | Prize: ${displayPrizeMoney.value}`;
        });

        const displayTrackLength = computed(() => {
          const len = trackMeta.value?.trackLength
          return typeof len === 'number' ? `${len} m` : 'N/A'
        });

        const displayTrackRecord = computed(() => {
          return trackMeta.value?.trackRecord || 'N/A'
        });

        const displayFavStartPos = computed(() => {
          const pos = trackMeta.value?.favouriteStartingPosition
          return typeof pos === 'number' ? pos : 'N/A'
        });

        const trackMetaString = computed(() => {
          const name = getTrackName(racedayTrackCode.value)
          return `Track: ${name} | Length: ${displayTrackLength.value} | Fav. pos: ${displayFavStartPos.value} | Record: ${displayTrackRecord.value}`
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
                const driverRatingMap = {}
                scores.forEach(r => {
                    scoreMap[r.id] = r.score
                    ratingMap[r.id] = r.rating
                })
                driverRatings.forEach(d => {
                    // Use string keys to avoid number/string mismatches
                    driverRatingMap[String(d.id)] = d.elo
                })
                responseData.horses = (responseData.horses || []).map(h => {
                    const driverId = h.driver?.licenseId ?? h.driver?.id
                    const driverElo = driverRatingMap[String(driverId)]
                    return {
                        ...h,
                        score: scoreMap[h.id],
                        rating: ratingMap[h.id],
                        eloRating: ratingMap[h.id],
                        driverElo,
                        driver: {
                            ...h.driver,
                            id: driverId,
                            elo: driverElo,
                        }
                    }
                })
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
        })

        watch(() => route.params.raceId, async (newRaceId) => {
            store.commit('raceHorses/clearRankedHorses')
            store.commit('raceHorses/clearCurrentRace')
            await fetchDataAndUpdate(newRaceId)
            await fetchTrackInfo()
        })

        watch(() => route.params.racedayId, async () => {
            await fetchTrackInfo()
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

        const headers = [
            { title: 'Start Position', key: 'programNumber' },
            { title: 'Horse Name', key: 'name' },
            { title: 'Driver Name', key: 'driver.name' },
            { title: 'Horse Elo', key: 'eloRating' },
            { title: 'Driver Elo', key: 'driverElo' },
            { title: 'Sko', key: 'shoeOption', sortable: false },
            { key: 'horseWithdrawn' },
        ]

        const rankedHeaders = [
            { title: '', key: 'favoriteIndicator', sortable: false },
            { title: 'Start Position', key: 'programNumber' },
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
            { title: 'Number of Starts', key: 'numberOfStarts' },
            { title: 'Placements', key: 'placements' },
            { title: 'Total Score', key: 'totalScore' },
        ]

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

        const formatShoe = (horse) => {
            const code = horse?.shoeOption?.code
            if (code === undefined || code === null) return 'N/A'
            const prev = horse?.previousShoeOption?.code
            const changed = prev !== undefined && prev !== null && prev !== code
            const mapping = shoeMap[code] || { label: code, emoji: '' }
            const text = `${mapping.emoji} ${mapping.label}`.trim()
            return changed ? `${text} 🔁` : text
        }

        const getShoeById = (horseId) => {
            const horse = currentRace.value?.horses?.find(h => h.id === horseId)
            return horse ? formatShoe(horse) : 'N/A'
        }

        const formatElo = (value) => {
            return typeof value === 'number' ? Math.round(value) : 'N/A'
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
            raceStartMethod,
            raceStartMethodCode,
            raceMetaString,
            trackMetaString,
            formatElo,
            formatShoe,
            getShoeById,
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
</style>
