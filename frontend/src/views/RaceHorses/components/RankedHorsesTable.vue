<template>
  <div>
    <v-data-table
      :headers="rankedHeaders"
      :items="rankedHorses"
      :items-per-page="16"
      class="elevation-1"
    >
      <template v-slot:item.favoriteStartPosition="{ item }">
        {{ item.favoriteStartPosition }}
        <span v-if="matchesStartPosition(item)" title="Favorite start position" class="ml-1">Ⓢ</span>
      </template>
      <template v-slot:item.favoriteStartMethod="{ item }">
        {{ item.favoriteStartMethod }}
        <span v-if="matchesStartMethod(item)" title="Favorite start method" class="ml-1">🏅</span>
      </template>
    </v-data-table>
    <div class="mt-2 legend">
      <span>🏅 – favorite start method for this race</span>
      <span>Ⓢ – favorite start position this race</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    rankedHorses: Array,
    rankedHeaders: {
      type: Array,
      default: () => []
    },
    currentRace: Object
  },
  methods: {
    matchesStartPosition(item) {
      return item.favoriteStartPosition === item.programNumber;
    },
    matchesStartMethod(item) {
      const method = this.currentRace?.startMethod || this.currentRace?.raceType?.text;
      return item.favoriteStartMethod && method && item.favoriteStartMethod === method;
    }
  }
}
</script>

<style scoped>
.legend span {
  margin-right: 12px;
}
</style>
