export const DEFAULT_ELO = Number(process.env.DEFAULT_ELO_RATING || 1000)
export const ELO_ENGINE_VERSION = process.env.ELO_VERSION || 'winv75-elo-v4'

export const CAREER_ELO_WEIGHT = Number(process.env.ELO_EFFECTIVE_CAREER_WEIGHT || 0.38)
export const FORM_ELO_WEIGHT = Number(process.env.ELO_EFFECTIVE_FORM_WEIGHT || 0.62)
export const DRIVER_SUPPORT_WEIGHT = Number(process.env.ELO_EFFECTIVE_DRIVER_WEIGHT || 0.1)

export const CAREER_RATING_HALF_LIFE_DAYS = Number(process.env.ELO_CAREER_RATING_HALF_LIFE_DAYS || 540)
export const FORM_RATING_HALF_LIFE_DAYS = Number(process.env.ELO_FORM_RATING_HALF_LIFE_DAYS || 75)
export const DRIVER_CAREER_HALF_LIFE_DAYS = Number(process.env.DRIVER_ELO_HALF_LIFE_DAYS || 300)
export const DRIVER_FORM_HALF_LIFE_DAYS = Number(process.env.DRIVER_FORM_HALF_LIFE_DAYS || 60)

export const CAREER_RECENCY_HALF_LIFE_DAYS = Number(process.env.ELO_CAREER_RECENCY_HALF_LIFE_DAYS || 240)
export const FORM_RECENCY_HALF_LIFE_DAYS = Number(process.env.ELO_FORM_RECENCY_HALF_LIFE_DAYS || 45)
export const RESULT_WINDOW_DAYS = Number(process.env.ELO_RESULT_WINDOW_DAYS || 220)

const SHOE_STATE_BY_CODE = Object.freeze({
  '1': 'barefoot_all',
  '2': 'barefoot_back',
  '3': 'barefoot_front',
  '4': 'all_shoes'
})

const SHOE_RELIABILITY_BY_CODE = Object.freeze({
  '1': 'known',
  '2': 'known',
  '3': 'known',
  '4': 'known',
  '9': 'unreliable',
  '0': 'unknown'
})

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return Number.isFinite(min) ? min : 0
  if (Number.isFinite(min) && value < min) return min
  if (Number.isFinite(max) && value > max) return max
  return value
}

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const differenceInDays = (from, to) => {
  const start = toDate(from)
  const end = toDate(to)
  if (!start || !end) return NaN
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
}

const resolvePlacement = (result = {}) => {
  const candidates = [
    result?.placement,
    result?.placement?.sortValue,
    result?.placement?.numericalValue,
    result?.placement?.value,
    result?.placementValue,
    result?.finishPosition,
    result?.result?.placement?.sortValue,
    result?.result?.placement?.numericalValue,
    result?.result?.placement?.value,
    result?.result?.placement
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 99) {
      return parsed
    }
  }

  return null
}

const resolvePlacementDisplay = (result = {}) =>
  String(
    result?.placement?.displayValue ??
    result?.placement?.display ??
    result?.result?.placement?.displayValue ??
    result?.result?.placement?.display ??
    ''
  ).trim()

const isPendingResult = (resultDate, referenceDate = new Date()) => {
  const date = toDate(resultDate)
  const reference = toDate(referenceDate)
  if (!date || !reference) return false
  return date.getTime() > reference.getTime() + 12 * 60 * 60 * 1000
}

const resolveResultCode = (result = {}, referenceDate = new Date()) => {
  if (result?.withdrawn === true) return 'withdrawn'

  const raceDate = toDate(result?.raceInformation?.date ?? result?.date)
  if (isPendingResult(raceDate, referenceDate)) return 'pending'

  const display = resolvePlacementDisplay(result).toLowerCase()
  if (['g', 'gal', 'galopp'].includes(display)) return 'gallop'
  if (['d', 'disk', 'diskad', 'dq', 'dist'].includes(display)) return 'disqualified'
  if (['s', 'str', 'struken'].includes(display)) return 'withdrawn'

  const placement = resolvePlacement(result)
  if (placement != null) return 'placed'
  return 'invalid'
}

const placementFieldScore = (placement, fieldSize = 8) => {
  const plc = Number(placement)
  if (!Number.isFinite(plc) || plc <= 0) return null

  const baseScores = [1, 0.76, 0.58, 0.44, 0.31, 0.21, 0.13, 0.08]
  if (plc <= baseScores.length) {
    return baseScores[plc - 1]
  }

  const normalizedField = Math.max(Number(fieldSize) || 8, plc)
  const fallback = 1 - ((plc - 1) / Math.max(1, normalizedField - 1))
  return Number(clamp(fallback * 0.34, 0.02, 0.12).toFixed(4))
}

const outcomeScoreFromPlacement = (placement, fieldSize = 8) => {
  const fieldScore = placementFieldScore(placement, fieldSize)
  if (!Number.isFinite(fieldScore)) return null
  return Number(((fieldScore - 0.5) * 2).toFixed(4))
}

const getResultSignal = (result = {}, { referenceDate = new Date(), fieldSize = 8 } = {}) => {
  const placement = resolvePlacement(result)
  const code = resolveResultCode(result, referenceDate)

  if (code === 'withdrawn' || code === 'pending' || code === 'invalid') {
    return {
      placement,
      code,
      fieldScore: null,
      outcomeScore: null
    }
  }

  const placedFieldScore = placementFieldScore(placement, fieldSize)

  if (code === 'gallop') {
    const fieldScore = placedFieldScore != null
      ? Math.min(placedFieldScore, 0.18)
      : 0.1
    return {
      placement,
      code,
      fieldScore: Number(fieldScore.toFixed(4)),
      outcomeScore: Number((((fieldScore) - 0.5) * 2).toFixed(4))
    }
  }

  if (code === 'disqualified') {
    const fieldScore = 0.03
    return {
      placement,
      code,
      fieldScore,
      outcomeScore: Number((((fieldScore) - 0.5) * 2).toFixed(4))
    }
  }

  return {
    placement,
    code,
    fieldScore: placedFieldScore,
    outcomeScore: outcomeScoreFromPlacement(placement, fieldSize)
  }
}

const getRecencyWeight = (
  date,
  {
    referenceDate = new Date(),
    halfLifeDays = CAREER_RECENCY_HALF_LIFE_DAYS
  } = {}
) => {
  const ageDays = differenceInDays(date, referenceDate)
  if (!Number.isFinite(ageDays)) return 1
  if (ageDays <= 0) return 1
  return Math.exp(-ageDays / Math.max(1, halfLifeDays))
}

const normalizeStartMethod = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return 'unknown'
  if (raw.includes('volt')) return 'volt'
  if (raw.includes('auto')) return 'auto'
  return raw
}

const getDistanceBucket = (distance) => {
  const meters = safeNumber(distance?.sortValue ?? distance?.value ?? distance, NaN)
  if (!Number.isFinite(meters) || meters <= 0) return 'unknown'
  if (meters < 1900) return 'short'
  if (meters <= 2200) return 'medium'
  return 'long'
}

const normalizeTrack = (value) => {
  const raw = String(value || '').trim().toUpperCase()
  return raw || 'unknown'
}

const normalizeRawShoeCode = (value) => {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  return raw || null
}

const normalizeShoeState = (value) => {
  const rawCode = normalizeRawShoeCode(value)
  const reliability = rawCode == null
    ? 'unknown'
    : (SHOE_RELIABILITY_BY_CODE[rawCode] || 'unreliable')
  const state = rawCode != null && SHOE_STATE_BY_CODE[rawCode]
    ? SHOE_STATE_BY_CODE[rawCode]
    : 'unknown'

  return {
    rawCode,
    state,
    reliability,
    trusted: reliability === 'known'
  }
}

const SHOE_LIGHTNESS_BY_STATE = Object.freeze({
  unknown: null,
  all_shoes: 0,
  barefoot_front: 1,
  barefoot_back: 1,
  barefoot_all: 2
})

const classifyShoeChange = (currentValue, previousValue) => {
  const current = normalizeShoeState(currentValue)
  const previous = normalizeShoeState(previousValue)

  if (!current.trusted) {
    return {
      current,
      previous,
      changed: false,
      reliable: false,
      classification: 'unknown',
      direction: 'unknown',
      changeKey: null,
      reason: 'unknown_current_shoe'
    }
  }

  if (!previous.trusted) {
    return {
      current,
      previous,
      changed: false,
      reliable: false,
      classification: 'unknown',
      direction: 'unknown',
      changeKey: null,
      reason: 'unknown_previous_shoe'
    }
  }

  if (current.state === previous.state) {
    return {
      current,
      previous,
      changed: false,
      reliable: true,
      classification: 'unchanged',
      direction: 'flat',
      changeKey: `${previous.state}->${current.state}`,
      reason: 'unchanged'
    }
  }

  const currentLightness = SHOE_LIGHTNESS_BY_STATE[current.state]
  const previousLightness = SHOE_LIGHTNESS_BY_STATE[previous.state]
  const direction = currentLightness > previousLightness
    ? 'lighter'
    : (currentLightness < previousLightness ? 'heavier' : 'mixed')

  return {
    current,
    previous,
    changed: true,
    reliable: true,
    classification: 'changed',
    direction,
    changeKey: `${previous.state}->${current.state}`,
    reason: 'changed'
  }
}

export {
  clamp,
  safeNumber,
  toDate,
  differenceInDays,
  isPendingResult,
  resolvePlacement,
  resolvePlacementDisplay,
  resolveResultCode,
  getResultSignal,
  getRecencyWeight,
  normalizeStartMethod,
  getDistanceBucket,
  normalizeTrack,
  normalizeRawShoeCode,
  normalizeShoeState,
  classifyShoeChange,
  outcomeScoreFromPlacement
}
