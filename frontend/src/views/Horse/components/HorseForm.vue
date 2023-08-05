<template>
    <v-form @submit.prevent="submitData">
      <v-text-field v-model="horseName" label="Horse Name" required outlined/>
      <v-textarea v-model="horseJson" label="Horse JSON Data" required outlined/>
      <v-btn type="submit" color="primary">Submit</v-btn>
      <v-alert v-if="error" type="error">{{ error }}</v-alert>
    </v-form>
  </template>
  
  <script>
  export default {
    data() {
      return {
        horseName: '',
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
        console.log('submitData', this.horseName)
        if (this.horseName === '' || this.horseJson === '') {
          return
        }
  
        try {
          const parsedData = JSON.parse(this.horseJson)
          this.$store.dispatch('addHorseData', { horseName: this.horseName, horseData: parsedData })
          this.horseName = ''
          this.horseJson = ''
        } catch (error) {
          console.error('Error parsing JSON data:', error)
        }
      }
    }
  }
  </script>  