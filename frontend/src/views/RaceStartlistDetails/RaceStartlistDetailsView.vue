<template>
    <v-container fluid>
  
      <!-- Basic Horse Information -->
      <v-card class="mb-5">
        <v-card-title>Horse Information</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4"><strong>Name:</strong> {{ horse.name }}</v-col>
            <v-col cols="4"><strong>Gender:</strong> {{ horse.horseGender.text }}</v-col>
            <!-- ... Other basic info fields ... -->
          </v-row>
        </v-card-text>
      </v-card>
  
      <!-- Trainer Information -->
      <v-card class="mb-5">
        <v-card-title>Trainer Information</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4"><strong>Name:</strong> {{ horse.trainer.name }}</v-col>
            <v-col cols="4"><strong>License Type:</strong> {{ horse.trainer.licenseType }}</v-col>
            <!-- ... Other trainer info fields ... -->
          </v-row>
        </v-card-text>
      </v-card>
  
      <!-- Race Statistics -->
      <v-expansion-panels multiple v-if="horse.statistics && horse.statistics.length">
        <v-expansion-panel v-for="stat in horse.statistics" :key="stat.horseId">
          <v-expansion-panel-header>{{ stat.year }}</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-col cols="4"><strong>Number of Starts:</strong> {{ stat.numberOfStarts }}</v-col>
              <!-- ... Other statistic fields ... -->
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
  
      <!-- Race Results -->
      <v-expansion-panels multiple v-if="horse.results && horse.results.length">
        <v-expansion-panel v-for="result in horse.results" :key="result.raceInformation.raceId">
          <v-expansion-panel-header>{{ new Date(result.raceInformation.date).toLocaleDateString() }}</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-col cols="4"><strong>Track Code:</strong> {{ result.trackCode }}</v-col>
              <!-- ... Other result fields ... -->
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
  
      <!-- ... Additional sections using Vuetify components ... -->
  
    </v-container>
  </template>
  
  <script>
  export default {
    name: 'RaceStartlistDetails',
    data() {
      return {
        horse: {}  // Start with an empty object; it will be filled when the data is fetched
      }
    },
    beforeRouteEnter(to, from, next) {
      // Fetching the horse details based on the id from the route
      fetch(`/api/horse/${to.params.horseId}`)  // replace with your actual API endpoint
        .then(response => response.json())
        .then(horse => {
          next(vm => vm.setData(horse))
        })
        .catch(error => {
          console.error("Failed to fetch horse details:", error)
          next();  // you might want to handle this more gracefully in a real application
        });
    },
    methods: {
      setData(horse) {
        this.horse = horse
      }
    }
  }
  </script>
  

<style scoped>
/* Styling for the component can go here. */
</style>