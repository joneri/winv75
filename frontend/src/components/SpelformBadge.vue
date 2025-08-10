<template>
  <v-chip
    :class="['spelform-badge', { neutral: isNeutral }]"
    :style="{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }"
    size="small"
    density="compact"
    label
  >
    {{ label }}
  </v-chip>
</template>

<script>
import { computed } from 'vue'
import { getContrastColor } from '@/utils/colors'
import { getGameColor } from '@/utils/gameColors'

export default {
  name: 'SpelformBadge',
  props: {
    game: { type: String, required: true },
    leg: { type: Number, required: true }
  },
  setup(props) {
    const raw = getGameColor(props.game)
    const isNeutral = !raw || raw === 'transparent'
    const lightNeutralBg = 'rgba(0,0,0,0.06)'
    const bgColor = isNeutral ? lightNeutralBg : raw
    const textColor = isNeutral ? '#111827' : getContrastColor(raw)
    const borderColor = isNeutral ? 'rgba(0,0,0,0.12)' : 'transparent'
    const label = `${props.game}-${props.leg}`
    return { bgColor, textColor, label, isNeutral, borderColor }
  }
}
</script>

<style scoped>
.spelform-badge {
  font-size: 0.75rem;
  padding: 0 6px;
  border: 1px solid transparent;
  font-weight: 600;
}

@media (prefers-color-scheme: dark) {
  .spelform-badge.neutral {
    background-color: rgba(255,255,255,0.14) !important;
    color: #e5e7eb !important;
    border-color: rgba(255,255,255,0.24) !important;
  }
}
</style>
