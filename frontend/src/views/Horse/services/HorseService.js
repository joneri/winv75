export async function addHorse(horseData) {
    console.log('horseData', horseData)
    const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/horses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(horseData),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}