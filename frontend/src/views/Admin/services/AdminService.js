import axios from 'axios'

const triggerRatingsUpdate = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_BE_URL}/api/elo/update`)
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

export default {
  triggerRatingsUpdate,
  precomputeRacedayAI
}
