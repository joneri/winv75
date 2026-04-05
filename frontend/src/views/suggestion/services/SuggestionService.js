import axios from 'axios'

const API_BASE = '/api'

async function fetchRacedaySuggestions(racedayId, params = {}) {
  const response = await axios.get(`${API_BASE}/raceday/${racedayId}/suggestions`, { params })
  return response.data
}

async function fetchSuggestionDetail(suggestionId) {
  const response = await axios.get(`${API_BASE}/suggestions/${suggestionId}`)
  return response.data
}

async function fetchSuggestionAnalytics(params = {}) {
  const response = await axios.get(`${API_BASE}/suggestions/analytics`, { params })
  return response.data
}

async function createSuggestionMarker(payload) {
  const response = await axios.post(`${API_BASE}/suggestions/markers`, payload)
  return response.data
}

export default {
  fetchRacedaySuggestions,
  fetchSuggestionDetail,
  fetchSuggestionAnalytics,
  createSuggestionMarker
}
