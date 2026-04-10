import { resolveApiUrl } from '@/config/api-base.js'

export async function fetchRacedaysByDate(date) {
  const response = await fetch(resolveApiUrl(`/api/raceday/fetch?date=${date}`), {
      method: 'POST'
  })
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

export async function fetchRacedaysSummary({ page = 1, pageSize = 20, fields } = {}) {
  const skip = (page - 1) * pageSize
  const limit = pageSize
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (fields && fields.length) params.set('fields', fields.join(','))
  const url = resolveApiUrl(`/api/raceday/summary?${params.toString()}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

export async function refreshStaleRacedayResults({ limit = 100, raceDayIds = [] } = {}) {
  const res = await fetch(resolveApiUrl(`/api/raceday/refresh-stale-results?limit=${limit}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raceDayIds })
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
