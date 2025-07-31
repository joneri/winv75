<template>
  <v-card
    class="clickable-card"
    @click="viewRaceDetails"
    :style="{ '--hover-bg': hoverBg, '--hover-text': hoverText, 'background-color': cardColor }"
  >
    <div class="d-flex justify-space-between align-center" style="width: 100%;">
      <v-card-title>
        Race Number: {{ race.raceNumber }}
        <div class="d-inline-flex ml-2">
          <SpelformBadge v-for="g in games" :key="g.game" :game="g.game" :leg="g.leg" />
        </div>
      </v-card-title>
      <v-card-text>
        <div>
          {{ race.propTexts[0].text + " " + race.propTexts[1].text }}
          <div v-if="lastUpdatedHorseTimestamp !== null" class="updated-indication">
            Last Horse Updated: {{ lastUpdatedHorseTimestamp }}
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn @click.stop="viewRaceDetails">View Details</v-btn>
        <v-btn @click.stop="updateRace" :disabled="loading" class="ml-2">
          {{ loading ? 'Updating…' : 'Update Race' }}
        </v-btn>
      </v-card-actions>
    </div>
    <v-alert v-if="errorMessage" type="error" class="ma-2">{{ errorMessage }}</v-alert>
  </v-card>
</template>

<script>
import { toRefs, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { getContrastColor } from '@/utils/colors'
import { getGameColor } from '@/utils/gameColors'
import SpelformBadge from '@/components/SpelformBadge.vue'
import { updateHorse, setEarliestUpdatedHorseTimestamp } from '@/views/race/services/RaceHorsesService.js'

export default {
  components: { SpelformBadge },
  props: {
    race: {
      type: Object,
      required: true
    },
    lastUpdatedHorseTimestamp: {
      type: String,
      default: null
    },
    racedayId: {
      type: String,
      required: true
    },
    games: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    // Convert props to reactive references
    const { race, lastUpdatedHorseTimestamp, games } = toRefs(props)
    const router = useRouter()
    const store = useStore()
    const loading = ref(false)
    const errorMessage = ref('')

    const hoverBg = '#f5f5f5'
    const hoverText = getContrastColor(hoverBg)
    const cardColor = computed(() => {
      if (games.value.length > 0) {
        return getGameColor(games.value[0].game)
      }
      return undefined
    })

    const viewRaceDetails = () => {
      store.commit('raceHorses/setCurrentRace', props.race);
      const raceId = props.race.raceId;
      const racedayId = props.racedayId;

      router.push(`/raceday/${racedayId}/race/${raceId}`)
        .catch(err => {
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
      hoverText,
      cardColor
    }
  }
}
</script>

<style scoped>
.updated-indication {
  color: green;
  font-weight: bold;
}
.clickable-card {
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
}
.clickable-card:hover {
  background-color: var(--hover-bg);
  color: var(--hover-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
