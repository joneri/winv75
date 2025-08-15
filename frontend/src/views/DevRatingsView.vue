<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Ratings Overview</h1>
        <v-btn class="ma-2" @click="refresh">Refresh</v-btn>
        <v-data-table :headers="headers" :items="items" :items-per-page="20" class="elevation-1" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const items = ref([])
const headers = [
  { title: 'Horse ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Elo Rating', key: 'rating' },
  { title: 'Form Elo', key: 'formRating' },
  { title: 'Score', key: 'score' }
]

const load = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/horses/scores`)
  items.value = res.data.map(h => ({ id: h.id, name: h.name, rating: h.rating, formRating: h.formRating ?? h.rating, score: h.score }))
}

const refresh = async () => {
  await load()
}

onMounted(load)
</script>
