<template>
  <v-card>
    <div class="d-flex justify-space-between align-center" style="width: 100%;">
      <v-card-title> Race Number: {{ race.raceNumber }}</v-card-title>
      <v-card-text>
        <div>
          {{ race.propTexts[0].text + " " +  race.propTexts[1].text}}
        </div>
        <!-- Add other race details as needed -->
      </v-card-text>
      <v-card-actions>
        <v-btn @click="viewRaceDetails">View Details</v-btn>
      </v-card-actions>
    </div>
  </v-card>
</template>

<script>
import { ref, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  props: {
    race: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Convert props to reactive references
    const { race } = toRefs(props)
    const router = useRouter()
    const store = useStore()

    const viewRaceDetails = () => {
      console.log("Race being committed:", props.race)
      try {
        store.commit('raceHorses/setCurrentRace', props.race)
      } catch (error) {
        console.error("Error in viewRaceDetails:", error)
      }
      router.push({ name: 'race', params: { raceId: props.race.raceId } }).catch(error => {
        console.error("Router push error:", error);
      })
    }

    return {
      race,
      viewRaceDetails
    }
  }
}
</script>

<style scoped>
/* You can put any scoped styles for RaceCardComponent here */
</style>