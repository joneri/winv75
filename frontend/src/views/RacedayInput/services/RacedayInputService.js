export async function fetchRacedaysByDate(date) {
  const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/raceday/fetch?date=${date}`, {
      method: 'POST'
  })
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
