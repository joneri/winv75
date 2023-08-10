import { ref } from 'vue'

export const updateHorse = async (horseId) => {
    const endpoint = `/api/horses/${horseId}`
    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            // Include any additional data here if needed
        })

        if (!response.ok) {
            const message = `An error has occurred: ${response.status}`
            throw new Error(message)
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error(`Failed to fetch: ${error.message}`)
    }
}

const checkIfUpdatedRecently = async (horseId) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/horses/${horseId}`)
        
        if (response.data && response.data.updatedAt) {
            const updatedAt = new Date(response.data.updatedAt)
            const now = new Date()
            
            const differenceInDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24))
            
            return differenceInDays <= 6
        }
    } catch (error) {
        console.error(`Failed to fetch horse with id ${horseId}:`, error)
    }
    
    return false
}

export {
    updateHorse,
    checkIfUpdatedRecently
}