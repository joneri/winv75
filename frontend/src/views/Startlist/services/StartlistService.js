export async function addStartlist(startlistData) {
    const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/startlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startlistData)
    })
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  
    return await response.json()
  }  