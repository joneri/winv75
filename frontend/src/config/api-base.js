const rawBackendUrl = (import.meta.env.VITE_BE_URL || '').trim()

export const apiBaseUrl = rawBackendUrl || ''

export function resolveApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}
