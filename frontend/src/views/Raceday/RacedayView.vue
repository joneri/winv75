<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- Display Raceday details if available, else show error message -->
        <div v-if="racedayDetails">
          <h1>{{ formatDate(racedayDetails.firstStart) }}</h1>
          <div v-for="race in sortedRaceList" :key="race.id">
            <RaceCardComponent :race="race" />
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
import RacedayService from './services/RacedayService.js'
import RaceCardComponent from './components/RaceCardComponent.vue'
import { useDateFormat } from '@/composables/useDateFormat.js'
import { useRoute } from 'vue-router'


export default {
  components: {
    RaceCardComponent
  },
  setup(props, { root }) {    
    const route = useRoute()
    const racedayDetails = ref(null)
    const errorMessage = ref(null)
    const { formatDate } = useDateFormat()

    // Using onMounted lifecycle hook to fetch raceday details
    onMounted(async () => {
      try {
        racedayDetails.value = await RacedayService.fetchRacedayDetails(route.params.racedayId)
      } catch (error) {
        console.error('Error fetching raceday details:', error)
        errorMessage.value = 'Error fetching raceday details. Please try again later.'
      }
    })

    const sortedRaceList = computed(() => {
      return racedayDetails.value?.raceList.sort((a, b) => a.raceNumber - b.raceNumber) || []
    })

    return {
      racedayDetails,
      errorMessage,
      formatDate,
      sortedRaceList
    }
  }
}
</script>

<style scoped>
.error-message {
  color: red;
  font-size: 1rem;
  margin-top: 1rem;
}
</style>