<template>
  <v-card>
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
  </v-card>
</template>

<script>
import { ref, toRefs } from 'vue';

export default {
  props: {
    race: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Convert props to reactive references
    const { race } = toRefs(props);

    const viewRaceDetails = () => {
      // Logic to navigate or display race details
      // You can access the race id with race.id
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