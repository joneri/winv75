import axios from 'axios'

const API_BASE = '/api'

const fetchRacedayDetails = async racedayId => {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching raceday details:', error)
    throw error
  }
}

async function fetchSpelformer(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/spelformer/${racedayId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching spelformer:', error)
    throw error
  }
}

async function fetchV85Info(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v85/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V85 info:', error)
    throw error
  }
}

async function fetchV86Info(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v86/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V86 info:', error)
    throw error
  }
}

async function updateV85Distribution(racedayId) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v85/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V85 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function updateV86Distribution(racedayId) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v86/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V86 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function fetchV85Templates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/v85/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V85 templates:', error)
    throw error
  }
}

async function fetchV86Templates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/v86/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V86 templates:', error)
    throw error
  }
}

async function fetchV85Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v85`, payload)
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
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v86`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchV86GameView(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v86/game`)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 game view:', error)
    throw error
  }
}

export default {
  fetchRacedayDetails,
  fetchSpelformer,
  fetchV85Info,
  fetchV86Info,
  updateV85Distribution,
  updateV86Distribution,
  fetchV85Templates,
  fetchV86Templates,
  fetchV85Suggestion,
  fetchV86Suggestion,
  fetchV86GameView
}
