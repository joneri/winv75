<template>
  <v-app>
    <NavigationBar />
    <v-main>
      <AppBreadcrumbs />
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import NavigationBar from '@/components/NavigationBar.vue'
import AppBreadcrumbs from '@/components/AppBreadcrumbs.vue'

export default {
  components: {
    NavigationBar,
    AppBreadcrumbs,
  },
}
</script>
