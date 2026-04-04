import axios from 'axios'

export async function fetchRacedaysByDate(date) {
  const url = `https://api.travsport.se/webapi/raceinfo/organisation/TROT/sourceofdata/BOTH?fromracedate=${date}&toracedate=${date}&tosubmissiondate=${date}&typeOfRacesCodes=`

  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching raceday data for ${date}:`, error)
    throw error
  }
}

export async function fetchStartlistById(racedayId) {
  const url = `https://api.travsport.se/webapi/raceinfo/startlists/organisation/TROT/sourceofdata/SPORT/racedayid/${racedayId}`

  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching startlist for racedayId ${racedayId}:`, error)
    throw error
  }
}

export default {
  fetchRacedaysByDate,
  fetchStartlistById
}
