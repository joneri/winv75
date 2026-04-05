import {
  CAREER_ELO_WEIGHT,
  DRIVER_SUPPORT_WEIGHT,
  ELO_ENGINE_VERSION,
  DEFAULT_ELO,
  FORM_ELO_WEIGHT,
  FORM_RECENCY_HALF_LIFE_DAYS,
  RESULT_WINDOW_DAYS,
  clamp,
  differenceInDays,
  getDistanceBucket,
  getRecencyWeight,
  getResultSignal,
  isPendingResult,
  classifyShoeChange,
  normalizeStartMethod,
  normalizeShoeState,
  normalizeTrack,
  resolvePlacementDisplay,
  safeNumber,
  toDate
} from './elo-policy.js'

export const ELO_PREDICTION_VERSION = ELO_ENGINE_VERSION

const CAREER_WEIGHT = CAREER_ELO_WEIGHT
const FORM_WEIGHT = FORM_ELO_WEIGHT
const DRIVER_BASELINE = Number(process.env.ELO_DRIVER_BASELINE || DEFAULT_ELO)
const DRIVER_SHRINK_K = Number(process.env.ELO_DRIVER_SHRINK_K || 8)
const DRIVER_SUPPORT_CAP = Number(process.env.ELO_DRIVER_SUPPORT_CAP || 42)

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
const TRACK_AFFINITY_WEIGHT = Number(process.env.ELO_TRACK_AFFINITY_WEIGHT || 28)
const TRACK_AFFINITY_MIN_SAMPLE = Number(process.env.ELO_TRACK_AFFINITY_MIN_SAMPLE || 3)
const TRACK_AFFINITY_SHRINK_K = Number(process.env.ELO_TRACK_AFFINITY_SHRINK_K || 4)
const TRACK_AFFINITY_CAP = Number(process.env.ELO_TRACK_AFFINITY_CAP || 24)
const SHOE_SIGNAL_WEIGHT = Number(process.env.ELO_SHOE_SIGNAL_WEIGHT || 22)
const SHOE_SIGNAL_MIN_SAMPLE = Number(process.env.ELO_SHOE_SIGNAL_MIN_SAMPLE || 3)
const SHOE_SIGNAL_CHANGE_MIN_SAMPLE = Number(process.env.ELO_SHOE_SIGNAL_CHANGE_MIN_SAMPLE || 3)
const SHOE_SIGNAL_SHRINK_K = Number(process.env.ELO_SHOE_SIGNAL_SHRINK_K || 5)
const SHOE_SIGNAL_CAP = Number(process.env.ELO_SHOE_SIGNAL_CAP || 18)

const FIELD_SOFTMAX_SCALE = Number(process.env.ELO_FIELD_SOFTMAX_SCALE || 45)

const buildRaceContext = (raceContext = {}, fallbackDate = new Date()) => ({
  raceDate: toDate(raceContext?.raceDate ?? raceContext?.startDateTime ?? fallbackDate) || new Date(),
  startMethod: normalizeStartMethod(raceContext?.startMethod ?? raceContext?.raceType?.text),
  distanceBucket: getDistanceBucket(raceContext?.distance),
  track: normalizeTrack(raceContext?.trackCode ?? raceContext?.trackName)
})

const computeWeightedOutcome = (results = []) => {
  const weightSum = results.reduce((sum, result) => sum + result.recencyWeight, 0)
  if (weightSum <= 0) {
    return {
      weightSum: 0,
      outcome: 0
    }
  }

  return {
    weightSum: Number(weightSum.toFixed(4)),
    outcome: Number((
      results.reduce((sum, result) => sum + result.outcomeScore * result.recencyWeight, 0) / weightSum
    ).toFixed(4))
  }
}

const buildInactiveContextFeature = (extra = {}) => ({
  rawMeasurement: 0,
  sampleSize: 0,
  confidence: 0,
  deltaElo: 0,
  reason: 'inactive',
  ...extra
})

const listRelevantResults = (results = [], targetRaceDate = new Date()) => {
  if (!Array.isArray(results)) return []

  return results
    .map((result) => {
      const raceDate = toDate(result?.raceInformation?.date ?? result?.date)
      if (!raceDate || isPendingResult(raceDate, targetRaceDate)) return null

      const ageDays = differenceInDays(raceDate, targetRaceDate)
      if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > RESULT_WINDOW_DAYS) return null

      const signal = getResultSignal(result, {
        referenceDate: targetRaceDate,
        fieldSize: safeNumber(result?.fieldSize, 8)
      })
      const placement = signal.placement
      const code = signal.code
      const outcomeScore = signal.outcomeScore
      if (!Number.isFinite(outcomeScore)) return null

      const recencyWeight = getRecencyWeight(raceDate, {
        referenceDate: targetRaceDate,
        halfLifeDays: FORM_RECENCY_HALF_LIFE_DAYS
      })

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
        track: normalizeTrack(result?.trackCode),
        shoeState: normalizeShoeState(result?.equipmentOptions?.shoeOptions?.code)
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.raceDate.getTime() - a.raceDate.getTime())
    .map((result, index, rows) => {
      const previousResult = rows[index + 1] || null
      const shoeChange = classifyShoeChange(
        result?.shoeState?.rawCode ?? null,
        previousResult?.shoeState?.rawCode ?? null
      )

      return {
        ...result,
        shoeChange
      }
    })
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

const computeTrackAffinity = ({
  relevantResults,
  raceContext,
  baselineOutcome
}) => {
  if (raceContext.track === 'unknown') {
    return buildInactiveContextFeature({
      track: 'unknown',
      baselineOutcome: Number(baselineOutcome.toFixed(4)),
      trackOutcome: null,
      weightSum: 0,
      minSample: TRACK_AFFINITY_MIN_SAMPLE,
      cappedBy: TRACK_AFFINITY_CAP,
      reason: 'missing_track_context'
    })
  }

  const matched = relevantResults.filter((result) => result.track === raceContext.track)
  if (matched.length < TRACK_AFFINITY_MIN_SAMPLE) {
    return buildInactiveContextFeature({
      track: raceContext.track,
      sampleSize: matched.length,
      baselineOutcome: Number(baselineOutcome.toFixed(4)),
      trackOutcome: null,
      weightSum: Number(matched.reduce((sum, result) => sum + result.recencyWeight, 0).toFixed(4)),
      minSample: TRACK_AFFINITY_MIN_SAMPLE,
      cappedBy: TRACK_AFFINITY_CAP,
      reason: 'insufficient_sample'
    })
  }

  const weightedTrack = computeWeightedOutcome(matched)
  const rawMeasurement = Number((weightedTrack.outcome - baselineOutcome).toFixed(4))
  const confidence = Number(clamp(
    matched.length / (matched.length + TRACK_AFFINITY_SHRINK_K),
    0,
    1
  ).toFixed(4))
  const deltaElo = Number(clamp(
    rawMeasurement * TRACK_AFFINITY_WEIGHT * confidence,
    -TRACK_AFFINITY_CAP,
    TRACK_AFFINITY_CAP
  ).toFixed(2))

  return {
    track: raceContext.track,
    sampleSize: matched.length,
    rawMeasurement,
    confidence,
    deltaElo,
    baselineOutcome: Number(baselineOutcome.toFixed(4)),
    trackOutcome: weightedTrack.outcome,
    weightSum: weightedTrack.weightSum,
    minSample: TRACK_AFFINITY_MIN_SAMPLE,
    cappedBy: TRACK_AFFINITY_CAP,
    reason: 'active'
  }
}

const computeShoeSignal = ({
  relevantResults,
  horse,
  baselineOutcome
}) => {
  const currentShoe = normalizeShoeState(horse?.shoeOption?.code)
  const previousShoe = normalizeShoeState(horse?.previousShoeOption?.code)
  const currentChange = classifyShoeChange(currentShoe.rawCode, previousShoe.rawCode)

  const basePayload = {
    rawCurrentShoeCode: currentShoe.rawCode,
    rawPreviousShoeCode: previousShoe.rawCode,
    normalizedCurrentShoeState: currentShoe.state,
    normalizedPreviousShoeState: previousShoe.state,
    currentShoeReliability: currentShoe.reliability,
    previousShoeReliability: previousShoe.reliability,
    normalizedChangeClassification: currentChange.classification,
    normalizedChangeDirection: currentChange.direction,
    normalizedChangeKey: currentChange.changeKey,
    baselineOutcome: Number(baselineOutcome.toFixed(4)),
    stateSampleSize: 0,
    changeSampleSize: 0,
    matchMode: 'inactive',
    matchedOutcome: null,
    weightSum: 0,
    minSample: SHOE_SIGNAL_MIN_SAMPLE,
    changeMinSample: SHOE_SIGNAL_CHANGE_MIN_SAMPLE,
    cappedBy: SHOE_SIGNAL_CAP
  }

  if (!currentShoe.trusted) {
    return buildInactiveContextFeature({
      ...basePayload,
      reason: 'unknown_current_shoe'
    })
  }

  const stateMatches = relevantResults.filter(
    (result) => result?.shoeState?.trusted && result.shoeState.state === currentShoe.state
  )

  const changeMatches = currentChange.reliable && currentChange.changed
    ? relevantResults.filter(
      (result) => result?.shoeChange?.reliable && result.shoeChange.changeKey === currentChange.changeKey
    )
    : []

  let matchMode = 'inactive'
  let matched = []

  if (currentChange.reliable && currentChange.changed && changeMatches.length >= SHOE_SIGNAL_CHANGE_MIN_SAMPLE) {
    matchMode = 'change'
    matched = changeMatches
  } else if (stateMatches.length >= SHOE_SIGNAL_MIN_SAMPLE) {
    matchMode = 'state'
    matched = stateMatches
  } else {
    return buildInactiveContextFeature({
      ...basePayload,
      stateSampleSize: stateMatches.length,
      changeSampleSize: changeMatches.length,
      reason: currentChange.reliable && currentChange.changed
        ? 'insufficient_change_and_state_sample'
        : 'insufficient_state_sample'
    })
  }

  const weightedMatch = computeWeightedOutcome(matched)
  const rawMeasurement = Number((weightedMatch.outcome - baselineOutcome).toFixed(4))
  const confidence = Number(clamp(
    matched.length / (matched.length + SHOE_SIGNAL_SHRINK_K),
    0,
    1
  ).toFixed(4))
  const deltaElo = Number(clamp(
    rawMeasurement * SHOE_SIGNAL_WEIGHT * confidence,
    -SHOE_SIGNAL_CAP,
    SHOE_SIGNAL_CAP
  ).toFixed(2))

  return {
    ...basePayload,
    sampleSize: matched.length,
    stateSampleSize: stateMatches.length,
    changeSampleSize: changeMatches.length,
    matchMode,
    matchedOutcome: weightedMatch.outcome,
    weightSum: weightedMatch.weightSum,
    rawMeasurement,
    confidence,
    deltaElo,
    reason: 'active'
  }
}

const buildLaneBiasPlaceholder = () => buildInactiveContextFeature({
  laneKey: null,
  reason: 'not_implemented_yet'
})

const computeContextAdjustments = ({
  relevantResults,
  raceContext,
  trackAffinity,
  shoeSignal,
  laneBias
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

  const total = Number((
    startMethod.adjustment +
    distance.adjustment +
    trackAffinity.deltaElo +
    shoeSignal.deltaElo +
    laneBias.deltaElo
  ).toFixed(2))

  return {
    total,
    startMethod,
    distance,
    trackAffinity,
    shoeSignal,
    laneBias
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

  const trackAffinity = computeTrackAffinity({
    relevantResults,
    raceContext: targetContext,
    baselineOutcome: form.weightedOutcome
  })

  const shoeSignal = computeShoeSignal({
    relevantResults,
    horse,
    baselineOutcome: form.weightedOutcome
  })

  const laneBias = buildLaneBiasPlaceholder()

  const contextAdjustments = computeContextAdjustments({
    relevantResults,
    raceContext: targetContext,
    trackAffinity,
    shoeSignal,
    laneBias
  })

  const driverSupport = computeDriverSupport({
    driverElo: driver?.elo,
    driverCareerElo: driver?.careerElo,
    sampleSize: relevantResults.length
  })

  const weightedBase = (careerElo * CAREER_WEIGHT) + (form.formElo * FORM_WEIGHT)
  const effectiveElo = Math.round(weightedBase + driverSupport.supportDelta + contextAdjustments.total)
  const effectiveEloBreakdown = {
    careerComponent: Number((careerElo * CAREER_WEIGHT).toFixed(2)),
    formComponent: Number((form.formElo * FORM_WEIGHT).toFixed(2)),
    weightedBase: Number(weightedBase.toFixed(2)),
    driverDelta: driverSupport.supportDelta,
    startMethodDelta: contextAdjustments.startMethod.adjustment,
    distanceDelta: contextAdjustments.distance.adjustment,
    trackAffinityDelta: trackAffinity.deltaElo,
    shoeSignalDelta: shoeSignal.deltaElo,
    laneBiasDelta: laneBias.deltaElo,
    contextTotal: contextAdjustments.total,
    effectiveElo
  }

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
      driver: DRIVER_SUPPORT_WEIGHT,
      trackAffinity: TRACK_AFFINITY_WEIGHT,
      shoeSignal: SHOE_SIGNAL_WEIGHT
    },
    recencyProfiles: {
      career: 'persisted-long-horizon',
      form: {
        lookbackDays: RESULT_WINDOW_DAYS,
        halfLifeDays: FORM_RECENCY_HALF_LIFE_DAYS
      }
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
      effectiveEloBreakdown,
      effectiveElo,
      version: ELO_PREDICTION_VERSION,
      recencyProfiles: {
        career: 'persisted-long-horizon',
        form: {
          lookbackDays: RESULT_WINDOW_DAYS,
          halfLifeDays: FORM_RECENCY_HALF_LIFE_DAYS
        }
      },
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
        track: result.track,
        shoeState: result?.shoeState?.state ?? 'unknown',
        shoeReliability: result?.shoeState?.reliability ?? 'unknown',
        shoeChangeClassification: result?.shoeChange?.classification ?? 'unknown',
        shoeChangeDirection: result?.shoeChange?.direction ?? 'unknown'
      })),
      weights: {
        career: CAREER_WEIGHT,
        form: FORM_WEIGHT,
        driver: DRIVER_SUPPORT_WEIGHT,
        trackAffinity: TRACK_AFFINITY_WEIGHT,
        shoeSignal: SHOE_SIGNAL_WEIGHT
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
