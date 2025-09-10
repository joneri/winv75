<template>
  <div class="global-search">
    <v-text-field
      v-model="query"
      label="Sök"
      density="compact"
      hide-details
      clearable
    />
    <v-menu v-model="menu" activator="parent" transition="fade-transition" :close-on-content-click="false">
      <v-card>
        <v-list>
          <template v-if="results.horses.length">
            <v-subheader>Hästar</v-subheader>
            <v-list-item v-for="horse in results.horses" :key="`h-${horse.id}`">
              <v-list-item-title>{{ horse.name }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-if="results.raceDays.length">
            <v-subheader>Kommande tävlingsdagar</v-subheader>
            <v-list-item v-for="day in results.raceDays" :key="`d-${day.raceDayId}`" :to="`/raceday/${day.raceDayId}`" @click="close">
              <v-list-item-title>{{ day.trackName }} {{ day.raceDayDate }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-if="results.results.length">
            <v-subheader>Resultat</v-subheader>
            <v-list-item v-for="res in results.results" :key="`r-${res.raceDayId}`" :to="`/raceday/${res.raceDayId}`" @click="close">
              <v-list-item-title>{{ res.trackName }} {{ res.raceDayDate }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-if="results.tracks.length">
            <v-subheader>Banor</v-subheader>
            <v-list-item v-for="track in results.tracks" :key="`t-${track.trackCode}`">
              <v-list-item-title>{{ track.trackName }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const query = ref('')
const results = ref({ horses: [], raceDays: [], results: [], tracks: [] })
const menu = ref(false)

function close() {
  menu.value = false
}

watch(query, async (val) => {
  if (val.length > 1) {
    menu.value = true
    try {
      const { data } = await axios.get('/api/search', { params: { q: val } })
      results.value = data
    } catch (err) {
      console.error('Search failed', err)
      results.value = { horses: [], raceDays: [], results: [], tracks: [] }
    }
  } else {
    menu.value = false
    results.value = { horses: [], raceDays: [], results: [], tracks: [] }
  }
})
</script>
