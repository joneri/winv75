<template>
  <div>
    <v-row>
      <v-col>
        <button @click="$emit('navigate-to-raceday')">Go to Race Day</button>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="race-header">
          <div class="titles">
            <div class="title">Lopp {{ currentRace.raceNumber }}</div>
            <div class="subtitle" v-if="racedayTrackName">{{ racedayTrackName }}</div>
            <div class="meta">{{ raceMetaString }}</div>
            <div class="meta2">{{ trackMetaString }}</div>
          </div>
          <div class="games" v-if="raceGames.length">
            <SpelformBadge v-for="g in raceGames" :key="`${g.game}-${g.leg}`" :game="g.game" :leg="g.leg" />
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import SpelformBadge from '@/components/SpelformBadge.vue'

export default {
  name: 'RaceHeader',
  components: { SpelformBadge },
  props: {
    currentRace: { type: Object, required: true },
    racedayTrackName: { type: String, default: '' },
    raceMetaString: { type: String, default: '' },
    trackMetaString: { type: String, default: '' },
    raceGames: { type: Array, default: () => [] }
  },
  emits: ['navigate-to-raceday']
}
</script>
