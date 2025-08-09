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

async function fetchRacedayAiList(racedayId) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday/${racedayId}/ai-list`)
    return response.data
  } catch (error) {
    console.error('Error fetching raceday AI list:', error)
    throw error
  }
}

export default {
  fetchRacedayDetails,
  fetchSpelformer,
  fetchRacedayAiList
}
