import axios from 'axios'

const fetchRacedayDetails = async racedayId => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching raceday details:', error)
    throw error
  }
}

async function fetchSpelformer(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/spelformer/${racedayId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching spelformer:', error)
    throw error
  }
}

// Allow optional force flag to bypass cache
async function fetchRacedayAiList(racedayId, { force = false } = {}) {
  try {
    const url = `${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/ai-list${force ? '?force=true' : ''}`
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('Error fetching raceday AI list:', error)
    throw error
  }
}

// Admin: force refresh AI cache for a raceday
async function refreshRacedayAi(racedayId) {
  try {
    const url = `${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/_admin/refresh-ai`
    const response = await axios.post(url)
    return response.data
  } catch (error) {
    console.error('Error refreshing raceday AI cache:', error)
    throw error
  }
}

export default {
  fetchRacedayDetails,
  fetchSpelformer,
  fetchRacedayAiList,
  refreshRacedayAi
}
