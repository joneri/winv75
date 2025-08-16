<template>
  <v-row class="race-navigation">
    <v-col class="d-flex justify-space-between">
      <v-btn variant="text" @click="$emit('navigate', previousRaceId)" :disabled="!previousRaceId">⟵ Previous race</v-btn>
      <v-btn variant="text" @click="$emit('navigate', nextRaceId)" :disabled="!nextRaceId">Next race ⟶</v-btn>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'RaceNavigation',
  props: {
    previousRaceId: [String, Number],
    nextRaceId: [String, Number]
  },
  emits: ['navigate']
}
</script>
