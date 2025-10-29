<template>
  <div class="ai-cell">
    <v-chip
      size="x-small"
      class="tier-chip"
      :class="{ highlight: ai?.highlight }"
      :color="tierColor(ai?.tier)"
      variant="flat"
    >
      {{ ai?.tier || '–' }}
    </v-chip>
    <div class="prob-bar" :class="{ a: ai?.tier === 'A', hl: ai?.highlight }">
      <div class="prob-fill" :style="{ width: Math.round((ai?.prob || 0) * 100) + '%' }"></div>
    </div>
    <div class="text-caption text-medium-emphasis">
      {{ ai?.prob ? formatPct(ai.prob) : '–' }}
      <span v-if="ai?.rank" class="ml-1">(#{{ formatNum(ai.rank) }})</span>
    </div>
    <div v-if="ai?.publicPercent != null" class="text-caption text-high-emphasis">
      V85 {{ formatPct(ai.publicPercent) }}
    </div>
  </div>
</template>

<script>
import { formatPct, formatNum } from '@/utils/formatters.js'

export default {
  name: 'AiTierCell',
  props: {
    ai: { type: Object, default: null }
  },
  setup() {
    const tierColor = (tier) => tier === 'A' ? 'green' : tier === 'B' ? 'orange' : 'grey'
    return { formatPct, formatNum, tierColor }
  }
}
</script>
