import axios from 'axios'

const API_BASE = '/api'

const fetchRacedayDetails = async (racedayId, propLanguage = 'sv') => {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}`, {
      params: { propLanguage }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching raceday details:', error)
    throw error
  }
}

const fetchRacedayKpis = async (racedayId) => {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/kpis`)
    return response.data
  } catch (error) {
    console.error('Error fetching raceday KPI profile:', error)
    throw error
  }
}

async function fetchPropositionTranslationOverview(limit = 250, propLanguage = 'sv') {
  try {
    const response = await axios.get(`${API_BASE}/proposition-translations/overview`, {
      params: { limit, propLanguage }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching proposition translation overview:', error)
    throw error
  }
}

async function downloadPropositionTranslationBundle(format = 'json') {
  try {
    const response = await axios.get(`${API_BASE}/proposition-translations/export-bundle`, {
      params: { format },
      responseType: 'blob'
    })
    const contentDisposition = response.headers['content-disposition'] || ''
    const match = contentDisposition.match(/filename="?([^";]+)"?/i)
    const fileName = match?.[1] || (format === 'zip'
      ? 'proposition-translation-bundle-package.zip'
      : 'proposition-translation-bundle.json')
    const blobUrl = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading proposition translation bundle:', error)
    throw error
  }
}

async function fetchSpelformer(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/spelformer/${racedayId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching spelformer:', error)
    throw error
  }
}

async function fetchV85Info(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v85/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V85 info:', error)
    throw error
  }
}

async function fetchV5Info(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v5/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V5 info:', error)
    throw error
  }
}

async function fetchV86Info(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v86/info`)
    return response.data?.info || null
  } catch (error) {
    console.error('Error fetching V86 info:', error)
    throw error
  }
}

async function updateV5Distribution(racedayId) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v5/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V5 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function updateV85Distribution(racedayId) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v85/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V85 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function updateV86Distribution(racedayId) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v86/update`)
    return response.data
  } catch (error) {
    console.error('Error updating V86 distribution:', error)
    if (error.response?.data) throw error.response.data
    throw error
  }
}

async function fetchV5Templates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/v5/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V5 templates:', error)
    throw error
  }
}

async function fetchV85Templates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/v85/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V85 templates:', error)
    throw error
  }
}

async function fetchDdTemplates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/dd/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching DD templates:', error)
    throw error
  }
}

async function fetchV86Templates() {
  try {
    const response = await axios.get(`${API_BASE}/raceday/v86/templates`)
    return response.data?.templates || []
  } catch (error) {
    console.error('Error fetching V86 templates:', error)
    throw error
  }
}

async function fetchV5Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v5`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V5 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchV85Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v85`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V85 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchDdSuggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/dd`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching DD suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchV86Suggestion(racedayId, payload) {
  try {
    const response = await axios.post(`${API_BASE}/raceday/${racedayId}/v86`, payload)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 suggestion:', error)
    if (error.response?.data) {
      throw error.response.data
    }
    throw error
  }
}

async function fetchDdGameView(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/dd/game`)
    return response.data
  } catch (error) {
    console.error('Error fetching DD game view:', error)
    throw error
  }
}

async function fetchV86GameView(racedayId) {
  try {
    const response = await axios.get(`${API_BASE}/raceday/${racedayId}/v86/game`)
    return response.data
  } catch (error) {
    console.error('Error fetching V86 game view:', error)
    throw error
  }
}

export default {
  fetchRacedayDetails,
  fetchRacedayKpis,
  fetchSpelformer,
  fetchV5Info,
  fetchV85Info,
  fetchV86Info,
  updateV5Distribution,
  updateV85Distribution,
  updateV86Distribution,
  fetchV5Templates,
  fetchV85Templates,
  fetchDdTemplates,
  fetchV86Templates,
  fetchV5Suggestion,
  fetchV85Suggestion,
  fetchDdSuggestion,
  fetchV86Suggestion,
  fetchDdGameView,
  fetchV86GameView,
  fetchPropositionTranslationOverview,
  downloadPropositionTranslationBundle
}
