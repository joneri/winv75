import axios from 'axios'
import { resolveApiUrl } from '@/config/api-base.js'

const normalize = (t) => {
  if (!t) return {}
  const trackLengthMeters = t.trackLengthMeters ?? t.trackLength ?? null
  return {
    ...t,
    trackLengthMeters,
    trackLength: trackLengthMeters,
    hasOpenStretch: !!t.hasOpenStretch,
    openStretchLanes: Number.isFinite(t.openStretchLanes) ? t.openStretchLanes : 0
  }
}

const getTrackByCode = async (trackCode) => {
  try {
    const response = await axios.get(resolveApiUrl(`/api/track/${trackCode}`))
    return normalize(response.data)
  } catch (error) {
    console.error(`Failed to fetch track with code ${trackCode}:`, error)
    throw error
  }
}

export default {
  getTrackByCode
}
