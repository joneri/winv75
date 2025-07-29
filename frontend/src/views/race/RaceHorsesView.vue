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
              <span v-if="raceStartMethod">
                – {{ raceStartMethod }}
                <span v-if="raceStartMethodCode"> ({{ raceStartMethodCode }})</span>
              </span>
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
    triggerRatingsUpdate
} from '@/views/race/services/RaceHorsesService.js'
import RacedayService from '@/views/raceday/services/RacedayService.js'

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
        }

        const fetchDataAndUpdate = async (raceId) => {
            try {
                const responseData = await fetchRaceFromRaceId(raceId)
                const horseIds = (responseData.horses || []).map(h => h.id)
                let scores = []
                if (horseIds.length) {
                    scores = await fetchHorseScores(horseIds)
                }
                const scoreMap = {}
                const ratingMap = {}
                scores.forEach(r => { 
                    scoreMap[r.id] = r.score 
                    ratingMap[r.id] = r.rating
                })
                responseData.horses = (responseData.horses || []).map(h => ({ ...h, score: scoreMap[h.id], rating: ratingMap[h.id] }))
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
            { key: 'horseWithdrawn' },
        ]

        const rankedHeaders = [
            { title: '', key: 'favoriteIndicator', sortable: false },
            { title: 'Start Position', key: 'programNumber' },
            { title: 'Driver Name', key: 'driver.name' },
            { title: 'Name', key: 'name' },
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
        }
    },
}
</script>

<style>
.tabbed-view-container {
    margin-top: 64px;
}
</style>
