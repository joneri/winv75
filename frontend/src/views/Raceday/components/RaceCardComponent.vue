<template>
    <v-card>
      <v-card-title>{{ race.name }}</v-card-title>
      <v-card-text>
        <div>
          Race Number: {{ race.number }}
        </div>
        <!-- Add other race details as needed -->
      </v-card-text>
      <v-card-actions>
        <v-btn @click="viewRaceDetails(race.id)">View Details</v-btn>
      </v-card-actions>
    </v-card>
  </template>
  
  <script>
  export default {
    props: {
      race: {
        type: Object,
        required: true
      }
    },
    methods: {
      viewRaceDetails(raceId) {
        // Logic to navigate or display race details
      }
    }
  }
  </script>
  
  <style scoped>
  /* You can put any scoped styles for RaceCardComponent here */
  </style>
  