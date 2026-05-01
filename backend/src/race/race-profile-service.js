import { getRaceWithRatings } from './race-read-service.js'
import trackService from '../track/track-service.js'

const safeNumber = (value, fallback = null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const average = (values) => {
  const valid = values.map(value => safeNumber(value)).filter(Number.isFinite)
  if (!valid.length) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

const round = (value, decimals = 0) => {
  const numeric = safeNumber(value)
  if (!Number.isFinite(numeric)) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

const getContext = (horse) => horse?.prediction?.debug?.contextAdjustments || horse?.eloDebug?.contextAdjustments || {}
const getBreakdown = (horse) => horse?.prediction?.debug?.effectiveEloBreakdown || horse?.eloDebug?.effectiveEloBreakdown || {}

const rankHorses = (horses) => [...horses]
  .filter(horse => !horse?.horseWithdrawn)
  .sort((left, right) => safeNumber(right?.effectiveElo, 0) - safeNumber(left?.effectiveElo, 0))

const buildDistanceTiers = (race, horses) => {
  const baseDistance = safeNumber(race?.distance)
  const tiers = new Map()
  for (const horse of horses) {
    const actualDistance = safeNumber(horse?.actualDistance, baseDistance)
    if (!Number.isFinite(actualDistance)) continue
    if (!tiers.has(actualDistance)) {
      tiers.set(actualDistance, { distance: actualDistance, starters: 0, avgPointsValues: [], topHorse: null })
    }
    const tier = tiers.get(actualDistance)
    tier.starters += 1
    const points = safeNumber(horse?.points)
    if (Number.isFinite(points)) tier.avgPointsValues.push(points)
    if (!tier.topHorse || safeNumber(horse?.effectiveElo, 0) > safeNumber(tier.topHorse?.effectiveElo, 0)) {
      tier.topHorse = {
        id: horse.id,
        name: horse.name,
        classElo: safeNumber(horse.careerElo ?? horse.eloRating ?? horse.rating),
        formElo: safeNumber(horse.formElo ?? horse.formRating),
        modelElo: safeNumber(horse.effectiveElo)
      }
    }
  }

  return [...tiers.values()]
    .sort((left, right) => left.distance - right.distance)
    .map(tier => ({
      distance: tier.distance,
      handicapMeters: Number.isFinite(baseDistance) ? tier.distance - baseDistance : 0,
      starters: tier.starters,
      avgPoints: round(average(tier.avgPointsValues)),
      topHorse: tier.topHorse
    }))
}

const describeVerdict = ({ topHorse, topGap, topHandicap, lanePenaltyCount, hasHandicap }) => {
  if (!topHorse) return 'Loppet saknar tillracklig modellprofil for en spikbedomning.'
  if (topGap >= 95 && topHandicap <= 0 && lanePenaltyCount === 0) {
    return `${topHorse.name} ser ut som en stark spikkandidat: tydligt modellgap och inga storre spar- eller tillaggsvarningar.`
  }
  if (topGap >= 70 && topHandicap > 0) {
    return `${topHorse.name} ar bast i modellen, men ${topHandicap} meter tillagg gor spiken mindre sjalvklar.`
  }
  if (topGap >= 70 && lanePenaltyCount > 0) {
    return `${topHorse.name} sticker ut i modellen, men sparbilden innehaller minus som bor vagas in innan spik.`
  }
  if (topGap < 35) {
    return hasHandicap
      ? 'Modellen ser ett oppet lopp dar tillagg och distansnivaer kan vaga tyngre an ren ranking.'
      : 'Modellen ser ett oppet lopp utan tydlig spik. Gardering ligger nara till hands.'
  }
  return `${topHorse.name} ar forstahast, men gapet ar inte sa stort att loppet bor behandlas som en sjalvklar spik.`
}

const buildTrackLaneText = (trackMeta = {}) => {
  const fastestPos = safeNumber(trackMeta?.fastestStartingPosition)
  const bestPos = safeNumber(trackMeta?.favouriteStartingPosition)

  if (Number.isFinite(fastestPos) && Number.isFinite(bestPos)) {
    return `Banans snabbaste segerspar ar ${fastestPos} och basta totalspar ar ${bestPos}.`
  }
  if (Number.isFinite(bestPos)) {
    return `Banans basta totalspar ar ${bestPos}.`
  }
  if (Number.isFinite(fastestPos)) {
    return `Banans snabbaste segerspar ar ${fastestPos}.`
  }
  return 'Banprofilen saknar just nu tillrackliga data for snabbaste/basta spar.'
}

const buildNarrative = ({ race, topHorse, topGap, kpis, distanceTiers, laneBest, laneWorst, trackMeta }) => {
  const raceNumber = race?.raceNumber ? `Lopp ${race.raceNumber}` : 'Loppet'
  const startMethod = race?.raceType?.text || race?.startMethod || race?.raceType?.code || 'okand startmetod'
  const distanceText = race?.distance ? `${race.distance} meter` : 'okand distans'
  const trackLaneText = buildTrackLaneText(trackMeta)
  const handicapText = kpis.hasHandicap.value
    ? `Det finns tillagg i loppet, med ${distanceTiers.length} distansnivaer.`
    : 'Alla aktiva hastar star pa samma distans.'
  const laneText = laneBest
    ? `Sparhistoriken ger bast stod at ${laneBest.name} och mest motvind for ${laneWorst?.name || 'nagon av konkurrenterna'}.`
    : 'Sparhistoriken ar for tunn eller saknar tydlig aktiv signal.'
  const topText = topHorse
    ? `${topHorse.name} ar modellfavorit med ${topHorse.effectiveElo} i Modell Elo${Number.isFinite(topGap) ? ` och ${round(topGap)} Elo ner till nasta hast` : ''}. Modell Elo vager ihop Class Elo, Form Elo, kusk och loppets villkor.`
    : 'Ingen tydlig modellfavorit hittades.'

  return `${raceNumber} kors over ${distanceText} med ${startMethod}. ${trackLaneText} ${handicapText} ${topText} ${laneText} ${kpis.spikeVerdict.value}`
}

export async function getRaceProfile(raceId) {
  const race = await getRaceWithRatings(raceId)
  if (!race) return null

  const trackMeta = race?.trackCode
    ? await trackService.getTrackByCode(race.trackCode)
    : await trackService.getTrackByName(race?.trackName ?? null)

  const active = (race.horses || []).filter(horse => !horse?.horseWithdrawn)
  const ranked = rankHorses(active)
  const topHorse = ranked[0] || null
  const secondHorse = ranked[1] || null
  const topGap = topHorse && secondHorse
    ? safeNumber(topHorse.effectiveElo, 0) - safeNumber(secondHorse.effectiveElo, 0)
    : null
  const baseDistance = safeNumber(race.distance)
  const distanceTiers = buildDistanceTiers(race, active)
  const hasHandicap = distanceTiers.some(tier => tier.handicapMeters !== 0)
  const topActualDistance = safeNumber(topHorse?.actualDistance, baseDistance)
  const topHandicap = Number.isFinite(topActualDistance) && Number.isFinite(baseDistance) ? topActualDistance - baseDistance : 0
  const laneSignals = active
    .map(horse => ({
      id: horse.id,
      name: horse.name,
      startPosition: horse.startPosition,
      deltaElo: safeNumber(getBreakdown(horse).laneBiasDelta, 0),
      sampleSize: safeNumber(getContext(horse)?.laneBias?.exactSampleSize, 0),
      reason: getContext(horse)?.laneBias?.reason || 'unknown'
    }))
    .filter(signal => signal.reason === 'active' || signal.deltaElo !== 0)
    .sort((left, right) => right.deltaElo - left.deltaElo)
  const laneBest = laneSignals[0] || null
  const laneWorst = laneSignals.length ? laneSignals[laneSignals.length - 1] : null
  const lanePenaltyCount = laneSignals.filter(signal => signal.deltaElo < 0).length
  const handicapPenalties = active
    .map(horse => ({
      id: horse.id,
      name: horse.name,
      handicapMeters: safeNumber(horse.actualDistance, baseDistance) - baseDistance,
      deltaElo: safeNumber(getBreakdown(horse).handicapDistanceDelta, 0)
    }))
    .filter(item => item.handicapMeters > 0)
    .sort((left, right) => left.deltaElo - right.deltaElo)

  const kpis = {
    activeStarters: { key: 'activeStarters', label: 'Aktiva starter', value: active.length, unit: 'st' },
    topGap: { key: 'topGap', label: 'Modellgap', value: round(topGap), unit: 'Elo' },
    spikeConfidence: { key: 'spikeConfidence', label: 'Spiksakerhet', value: round(Math.max(0, Math.min(100, ((topGap || 0) / 110) * 100 - Math.max(0, topHandicap) * 0.35 - lanePenaltyCount * 4))), unit: '%' },
    hasHandicap: { key: 'hasHandicap', label: 'Tillagg', value: hasHandicap, unit: 'bool' },
    maxHandicap: { key: 'maxHandicap', label: 'Max tillagg', value: Math.max(0, ...distanceTiers.map(tier => tier.handicapMeters)), unit: 'm' },
    laneBiasSpread: { key: 'laneBiasSpread', label: 'Sparspridning', value: round((safeNumber(laneBest?.deltaElo, 0) - safeNumber(laneWorst?.deltaElo, 0)), 1), unit: 'Elo' },
    shoeChanges: { key: 'shoeChanges', label: 'Balansandringar', value: active.filter(horse => horse?.shoeOption?.code !== horse?.previousShoeOption?.code).length, unit: 'st' },
    driverChanges: { key: 'driverChanges', label: 'Kuskbyten', value: active.filter(horse => horse?.driverChanged).length, unit: 'st' }
  }
  kpis.spikeVerdict = {
    key: 'spikeVerdict',
    label: 'Spikomdome',
    value: describeVerdict({ topHorse, topGap: safeNumber(topGap, 0), topHandicap, lanePenaltyCount, hasHandicap }),
    unit: 'text'
  }

  return {
    raceId: Number(race.raceId),
    raceNumber: race.raceNumber,
    generatedAt: new Date().toISOString(),
    narrative: buildNarrative({ race, topHorse, topGap, kpis, distanceTiers, laneBest, laneWorst, trackMeta }),
    topHorse: topHorse ? {
      id: topHorse.id,
      name: topHorse.name,
      classElo: safeNumber(topHorse.careerElo ?? topHorse.eloRating ?? topHorse.rating),
      formElo: safeNumber(topHorse.formElo ?? topHorse.formRating),
      effectiveElo: safeNumber(topHorse.effectiveElo),
      modelElo: safeNumber(topHorse.effectiveElo),
      winProbability: safeNumber(topHorse.winProbability),
      actualDistance: safeNumber(topHorse.actualDistance, baseDistance),
      handicapMeters: topHandicap
    } : null,
    kpis: Object.values(kpis),
    distanceTiers,
    laneSignals: {
      best: laneBest,
      worst: laneWorst,
      items: laneSignals.slice(0, 6)
    },
    handicapPenalties: handicapPenalties.slice(0, 6),
    modelSignalsUsed: [
      'careerElo',
      'formElo',
      'driverElo',
      'startMethodAffinity',
      'startPositionAffinity',
      'distanceAffinity',
      'trackDistanceAffinity',
      'trackAffinity',
      'shoeSignal',
      'driverHorseAffinity',
      'laneBias',
      'handicapDistance'
    ]
  }
}

export default {
  getRaceProfile
}
