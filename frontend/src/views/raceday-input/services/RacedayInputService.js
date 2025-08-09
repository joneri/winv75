export async function fetchRacedaysByDate(date) {
  const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/raceday/fetch?date=${date}`, {
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
  const url = `${import.meta.env.VITE_BE_URL}/api/raceday/summary?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
