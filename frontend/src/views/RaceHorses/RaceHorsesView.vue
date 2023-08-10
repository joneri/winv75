<template>
    <v-container>
      <v-row>
        <v-col>
          <v-data-table
            :headers="headers"
            :items="race.horses"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.action="{ item }">
              <v-btn v-if="!isHorseUpdated(item)" @click="updateHorseData(item.id)">Update</v-btn>
              <v-icon v-else>mdi-check</v-icon>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { checkIfUpdatedRecently, updateHorse } from '@/views/RaceHorses/services/RaceHorsesService.js'
  
  export default {
    name: 'RaceHorsesView',
    props: {
      race: {
        type: Object,
        default: () => ({ horses: [] })
      }
    },
  
    setup(props) {
      const headers = ref([
        { text: 'Horse Name', value: 'name' },
        { text: 'Action', value: 'action' }
      ])
  
      // Check if the horse has been recently updated.
      const isHorseUpdated = async (horse) => {
        return await checkIfUpdatedRecently(horse.id)
      }
  
      // Use the updateHorse method from RaceHorsesService.
      const updateHorseData = async (horseId) => {
        await updateHorse(horseId)
        // You might want to refresh the data after updating.
        // For example, refetch the horse data or emit an event to the parent to do so.
      }
  
      return {
        headers,
        isHorseUpdated,
        updateHorseData
      }
    }
  }
  </script>
  