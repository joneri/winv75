import axios from 'axios'

const triggerRatingsUpdate = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_BE_URL}/api/elo/update`)
  } catch (error) {
    console.error('Failed to trigger ratings update', error)
    throw error
  }
}

export default {
  triggerRatingsUpdate
}
