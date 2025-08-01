<template>
  <div
    v-if="comment || formattedPastComments.length > 0"
    :class="['horse-comment-block', { withdrawn }]"
  >
    <div v-if="comment" class="main-comment" :class="commentClass(comment)">
      {{ comment }}
    </div>
    <ul v-if="formattedPastComments.length" class="past-comments">
      <li v-for="(pc, idx) in visiblePastComments" :key="idx">
        <span class="arrow">→</span>
        <span :class="commentClass(pc.comment)">
          <strong>{{ pc.date }}</strong>
          <span> ({{ formatPlace(pc.place) }})</span>
          {{ pc.comment }}
        </span>
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

export default {
  name: 'HorseCommentBlock',
  props: {
    comment: String,
    pastRaceComments: Array,
    withdrawn: Boolean
  },
  setup(props) {
    console.log('Raw pastRaceComments prop:', props.pastRaceComments);
    const showAll = ref(false)

    const formattedPastComments = computed(() =>
      (props.pastRaceComments || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(pc => ({
          date: pc.date?.split('T')[0] || '',
          place: Number(pc.place ?? 0),
          comment: pc.comment || ''
        }))
    )

    const visiblePastComments = computed(() =>
      showAll.value
        ? formattedPastComments.value
        : formattedPastComments.value.slice(0, 3)
    )

    const extraCommentsCount = computed(
      () => formattedPastComments.value.length - 3
    )

  const negativeWords = ['gal', 'galopp', 'disk', 'inget extra', 'inga plus', 'inget plus', 'saknade plus', 'saknade extra', 'ej plus', 'ej extra']
  const positiveWords = ['fullföljde bra', 'bra avslutning', 'stark', 'rejäl spurt', 'vass']

    const commentClass = text => {
      if (!text) return ''
      const lower = text.toLowerCase()
      if (negativeWords.some(w => lower.includes(w))) return 'comment-negative'
      if (positiveWords.some(w => lower.includes(w))) return 'comment-positive'
      return ''
    }

    console.log('Formatted past comments:', formattedPastComments.value)

    const formatPlace = place =>
      place === 0 || place === null || place === undefined || place === ''
        ? '**'
        : place

    return {
      formattedPastComments,
      visiblePastComments,
      extraCommentsCount,
      showAll,
      commentClass,
      formatPlace
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
  font-weight: 700;
  font-size: 13px;
  color: #cfc8c8;
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