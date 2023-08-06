<template>
    <v-data-table :headers="headers" :items="horses" class="elevation-1">
      <template v-slot:item.horseData="{ item }">
        <pre>{{ JSON.stringify(item.horseData, null, 2) }}</pre>
      </template>
    </v-data-table>
  </template>
  
  <script>
  export default {
    data() {
      return {
        headers: [
          { text: 'Horse Data', value: 'horseData' }
        ]
      }
    },
    computed: {
      horses() {
        return this.$store.state.horseData
      }
    }
  }
  </script>  