<template>
    <v-container fluid>
      <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
  
      <!-- Raceday JSON Input Section -->
      <v-row>
        <v-col>
          <v-form @submit.prevent="submitRacedayData">
            <v-textarea v-model="racedayJsonInput" label="Raceday JSON Data" required outlined></v-textarea>
            <v-btn type="submit" color="primary">Submit Raceday Data</v-btn>
          </v-form>
          <v-alert v-if="error" type="error">{{ error }}</v-alert>
        </v-col>
      </v-row>
  
      <!-- List of Racedays -->
      <ul>
        <li v-for="raceDay in raceDays" :key="raceDay._id">
          {{ raceDay.date }} <!-- Assuming you want to display the date or modify as needed -->
          <!-- Button to navigate to the RacedayView -->
          <v-btn @click="navigateToRaceDay(raceDay._id)">View Details</v-btn>
        </li>
      </ul>
  
    </v-container>
  
    <v-snackbar v-model="showSnackbar" top color="success">
      {{ successMessage }}
      <v-btn dark text @click="showSnackbar = false">
        Close
      </v-btn>
    </v-snackbar>
  
  </template>
  
  <script>
  export default {
    data() {
      return {
        racedayJsonInput: '',  // This will hold the raw JSON input for racedays
        showSnackbar: false,  // Will be used to show a snackbar when data is submitted successfully
      }
    },
    watch: {
      successMessage(newVal) {
        if (newVal) {
          this.showSnackbar = true;
          this.racedayJsonInput = '';  // Clear the textarea after submission
        }
      }
    },
    computed: {
      error() {
        return this.$store.state.raceday.error  // This is the error message
      },
      raceDays() {
        return this.$store.state.raceday.raceDays  // This will get the list of available racedays
      },
      loading() {
        return this.$store.state.raceday.loading  // Check if loading data
      },
      successMessage() {
        return this.$store.state.raceday.successMessage;  // Confirmation message after data submission
      }
    },
    methods: {
      submitRacedayData() {
        if (this.racedayJsonInput === '') {
          return
        }
        try {
          const parsedData = JSON.parse(this.racedayJsonInput)
          this.$store.dispatch('racedayInput/addRacedayData', parsedData)
          this.racedayJsonInput = ''  // Clear input after successful submission
        } catch (error) {
          console.error('Error parsing Raceday JSON data:', error)
        }
      },
      navigateToRaceDay(raceDayId) {
        this.$router.push({ name: 'RacedayView', params: { raceDayId } })
      }
    }
  }
  </script>  