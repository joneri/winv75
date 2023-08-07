<template>
    <v-container fluid>
      <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
      <!-- Startlist JSON Input Section -->
      <v-row>
        <v-col>
          <v-form @submit.prevent="submitStartlistData">
            <v-textarea v-model="startlistJsonInput" label="Startlist JSON Data" required outlined></v-textarea>
            <v-btn type="submit" color="primary">Submit Startlist Data</v-btn>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
          </v-form>
        </v-col>
      </v-row>
      <v-alert v-if="error" type="error">{{ error }}</v-alert>
  
      <!-- Tabbed Display for Races -->
      <v-tabs v-model="activeTab">
        <v-tab v-if="startlistData && startlistData.raceList" v-for="race in startlistData.raceList" :key="race.raceId">
            Race {{ race.raceNumber }}
        </v-tab>
        
        <v-tab-item v-if="startlistData && startlistData.raceList" v-for="race in startlistData.raceList" :key="race.raceId">
            <v-card flat>
            <v-card-text>
                <h2>Race {{ race.raceNumber }}</h2>
                <p>Organisation: {{ race.organisation }}</p>
                <p>Start Time: {{ race.startDateTime }}</p>
                <!-- You can expand this to show more detailed data -->
            </v-card-text>
            </v-card>
        </v-tab-item>
        </v-tabs>
  
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
      startlistData: null,  // This will hold the parsed JSON data
      showSnackbar: false, // Will be used to show a snackbar
      startlistJsonInput: '',  // This will hold the raw JSON input
      activeTab: null,  // Will hold the currently active tab
    }
  },
  watch: {
    successMessage(newVal) {
      if (newVal) {
        this.showSnackbar = true;
        this.startlistJson = ''; // to reset the textarea
      }
    }
  },
  computed: {
    error() {
      return this.$store.state.startlist.error // This is the error message
    },
    startlistData() {
      return this.$store.state.startlistData // This is the parsed JSON data
    },
    loading() {
      return this.$store.state.startlist.loading
    },
    successMessage() {
        return this.$store.state.startlist.successMessage; 
    }
  },
    methods: {
      submitStartlistData() {
        if (this.startlistJsonInput === '') {
          return
        }
  
        try {
          const parsedData = JSON.parse(this.startlistJsonInput)
          this.$store.dispatch('startlist/addStartlistData', parsedData)
          this.startlistJsonInput = ''  // Clear input after successful submission
        } catch (error) {
          console.error('Error parsing Startlist JSON data:', error)
        }
      }
    }
  }
  </script>