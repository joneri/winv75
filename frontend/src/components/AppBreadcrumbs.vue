<template>
  <v-sheet v-if="crumbs.length" class="breadcrumbs" color="transparent" elevation="0">
    <v-breadcrumbs :items="crumbs" density="compact" />
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBreadcrumbLabel, useBreadcrumbLabels } from '@/navigation/breadcrumbs'

const route = useRoute()
const router = useRouter()
useBreadcrumbLabels()

const extractParams = (path: string) => {
  const matches = [...path.matchAll(/:([^/]+)/g)]
  return matches.map((match) => match[1])
}

const resolveCrumb = (record: any) => {
  const breadcrumbMeta = record.meta?.breadcrumb
  let payload: any

  if (typeof breadcrumbMeta === 'function') {
    payload = breadcrumbMeta({
      ...route,
      meta: {
        ...route.meta,
        breadcrumbLabel: getBreadcrumbLabel(record.name)
      }
    })
  } else if (breadcrumbMeta) {
    payload = breadcrumbMeta
  }

  const storedLabel = getBreadcrumbLabel(record.name)

  if (!payload) {
    payload = {
      label: storedLabel || record.meta?.title || String(record.name || '')
    }
  }

  const crumb = typeof payload === 'string' ? { label: payload } : { ...payload }

  if (storedLabel) {
    crumb.label = storedLabel
  }

  if (!crumb.label) {
    crumb.label = record.meta?.title || String(record.name || '')
  }

  if (!crumb.to && record.name !== route.name) {
    const params: Record<string, any> = {}
    for (const param of extractParams(record.path)) {
      if (route.params?.[param] != null) {
        params[param] = route.params[param]
      }
    }
    if (record.name) {
      crumb.to = { name: record.name, params }
    }
  }

  return {
    title: crumb.label,
    to: crumb.to,
    disabled: record.name === route.name
  }
}

const crumbs = computed(() => {
  if (!route.name) return []
  const lookup = new Map(router.getRoutes().map((record) => [record.name, record]))
  const items: any[] = []
  const guard = new Set<string>()
  let current: any = route.name

  while (current && !guard.has(current)) {
    guard.add(current)
    const record = lookup.get(current)
    if (!record) break
    items.unshift(resolveCrumb(record))
    current = record.meta?.parent || null
  }

  return items
})
</script>

<style scoped>
.breadcrumbs {
  padding: 12px 24px 0;
}

@media (max-width: 960px) {
  .breadcrumbs {
    padding: 8px 16px 0;
  }
}
</style>
