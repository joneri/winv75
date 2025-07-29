<template>
  <v-container fluid class="main-content">
    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>

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
            class="clickable-row"
            @click="navigateToRaceDay(raceDay._id)"
            :style="{ '--hover-bg': hoverBg, '--hover-text': hoverText }"
          >
              <div class="d-flex justify-space-between align-center" style="width: 100%;">
                  <div>
                      <v-list-item-title class="headline">{{ formatDate(raceDay.firstStart) }}</v-list-item-title>
                      <v-list-item-subtitle>{{ raceDay.trackName }} - {{ raceDay.raceStandard }}</v-list-item-subtitle>
                  </div>
                  <v-btn @click.stop="navigateToRaceDay(raceDay._id)" variant="text">View Details</v-btn>
              </div>
          </v-list-item>
          <v-divider></v-divider>
      </template>
      <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    </v-list>
    <v-row justify="center" class="mt-2" v-if="hasMore && !loading">
      <v-btn color="primary" @click="loadMore">Load more</v-btn>
    </v-row>
    <v-alert v-if="raceDays.length === 0" type="info" class="mt-4">No racedays found.</v-alert>
    <v-progress-linear
      v-if="loading && hasMore"
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
import { ref, computed, onMounted, watchEffect, nextTick, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDateFormat } from '@/composables/useDateFormat.js';
import { getContrastColor } from '@/utils/colors';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const { formatDate } = useDateFormat();

    const fetchDate = ref('');
    const showSnackbar = ref(false);

    const hoverBg = '#f5f5f5';
    const hoverText = getContrastColor(hoverBg);

    const error = computed(() => store.state.racedayInput.error);
    const raceDays = computed(() => store.state.racedayInput.raceDays);
    const loading = computed(() => store.state.racedayInput.loading || store.state.racedayInput.listLoading);
    const successMessage = computed(() => store.state.racedayInput.successMessage);
    const hasMore = computed(() => store.state.racedayInput.hasMore);
    const infiniteScrollTrigger = ref(null);
    const listContainer = ref(null);


    const loadMore = async () => {
      const rootEl = listContainer.value?.$el ?? listContainer.value;
      if (!(rootEl instanceof HTMLElement)) return;
      const offset = rootEl.scrollHeight - rootEl.scrollTop;
      await store.dispatch('racedayInput/fetchRacedays');
      await nextTick();
      rootEl.scrollTop = rootEl.scrollHeight - offset;
    };


    const fetchRacedays = () => {
      if (fetchDate.value) {
        store.dispatch('racedayInput/fetchRacedaysFromAPI', fetchDate.value);
      }
    };

    const navigateToRaceDay = (raceDayId) => {
      router.push({ name: 'Raceday', params: { racedayId: raceDayId } }); // Changed this.$router to router
    };

    watchEffect(() => {
      if (successMessage.value) {
        showSnackbar.value = true;
        fetchDate.value = '';
      }
    });

    let observer;

    onMounted(async () => {
      store.dispatch('racedayInput/fetchRacedays', { reset: true });
      // Wait for DOM update to access element refs
      await nextTick();
      const rootEl = listContainer.value?.$el ?? listContainer.value;
      if (infiniteScrollTrigger.value && rootEl instanceof HTMLElement) {
        const options = {
          root: rootEl,
          rootMargin: '0px 0px 200px 0px'
        };
        observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore.value) {
            loadMore();
          }
        }, options);
        observer.observe(infiniteScrollTrigger.value);
      }
    });

    onBeforeUnmount(() => {
      if (observer) observer.disconnect();
    });

    return {
      formatDate,
      fetchDate,
      showSnackbar,
      error,
      raceDays,
      loading,
      successMessage,
      fetchRacedays,
      navigateToRaceDay,
      hoverBg,
      hoverText,
      infiniteScrollTrigger,
      listContainer,
      hasMore,
      loadMore
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
  .infinite-scroll-trigger {
    height: 1px;
  }
  .clickable-row {
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }
  .clickable-row:hover {
    background-color: var(--hover-bg);
    color: var(--hover-text);
  }
</style>
