<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    :temporary="mdAndDown"
    :width="drawerWidth"
  >
    <v-list nav density="compact">
      <template v-for="section in sections" :key="section.title">
        <v-list-subheader :title="section.title" class="pl-4" />
        <v-list-item
          v-for="item in section.items"
          :key="item.title"
          :title="item.title"
          :subtitle="item.description"
          :prepend-icon="item.icon"
          :to="item.to && !item.disabled ? item.to : undefined"
          :disabled="item.disabled"
          :active="isItemActive(item)"
          rounded="lg"
          class="ml-2 mr-2"
          @click="handleNavigation(item)"
        />
        <v-divider class="my-1" />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar app color="primary" dark flat>
    <v-app-bar-nav-icon @click="toggleDrawer" />
    <v-toolbar-title class="font-weight-semibold">WinV75</v-toolbar-title>
    <div class="search-wrapper">
      <GlobalSearch />
    </div>
    <v-spacer />
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import GlobalSearch from './GlobalSearch.vue'
import { navigationSections, type NavigationTarget } from '@/navigation/menu'

const drawer = ref(false)
const sections = computed(() => navigationSections)
const route = useRoute()
const router = useRouter()
const { mdAndDown } = useDisplay()

const drawerWidth = computed(() => (mdAndDown.value ? 280 : 240))

const isItemActive = (item: NavigationTarget) => {
  if (!route.name) return false
  if (item.to?.name === route.name) return true
  if (item.matchRoutes?.includes(String(route.name))) return true
  return false
}

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const handleNavigation = (item: NavigationTarget) => {
  if (!item.to || item.disabled) return
  router.push(item.to)
  if (mdAndDown.value) drawer.value = false
}

watch(
  () => route.fullPath,
  () => {
    if (mdAndDown.value) drawer.value = false
  }
)

watch(
  () => mdAndDown.value,
  (small) => {
    if (!small) {
      drawer.value = true
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!mdAndDown.value) drawer.value = true
})
</script>

<style scoped>
.search-wrapper {
  flex: 1;
  max-width: 420px;
  margin-left: 16px;
}

@media (max-width: 960px) {
  .search-wrapper {
    max-width: unset;
    margin-left: 12px;
  }
}
</style>
