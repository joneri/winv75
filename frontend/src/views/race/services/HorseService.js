import axios from 'axios'

const getHorseById = async (id) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/horses/${id}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch horse with id ${id}:`, error)
    throw error
  }
}

export default {
  getHorseById,
}
