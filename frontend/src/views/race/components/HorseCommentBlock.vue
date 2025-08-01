<template>
  <div v-if="hasContent" :class="['horse-comment-block', { withdrawn }]">
    <div v-if="comment" class="main-comment" :class="commentClass(comment)">
      {{ comment }}
    </div>
    <ul v-if="formattedPastComments.length" class="past-comments">
      <li v-for="(pc, idx) in visiblePastComments" :key="idx">
        <span class="arrow">\u2192</span>
        <span :class="commentClass(pc)">{{ pc }}</span>
      </li>
      <li
        v-if="!showAll && extraCommentsCount > 0"
        class="more-comments"
        @click="showAll = true"
      >
        +{{ extraCommentsCount }} fler tidigare kommentarer
      </li>
    </ul>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { formatPastComment } from '../services/formatPastComment.js'

export default {
  name: 'HorseCommentBlock',
  props: {
    comment: String,
    pastRaceComments: Array,
    withdrawn: Boolean
  },
  setup(props) {
    const showAll = ref(false)

    const formattedPastComments = computed(() =>
      (props.pastRaceComments || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(formatPastComment)
    )

    const visiblePastComments = computed(() =>
      showAll.value
        ? formattedPastComments.value
        : formattedPastComments.value.slice(0, 3)
    )

    const extraCommentsCount = computed(
      () => formattedPastComments.value.length - 3
    )

    const hasContent = computed(
      () => !!(props.comment || formattedPastComments.value.length)
    )

    const negativeWords = ['gal', 'galopp', 'disk']
    const positiveWords = [
      'fullföljde bra', 'fullf bra',
      'bra avslutning', 'bra avsl',
      'stark',
      'rejäl spurt',
      'vass',
      'bra prestation', 'bra prest',
      'bra lopp',
      'bra insats',
      'bra form',
      'avgj lätt',
      'bra spurt',
      'pressade', 
      'bra tempo',
      'bra fart',
      'bra styrka',
    ]

    const commentClass = text => {
      if (!text) return ''
      const lower = text.toLowerCase()
      if (negativeWords.some(w => lower.includes(w))) return 'comment-negative'
      if (positiveWords.some(w => lower.includes(w))) return 'comment-positive'
      return ''
    }

    return {
      formattedPastComments,
      visiblePastComments,
      extraCommentsCount,
      showAll,
      hasContent,
      commentClass
    }
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
.past-comments .more-comments {
  font-size: 9px;
  color: #aaa;
  cursor: pointer;
}
.comment-negative {
  color: #c44;
}
.comment-positive {
  color: #2b2;
}
.withdrawn {
  text-decoration: line-through;
}
</style>
