<template>
  <div v-if="hasContent" :class="['horse-comment-block', { withdrawn }]">
    <div v-if="comment" class="main-comment">{{ comment }}</div>
    <ul v-if="formattedPastComments.length" class="past-comments">
      <li v-for="(pc, idx) in formattedPastComments" :key="idx">
        <span class="arrow">\u2192</span>
        {{ pc }}
      </li>
    </ul>
  </div>
</template>

<script>
import { computed } from 'vue'
import { formatPastComment } from '../services/formatPastComment.js'

export default {
  name: 'HorseCommentBlock',
  props: {
    comment: String,
    pastRaceComments: Array,
    withdrawn: Boolean
  },
  setup(props) {
    const formattedPastComments = computed(() => {
      const list = (props.pastRaceComments || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)
        .map(formatPastComment)
      return list
    })

    const hasContent = computed(() => !!(props.comment || formattedPastComments.value.length))

    return { formattedPastComments, hasContent }
  }
}
</script>

<style scoped>
.horse-comment-block {
  font-size: 11px;
  color: #666;
}
.main-comment {
  margin-top: 2px;
}
.past-comments {
  padding-left: 0;
  margin: 2px 0 0 0;
  list-style: none;
  font-size: 10px;
  color: #888;
}
.past-comments .arrow {
  margin-right: 4px;
}
.withdrawn {
  text-decoration: line-through;
}
</style>
