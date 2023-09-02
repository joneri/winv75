<template>
  <v-container class="main-content">
    <v-row>
      <v-col>
        <!-- Display Raceday details if available, else show error message -->
        <div v-if="racedayDetails">
          <h1>{{ formatDate(racedayDetails.firstStart) }}</h1>
          <div v-for="race in sortedRaceList" :key="race.id">
           <RaceCardComponent :race="race" :lastUpdatedHorseTimestamp="lastUpdatedHorseTimestamps[race.id]" :racedayId="reactiveRouteParams.racedayId" />
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
import RacedayService from '@/views/Raceday/services/RacedayService.js'
import { useDateFormat } from '@/composables/useDateFormat.js'
import { useRoute } from 'vue-router'

export default {
  components: {
    RaceCardComponent
  },
  setup(props, { root }) {
    const route = useRoute()
    console.log('RacedayView Props:', props);
    console.log('RacedayView Route Params:', route.params);

    const racedayDetails = ref(null)
    const errorMessage = ref(null)
    const { formatDate } = useDateFormat()
    // Create a ref to hold the timestamps
    const lastUpdatedHorseTimestamps = ref({})
    const getLastUpdatedHorseTimestamp = async (raceId) => {
      const racedayId = route.params?.racedayId
      try {
        return await RacedayService.fetchEarliestUpdatedHorseTimestamp(racedayId, raceId)
      } catch (error) {
        console.error('Error getting the last updated horse timestamp:', error)
      }
    }
    const reactiveRouteParams = computed(() => route.params)
    
    // Using onMounted lifecycle hook to fetch raceday details
    onMounted(async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)

        for (const race of racedayDetails.value.raceList) {
          const timestamp = await RacedayService.fetchEarliestUpdatedHorseTimestamp(racedayDetails.value.raceDayId, race.raceId)
          lastUpdatedHorseTimestamps.value[race.raceId] = timestamp
        }
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Error fetching raceday details. Please try again later.'
      }
      console.log('Here is the racedayDetails', racedayDetails.value)
    })

    const sortedRaceList = computed(() => {
      return racedayDetails.value?.raceList.sort((a, b) => a.raceNumber - b.raceNumber) || []
    }) 

    return {
      racedayDetails,
      errorMessage,
      formatDate,
      sortedRaceList,
      lastUpdatedHorseTimestamps,
      reactiveRouteParams,
      getLastUpdatedHorseTimestamp,
    }
  }
}
</script>

<style scoped>
  .main-content {
    padding-top: 70px;
  }
.error-message {
  color: red;
  font-size: 1rem;
  margin-top: 1rem;
}
</style>