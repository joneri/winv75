<template>
  <v-card
    class="clickable-card"
    :class="gameClass"
    @click="viewRaceDetails"
    :style="{ '--hover-bg': hoverBg }"
  >
    <v-card-title class="card-title">
      <div class="title-line">
        <span class="race-no">Lopp {{ race.raceNumber }}</span>
        <span class="meta" v-if="race.distance">• {{ race.distance }} m</span>
        <span class="meta" v-if="startTime">• Start {{ startTime }}</span>
      </div>
    </v-card-title>

    <v-card-text class="card-body">
      <div class="muted" v-if="race.propTexts && race.propTexts.length">
        {{ (race.propTexts[0]?.text || '') + ' ' + (race.propTexts[1]?.text || '') }}
      </div>
      <div v-if="lastUpdatedHorseTimestamp !== null" class="updated-indication">
        Senast häst uppdaterad: {{ formattedUpdated }}
      </div>
    </v-card-text>

    <div class="spelformer-row" v-if="games.length">
      <SpelformBadge
        v-for="g in games"
        :key="`${g.game}-${g.leg}`"
        :game="g.game"
        :leg="g.leg"
      />
    </div>

    <v-card-actions class="card-actions">
      <v-btn @click.stop="viewRaceDetails" size="small" variant="text">Visa detaljer</v-btn>
      <v-btn @click.stop="updateRace" :disabled="loading" class="ml-2" size="small" variant="outlined">
        {{ loading ? 'Uppdaterar…' : 'Uppdatera lopp' }}
      </v-btn>
    </v-card-actions>

    <v-alert v-if="errorMessage" type="error" class="ma-2">{{ errorMessage }}</v-alert>
  </v-card>
</template>

<script>
import { toRefs, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import SpelformBadge from '@/components/SpelformBadge.vue'
import { updateHorse, setEarliestUpdatedHorseTimestamp } from '@/views/race/services/RaceHorsesService.js'

export default {
  components: { SpelformBadge },
  props: {
    race: { type: Object, required: true },
    lastUpdatedHorseTimestamp: { type: String, default: null },
    racedayId: { type: String, required: true },
    games: { type: Array, default: () => [] }
  },
  setup(props, { emit }) {
    const { race, lastUpdatedHorseTimestamp, games } = toRefs(props)
    const router = useRouter()
    const store = useStore()
    const loading = ref(false)
    const errorMessage = ref('')

    const hoverBg = '#f8fafc' // a subtle hover background
    const startTime = computed(() => {
      const dt = props.race?.startDateTime
      if (!dt) return ''
      const d = new Date(dt)
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${h}:${m}`
    })
    const formattedUpdated = computed(() => {
      if (!props.lastUpdatedHorseTimestamp) return ''
      const d = new Date(props.lastUpdatedHorseTimestamp)
      const y = d.getFullYear()
      const mo = String(d.getMonth() + 1).padStart(2, '0')
      const da = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${y}-${mo}-${da} ${h}:${m}`
    })

    const gameClass = computed(() => {
      if (!games.value.length) return ''
      const code = games.value[0].game
      const majorGames = ['V75', 'V64', 'V65', 'V86', 'GS75']
      return majorGames.includes(code) ? `${code.toLowerCase()}-accent` : ''
    })

    const viewRaceDetails = () => {
      store.commit('raceHorses/setCurrentRace', props.race);
      const raceId = props.race.raceId;
      const racedayId = props.racedayId;

      router.push(`/raceday/${racedayId}/race/${raceId}`).catch(err => {
        console.error('Router Push Error:', err);
      });
    };

    const updateRace = async () => {
      loading.value = true
      errorMessage.value = ''
      for (const h of props.race.horses || []) {
        try {
          await updateHorse(h.id)
          await new Promise(r => setTimeout(r, 200))
        } catch (err) {
          console.error(`Failed to update horse ${h.id}:`, err)
          errorMessage.value = 'Failed to update some horses'
        }
      }
      try {
        await setEarliestUpdatedHorseTimestamp(props.racedayId, props.race.raceId)
      } catch (err) {
        console.error('Failed to set earliest updated timestamp', err)
      }
      loading.value = false
      emit('race-updated')
    }

    return {
      race,
      lastUpdatedHorseTimestamp,
      games,
      viewRaceDetails,
      updateRace,
      loading,
      errorMessage,
      hoverBg,
      startTime,
      formattedUpdated,
      gameClass
    }
  }
}
</script>

<style scoped>
.updated-indication {
  color: #0e7490;
  font-weight: 500;
  margin-top: 6px;
}
.clickable-card {
  cursor: pointer;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  border: 1px solid #e5e7eb;
  border-left-width: 4px; /* accent border via game class */
}
.clickable-card:hover {
  background-color: var(--hover-bg) !important;
  box-shadow: 0 2px 12px rgba(2, 6, 23, 0.06);
}
.card-title {
  padding-bottom: 4px !important;
}
.title-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.race-no { font-weight: 700; }
.meta { color: #6b7280; font-size: 0.9rem; }
.card-body { color: #374151; }
.muted { color: #6b7280; }
.card-actions { padding-top: 0; }

/* Accent borders per major game */
.v75-accent { border-left-color: #1e3a8a; }
.v64-accent { border-left-color: #ed6c15; }
.v65-accent { border-left-color: #c00a26; }
.v86-accent { border-left-color: #802c7e; }
.gs75-accent { border-left-color: #be123c; }
</style>
