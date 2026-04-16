<template>
  <article
    :class="['race-card', gameClass, { 'has-major': hasMajorGame }]"
    :style="{ '--accent-color': accentColor, '--accent-tint': accentTint }"
    role="button"
    tabindex="0"
    @click="viewRaceDetails"
    @keydown.enter.prevent="viewRaceDetails"
    @keydown.space.prevent="viewRaceDetails"
  >
    <div class="race-card-shell">
      <div class="race-head">
        <div class="race-heading">
          <div class="race-eyebrow">Lopp {{ race.raceNumber }}</div>
          <div class="race-topline">
            <span v-if="race.distance" class="race-chip">{{ race.distance }} m</span>
            <span v-if="startTime" class="race-chip race-chip-accent">Start {{ startTime }}</span>
            <span class="race-chip">{{ horseCount }} hästar</span>
          </div>
        </div>

        <div class="race-side">
          <div class="badge-rail" v-if="games.length">
            <SpelformBadge
              v-for="g in games"
              :key="`${g.game}-${g.leg}`"
              :game="g.game"
              :leg="g.leg"
            />
          </div>
        </div>
      </div>

      <div v-if="raceSummary || lastUpdatedHorseTimestamp !== null" class="race-meta">
        <p v-if="raceSummary" class="race-summary">
          {{ raceSummary }}
        </p>
        <div v-if="lastUpdatedHorseTimestamp !== null" class="updated-indication">
          Hästar senast uppdaterade {{ formattedUpdated }}
        </div>
      </div>

      <div class="race-actions">
        <v-btn @click.stop="viewRaceDetails" size="small" variant="tonal" color="info">
          Öppna lopp
        </v-btn>
        <v-btn
          @click.stop="updateRace"
          :disabled="loading"
          size="small"
          variant="outlined"
          color="secondary"
        >
          {{ loading ? 'Uppdaterar…' : 'Uppdatera hästar' }}
        </v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="race-error">
        {{ errorMessage }}
      </v-alert>
    </div>
  </article>
</template>

<script>
import { toRefs, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import SpelformBadge from '@/components/SpelformBadge.vue'
import { updateHorse, setEarliestUpdatedHorseTimestamp } from '@/views/race/services/RaceHorsesService.js'
import { getGameColor } from '@/utils/gameColors'

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

    const majorGames = ['V85', 'V64', 'V65', 'V86', 'GS75']
    const primaryMajorGame = computed(() => games.value.find(g => majorGames.includes(g.game))?.game)
    const accentColor = computed(() => primaryMajorGame.value ? getGameColor(primaryMajorGame.value) : '#e5e7eb')
    const hexToRgba = (hex, alpha = 0.08) => {
      const h = hex.replace('#','')
      const r = parseInt(h.substring(0,2),16)
      const g = parseInt(h.substring(2,4),16)
      const b = parseInt(h.substring(4,6),16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const hasMajorGame = computed(() => Boolean(primaryMajorGame.value))
    const accentTint = computed(() => hasMajorGame.value ? hexToRgba(accentColor.value, 0.08) : 'transparent')

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
      return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(d)
    })

    const horseCount = computed(() => Array.isArray(props.race?.horses) ? props.race.horses.length : 0)

    const raceSummary = computed(() => {
      const texts = Array.isArray(props.race?.propTexts) ? props.race.propTexts.map(item => item?.displayText || item?.text).filter(Boolean) : []
      return texts.join(' ').trim()
    })

    const gameClass = computed(() => {
      if (!games.value.length) return ''
      const code = games.value[0].game
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
      startTime,
      formattedUpdated,
      horseCount,
      raceSummary,
      gameClass,
      hasMajorGame,
      accentColor,
      accentTint
    }
  }
}
</script>

<style scoped>
.race-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-color) 12%, transparent), transparent 32%),
    linear-gradient(180deg, rgba(12, 21, 38, 0.98), rgba(15, 26, 46, 0.96));
  box-shadow: 0 24px 48px rgba(2, 6, 23, 0.24);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.race-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: color-mix(in srgb, var(--accent-color) 82%, white 10%);
  opacity: 0.72;
}

.race-card:hover,
.race-card:focus-within {
  transform: translateY(-2px);
  border-color: rgba(125, 211, 252, 0.28);
  box-shadow: 0 28px 54px rgba(2, 6, 23, 0.34);
}

.race-card-shell {
  padding: 18px 20px 18px 22px;
  display: grid;
  gap: 16px;
}

.race-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
}

.race-heading {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.race-eyebrow {
  color: var(--track-amber);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.race-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.race-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-body);
  font-size: 0.86rem;
  font-weight: 600;
}

.race-chip-accent {
  border-color: rgba(245, 201, 121, 0.18);
  color: #fee5b6;
  background: rgba(245, 201, 121, 0.12);
}

.race-meta {
  display: grid;
  gap: 10px;
}

.race-summary {
  margin: 0;
  max-width: none;
  color: var(--text-muted);
  line-height: 1.7;
  text-wrap: pretty;
}

.updated-indication {
  color: var(--text-soft);
  font-size: 0.88rem;
}

.race-side {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.badge-rail {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.race-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.race-error {
  margin-top: -2px;
}

.v85-accent::before { background: #4d8fff; }
.v64-accent::before { background: #ffb35e; }
.v65-accent::before { background: #ff6c80; }
.v86-accent::before { background: #8c7dff; }
.gs75-accent::before { background: #ff8f66; }

@media (max-width: 820px) {
  .race-head {
    grid-template-columns: 1fr;
  }

  .race-side,
  .badge-rail {
    justify-content: flex-start;
  }
}
</style>
