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

async function fetchV75Info(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v75/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V75 info:', error)
    throw error
  }
}

async function updateV75Distribution(racedayId) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v75/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V75 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function fetchV75Templates() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/v75/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V75 templates:', error)
    throw error
  }
}

async function fetchV75Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v75`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V75 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
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
  fetchV75Info,
  updateV75Distribution,
  fetchV75Templates,
  fetchV75Suggestion,
  refreshRacedayAi
}
