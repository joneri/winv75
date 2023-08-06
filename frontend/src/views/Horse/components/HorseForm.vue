<template>
    <v-form @submit.prevent="submitData">
      <v-textarea v-model="horseJson" label="Horse JSON Data" required outlined/>
      <v-btn type="submit" color="primary">Submit</v-btn>
      <v-alert v-if="error" type="error">{{ error }}</v-alert>
    </v-form>
  </template>
  
  <script>
  export default {
    data() {
      return {
        horseJson: ''
      }
    },
    computed: {
      error() {
        return this.$store.state.error
      }
    },
    methods: {
      submitData() {
        if (this.horseJson === '') {
          return
        }
  
        try {
          const parsedData = JSON.parse(this.horseJson)
          this.$store.dispatch('horse/addHorseData', { horseData: parsedData });
          this.horseJson = ''
        } catch (error) {
          console.error('Error parsing JSON data:', error)
        }
      }
    }
  }
  </script>  