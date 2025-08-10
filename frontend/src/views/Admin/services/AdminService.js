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
    const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/elo/eval`, { params })
    return res.data
  } catch (error) {
    console.error('Failed to evaluate Elo', error)
    throw error
  }
}

export default {
  triggerRatingsUpdate,
  precomputeRacedayAI,
  evalElo
}
