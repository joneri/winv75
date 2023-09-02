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

const fetchEarliestUpdatedHorseTimestamp = async (raceDayId, raceId) => {
    console.log(`This function is not yet implemented`)
}

export default {
  fetchRacedayDetails,
  fetchEarliestUpdatedHorseTimestamp

}