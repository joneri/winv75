import { ref } from 'vue'
import axios from 'axios'

const updateHorse = async (horseId) => {
    const endpoint = `${import.meta.env.VITE_BE_URL}/api/horses/${horseId}`
    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
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
        if (error.response && error.response.status === 404) {
            console.log(`Horse with id ${horseId} not found.`)
            return null
        }
        console.error(`Failed to fetch horse with id ${horseId}:`, error)
    }
    
    return false
}

const fetchRaceFromRaceId = async (raceId) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/race/${raceId}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch race data", error)
        throw error  // this will allow the calling function to catch the error as well
    }
}

const fetchHorseRankings = async (raceId) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/horses/rankings/${raceId}`)
        return response.data
    } catch (error) {
        console.error("Failed to fetch race data", error)
        throw error  // this will allow the calling function to catch the error as well
    }
}

export {
    updateHorse,
    checkIfUpdatedRecently,
    fetchRaceFromRaceId,
    fetchHorseRankings
}