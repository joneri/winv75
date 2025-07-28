<template>
  <v-card class="clickable-card" @click="viewRaceDetails">
    <div class="d-flex justify-space-between align-center" style="width: 100%;">
      <v-card-title> Race Number: {{ race.raceNumber }}</v-card-title>
      <v-card-text>
        <div>
          {{ race.propTexts[0].text + " " + race.propTexts[1].text }}
          <div v-if="lastUpdatedHorseTimestamp !== null" class="updated-indication">
            Last Horse Updated: {{ lastUpdatedHorseTimestamp }}
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn @click.stop="viewRaceDetails">View Details</v-btn>
      </v-card-actions>
    </div>
  </v-card>
</template>

<script>
import { toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  props: {
    race: {
      type: Object,
      required: true
    },
    lastUpdatedHorseTimestamp: {
      type: String,
      default: null
    },
    racedayId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // Convert props to reactive references
    const { race, lastUpdatedHorseTimestamp } = toRefs(props)
    const router = useRouter()
    const store = useStore()

    const viewRaceDetails = () => {
      store.commit('raceHorses/setCurrentRace', props.race);
      const raceId = props.race.raceId;
      const racedayId = props.racedayId;

      router.push(`/raceday/${racedayId}/race/${raceId}`)
        .catch(err => {
          console.error('Router Push Error:', err);
        });
    };



    return {
      race,
      lastUpdatedHorseTimestamp,
      viewRaceDetails
    }
  }
}
</script>

<style scoped>
.updated-indication {
  color: green;
  font-weight: bold;
}
.clickable-card {
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
}
.clickable-card:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
