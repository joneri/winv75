<template>
    <v-container>
        <v-row>
            <v-col>
                <v-data-table :headers="headers" :items="currentRace.horses" :items-per-page="16" class="elevation-1">

                    <!-- For the action buttons -->
                    <template v-slot:item.action="{ item }">
                        <v-btn v-if="!isHorseUpdated(item.id)" @click="updateHorseData(item.id)">Update</v-btn>
                        <v-icon v-else>mdi-check</v-icon>
                    </template>

                    <!-- This slot is for accessing nested property driver.name -->
                    <template v-slot:item.driverName="{ item }">
                        {{ item.driver ? item.driver.name : '' }}
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
import { checkIfUpdatedRecently, fetchRaceFromRaceId } from '@/views/RaceHorses/services/RaceHorsesService.js'

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
            { title: 'Start Position', key: 'startPosition' },
            { title: 'Horse Name', key: 'name' },
            { title: 'Driver Name', key: 'driver.name' }, // Change this to a unique name
            { title: 'Action', key: 'action' }
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

        const updateHorseData = (horseId) => {
            // Your logic to update the horse data goes here.
            // Once the horse is updated, push the horseId to the updatedHorses array
            // updatedHorses.value.push(horseId)
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