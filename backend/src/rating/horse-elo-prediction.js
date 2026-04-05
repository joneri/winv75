const DEFAULT_ELO = Number(process.env.DEFAULT_ELO_RATING || 1000)
export const ELO_PREDICTION_VERSION = process.env.ELO_VERSION || 'winv75-elo-v1'

const CAREER_WEIGHT = Number(process.env.ELO_EFFECTIVE_CAREER_WEIGHT || 0.42)
const FORM_WEIGHT = Number(process.env.ELO_EFFECTIVE_FORM_WEIGHT || 0.58)
const DRIVER_SUPPORT_WEIGHT = Number(process.env.ELO_EFFECTIVE_DRIVER_WEIGHT || 0.12)
const DRIVER_BASELINE = Number(process.env.ELO_DRIVER_BASELINE || DEFAULT_ELO)
const DRIVER_SHRINK_K = Number(process.env.ELO_DRIVER_SHRINK_K || 8)
const DRIVER_SUPPORT_CAP = Number(process.env.ELO_DRIVER_SUPPORT_CAP || 42)

const RESULT_WINDOW_DAYS = Number(process.env.ELO_RESULT_WINDOW_DAYS || 180)
const RESULT_HALF_LIFE_DAYS = Number(process.env.ELO_RESULT_HALF_LIFE_DAYS || 60)
const RESULT_SAMPLE_TARGET = Number(process.env.ELO_RESULT_SAMPLE_TARGET || 5)
const RESULT_ANCHOR_MULTIPLIER = Number(process.env.ELO_RESULT_ANCHOR_MULTIPLIER || 92)
const RESULT_TREND_MULTIPLIER = Number(process.env.ELO_RESULT_TREND_MULTIPLIER || 18)
const FORM_ANCHOR_BLEND = Number(process.env.ELO_FORM_ANCHOR_BLEND || 0.52)
const FORM_DELTA_CAP = Number(process.env.ELO_FORM_DELTA_CAP || 140)

const INACTIVITY_START_DAYS = Number(process.env.ELO_INACTIVITY_START_DAYS || 45)
const INACTIVITY_SPAN_DAYS = Number(process.env.ELO_INACTIVITY_SPAN_DAYS || 110)
const INACTIVITY_CAP = Number(process.env.ELO_INACTIVITY_CAP || 58)

const CONTEXT_START_METHOD_WEIGHT = Number(process.env.ELO_CONTEXT_START_METHOD_WEIGHT || 18)
const CONTEXT_DISTANCE_WEIGHT = Number(process.env.ELO_CONTEXT_DISTANCE_WEIGHT || 24)
const CONTEXT_TRACK_WEIGHT = Number(process.env.ELO_CONTEXT_TRACK_WEIGHT || 10)

const FIELD_SOFTMAX_SCALE = Number(process.env.ELO_FIELD_SOFTMAX_SCALE || 45)

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

const resolvePlacement = (result = {}) => {
  const candidates = [
    result?.placement?.sortValue,
    result?.placement?.numericalValue,
    result?.placement?.value,
    result?.placement
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
  String(result?.placement?.displayValue ?? result?.placement?.display ?? '').trim()

const isPendingResult = (resultDate, now = new Date()) => {
  const date = toDate(resultDate)
  if (!date) return false
  return date.getTime() > now.getTime() + 12 * 60 * 60 * 1000
}

const resolveResultCode = (result = {}, now = new Date()) => {
  if (result?.withdrawn === true) return 'withdrawn'

  const resultDate = toDate(result?.raceInformation?.date ?? result?.date)
  if (isPendingResult(resultDate, now)) return 'pending'

  const display = resolvePlacementDisplay(result).toLowerCase()
  if (['g', 'gal', 'galopp'].includes(display)) return 'gallop'
  if (['d', 'disk', 'diskad', 'dq', 'dist'].includes(display)) return 'disqualified'
  if (['s', 'str', 'struken'].includes(display)) return 'withdrawn'

  const placement = resolvePlacement(result)
  if (placement != null) return 'placed'
  return 'invalid'
}

const outcomeScoreFromPlacement = (placement) => {
  const plc = Number(placement)
  if (!Number.isFinite(plc)) return null
  if (plc === 1) return 1.1
  if (plc === 2) return 0.76
  if (plc === 3) return 0.5
  if (plc === 4) return 0.18
  if (plc === 5) return -0.04
  if (plc === 6) return -0.18
  if (plc === 7) return -0.32
  if (plc === 8) return -0.48
  return -0.65
}

const outcomeScoreFromCode = (code, placement = null) => {
  if (code === 'withdrawn' || code === 'pending' || code === 'invalid') return null
  if (code === 'gallop') return -0.72
  if (code === 'disqualified') return -0.92
  return outcomeScoreFromPlacement(placement)
}

const buildRaceContext = (raceContext = {}, fallbackDate = new Date()) => ({
  raceDate: toDate(raceContext?.raceDate ?? raceContext?.startDateTime ?? fallbackDate) || new Date(),
  startMethod: normalizeStartMethod(raceContext?.startMethod ?? raceContext?.raceType?.text),
  distanceBucket: getDistanceBucket(raceContext?.distance),
  track: normalizeTrack(raceContext?.trackCode ?? raceContext?.trackName)
})

const listRelevantResults = (results = [], targetRaceDate = new Date()) => {
  if (!Array.isArray(results)) return []

  return results
    .map((result) => {
      const raceDate = toDate(result?.raceInformation?.date ?? result?.date)
      if (!raceDate || isPendingResult(raceDate, targetRaceDate)) return null

      const ageDays = differenceInDays(raceDate, targetRaceDate)
      if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > RESULT_WINDOW_DAYS) return null

      const placement = resolvePlacement(result)
      const code = resolveResultCode(result, targetRaceDate)
      const outcomeScore = outcomeScoreFromCode(code, placement)
      if (!Number.isFinite(outcomeScore)) return null

      const recencyWeight = Math.exp(-ageDays / RESULT_HALF_LIFE_DAYS)

      return {
        raceId: safeNumber(result?.raceInformation?.raceId ?? result?.raceId, null),
        raceDate,
        ageDays,
        placement,
        display: resolvePlacementDisplay(result) || (placement != null ? String(placement) : ''),
        code,
        outcomeScore,
        recencyWeight,
        startMethod: normalizeStartMethod(result?.startMethod),
        distanceBucket: getDistanceBucket(result?.distance),
        track: normalizeTrack(result?.trackCode)
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.raceDate.getTime() - a.raceDate.getTime())
}

const computeInactivityPenalty = (lastRaceDate, now = new Date()) => {
  if (!lastRaceDate) {
    return { penalty: INACTIVITY_CAP * 0.4, daysSinceLast: null }
  }

  const daysSinceLast = differenceInDays(lastRaceDate, now)
  if (!Number.isFinite(daysSinceLast) || daysSinceLast <= INACTIVITY_START_DAYS) {
    return { penalty: 0, daysSinceLast }
  }

  const ratio = clamp((daysSinceLast - INACTIVITY_START_DAYS) / INACTIVITY_SPAN_DAYS, 0, 1)
  return {
    penalty: ratio * INACTIVITY_CAP,
    daysSinceLast
  }
}

const computeFormDelta = ({
  careerElo,
  storedFormElo,
  relevantResults,
  targetRaceDate
}) => {
  const weightSum = relevantResults.reduce((sum, result) => sum + result.recencyWeight, 0)
  const weightedOutcome = weightSum > 0
    ? relevantResults.reduce((sum, result) => sum + result.outcomeScore * result.recencyWeight, 0) / weightSum
    : 0

  const recentSlice = relevantResults.slice(0, 3)
  const recentTrend = recentSlice.length
    ? recentSlice.reduce((sum, result) => sum + result.outcomeScore, 0) / recentSlice.length
    : 0

  const resultAnchorElo = careerElo + (weightedOutcome * RESULT_ANCHOR_MULTIPLIER) + (recentTrend * RESULT_TREND_MULTIPLIER)
  const sampleWeight = clamp(weightSum / RESULT_SAMPLE_TARGET, 0, 1)
  const anchorBlend = clamp(FORM_ANCHOR_BLEND * sampleWeight, 0, FORM_ANCHOR_BLEND)
  const anchoredForm = storedFormElo + ((resultAnchorElo - storedFormElo) * anchorBlend)

  const lastRaceDate = relevantResults[0]?.raceDate || null
  const inactivity = computeInactivityPenalty(lastRaceDate, targetRaceDate)
  const formElo = Math.round(
    clamp(anchoredForm - inactivity.penalty, careerElo - FORM_DELTA_CAP, careerElo + FORM_DELTA_CAP)
  )

  return {
    formElo,
    delta: Number((formElo - careerElo).toFixed(2)),
    weightedOutcome: Number(weightedOutcome.toFixed(4)),
    recentTrend: Number(recentTrend.toFixed(4)),
    weightSum: Number(weightSum.toFixed(4)),
    anchorBlend: Number(anchorBlend.toFixed(4)),
    inactivityPenalty: Number(inactivity.penalty.toFixed(2)),
    daysSinceLast: inactivity.daysSinceLast == null ? null : Number(inactivity.daysSinceLast.toFixed(1)),
    resultAnchorElo: Number(resultAnchorElo.toFixed(2))
  }
}

const computeContextAdjustments = ({
  relevantResults,
  raceContext
}) => {
  const makeAdjustment = (matchFn, weightCap) => {
    const matched = relevantResults.filter(matchFn)
    if (!matched.length) {
      return { adjustment: 0, matches: 0 }
    }
    const weightSum = matched.reduce((sum, result) => sum + result.recencyWeight, 0)
    if (weightSum <= 0) {
      return { adjustment: 0, matches: matched.length }
    }
    const normalizedOutcome = matched.reduce((sum, result) => sum + result.outcomeScore * result.recencyWeight, 0) / weightSum
    return {
      adjustment: Number(clamp(normalizedOutcome * weightCap, -weightCap, weightCap).toFixed(2)),
      matches: matched.length
    }
  }

  const startMethod = raceContext.startMethod !== 'unknown'
    ? makeAdjustment((result) => result.startMethod === raceContext.startMethod, CONTEXT_START_METHOD_WEIGHT)
    : { adjustment: 0, matches: 0 }

  const distance = raceContext.distanceBucket !== 'unknown'
    ? makeAdjustment((result) => result.distanceBucket === raceContext.distanceBucket, CONTEXT_DISTANCE_WEIGHT)
    : { adjustment: 0, matches: 0 }

  const track = raceContext.track !== 'unknown'
    ? makeAdjustment((result) => result.track === raceContext.track, CONTEXT_TRACK_WEIGHT)
    : { adjustment: 0, matches: 0 }

  const total = Number((startMethod.adjustment + distance.adjustment + track.adjustment).toFixed(2))

  return {
    total,
    startMethod,
    distance,
    track
  }
}

const computeDriverSupport = ({
  driverElo,
  driverCareerElo,
  sampleSize
}) => {
  const source = safeNumber(driverElo, safeNumber(driverCareerElo, NaN))
  if (!Number.isFinite(source) || source <= 0) {
    return {
      driverElo: null,
      supportDelta: 0,
      shrink: 0
    }
  }

  const shrink = clamp(sampleSize / (sampleSize + DRIVER_SHRINK_K), 0, 1)
  const supportDelta = clamp((source - DRIVER_BASELINE) * DRIVER_SUPPORT_WEIGHT * shrink, -DRIVER_SUPPORT_CAP, DRIVER_SUPPORT_CAP)

  return {
    driverElo: Math.round(source),
    supportDelta: Number(supportDelta.toFixed(2)),
    shrink: Number(shrink.toFixed(4))
  }
}

export const buildHorseEloPrediction = ({
  horse = {},
  ratingDoc = {},
  driver = {},
  raceContext = {},
  now = new Date()
}) => {
  const targetContext = buildRaceContext(raceContext, now)
  const careerElo = Math.round(safeNumber(ratingDoc?.rating ?? horse?.rating, DEFAULT_ELO))
  const storedFormElo = Math.round(safeNumber(ratingDoc?.formRating ?? ratingDoc?.rating ?? horse?.formRating, careerElo))
  const relevantResults = listRelevantResults(horse?.results || [], targetContext.raceDate)

  const form = computeFormDelta({
    careerElo,
    storedFormElo,
    relevantResults,
    targetRaceDate: targetContext.raceDate
  })

  const contextAdjustments = computeContextAdjustments({
    relevantResults,
    raceContext: targetContext
  })

  const driverSupport = computeDriverSupport({
    driverElo: driver?.elo,
    driverCareerElo: driver?.careerElo,
    sampleSize: relevantResults.length
  })

  const weightedBase = (careerElo * CAREER_WEIGHT) + (form.formElo * FORM_WEIGHT)
  const effectiveElo = Math.round(weightedBase + driverSupport.supportDelta + contextAdjustments.total)

  return {
    version: ELO_PREDICTION_VERSION,
    careerElo,
    storedFormElo,
    formElo: form.formElo,
    driverElo: driverSupport.driverElo,
    effectiveElo,
    probabilityScore: effectiveElo,
    weights: {
      career: CAREER_WEIGHT,
      form: FORM_WEIGHT,
      driver: DRIVER_SUPPORT_WEIGHT
    },
    context: {
      startMethod: targetContext.startMethod,
      distanceBucket: targetContext.distanceBucket,
      track: targetContext.track
    },
    debug: {
      careerElo,
      storedFormElo,
      formElo: form.formElo,
      formDelta: form.delta,
      weightedOutcome: form.weightedOutcome,
      recentTrend: form.recentTrend,
      weightSum: form.weightSum,
      anchorBlend: form.anchorBlend,
      resultAnchorElo: form.resultAnchorElo,
      inactivityPenalty: form.inactivityPenalty,
      daysSinceLast: form.daysSinceLast,
      driverSupport,
      contextAdjustments,
      effectiveElo,
      recentRaces: relevantResults.slice(0, 8).map((result) => ({
        raceId: result.raceId,
        raceDate: result.raceDate.toISOString(),
        ageDays: Number(result.ageDays.toFixed(1)),
        placement: result.placement,
        display: result.display,
        code: result.code,
        outcomeScore: result.outcomeScore,
        recencyWeight: Number(result.recencyWeight.toFixed(4)),
        startMethod: result.startMethod,
        distanceBucket: result.distanceBucket,
        track: result.track
      })),
      weights: {
        career: CAREER_WEIGHT,
        form: FORM_WEIGHT,
        driver: DRIVER_SUPPORT_WEIGHT
      }
    }
  }
}

export const attachFieldProbabilities = (entries = []) => {
  if (!Array.isArray(entries) || !entries.length) return []

  const maxScore = Math.max(...entries.map((entry) => safeNumber(entry?.prediction?.probabilityScore, DEFAULT_ELO)))
  const weights = entries.map((entry) => Math.exp((safeNumber(entry?.prediction?.probabilityScore, DEFAULT_ELO) - maxScore) / FIELD_SOFTMAX_SCALE))
  const total = weights.reduce((sum, value) => sum + value, 0) || 1

  return entries
    .map((entry, index) => {
      const modelProbability = Number((weights[index] / total).toFixed(4))
      return {
        ...entry,
        prediction: {
          ...entry.prediction,
          modelProbability,
          fieldRank: 0
        },
        modelProbability,
        winProbability: modelProbability
      }
    })
    .sort((left, right) => {
      const probabilityDiff = safeNumber(right.modelProbability, 0) - safeNumber(left.modelProbability, 0)
      if (Math.abs(probabilityDiff) > 1e-8) return probabilityDiff
      return safeNumber(right?.prediction?.effectiveElo, 0) - safeNumber(left?.prediction?.effectiveElo, 0)
    })
    .map((entry, index) => ({
      ...entry,
      prediction: {
        ...entry.prediction,
        fieldRank: index + 1
      }
    }))
}

export default {
  ELO_PREDICTION_VERSION,
  buildHorseEloPrediction,
  attachFieldProbabilities
}
