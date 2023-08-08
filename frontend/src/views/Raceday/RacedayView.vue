<template>
    <v-container>
      <v-row>
        <v-col>
          <h1>{{ racedayDetails.name }}</h1>
          <!-- Display basic Raceday details here -->
  
          <div v-for="race in racedayDetails.races" :key="race.id">
            <RaceCardComponent :race="race" />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import RacedayService from './services/RacedayService.js'
  import RaceCardComponent from './components/RaceCardComponent.vue'
  
  export default {
    components: {
      RaceCardComponent
    },
    data() {
      return {
        racedayDetails: null
      }
    },
    async created() {
      try {
        this.racedayDetails = await RacedayService.fetchRacedayDetails(this.$route.params.racedayId)
      } catch (error) {
        console.error('Error fetching raceday details:', error)
      }
    }
  }
  </script>
  
  <style scoped>
  /* You can put any scoped styles for RacedayView here */
  </style>
  