import axios from 'axios'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'
const TRAVSPORT_TIMEOUT_MS = 15000

function externalFetchErrorSummary(error) {
  if (!error?.isAxiosError) {
    return {
      message: error?.message || 'Unknown error'
    }
  }

  return {
    message: error.message,
    status: error.response?.status || null,
    statusText: error.response?.statusText || '',
    code: error.code || '',
    responseMessage: error.response?.data?.errorMessage || ''
  }
}

function formatExternalFetchError(error) {
  const summary = externalFetchErrorSummary(error)
  const parts = [
    summary.message,
    summary.status ? `status=${summary.status}` : '',
    summary.statusText ? `statusText=${summary.statusText}` : '',
    summary.code ? `code=${summary.code}` : '',
    summary.responseMessage ? `response="${summary.responseMessage}"` : ''
  ].filter(Boolean)

  return parts.join(' ')
}

function enrichExternalFetchError(error, context) {
  error.externalFetch = {
    ...context,
    ...externalFetchErrorSummary(error)
  }
  return error
}

export async function fetchRacedaysByDate(date) {
  const url = `https://api.travsport.se/webapi/raceinfo/organisation/TROT/sourceofdata/BOTH?fromracedate=${date}&toracedate=${date}&tosubmissiondate=${date}&typeOfRacesCodes=`

  try {
    const response = await axios.get(url, { timeout: TRAVSPORT_TIMEOUT_MS })
    return response.data
  } catch (error) {
    const enriched = enrichExternalFetchError(error, { provider: 'Travsport', operation: 'fetchRacedaysByDate', date })
    console.warn(`Travsport raceday fetch failed for ${date}: ${formatExternalFetchError(enriched)}`)
    throw enriched
  }
}

export async function fetchStartlistById(racedayId) {
  const url = `https://api.travsport.se/webapi/raceinfo/startlists/organisation/TROT/sourceofdata/SPORT/racedayid/${racedayId}`

  try {
    const response = await axios.get(url, { timeout: TRAVSPORT_TIMEOUT_MS })
    return response.data
  } catch (error) {
    const enriched = enrichExternalFetchError(error, { provider: 'Travsport', operation: 'fetchStartlistById', racedayId })
    console.warn(`Travsport startlist fetch failed for racedayId ${racedayId}: ${formatExternalFetchError(enriched)}`)
    throw enriched
  }
}

export async function fetchAtgGameById(gameId) {
  const url = `${ATG_BASE_URL}/games/${gameId}`

  try {
    const response = await axios.get(url, { timeout: 15000 })
    return response.data
  } catch (error) {
    console.error(`Error fetching ATG game ${gameId}:`, error.message)
    throw error
  }
}

export default {
  fetchRacedaysByDate,
  fetchStartlistById,
  fetchAtgGameById
}
