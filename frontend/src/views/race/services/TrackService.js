import axios from 'axios'

const getTrackByCode = async (trackCode) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/track/${trackCode}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch track with code ${trackCode}:`, error)
    throw error
  }
}

export default {
  getTrackByCode
}
