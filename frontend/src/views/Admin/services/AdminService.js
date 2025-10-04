import axios from 'axios'

const triggerRatingsUpdate = async (full = false) => {
  try {
    const params = full ? { full: true } : undefined
    await axios.post(`${import.meta.env.VITE_BE_URL}/api/rating/update`, null, { params })
  } catch (error) {
    console.error('Failed to trigger ratings update', error)
    throw error
  }
}

const precomputeRacedayAI = async (daysAhead = 3) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_BE_URL}/api/raceday/_admin/precompute-ai`, null, { params: { daysAhead } })
    return res.data
  } catch (error) {
    console.error('Failed to precompute raceday AI', error)
    throw error
  }
}

const evalElo = async (params) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/rating/eval`, { params })
    return res.data
  } catch (error) {
    console.error('Failed to evaluate Elo', error)
    throw error
  }
}

const fetchDriverRating = async (id) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/driver/ratings`, { params: { ids: id } })
    return Array.isArray(res.data) ? res.data[0] : null
  } catch (error) {
    console.error('Failed to fetch driver rating', error)
    throw error
  }
}

const updateDriverElo = async (id, payload) => {
  try {
    const res = await axios.put(`${import.meta.env.VITE_BE_URL}/api/driver/${id}/elo`, payload)
    return res.data
  } catch (error) {
    console.error('Failed to update driver elo', error)
    throw error
  }
}

const recomputeDriverElo = async (payload = {}) => {
  try {
    const body = { rebuild: true, ...payload }
    const res = await axios.post(`${import.meta.env.VITE_BE_URL}/api/driver/recompute`, body)
    return res.data
  } catch (error) {
    console.error('Failed to recompute driver elo', error)
    throw error
  }
}

export default {
  triggerRatingsUpdate,
  precomputeRacedayAI,
  evalElo,
  fetchDriverRating,
  updateDriverElo,
  recomputeDriverElo
}
