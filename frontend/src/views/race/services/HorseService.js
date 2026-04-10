import axios from 'axios'
import { resolveApiUrl } from '@/config/api-base.js'

const getHorseById = async (id) => {
  try {
    const response = await axios.get(resolveApiUrl(`/api/horses/${id}`))
    return response.data
  } catch (error) {
    console.error(`Failed to fetch horse with id ${id}:`, error)
    throw error
  }
}

export default {
  getHorseById,
}
