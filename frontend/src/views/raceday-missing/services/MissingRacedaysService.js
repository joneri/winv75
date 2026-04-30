import { resolveApiUrl } from '@/config/api-base.js'

export async function fetchMissingRacedays({ from, to }) {
  const params = new URLSearchParams({ from, to })
  const response = await fetch(resolveApiUrl(`/api/raceday/missing?${params.toString()}`))
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error || `HTTP error! status: ${response.status}`)
  }
  return body
}

export async function importMissingRacedayDate(date) {
  const params = new URLSearchParams({ date })
  const response = await fetch(resolveApiUrl(`/api/raceday/missing/import?${params.toString()}`), {
    method: 'POST'
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error || `HTTP error! status: ${response.status}`)
  }
  return body
}
