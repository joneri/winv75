<template>
  <v-container class="pt-12">
    <v-row>
      <v-col>
        <h1>Admin</h1>
        <v-btn color="primary" @click="updateRatings">Update Ratings</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AdminService from './services/AdminService.js'

export default {
  name: 'AdminView',
  setup() {
    const updateRatings = async () => {
      try {
        await AdminService.triggerRatingsUpdate()
      } catch (error) {
        console.error('Manual rating update failed', error)
      }
    }
    return {
      updateRatings
    }
  }
}
</script>

<style scoped>
.pt-12 {
  padding-top: 70px;
}
</style>
