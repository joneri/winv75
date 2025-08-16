<!-- frontend/src/views/race/components/AiBanner.vue -->
<template>
  <div class="ai-banner" :class="{ wide: config.wideOpen, spik: config.spikAllowed }">
    <div class="ai-banner-text">
      <template v-if="config.wideOpen">Vidöppet lopp – flera segerbud.</template>
      <template v-else-if="config.spikAllowed">Favorit-tungt – spik möjlig.</template>
      <template v-else>Jämnt lopp.</template>
    </div>
    <div class="ai-coverage" v-if="typeof config.aCoverage === 'number'">
      A-täckning: <strong>{{ Math.round(config.aCoverage * 100) }}%</strong>
      <div class="coverage-bar">
        <div class="coverage-fill" :style="{ width: Math.round(config.aCoverage * 100) + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AiBanner',
  props: {
    config: { type: Object, required: true }
  }
}
</script>