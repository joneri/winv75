<template>
  <v-chip
    class="spelform-badge"
    :style="{ backgroundColor: bgColor, color: textColor }"
    size="small"
    density="compact"
    label
  >
    {{ label }}
  </v-chip>
</template>

<script>
import { getContrastColor } from '@/utils/colors'
import { getGameColor } from '@/utils/gameColors'

export default {
  name: 'SpelformBadge',
  props: {
    game: { type: String, required: true },
    leg: { type: Number, required: true }
  },
  setup(props) {
    const bgColor = getGameColor(props.game)
    const textColor = getContrastColor(bgColor)
    const label = `${props.game}-${props.leg}`
    return { bgColor, textColor, label }
  }
}
</script>

<style scoped>
.spelform-badge {
  font-size: 0.75rem;
  padding: 0 4px;
}
</style>
