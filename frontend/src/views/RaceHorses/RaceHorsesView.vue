<template>
    <v-container>
        <v-row>
            <v-col>
                <v-data-table :headers="headers" :items="currentRace.horses" :items-per-page="16" class="elevation-1">
                    <template v-slot:item.name="{ item }">
                        <span :style="{ 'text-decoration': item.columns.horseWithdrawn ? 'line-through' : 'none' }">
                            {{ item.columns.name }}
                        </span>
                    </template>
                    <template v-slot:item.action="{ item }">
                        <v-btn v-if="!isHorseUpdated(item.key)" @click="updateHorseData(item.key)">Update</v-btn>
                        <v-icon v-else>mdi-check</v-icon>
                    </template>
                </v-data-table>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { checkIfUpdatedRecently, fetchRaceFromRaceId, updateHorse } from '@/views/RaceHorses/services/RaceHorsesService.js'

export default {
    name: 'RaceHorsesView',

    setup() {
        const store = useStore()
        const route = useRoute()
        const currentRace = computed(() => store.state.raceHorses.currentRace)

        onMounted(async () => {
            try {
                const raceId = route.params.raceId
                const responseData = await fetchRaceFromRaceId(raceId)
                store.commit('raceHorses/setCurrentRace', responseData)

                await fetchUpdatedHorses()
            } catch (error) {
                console.error("Failed to fetch data:", error)
            }
        })

        const headers = [
            { title: 'Start Position', key: 'programNumber' },
            { title: 'Horse Name', key: 'name' },
            { title: 'Driver Name', key: 'driver.name' },
            { title: 'Action', key: 'action' },
            {key: 'horseWithdrawn'}
        ]

        const updatedHorses = ref([])  // A list to store IDs of updated horses

        const fetchUpdatedHorses = async () => {
            const horses = currentRace.value.horses || []
            for (let horse of horses) {
                const updated = await checkIfUpdatedRecently(horse.id)
                if (updated) {
                    updatedHorses.value.push(horse.id)
                }
            }
        }

        const isHorseUpdated = (horseId) => {
            return updatedHorses.value.includes(horseId)
        }

        const updateHorseData = async (horseId) => {
            console.log('Logging from updateHorseData function', horseId)
            try {
                await updateHorse(horseId)
                const updated = await checkIfUpdatedRecently(horseId)
                if (updated && !updatedHorses.value.includes(horseId)) {
                    updatedHorses.value.push(horseId)
                }
            } catch (error) {
                console.error(`Failed to update horse with ID ${horseId}:`, error)
            }
        }

        return {
            headers,
            isHorseUpdated,
            updateHorseData,
            currentRace
        }
    }
}
</script>