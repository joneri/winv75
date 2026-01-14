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

async function fetchV85Info(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v85/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V85 info:', error)
    throw error
  }
}

async function fetchV86Info(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v86/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V86 info:', error)
    throw error
  }
}

async function updateV85Distribution(racedayId) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v85/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V85 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function updateV86Distribution(racedayId) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v86/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V86 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function fetchV85Templates() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/v85/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V85 templates:', error)
    throw error
  }
}

async function fetchV86Templates() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/v86/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V86 templates:', error)
    throw error
  }
}

async function fetchV85Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v85`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V85 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchV86Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v86`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchV86AiList(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v86/ai-list`)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 AI list:', error)
    throw error
  }
}

async function fetchV86GameView(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/v86/game`)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 game view:', error)
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
  fetchV85Info,
  fetchV86Info,
  updateV85Distribution,
  updateV86Distribution,
  fetchV85Templates,
  fetchV86Templates,
  fetchV85Suggestion,
  fetchV86Suggestion,
  fetchV86AiList,
  fetchV86GameView,
  refreshRacedayAi
}
