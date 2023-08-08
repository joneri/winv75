export async function fetchRaceStartlist(id) {
    const response = await fetch(`/api/raceStartlists/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
}

export async function addRaceStartlist(startlistData) {
    const response = await fetch('/api/raceStartlists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(startlistData)
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}