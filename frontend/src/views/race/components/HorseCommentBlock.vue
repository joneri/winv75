<template>
  <div :class="['horse-comment-block', { withdrawn }]">
    <div v-if="comment" class="main-comment" :class="commentClass(comment)">
      {{ comment }}
    </div>
    <template v-if="formattedPastComments.length">
      <div class="saved-label">ATG-kommentarer (sparade)</div>
      <ul class="past-comments">
        <li v-for="(pc, idx) in visiblePastComments" :key="idx">
          <span class="arrow">→</span>
          <span :class="commentClass(pc.comment)">{{ pc.comment }}</span>
        </li>
        <li
          v-if="!showAll && extraCommentsCount > 0"
          class="more-comments"
          @click="showAll = true"
        >
          +{{ extraCommentsCount }} fler tidigare kommentarer
        </li>
      </ul>
    </template>
    <div v-else-if="!comment && formattedPastComments.length === 0" class="text-muted" style="font-size:10px;">
      Inga tidigare starter tillgängliga
    </div>
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
    const showAll = ref(false)

    // Always sort and format pastRaceComments from props (which should come from atgExtendedRaw)
    const formattedPastComments = computed(() => {
      return (props.pastRaceComments || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(pc => ({
          date: pc.date?.split('T')[0] || '',
          place: pc.place,
          comment: (pc.comment || '').trim()
        }))
        .filter(pc => pc.comment.length > 0)
    })

    const visiblePastComments = computed(() =>
      showAll.value
        ? formattedPastComments.value
        : formattedPastComments.value.slice(0, 3)
    )

    const extraCommentsCount = computed(() =>
      Math.max(0, formattedPastComments.value.length - 3)
    )

    // Simple sentiment coloring
    const negativeWords = [
      'gal', 'galopp', 'disk', 'inget extra', 'inga plus', 'inget plus',
      'saknade plus', 'saknade extra', 'ej plus', 'ej extra'
    ]
    const positiveWords = [
      'fullföljde bra', 'bra avslutning', 'stark', 'rejäl spurt', 'vass'
    ]

    const commentClass = text => {
      if (!text) return ''
      const lower = text.toLowerCase()
      if (negativeWords.some(w => lower.includes(w))) return 'comment-negative'
      if (positiveWords.some(w => lower.includes(w))) return 'comment-positive'
      return ''
    }

    // Show *** for missing/zero/empty place
    const formatPlace = place =>
      place === 0 || place === null || place === undefined || place === ''
        ? '***'
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
.saved-label {
  font-size: 10px;
  color: #9aa;
  margin-top: 4px;
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