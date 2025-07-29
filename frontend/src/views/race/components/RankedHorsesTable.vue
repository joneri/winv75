<template>
  <div>
    <v-data-table
      :headers="rankedHeaders"
      :items="rankedHorses"
      :items-per-page="16"
      class="elevation-1"
    >
    </v-data-table>
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
