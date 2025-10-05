const FORM_HALF_LIFE_DAYS = Number(process.env.HORSE_FORM_HALF_LIFE_DAYS || 90)
const FORM_WINDOW_DAYS = Number(process.env.HORSE_FORM_WINDOW_DAYS || 150)
const FORM_SAMPLE_TARGET = Number(process.env.HORSE_FORM_SAMPLE_TARGET || 4)
const FORM_SHRINK_K = Number(process.env.HORSE_FORM_SHRINK_K || 3)
const FORM_MOMENTUM_MULTIPLIER = Number(process.env.HORSE_FORM_MOMENTUM_MULTIPLIER || 22)
const FORM_MOMENTUM_CAP = Number(process.env.HORSE_FORM_MOMENTUM_CAP || 55)
const FORM_RESIDUAL_WEIGHT = Number(process.env.HORSE_FORM_RESIDUAL_WEIGHT || 0.65)
const FORM_INACTIVITY_START = Number(process.env.HORSE_FORM_INACTIVITY_START || 45)
const FORM_INACTIVITY_SPAN = Number(process.env.HORSE_FORM_INACTIVITY_SPAN || 120)
const FORM_INACTIVITY_CAP = Number(process.env.HORSE_FORM_INACTIVITY_CAP || 65)
const FORM_DELTA_CAP = Number(process.env.HORSE_FORM_DELTA_CAP || 100)
const FORM_DRIVER_WEIGHT = Number(process.env.HORSE_FORM_DRIVER_WEIGHT || 0.18)
const FORM_DRIVER_BASELINE = Number(process.env.HORSE_FORM_DRIVER_BASELINE || 1000)
const FORM_DRIVER_SHRINK_K = Number(process.env.HORSE_FORM_DRIVER_SHRINK_K || 8)
const FORM_MODEL_VERSION = process.env.HORSE_FORM_MODEL_VERSION || 'deltaForm-v1'

const WIN_WEIGHT_CLASS = Number(process.env.HORSE_WIN_WEIGHT_CLASS || 1)
const WIN_WEIGHT_FORM = Number(process.env.HORSE_WIN_WEIGHT_FORM || 0.35)
const WIN_WEIGHT_GAP = Number(process.env.HORSE_WIN_WEIGHT_GAP || -0.05)
const WIN_LOGISTIC_CENTER = Number(process.env.HORSE_WIN_LOGISTIC_CENTER || 1000)
const WIN_LOGISTIC_SCALE = Number(process.env.HORSE_WIN_LOGISTIC_SCALE || 26)
const WIN_PROB_MIN = Number(process.env.HORSE_WIN_PROB_MIN || 0.02)
const WIN_PROB_MAX = Number(process.env.HORSE_WIN_PROB_MAX || 0.98)
const GAP_FALLBACK_DAYS = Number(process.env.HORSE_WIN_GAP_FALLBACK_DAYS || 75)

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return Number.isFinite(min) ? min : 0
  if (Number.isFinite(min) && value < min) return min
  if (Number.isFinite(max) && value > max) return max
  return value
}

const safeNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback

const differenceInDays = (from, to) => {
  const start = toDate(from)
  const end = toDate(to)
  if (!start || !end) return NaN
  const diffMs = end.getTime() - start.getTime()
  return diffMs / (1000 * 60 * 60 * 24)
}

const isResultPending = (resultDate, now = new Date()) => {
  if (!resultDate) return false
  const parsed = new Date(resultDate)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() > now.getTime() + 12 * 60 * 60 * 1000
}

const placementMomentumValue = (placement) => {
  const plc = Number(placement)
  if (!Number.isFinite(plc)) return 0
  if (plc === 1) return 3
  if (plc === 2) return 2.4
  if (plc === 3) return 1.6
  if (plc === 4) return 0.8
  if (plc === 5) return 0
  if (plc === 6) return -0.8
  if (plc === 7) return -1.4
  if (plc === 8) return -1.8
  return -2.2
}

const getDistanceBucket = (distance) => {
  const meters = Number(distance?.sortValue ?? distance?.value ?? distance)
  if (!Number.isFinite(meters) || meters <= 0) return 'unknown'
  if (meters < 1900) return 'short'
  if (meters <= 2200) return 'medium'
  if (meters <= 2700) return 'long'
  return 'extreme'
}

const getSeason = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'unknown'
  const month = date.getUTCMonth()
  if (month === 11 || month <= 1) return 'winter'
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  return 'autumn'
}

const toDate = (value) => {
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const computeMomentumDelta = (results = [], now = new Date()) => {
  if (!Array.isArray(results) || !results.length) {
    return { delta: 0, weightSum: 0 }
  }

  let weighted = 0
  let weightSum = 0
  for (const res of results) {
    const placement = res?.placement?.sortValue ?? res?.placement?.numericalValue ?? res?.placement
    const dateRaw = res?.raceInformation?.date ?? res?.date
    const raceDate = toDate(dateRaw)
    if (!Number.isFinite(placement) || !raceDate || isResultPending(raceDate, now)) {
      continue
    }
    const diffDays = differenceInDays(raceDate, now)
    if (!Number.isFinite(diffDays) || diffDays < 0 || diffDays > FORM_WINDOW_DAYS) {
      continue
    }
    const base = placementMomentumValue(placement)
    const weight = Math.exp(-diffDays / FORM_HALF_LIFE_DAYS)
    weighted += base * weight
    weightSum += weight
  }

  if (weightSum <= 0) {
    return { delta: 0, weightSum: 0 }
  }

  const normalized = weighted / weightSum
  const rawDelta = normalized * FORM_MOMENTUM_MULTIPLIER
  const capped = clamp(rawDelta, -FORM_MOMENTUM_CAP, FORM_MOMENTUM_CAP)
  return { delta: capped, weightSum }
}

const computeResidualComponent = ({
  baseRating,
  rawFormRating,
  effectiveSample,
  recencyWeight
}) => {
  const safeBase = safeNumber(baseRating, safeNumber(rawFormRating, 1000))
  const safeForm = safeNumber(rawFormRating, safeBase)
  const residual = safeForm - safeBase
  if (!Number.isFinite(residual)) return { residual: 0, weighted: 0 }

  const sampleWeight = clamp(effectiveSample / FORM_SAMPLE_TARGET, 0, 1)
  const residualWeight = clamp(sampleWeight * recencyWeight * FORM_RESIDUAL_WEIGHT, 0, FORM_RESIDUAL_WEIGHT)
  return {
    residual,
    weighted: residual * residualWeight,
    weight: residualWeight
  }
}

const computeInactivityPenalty = ({
  lastRaceDate,
  formRaceCount
}, now = new Date()) => {
  if (!lastRaceDate) {
    if (formRaceCount === 0) {
      return { penalty: FORM_INACTIVITY_CAP * 0.4, daysSinceLast: null }
    }
    return { penalty: FORM_INACTIVITY_CAP * 0.25, daysSinceLast: null }
  }

  const diffDays = differenceInDays(lastRaceDate, now)
  if (!Number.isFinite(diffDays) || diffDays < 0) {
    return { penalty: 0, daysSinceLast: diffDays }
  }

  if (diffDays <= FORM_INACTIVITY_START) {
    return { penalty: 0, daysSinceLast: diffDays }
  }

  const extraDays = diffDays - FORM_INACTIVITY_START
  const ratio = clamp(extraDays / FORM_INACTIVITY_SPAN, 0, 1)
  const cap = FORM_INACTIVITY_CAP * (formRaceCount > 0 ? 1 : 0.7)
  const penalty = ratio * cap
  return { penalty, daysSinceLast: diffDays }
}

const deriveContexts = (results = [], now = new Date()) => {
  if (!Array.isArray(results)) return []
  const contexts = []
  for (const res of results) {
    const rawDate = res?.raceInformation?.date ?? res?.date
    const raceDate = toDate(rawDate)
    if (!raceDate || isResultPending(raceDate, now)) continue
    const diffDays = differenceInDays(raceDate, now)
    if (!Number.isFinite(diffDays) || diffDays < 0 || diffDays > FORM_WINDOW_DAYS) continue

    contexts.push({
      startMethod: res?.startMethod || 'unknown',
      distanceBucket: getDistanceBucket(res?.distance),
      season: getSeason(raceDate),
      track: res?.trackCode || 'unknown',
      weight: Math.exp(-diffDays / FORM_HALF_LIFE_DAYS)
    })
  }
  return contexts
}

const computeDriverBoost = ({ driverElo, formRaceCount }) => {
  if (!Number.isFinite(driverElo) || driverElo <= 0) {
    return { boost: 0, weight: 0 }
  }
  const delta = driverElo - FORM_DRIVER_BASELINE
  const shrink = formRaceCount / (formRaceCount + FORM_DRIVER_SHRINK_K)
  const boost = delta * FORM_DRIVER_WEIGHT * shrink
  return { boost, weight: shrink }
}

const logistic = (value, center, scale) => {
  if (!Number.isFinite(value)) return 0.5
  const shifted = (value - center) / scale
  const expVal = Math.exp(-shifted)
  return 1 / (1 + expVal)
}

export const computeHorseFormMetrics = ({
  baseRating,
  rawFormRating,
  formRaceCount = 0,
  results = [],
  driverElo = null,
  now = new Date()
}) => {
  const safeBase = safeNumber(baseRating, safeNumber(rawFormRating, 1000))
  const safeForm = safeNumber(rawFormRating, safeBase)

  const relevantResults = Array.isArray(results)
    ? results.filter(res => {
        const dateRaw = res?.raceInformation?.date ?? res?.date
        const raceDate = toDate(dateRaw)
        if (!raceDate || isResultPending(raceDate, now)) return false
        const diffDays = differenceInDays(raceDate, now)
        return Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= FORM_WINDOW_DAYS
      })
    : []

  const effectiveSample = relevantResults.length || formRaceCount || 0
  const lastRace = relevantResults
    .map(res => toDate(res?.raceInformation?.date ?? res?.date))
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || null

  const recencyWeight = (() => {
    if (!lastRace) return 0
    const diffDays = differenceInDays(lastRace, now)
    if (!Number.isFinite(diffDays) || diffDays < 0) return 0
    return Math.exp(-diffDays / FORM_HALF_LIFE_DAYS)
  })()

  const { delta: momentumDelta, weightSum: momentumWeightSum } = computeMomentumDelta(relevantResults, now)
  const residualInfo = computeResidualComponent({
    baseRating: safeBase,
    rawFormRating: safeForm,
    effectiveSample,
    recencyWeight: recencyWeight || 0.1
  })

  const shrinkFactor = effectiveSample / (effectiveSample + FORM_SHRINK_K)

  const { penalty: inactivityPenalty, daysSinceLast } = computeInactivityPenalty({
    lastRaceDate: lastRace,
    formRaceCount: effectiveSample
  }, now)

  const { boost: driverBoost, weight: driverWeight } = computeDriverBoost({
    driverElo,
    formRaceCount: effectiveSample
  })

  const rawDelta = (momentumDelta + residualInfo.weighted + driverBoost) * shrinkFactor - inactivityPenalty
  const deltaForm = clamp(rawDelta, -FORM_DELTA_CAP, FORM_DELTA_CAP)

  const formRating = Math.round(safeBase + deltaForm)
  const gapMetric = Number.isFinite(daysSinceLast) ? daysSinceLast : GAP_FALLBACK_DAYS
  const winScore =
    WIN_WEIGHT_CLASS * safeBase +
    WIN_WEIGHT_FORM * deltaForm +
    WIN_WEIGHT_GAP * gapMetric

  const pWinRaw = logistic(winScore, WIN_LOGISTIC_CENTER, WIN_LOGISTIC_SCALE)
  const pWin = clamp(pWinRaw, WIN_PROB_MIN, WIN_PROB_MAX)

  const contexts = deriveContexts(relevantResults, now)

  return {
    formRating,
    deltaForm: Number(deltaForm.toFixed(2)),
    winScore: Number(winScore.toFixed(2)),
    pWin: Number(pWin.toFixed(4)),
    gapMetric: Number(gapMetric.toFixed(2)),
    modelVersion: FORM_MODEL_VERSION,
    components: {
      baseRating: safeBase,
      rawFormRating: safeForm,
      momentumDelta,
      momentumWeightSum,
      residualRaw: residualInfo.residual,
      residualWeighted: Number(residualInfo.weighted.toFixed(2)),
      residualWeight: Number(residualInfo.weight.toFixed(2)),
      driverBoost: Number(driverBoost.toFixed(2)),
      driverWeight: Number(driverWeight.toFixed(2)),
      inactivityPenalty: Number(inactivityPenalty.toFixed(2)),
      shrinkFactor: Number(shrinkFactor.toFixed(2)),
      recencyWeight: Number(recencyWeight.toFixed(2)),
      effectiveSample,
      daysSinceLast: daysSinceLast == null ? null : Number(daysSinceLast.toFixed(1)),
      contexts
    }
  }
}
