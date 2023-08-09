<template>
  <v-container>
    <v-row>
      <v-col>
        <!-- Check if racedayDetails exists before rendering the name -->
        <h1 v-if="racedayDetails">{{ formatDate(racedayDetails.firstStart) }}</h1>

        <!-- Check for error messages and display them if any -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Display basic Raceday details here -->
        <!-- Check if racedayDetails.races exists before rendering races -->
        <div v-for="race in racedayDetails?.races" :key="race.id">
          <RaceCardComponent :race="race" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import RacedayService from './services/RacedayService.js'
import RaceCardComponent from './components/RaceCardComponent.vue'
import { useDateFormat } from '@/composables/useDateFormat.js'

export default {
  components: {
    RaceCardComponent
  },
  setup() {
    const { formatDate } = useDateFormat()
    return {
      formatDate
    }
  },
  data() {
    return {
      racedayDetails: null,
      errorMessage: null  // Added an errorMessage property to handle any errors
    }
  },
  async created() {
    try {
      this.racedayDetails = await RacedayService.fetchRacedayDetails(this.$route.params.racedayId)
    } catch (error) {
      console.error('Error fetching raceday details:', error)
      this.errorMessage = 'Error fetching raceday details. Please try again later.'; // Set the error message
    }
  }
}
</script>

<style scoped>
/* You can put any scoped styles for RacedayView here */

/* Style for the error message */
.error-message {
  color: red;
  font-size: 1rem;
  margin-top: 1rem;
}

</style>