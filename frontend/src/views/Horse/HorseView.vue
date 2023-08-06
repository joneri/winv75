<template>
    <v-container fluid>
      <v-row>
        <v-col>
          <h1>Horse Data</h1>
          <horse-form @submit-data="submitData" :loading="loading" :error="error" />
        </v-col>
      </v-row>
      <v-row>
        <v-col v-if="horseData && horseData.length > 0">
          <horse-table :horses="horseData" />
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import { mapState } from 'vuex'
  import HorseForm from './components/HorseForm.vue'
  import HorseTable from './components/HorseTable.vue'
  
  export default {
    components: {
      HorseForm,
      HorseTable
    },
    computed: {
      ...mapState(['horseData', 'loading', 'error'])
    },
    methods: {
      submitData(data) {
        this.$store.dispatch('horse/addHorseData', data);
      }
    }
  }
  </script> 