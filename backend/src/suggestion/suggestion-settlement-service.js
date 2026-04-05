import Horse from '../horse/horse-model.js'

const RESULT_TIERS = [8, 7, 6]

const toNumber = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const buildMissSummary = (missedLegs = []) => {
  if (!Array.isArray(missedLegs) || !missedLegs.length) {
    return 'Alla lopp satt'
  }
  if (missedLegs.length === 1) {
    return `Sprack i avd ${missedLegs[0]}`
  }
  const start = missedLegs.slice(0, -1).join(', ')
  return `Sprack i avd ${start} och ${missedLegs[missedLegs.length - 1]}`
}

const buildSettlementSummary = ({ missedLegs, unresolvedLegs, spikeStats, correctLegs, totalLegs }) => {
  if (Array.isArray(unresolvedLegs) && unresolvedLegs.length === totalLegs) {
    return 'Inväntar resultat'
  }
  if (Array.isArray(unresolvedLegs) && unresolvedLegs.length > 0) {
    return `Delvis avgjord, ${correctLegs}/${totalLegs} rätt hittills`
  }
  const allSpikesHit = Number(spikeStats?.total || 0) > 0 && Number(spikeStats?.misses || 0) === 0
  const missSummary = buildMissSummary(missedLegs)
  if (!missedLegs.length) {
    return `${correctLegs}/${totalLegs} rätt`
  }
  if (allSpikesHit) {
    return `Alla spikar satt, ${missSummary.toLowerCase()}`
  }
  return missSummary
}

export async function loadRaceWinnerMap(raceIds = []) {
  const ids = [...new Set((raceIds || []).map((raceId) => Number(raceId)).filter((raceId) => Number.isFinite(raceId)))]
  if (!ids.length) {
    return new Map()
  }

  const horses = await Horse.find(
    {
      'results.raceInformation.raceId': { $in: ids },
      'results.placement.sortValue': 1
    },
    {
      id: 1,
      name: 1,
      results: 1
    }
  ).lean()

  const winners = new Map()

  for (const horse of horses) {
    for (const result of horse.results || []) {
      const raceId = Number(result?.raceInformation?.raceId)
      const placement = Number(result?.placement?.sortValue ?? result?.placement)
      if (!Number.isFinite(raceId) || placement !== 1 || winners.has(raceId)) {
        continue
      }

      winners.set(raceId, {
        raceId,
        horseId: Number(horse.id),
        horseName: horse.name || '',
        placement,
        raceDayId: Number(result?.raceInformation?.raceDayId) || null,
        raceNumber: Number(result?.raceInformation?.raceNumber) || null,
        placementDisplay: result?.placement?.displayValue || '1',
        startPosition: Number(result?.startPosition?.sortValue) || null,
        withdrawn: Boolean(result?.withdrawn)
      })
    }
  }

  return winners
}

export function buildSettlementFromTicket(ticket = {}, winnerMap = new Map()) {
  const legs = Array.isArray(ticket?.legs) ? ticket.legs : []
  const legResults = []
  const hitLegs = []
  const missedLegs = []
  const unresolvedLegs = []
  let spikeTotal = 0
  let spikeHits = 0
  let spikeMisses = 0
  let topRankTotal = 0
  let topRankWins = 0

  for (const leg of legs) {
    const legNumber = Number(leg?.leg)
    const raceId = Number(leg?.raceId)
    const winner = Number.isFinite(raceId) ? winnerMap.get(raceId) || null : null
    const selections = Array.isArray(leg?.selections) ? leg.selections : []
    const selectedIds = selections
      .map((selection) => toNumber(selection?.id, null))
      .filter((id) => Number.isFinite(id))

    const aiSelections = Array.isArray(leg?.aiSelections) ? leg.aiSelections : []
    const aiTop = aiSelections.length ? toNumber(aiSelections[0]?.id, null) : null
    const isResolved = Boolean(winner?.horseId)
    const isHit = isResolved && selectedIds.includes(Number(winner.horseId))
    const isSpike = Number(leg?.count || 0) === 1
    const winningSelection = isHit
      ? selections.find((selection) => Number(selection?.id) === Number(winner?.horseId)) || null
      : null

    if (isResolved) {
      if (isHit) {
        hitLegs.push(legNumber)
      } else {
        missedLegs.push(legNumber)
      }
    } else {
      unresolvedLegs.push(legNumber)
    }

    if (isSpike) {
      spikeTotal += 1
      if (isResolved && isHit) spikeHits += 1
      if (isResolved && !isHit) spikeMisses += 1
    }

    if (Number.isFinite(aiTop)) {
      topRankTotal += 1
      if (isResolved && Number(winner?.horseId) === aiTop) {
        topRankWins += 1
      }
    }

    legResults.push({
      leg: legNumber,
      raceId: Number.isFinite(raceId) ? raceId : null,
      raceNumber: Number(leg?.raceNumber) || null,
      isResolved,
      isHit,
      isSpike,
      winner: winner
        ? {
            horseId: Number(winner.horseId),
            horseName: winner.horseName,
            placementDisplay: winner.placementDisplay,
            startPosition: winner.startPosition,
            raceDayId: winner.raceDayId,
            raceNumber: winner.raceNumber
          }
        : null,
      selectedWinner: winningSelection
        ? {
            id: toNumber(winningSelection?.id, null),
            name: winningSelection?.name || '',
            programNumber: toNumber(winningSelection?.programNumber, null)
          }
        : null,
      selectedIds,
      selectedNames: selections.map((selection) => selection?.name || '').filter(Boolean),
      topRankedHorseId: aiTop
    })
  }

  const correctLegs = hitLegs.length
  const totalLegs = legs.length
  const completedLegs = hitLegs.length + missedLegs.length
  const fullySettled = totalLegs > 0 && completedLegs === totalLegs
  const tiers = {
    right8: fullySettled && totalLegs === 8 && correctLegs === 8 ? 1 : 0,
    right7: fullySettled && totalLegs === 8 && correctLegs === 7 ? 1 : 0,
    right6: fullySettled && totalLegs === 8 && correctLegs === 6 ? 1 : 0
  }

  const spikeStats = {
    total: spikeTotal,
    hits: spikeHits,
    misses: spikeMisses,
    hitRate: spikeTotal > 0 && spikeHits + spikeMisses > 0
      ? Number((spikeHits / spikeTotal).toFixed(4))
      : null
  }

  const topRankStats = {
    total: topRankTotal,
    wins: topRankWins,
    hitRate: topRankTotal > 0
      ? Number((topRankWins / topRankTotal).toFixed(4))
      : null
  }

  return {
    status: fullySettled ? 'settled' : (completedLegs > 0 ? 'partial_results' : 'pending_results'),
    settledAt: completedLegs > 0 ? new Date() : null,
    resultsAvailable: completedLegs > 0,
    totalLegs,
    completedLegs,
    correctLegs,
    hitLegs,
    missedLegs,
    unresolvedLegs,
    legs: legResults,
    tiers,
    spikeStats,
    topRankStats,
    summary: buildSettlementSummary({ missedLegs, unresolvedLegs, spikeStats, correctLegs, totalLegs }),
    applicableResultTiers: totalLegs === 8 ? RESULT_TIERS : []
  }
}

export default {
  loadRaceWinnerMap,
  buildSettlementFromTicket
}
