<template>
  <v-container class="main-content">
    <v-row>
      <v-col>
        <!-- Display Raceday details if available, else show error message -->
        <div v-if="racedayDetails">
          <h1>{{ formatDate(racedayDetails.firstStart) }}</h1>
          <div v-for="race in sortedRaceList" :key="race.id">
            <RaceCardComponent :race="race" :lastUpdatedHorseTimestamp="race.earliestUpdatedHorseTimestamp" :racedayId="reactiveRouteParams.racedayId" />
            <div v-if="isRecentlyUpdated(race.earliestUpdatedHorseTimestamp)">
              <v-chip color="green">Updated</v-chip>
            </div>
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
    const reactiveRouteParams = computed(() => route.params)
    const isRecentlyUpdated = (timestamp) => {
      const sixDaysAgo = new Date()
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
      const raceUpdateTime = new Date(timestamp)
      return raceUpdateTime >= sixDaysAgo
    }
    
    onMounted(async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Error fetching raceday details. Please try again later.'
        return
      }
    })

    const sortedRaceList = computed(() => {
      return racedayDetails.value?.raceList.sort((a, b) => a.raceNumber - b.raceNumber) || []
    }) 

    return {
      racedayDetails,
      errorMessage,
      formatDate,
      sortedRaceList,
      reactiveRouteParams,
      isRecentlyUpdated
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
