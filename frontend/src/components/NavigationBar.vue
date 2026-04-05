<template>
  <v-navigation-drawer
    v-if="mdAndDown"
    v-model="drawer"
    temporary
    location="left"
    :width="304"
    class="mobile-drawer"
  >
    <div class="drawer-head">
      <div class="drawer-kicker">Winv75</div>
      <div class="drawer-title">Navigera</div>
    </div>

    <v-list nav class="drawer-list">
      <template v-for="section in sections" :key="section.title">
        <div class="drawer-section-title">{{ section.title }}</div>
        <v-list-item
          v-for="item in section.items"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="item.description"
          :active="isItemActive(item)"
          rounded="xl"
          class="drawer-item"
          @click="handleNavigation(item)"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <div class="header-wrap">
    <header class="app-header app-page">
      <div class="header-brand">
        <v-btn
          v-if="mdAndDown"
          icon="mdi-menu"
          variant="text"
          class="mobile-nav-toggle"
          @click="toggleDrawer"
        />
        <router-link class="brand-link" :to="{ name: 'RacedayInput' }">
          <span class="brand-mark">W</span>
          <span class="brand-copy">
            <span class="brand-name">winv75</span>
          </span>
        </router-link>
      </div>

      <nav v-if="!mdAndDown" class="primary-nav" aria-label="Huvudnavigation">
        <v-btn
          v-for="item in primaryItems"
          :key="item.title"
          variant="text"
          class="primary-nav-link"
          :class="{ active: isItemActive(item) }"
          @click="handleNavigation(item)"
        >
          {{ item.shortTitle || item.title }}
        </v-btn>
      </nav>

      <div class="header-tools">
        <div v-if="!mdAndDown && currentSectionLabel" class="section-pill">
          {{ currentSectionLabel }}
        </div>
        <div class="search-shell">
          <GlobalSearch />
        </div>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import GlobalSearch from './GlobalSearch.vue'
import { mobileNavigationSections, primaryNavigation, type NavigationTarget } from '@/navigation/menu'

const drawer = ref(false)
const sections = computed(() => mobileNavigationSections)
const primaryItems = computed(() => primaryNavigation)
const route = useRoute()
const router = useRouter()
const { mdAndDown } = useDisplay()

const isItemActive = (item: NavigationTarget) => {
  if (!route.name) return false
  if (item.to?.name === route.name) return true
  if (item.matchRoutes?.includes(String(route.name))) return true
  return false
}

const currentSectionLabel = computed(() => {
  const match = primaryNavigation.find(item => isItemActive(item))
  return match?.title || ''
})

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const handleNavigation = (item: NavigationTarget) => {
  router.push(item.to)
  drawer.value = false
}

watch(
  () => route.fullPath,
  () => {
    if (mdAndDown.value) drawer.value = false
  }
)
</script>

<style scoped>
.header-wrap {
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(16px);
  background: linear-gradient(180deg, rgba(6, 11, 20, 0.92), rgba(6, 11, 20, 0.72));
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.app-header {
  min-height: 72px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text-strong);
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  color: #061120;
  background: linear-gradient(135deg, var(--track-amber), #f7e0a4);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.brand-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.primary-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.primary-nav-link {
  min-width: 0;
  border-radius: 999px;
  color: var(--text-muted);
  padding-inline: 16px;
  font-weight: 600;
  letter-spacing: 0;
}

.primary-nav-link.active {
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(89, 212, 255, 0.22);
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
  font-size: 0.84rem;
}

.search-shell {
  width: min(420px, 42vw);
}

.mobile-nav-toggle {
  color: var(--text-body);
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  background:
    radial-gradient(circle at top right, rgba(89, 212, 255, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(11, 19, 34, 0.98), rgba(15, 26, 46, 0.98));
  color: var(--text-body);
}

.drawer-head {
  padding: 18px 18px 10px;
}

.drawer-kicker,
.drawer-section-title {
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--track-amber);
}

.drawer-title {
  margin-top: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-strong);
}

.drawer-list {
  padding: 6px 12px 20px;
}

.drawer-section-title {
  padding: 14px 10px 8px;
}

.drawer-item {
  margin-bottom: 6px;
  color: var(--text-body);
}

.drawer-item :deep(.v-list-item-title) {
  color: var(--text-strong);
  font-weight: 600;
}

.drawer-item :deep(.v-list-item-subtitle) {
  color: var(--text-soft);
}

@media (max-width: 1120px) {
  .app-header {
    grid-template-columns: auto 1fr;
  }

  .header-tools {
    justify-content: flex-end;
  }

  .search-shell {
    width: min(360px, 46vw);
  }
}

@media (max-width: 960px) {
  .app-header {
    grid-template-columns: 1fr;
    gap: 10px;
    min-height: auto;
    padding: 12px 0 14px;
  }

  .header-brand,
  .header-tools {
    width: 100%;
  }

  .header-tools {
    justify-content: space-between;
  }

  .search-shell {
    width: 100%;
  }
}
</style>
