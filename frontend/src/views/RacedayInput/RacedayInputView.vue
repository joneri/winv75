<template>
  <v-container fluid>
    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>

    <!-- Raceday JSON Input Section -->
    <v-row>
      <v-col>
        <v-form @submit.prevent="submitRacedayData">
          <v-textarea v-model="racedayJsonInput" label="Raceday JSON Data" required variant="outlined"></v-textarea>
          <v-btn type="submit" color="primary">Submit Raceday Data</v-btn>
        </v-form>
        <v-alert v-if="error" type="error">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <!-- List of Racedays -->
    <v-list>
        <template v-for="raceDay in raceDays" :key="raceDay._id">
            <v-list-item>
                <div class="d-flex justify-space-between align-center" style="width: 100%;">
                    <div>
                        <v-list-item-title class="headline">{{ formatDate(raceDay.firstStart) }}</v-list-item-title>
                        <v-list-item-subtitle>{{ raceDay.trackName }} - {{ raceDay.raceStandard }}</v-list-item-subtitle>
                    </div>
                    <v-btn @click="navigateToRaceDay(raceDay._id)" variant="text">View Details</v-btn>
                </div>
            </v-list-item>
            <v-divider></v-divider>
        </template>
    </v-list>

  </v-container>

  <v-snackbar v-model="showSnackbar" top color="success">
    {{ successMessage }}
    <v-btn dark text @click="showSnackbar = false">
      Close
    </v-btn>
  </v-snackbar>
</template>

  
  <script>
  import { mapState } from 'vuex'
  import { mapActions } from 'vuex'

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
      ...mapState('racedayInput', ['raceDays']),  // This is the list of racedays
      loading() {
        return this.$store.state.raceday.loading  // Check if loading data
      },
      successMessage() {
        return this.$store.state.raceday.successMessage;  // Confirmation message after data submission
      }
    },
    methods: {
      ...mapActions(['fetchRacedays']),
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
      },
      formatDate(dateString) {
          const days = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORS DAG', 'FREDAG', 'LÖRDAG']
          const months = ['JANUARI', 'FEBRUARI', 'MARS', 'APRIL', 'MAJ', 'JUNI', 'JULI', 'AUGUSTI', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER']
          const date = new Date(dateString)
          const dayName = days[date.getDay()]
          const day = date.getDate()
          const month = months[date.getMonth()]
          const year = date.getFullYear()
          const hours = String(date.getUTCHours()).padStart(2, '0')
          const minutes = String(date.getUTCMinutes()).padStart(2, '0')

          return `${dayName} ${day} ${month} ${year} kl ${hours}:${minutes}`
      }
    },
    mounted() {
      this.$store.dispatch('racedayInput/fetchRacedays')
    }
  }
  </script>
  <style scoped>
  .track-name {
    font-size: 0.9em;
  }
  </style>