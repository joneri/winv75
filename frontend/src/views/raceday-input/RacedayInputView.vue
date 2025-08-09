<template>
  <v-container fluid class="main-content">
    <v-progress-circular v-if="loading && raceDays.length === 0" indeterminate color="primary"></v-progress-circular>

    <!-- Fetch Raceday by Date Section -->
    <v-row class="mt-4">
      <v-col>
        <v-text-field v-model="fetchDate" type="date" label="Fetch Racedays by Date"></v-text-field>
        <v-btn @click="fetchRacedays" color="primary">Fetch</v-btn>
        <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <!-- List of Racedays -->
    <v-list v-show="raceDays.length > 0" ref="listContainer" class="raceday-list">
      <template v-for="raceDay in raceDays" :key="raceDay._id">
          <v-list-item
            class="clickable-row compact-row"
            @click="navigateToRaceDay(raceDay._id)"
            :style="{ '--hover-bg': hoverBg, '--hover-text': hoverText }"
          >
              <div class="row-grid">
                  <div class="date">{{ formatDate(raceDay.firstStart) }}</div>
                  <div class="track">{{ raceDay.trackName }}</div>
                  <div class="time">{{ formatTime(raceDay.firstStart) }}</div>
                  <div class="count" v-if="typeof raceDay.raceCount === 'number'">{{ raceDay.raceCount }} lopp</div>
              </div>
          </v-list-item>
          <v-divider></v-divider>
      </template>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="sentinel">
        <v-progress-circular v-if="loading && hasMore" indeterminate color="primary" size="24" />
        <div v-else-if="!hasMore" class="end-marker">Inga fler dagar</div>
      </div>
    </v-list>
    <v-alert v-if="raceDays.length === 0 && !loading" type="info" class="mt-4">No racedays found.</v-alert>
    <v-progress-linear
      v-if="loading && raceDays.length > 0"
      indeterminate
      color="primary"
      height="3"
      class="mt-2"
    />
  </v-container>

  <v-snackbar v-model="showSnackbar" top color="success">
    {{ successMessage }}
    <v-btn dark text @click="showSnackbar = false">
      Close
    </v-btn>
  </v-snackbar>
</template>

<script>
import { ref, computed, onMounted, watchEffect, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDateFormat } from '@/composables/useDateFormat.js';
import { getContrastColor } from '@/utils/colors';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const { formatDate } = useDateFormat();

    const formatTime = (dateString) => {
      const d = new Date(dateString)
      const h = String(d.getUTCHours()).padStart(2, '0')
      const m = String(d.getUTCMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }

    const fetchDate = ref('');
    const showSnackbar = ref(false);

    const hoverBg = '#f5f5f5';
    const hoverText = getContrastColor(hoverBg);

    const error = computed(() => store.state.racedayInput.error);
    const raceDays = computed(() => store.state.racedayInput.raceDays);
    const raceDaysPage = computed(() => store.state.racedayInput.raceDaysPage);
    const raceDaysPageSize = computed(() => store.state.racedayInput.raceDaysPageSize);
    const raceDaysTotal = computed(() => store.state.racedayInput.raceDaysTotal);
    const hasMore = computed(() => store.state.racedayInput.raceDaysHasMore);
    const loading = computed(() => store.state.racedayInput.loading);
    const successMessage = computed(() => store.state.racedayInput.successMessage);

    const listContainer = ref(null);
    const sentinel = ref(null);
    let observer = null;
    let removeScroll = null;

    // Helper to get the actual scrollable DOM element from the v-list component
    const getRootEl = () => {
      const v = listContainer.value
      return v && (v.$el || v)
    }

    const fetchRacedays = () => {
      if (fetchDate.value) {
        store.dispatch('racedayInput/fetchRacedaysFromAPI', fetchDate.value);
      }
    };

    const navigateToRaceDay = (raceDayId) => {
      router.push({ name: 'Raceday', params: { racedayId: raceDayId } });
    };

    // Fallback scroll handler (helps Safari/Edge quirks)
    const onScroll = () => {
      const el = getRootEl()
      if (!el || loading.value || !hasMore.value) return
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200
      if (nearBottom) loadNextPage()
    }

    const loadNextPage = () => {
      if (!hasMore.value || loading.value) return
      store.dispatch('racedayInput/fetchRacedays', { page: raceDaysPage.value + 1 })
    }

    const setupObserver = () => {
      // Cleanup prior
      if (observer) observer.disconnect()
      if (removeScroll) { removeScroll(); removeScroll = null }

      const rootEl = getRootEl()

      observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          loadNextPage()
        }
      }, { root: rootEl || null, rootMargin: '200px', threshold: 0 })

      if (sentinel.value) observer.observe(sentinel.value)

      // Attach scroll fallback if we have a root element
      if (rootEl) {
        rootEl.addEventListener('scroll', onScroll, { passive: true })
        removeScroll = () => rootEl.removeEventListener('scroll', onScroll)
      }
    }

    onMounted(async () => {
      await store.dispatch('racedayInput/fetchRacedays', { page: 1 })
      await nextTick()
      setupObserver()
    });

    onBeforeUnmount(() => {
      if (observer) observer.disconnect()
      if (removeScroll) removeScroll()
    })

    return {
      formatDate,
      formatTime,
      fetchDate,
      showSnackbar,
      error,
      raceDays,
      raceDaysPage,
      raceDaysPageSize,
      raceDaysTotal,
      hasMore,
      loading,
      successMessage,
      fetchRacedays,
      navigateToRaceDay,
      hoverBg,
      hoverText,
      listContainer,
      sentinel,
    };
  }
}
</script>

<style scoped>
  .track-name {
    font-size: 0.9em;
  }
  .main-content {
    padding-top: 70px;
  }
  .raceday-list {
    max-height: 80vh;
    overflow-y: auto;
  }
  .clickable-row {
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }
  .clickable-row:hover {
    background-color: var(--hover-bg);
    color: var(--hover-text);
  }
  .compact-row .row-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 0.6fr 0.6fr;
    gap: 8px;
    align-items: center;
    width: 100%;
  }
  .compact-row .date { font-weight: 600; }
  .compact-row .track { color: #555; }
  .compact-row .time { color: #777; }
  .compact-row .count { color: #777; text-align: right; }
  .sentinel { display: flex; justify-content: center; padding: 16px; }
  .end-marker { color: #777; font-size: 0.9em; }
</style>
