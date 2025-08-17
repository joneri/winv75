// frontend/src/composables/usePastDisplay.js
import { getTrackName } from '@/utils/track'

// Safely format a date-like value to YYYY-MM-DD
function fmtDate(d) {
  if (!d) return '—'
  try {
    // Accept ISO string or epoch millis/seconds
    const dt = typeof d === 'number'
      ? new Date(String(d).length >= 13 ? d : d * 1000)
      : new Date(d)
    if (isNaN(dt.getTime())) return '—'
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return '—'
  }
}

function fmtTrack(codeOrName) {
  if (!codeOrName) return '—'
  // If looks like a code (3-4 uppercase letters), map to human-friendly name
  if (typeof codeOrName === 'string' && /^[A-ZÅÄÖ]{2,4}$/.test(codeOrName)) {
    return getTrackName(codeOrName) || codeOrName
  }
  return String(codeOrName)
}

function fmtPlacement(p) {
  if (p === null || p === undefined || p === '') return '—'
  const s = String(p)
  // Common non-finish codes (d = disqualified, g = gallop, etc.) are passed through
  return s
}

function compactComment(c) {
  if (!c) return ''
  // Trim and condense whitespace
  return String(c).trim().replace(/\s+/g, ' ')
}

/**
 * Build unified past performance lines for a horse.
 * @param {string|number} horseId
 * @param {Array<Object>} recentResultsCore - Array of past race entries
 * @returns {string[]} lines ready for Start List rendering
 */
export function buildUnifiedPastDisplay(horseId, recentResultsCore) {
  const arr = Array.isArray(recentResultsCore) ? recentResultsCore : []
  const lines = []
  for (const r of arr) {
    // Flexible field detection
    const date = r.date || r.startTime || r.raceDate || r.timestamp
    const track = r.trackName || r.track || r.trackCode
    const place = r.placement || r.place || r.pos
    const comment = r.comment || r.note || r.remark
    const time = r.time || r.resultTime || r.kmTime
    const distance = r.distance || r.dist

    const parts = []
    parts.push(fmtDate(date))
    parts.push(fmtTrack(track))
    parts.push(`Plats: ${fmtPlacement(place)}`)
    if (time) parts.push(`Tid: ${time}`)
    if (distance) parts.push(`${distance} m`)
    const head = parts.filter(Boolean).join(' • ')

    const tail = compactComment(comment)
    lines.push(tail ? `${head} — ${tail}` : head)
  }
  return lines
}

export default function usePastDisplay() {
  return { buildUnifiedPastDisplay }
}
