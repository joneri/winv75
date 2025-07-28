export async function addRaceday(racedayData) {
  const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/raceday`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(racedayData)
  })

  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

export async function fetchRacedaysByDate(date) {
  const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/raceday/fetch?date=${date}`, {
      method: 'POST'
  })
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
