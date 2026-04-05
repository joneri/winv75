<template>
  <v-app>
    <NavigationBar />
    <v-main class="app-shell-main">
      <AppBreadcrumbs />
      <div class="app-page">
        <router-view />
      </div>
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
