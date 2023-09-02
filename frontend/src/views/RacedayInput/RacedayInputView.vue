<template>
  <v-container fluid class="main-content">
    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>

    <!-- Raceday JSON Input Section -->
    <v-row>
      <v-col>
        <v-form @submit.prevent="submitRacedayData">
          <v-textarea v-model="racedayJsonInput" label="Raceday JSON Data" required variant="outlined"></v-textarea>
          <v-btn type="submit" color="primary">Submit Raceday Data</v-btn>
        </v-form>
        <v-alert v-if="error" type="error">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <!-- List of Racedays -->
    <v-list>
        <template v-for="raceDay in raceDays" :key="raceDay._id">
            <v-list-item>
                <div class="d-flex justify-space-between align-center" style="width: 100%;">
                    <div>
                        <v-list-item-title class="headline">{{ formatDate(raceDay.firstStart) }}</v-list-item-title>
                        <v-list-item-subtitle>{{ raceDay.trackName }} - {{ raceDay.raceStandard }}</v-list-item-subtitle>
                    </div>
                    <v-btn @click="navigateToRaceDay(raceDay._id)" variant="text">View Details</v-btn>
                </div>
            </v-list-item>
            <v-divider></v-divider>
        </template>
    </v-list>

  </v-container>

  <v-snackbar v-model="showSnackbar" top color="success">
    {{ successMessage }}
    <v-btn dark text @click="showSnackbar = false">
      Close
    </v-btn>
  </v-snackbar>
</template>

<script>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDateFormat } from '@/composables/useDateFormat.js';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const { formatDate } = useDateFormat();

    const racedayJsonInput = ref('');
    const showSnackbar = ref(false);

    const error = computed(() => store.state.raceday.error);
    const raceDays = computed(() => store.state.racedayInput.raceDays);
    const loading = computed(() => store.state.raceday.loading);
    const successMessage = computed(() => store.state.raceday.successMessage);

    const submitRacedayData = () => {
      if (racedayJsonInput.value === '') return;

      try {
        const parsedData = JSON.parse(racedayJsonInput.value);
        store.dispatch('racedayInput/addRacedayData', parsedData);
        racedayJsonInput.value = '';  // Clear input after successful submission
      } catch (error) {
        console.error('Error parsing Raceday JSON data:', error);
      }
    };

    const navigateToRaceDay = (raceDayId) => {
      router.push({ name: 'Raceday', params: { racedayId: raceDayId } }); // Changed this.$router to router
    };

    watchEffect(() => {
      if (successMessage.value) {
        showSnackbar.value = true;
        racedayJsonInput.value = '';
      }
    });

    onMounted(() => {
      store.dispatch('racedayInput/fetchRacedays');
    });

    return {
      formatDate,
      racedayJsonInput,
      showSnackbar,
      error,
      raceDays,
      loading,
      successMessage,
      submitRacedayData,
      navigateToRaceDay
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
</style>