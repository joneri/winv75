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
          <!-- Active AI preset badge -->
          <div class="ai-preset" v-if="aiPresetKey">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-chip v-bind="props" size="x-small" variant="outlined" color="info">
                  AI‑profil: {{ aiPresetLabel || aiPresetKey }}
                </v-chip>
              </template>
              <div>
                Denna profil styr AI‑tiering, sannolikheter och banner i denna vy.
                <div v-if="activeProfile && activeProfile.key !== aiPresetKey" class="mt-1 text-warning">
                  Obs: Förhandsvisning/annat preset (inte samma som aktiv: {{ activeProfile.label }} ({{ activeProfile.key }}))
                </div>
              </div>
            </v-tooltip>
          </div>
        </div>
        <!-- AI guidance banner -->
        <div v-if="aiRankConfig" class="ai-banner" :class="{ wide: aiRankConfig.wideOpen, spik: aiRankConfig.spikAllowed }">
          <div class="ai-banner-text">
            <template v-if="aiRankConfig.wideOpen">Vidöppet lopp – flera segerbud.</template>
            <template v-else-if="aiRankConfig.spikAllowed">Favorit-tungt – spik möjlig.</template>
            <template v-else>Jämnt lopp.</template>
          </div>
          <div class="ai-coverage" v-if="aiRankConfig && typeof aiRankConfig.aCoverage === 'number'">
            A-täckning: <strong>{{ Math.round(aiRankConfig.aCoverage * 100) }}%</strong>
            <div class="coverage-bar">
              <div class="coverage-fill" :style="{ width: Math.round(aiRankConfig.aCoverage * 100) + '%' }"></div>
            </div>
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
    raceGames: { type: Array, default: () => [] },
    aiPresetKey: { type: String, default: '' },
    aiPresetLabel: { type: String, default: '' },
    activeProfile: { type: Object, default: null },
    aiRankConfig: { type: Object, default: null }
  },
  emits: ['navigate-to-raceday']
}
</script>
