import { reactive } from 'vue'

const labels = reactive<Record<string, string>>({})

export const setBreadcrumbLabel = (routeName: string | undefined, label?: string | null) => {
  if (!routeName) return
  if (label && label.trim().length) {
    labels[routeName] = label.trim()
  } else {
    delete labels[routeName]
  }
}

export const getBreadcrumbLabel = (routeName: string | undefined) => {
  if (!routeName) return null
  return labels[routeName] ?? null
}

export const useBreadcrumbLabels = () => labels

