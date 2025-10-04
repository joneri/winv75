import axios from 'axios'
import raceDayService from './raceday-service.js'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const ROW_COST = 0.5
const DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.V75_DEFAULT_MAX_BUDGET)) ? Number(process.env.V75_DEFAULT_MAX_BUDGET) : Infinity

export const V75_TEMPLATES = [
  {
    key: 'two-spikes-one-lock',
    label: '2 spikar ett lås',
    counts: [1, 1, 2, 3, 3, 3, 3],
    assignment: 'bestToWorst'
  },
  {
    key: 'one-spike',
    label: '1 spik',
    counts: [1, 2, 3, 3, 3, 4, 4],
    assignment: 'bestToWorst'
  },
  {
    key: 'tv-system',
    label: 'TV-system',
    counts: [1, 2, 3, 3, 4, 4, 5],
    assignment: 'bestToWorst'
  },
  {
    key: 'inverse-t',
    label: 'Omvänt T-system',
    counts: [1, 2, 3, 3, 4, 4, 5],
    assignment: 'worstToBest'
  },
  {
    key: 'no-spikes',
    label: 'Inga spikar',
    counts: [3, 3, 4, 4, 4, 5, 5],
    assignment: 'worstToBest'
  }
]

const templateMap = new Map(V75_TEMPLATES.map(t => [t.key, t]))

export const listV75Templates = () => V75_TEMPLATES.map(t => ({ key: t.key, label: t.label, counts: t.counts }))

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toScore = (horse) => {
  if (!horse) return 0
  return toNumber(horse.compositeScore ?? horse.rating ?? 0, 0)
}

const extractRaceNumber = (raceKey) => {
  if (!raceKey || typeof raceKey !== 'string') return null
  const parts = raceKey.split('_')
  const last = parts[parts.length - 1]
  const num = Number(last)
  return Number.isFinite(num) ? num : null
}

const ensureGameDataForRaceday = async (raceday) => {
  if (!raceday.atgCalendarGamesRaw || Object.keys(raceday.atgCalendarGamesRaw || {}).length === 0) {
    await gameService.getGameTypesForRaceday(raceday._id)
    const refreshed = await Raceday.findById(raceday._id, { atgCalendarGamesRaw: 1, gameTypes: 1 })
    if (refreshed) {
      raceday.atgCalendarGamesRaw = refreshed.atgCalendarGamesRaw
      raceday.gameTypes = refreshed.gameTypes
    }
  }
}

const fetchGameDetails = async (gameId) => {
  const url = `${ATG_BASE_URL}/games/${gameId}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data
}

export const updateV75DistributionForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    throw new Error('Raceday not found')
  }

  await ensureGameDataForRaceday(raceday)

  const v75Entries = raceday.atgCalendarGamesRaw?.V75 || []
  if (!Array.isArray(v75Entries) || v75Entries.length === 0) {
    throw new Error('Ingen V75-omgång hittades för denna tävlingsdag')
  }

  const raceNumberMap = new Map((raceday.raceList || []).map(r => [Number(r.raceNumber), r]))

  let selectedEntry = null
  let selectedGameData = null
  let bestMatchCount = -1

  for (const entry of v75Entries) {
    try {
      const gameData = await fetchGameDetails(entry.id)
      const matchCount = (gameData.races || []).reduce((acc, race) => {
        const num = Number(race?.number)
        return raceNumberMap.has(num) ? acc + 1 : acc
      }, 0)
      if (matchCount > bestMatchCount) {
        selectedEntry = entry
        selectedGameData = gameData
        bestMatchCount = matchCount
      }
    } catch (err) {
      // continue trying other entries
    }
  }

  if (!selectedEntry || !selectedGameData) {
    throw new Error('Misslyckades med att hämta V75-data från ATG')
  }

  // reset previous values
  for (const race of raceday.raceList || []) {
    for (const horse of race.horses || []) {
      horse.v75Percent = null
      horse.v75Trend = null
    }
  }

  const legs = []
  const updatedAt = new Date()

  ;(selectedGameData.races || []).forEach((raceData, index) => {
    const raceNumber = Number(raceData?.number)
    const raceDoc = raceNumberMap.get(raceNumber)
    if (!raceDoc) return

    const horseMap = new Map((raceDoc.horses || []).map(h => [Number(h.id), h]))
    const selections = []

    for (const start of raceData.starts || []) {
      const horseId = Number(start?.horse?.id)
      if (!Number.isFinite(horseId)) continue
      const poolInfo = start?.pools?.V75
      if (!poolInfo || poolInfo.betDistribution == null) continue
      const betDistribution = toNumber(poolInfo.betDistribution, null)
      if (!Number.isFinite(betDistribution)) continue
      const percent = betDistribution / 100
      const trend = poolInfo.trend != null ? Number(poolInfo.trend) : null
      const programNumber = toNumber(start?.number, null)
      const horseName = start?.horse?.name || ''

      const horseDoc = horseMap.get(horseId)
      if (horseDoc) {
        horseDoc.v75Percent = percent
        horseDoc.v75Trend = trend
      }

      selections.push({
        horseId,
        horseName,
        programNumber,
        betDistribution,
        percent,
        trend
      })
    }

    legs.push({
      leg: index + 1,
      raceNumber,
      raceId: raceDoc?.raceId ?? null,
      selections
    })
  })

  raceday.v75Info = {
    updatedAt,
    gameId: selectedEntry.id,
    source: 'ATG',
    legs
  }

  raceday.markModified('raceList')
  raceday.markModified('v75Info')
  await raceday.save()

  const info = raceday.v75Info?.toObject ? raceday.v75Info.toObject() : raceday.v75Info
  return info
}

const classifyLegType = (count) => {
  if (count <= 1) return 'spik'
  if (count === 2) return 'lås'
  if (count >= 5) return 'bred gardering'
  return 'gardering'
}

const pickHorses = (legData, count, distributionMap = new Map()) => {
  const ranking = Array.isArray(legData?.ranking) ? legData.ranking : []
  if (!ranking.length && !distributionMap.size) return []

  const rankingMap = new Map(ranking.map(h => [h.id, h]))
  const allIds = new Set([...rankingMap.keys(), ...distributionMap.keys()])

  const maxComposite = ranking.reduce((max, h) => Math.max(max, toScore(h)), 0)
  const maxDistribution = [...distributionMap.values()].reduce((max, d) => {
    const val = d?.percent != null ? toNumber(d.percent, 0) : (d?.betDistribution != null ? toNumber(d.betDistribution, 0) / 100 : 0)
    return val > max ? val : max
  }, 0)

  const entries = [...allIds].map(id => {
    const base = rankingMap.get(id)
    const distInfo = distributionMap.get(id)
    const composite = toScore(base)
    const rank = toNumber(base?.rank, 0)
    const distPercent = distInfo?.percent != null
      ? toNumber(distInfo.percent, null)
      : (distInfo?.betDistribution != null ? toNumber(distInfo.betDistribution, null) / 100 : null)

    const compNorm = maxComposite > 0 ? composite / maxComposite : 0
    const rankNorm = rank > 0 ? 1 / rank : 0
    const distNorm = distPercent != null
      ? (maxDistribution > 0 ? distPercent / maxDistribution : distPercent / 100)
      : 0

    const weights = {
      composite: 0.5,
      rank: 0.25,
      distribution: distPercent != null ? 0.25 : 0
    }
    const totalWeight = weights.composite + weights.rank + weights.distribution
    const score = totalWeight > 0
      ? ((compNorm * weights.composite) + (rankNorm * weights.rank) + (distNorm * weights.distribution)) / totalWeight
      : 0

    return {
      id,
      score,
      base,
      dist: distInfo,
      composite,
      rank,
      distPercent
    }
  })

  entries.sort((a, b) => b.score - a.score)

  const limit = Math.max(1, count)
  return entries.slice(0, limit).map(({ base, dist, composite, id }) => ({
    id,
    programNumber: base?.programNumber ?? dist?.programNumber ?? null,
    name: base?.name ?? dist?.horseName ?? '',
    tier: base?.tier || null,
    rating: Math.round(toNumber(base?.rating, 0)),
    compositeScore: toNumber(base?.compositeScore ?? composite, null),
    plusPoints: Array.isArray(base?.plusPoints) ? base.plusPoints : [],
    formScore: toNumber(base?.formScore, null),
    v75Percent: dist?.percent ?? (dist?.betDistribution != null ? dist.betDistribution / 100 : null),
    v75Trend: dist?.trend ?? null
  }))
}

const computeLegMetrics = (leg, distributionMap = new Map()) => {
  const ranking = Array.isArray(leg.ranking) ? leg.ranking : []
  const sorted = [...ranking].sort((a, b) => toNumber(a.rank, Number.MAX_SAFE_INTEGER) - toNumber(b.rank, Number.MAX_SAFE_INTEGER))
  const top1 = sorted[0]
  const top2 = sorted[1]
  const top3 = sorted[2]
  const top4 = sorted[3]
  const s1 = toScore(top1)
  const s2 = toScore(top2)
  const s3 = toScore(top3)
  const s4 = toScore(top4)
  const distValues = [...distributionMap.values()].map(sel => sel.percent ?? (sel.betDistribution != null ? sel.betDistribution / 100 : null)).filter(v => v != null).sort((a, b) => b - a)
  const d1 = distValues[0] ?? 0
  const d2 = distValues[1] ?? 0
  const d3 = distValues[2] ?? 0
  return {
    spikScore: (s1 || 0) - (s2 || 0),
    lockScore: (s2 || 0) - (s3 || 0),
    depthScore: (s3 || 0) - (s4 || 0),
    publicSpikScore: d1 - d2,
    publicDepthScore: d2 - d3,
    publicTop: d1
  }
}

export const buildV75Suggestion = async (racedayId, { templateKey, stake, maxCost, maxBudget } = {}) => {
  try {
    const template = templateMap.get(templateKey) || V75_TEMPLATES[0]
    const budgetInput = [maxCost, maxBudget, stake].map(v => toNumber(v, NaN)).find(Number.isFinite)
    const budgetLimit = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : DEFAULT_MAX_BUDGET
    const stakePerRow = ROW_COST

    const aiData = await raceDayService.getRacedayAiList(racedayId)
    if (!aiData) {
      return { error: 'Raceday not found' }
    }

    const racedayDoc = await Raceday.findById(racedayId, { v75Info: 1 }).lean()
    const v75Info = racedayDoc?.v75Info || null
    const v75Available = Array.isArray(v75Info?.legs) && v75Info.legs.length > 0
    const v75ByRaceNumber = new Map()

    if (v75Available) {
      for (const leg of v75Info.legs) {
        const raceNumber = Number(leg?.raceNumber)
        if (!Number.isFinite(raceNumber)) continue
        const selections = (leg.selections || []).map(sel => ({
          ...sel,
          horseId: Number(sel?.horseId),
          percent: sel?.percent != null ? toNumber(sel.percent, null) : (sel?.betDistribution != null ? toNumber(sel.betDistribution, null) / 100 : null)
        }))
        const map = new Map(selections.map(sel => [sel.horseId, sel]))
        v75ByRaceNumber.set(raceNumber, { leg, map })
      }
    }

    const legs = (aiData.races || [])
      .map(r => {
        const v75Game = (r.games || []).find(g => g.game === 'V75')
        if (!v75Game) return null
        const raceNumber = Number(r.race?.raceNumber ?? v75Game.leg)
        const distributionEntry = v75ByRaceNumber.get(raceNumber)
        const distributionMap = distributionEntry?.map || new Map()
        return {
          leg: v75Game.leg,
          raceNumber,
          ranking: r.ranking || [],
          race: r.race || null,
          topForm: r.topByElo || [],
          bestForm: r.bestForm || [],
          plusPoints: r.plusPoints || [],
          rankConfig: r.rankConfig || null,
          metrics: computeLegMetrics(r, distributionMap),
          distribution: distributionMap
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.leg - b.leg)

    if (!legs.length) {
      return { error: 'Ingen V75 hittades för denna tävlingsdag' }
    }

    if (legs.length !== template.counts.length) {
      return { error: `Mall ${template.label} förväntar ${template.counts.length} avdelningar men hittade ${legs.length}` }
    }

    const order = template.assignment === 'worstToBest'
      ? [...legs].sort((a, b) => (a.metrics.spikScore + (a.metrics.publicSpikScore ?? 0)) - (b.metrics.spikScore + (b.metrics.publicSpikScore ?? 0)))
      : [...legs].sort((a, b) => (b.metrics.spikScore + (b.metrics.publicSpikScore ?? 0)) - (a.metrics.spikScore + (a.metrics.publicSpikScore ?? 0)))

    const counts = template.assignment === 'worstToBest'
      ? [...template.counts].sort((a, b) => b - a)
      : [...template.counts].sort((a, b) => a - b)

    const allocation = new Map()
    for (let i = 0; i < order.length; i += 1) {
      const leg = order[i]
      const count = counts[i] ?? counts[counts.length - 1]
      allocation.set(leg.leg, count)
    }

    const baseLegs = legs.map(leg => {
      const count = allocation.get(leg.leg) ?? template.counts[leg.leg - 1] ?? 3
      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        distance: leg.race?.distance ?? null,
        startTime: leg.race?.startDateTime ?? null,
        metrics: leg.metrics,
        ranking: leg.ranking,
        distribution: leg.distribution,
        count
      }
    })

    const product = (items) => items.reduce((acc, item) => acc * Math.max(1, item.count), 1)

    const adjustedLegs = (() => {
      const copy = baseLegs.map(l => ({ ...l }))
      const maxRows = budgetLimit === Infinity ? Infinity : Math.floor(budgetLimit / stakePerRow)
      if (maxRows === Infinity) return copy
      if (maxRows < 1) {
        throw new Error('Angivet maxbelopp är för lågt – minst 0,5 kr krävs.')
      }

      const canReduce = () => copy.some(l => l.count > 1)
      const chooseTarget = () => copy
        .filter(l => l.count > 1)
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          const scoreA = (a.metrics?.spikScore ?? 0) + (a.metrics?.publicSpikScore ?? 0)
          const scoreB = (b.metrics?.spikScore ?? 0) + (b.metrics?.publicSpikScore ?? 0)
          return scoreA - scoreB
        })[0]

      while (product(copy) > maxRows && canReduce()) {
        const target = chooseTarget()
        if (!target) break
        target.count -= 1
      }

      if (product(copy) > maxRows) {
        throw new Error(`Kupongen kan inte anpassas till max ${budgetLimit} kr (minst ${product(copy)} rader krävs).`)
      }
      return copy
    })()

    const detailedLegs = adjustedLegs.map(leg => {
      const selections = pickHorses(leg, leg.count, leg.distribution)
      const type = classifyLegType(leg.count)
      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        distance: leg.distance,
        startTime: leg.startTime,
        count: leg.count,
        type,
        selections
      }
    })

    const rows = product(adjustedLegs)
    const totalCost = rows * stakePerRow

    if (Number.isFinite(budgetLimit) && totalCost > budgetLimit + 1e-6) {
      throw new Error(`Kupongen kostar ${totalCost.toFixed(2)} kr vilket överstiger max ${budgetLimit.toFixed(2)} kr.`)
    }

    return {
      template: { key: template.key, label: template.label },
      stakePerRow,
      rows,
      totalCost,
      maxBudget: Number.isFinite(budgetLimit) ? budgetLimit : null,
      generatedAt: new Date().toISOString(),
      v75: {
        used: v75Available,
        updatedAt: v75Info?.updatedAt ? new Date(v75Info.updatedAt).toISOString() : null,
        gameId: v75Info?.gameId || null
      },
      legs: detailedLegs
    }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    throw err
  }
}

export default {
  V75_TEMPLATES,
  listV75Templates,
  updateV75DistributionForRaceday,
  buildV75Suggestion
}
