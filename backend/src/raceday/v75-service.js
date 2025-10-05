import axios from 'axios'
import raceDayService from './raceday-service.js'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const ROW_COST = 0.5
const DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.V75_DEFAULT_MAX_BUDGET))
  ? Number(process.env.V75_DEFAULT_MAX_BUDGET)
  : Infinity
const ENV_MAX_SELECTIONS = Number(process.env.V75_MAX_SELECTIONS_PER_LEG)
const MAX_SELECTIONS_PER_LEG = Number.isFinite(ENV_MAX_SELECTIONS) && ENV_MAX_SELECTIONS > 0
  ? ENV_MAX_SELECTIONS
  : 8
const SCORE_EPSILON = 1e-6
const DEFAULT_SUGGESTION_MODES = ['balanced', 'public', 'value']
const V75_PWIN_WEIGHT = Number.isFinite(Number(process.env.V75_PWIN_WEIGHT))
  ? Number(process.env.V75_PWIN_WEIGHT)
  : 24

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
  const composite = toNumber(horse.compositeScore ?? horse.rating ?? 0, 0)
  const pWin = Number(horse.winProbability)
  if (Number.isFinite(pWin) && pWin > 0) {
    return composite + V75_PWIN_WEIGHT * pWin
  }
  return composite
}

const buildSuggestionContext = async (racedayId, context = null) => {
  const ctx = context || {}

  if (!ctx.aiData) {
    ctx.aiData = await raceDayService.getRacedayAiList(racedayId)
  }

  if (!ctx.aiData) {
    return null
  }

  if (!ctx.v75InfoResolved) {
    const racedayDoc = await Raceday.findById(racedayId, { v75Info: 1 }).lean()
    ctx.v75Info = racedayDoc?.v75Info || null
    ctx.v75InfoResolved = true
  }

  if (!ctx.v75Prepared) {
    const map = new Map()
    const infoLegs = ctx.v75Info?.legs || []
    for (const leg of infoLegs) {
      const raceNumber = Number(leg?.raceNumber)
      if (!Number.isFinite(raceNumber)) continue
      const selections = (leg.selections || []).map(sel => ({
        ...sel,
        horseId: Number(sel?.horseId),
        percent: sel?.percent != null
          ? toNumber(sel.percent, null)
          : (sel?.betDistribution != null ? toNumber(sel.betDistribution, null) / 100 : null)
      }))
      const legMap = new Map(selections.map(sel => [sel.horseId, sel]))
      map.set(raceNumber, { leg, map: legMap, selections })
    }
    ctx.v75ByRaceNumber = map
    ctx.v75Available = map.size > 0
    ctx.v75Prepared = true
  }

  return ctx
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

const pickHorses = (legData, count, distributionMap = new Map(), weightOverrides = {}) => {
  const ranking = Array.isArray(legData?.ranking) ? legData.ranking : []
  if (!ranking.length && !distributionMap.size) return []

  const rankingMap = new Map(ranking.map(h => [h.id, h]))
  const allIds = new Set([...rankingMap.keys(), ...distributionMap.keys()])

  const maxComposite = ranking.reduce((max, h) => Math.max(max, toScore(h)), 0)
  const maxDistribution = [...distributionMap.values()].reduce((max, d) => {
    const val = d?.percent != null ? toNumber(d.percent, 0) : (d?.betDistribution != null ? toNumber(d.betDistribution, 0) / 100 : 0)
    return val > max ? val : max
  }, 0)

  const percentRanks = new Map()
  if (distributionMap.size) {
    const rankedByPublic = [...distributionMap.entries()]
      .map(([horseId, info]) => {
        const percent = info?.percent != null
          ? toNumber(info.percent, null)
          : (info?.betDistribution != null ? toNumber(info.betDistribution, null) / 100 : null)
        return { horseId: Number(horseId), percent }
      })
      .filter(entry => entry.percent != null)
      .sort((a, b) => b.percent - a.percent)

    rankedByPublic.forEach((entry, index) => {
      percentRanks.set(entry.horseId, index + 1)
    })
  }

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
      composite: weightOverrides.composite ?? 0.5,
      rank: weightOverrides.rank ?? 0.25,
      distribution: distPercent != null ? (weightOverrides.distribution ?? 0.25) : 0
    }
    const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0) || 1
    const score = totalWeight > 0
      ? ((compNorm * weights.composite) + (rankNorm * weights.rank) + (distNorm * weights.distribution)) / totalWeight
      : 0

    const publicRank = percentRanks.get(Number(id)) ?? null
    const isPublicFavorite = distPercent != null && maxDistribution > 0
      ? Math.abs(distPercent - maxDistribution) < 1e-4
      : false

    return {
      id,
      score,
      base,
      dist: distInfo,
      composite,
      rank,
      distPercent,
      publicRank,
      isPublicFavorite
    }
  })

  entries.sort((a, b) => b.score - a.score)

  const limit = Math.max(1, count)
  return entries.slice(0, limit).map(({ base, dist, composite, id, publicRank, isPublicFavorite }) => ({
    id,
    programNumber: base?.programNumber ?? dist?.programNumber ?? null,
    name: base?.name ?? dist?.horseName ?? '',
    tier: base?.tier || null,
    rating: Math.round(toNumber(base?.rating, 0)),
    compositeScore: toNumber(base?.compositeScore ?? composite, null),
    plusPoints: Array.isArray(base?.plusPoints) ? base.plusPoints : [],
    formScore: toNumber(base?.formScore, null),
    v75Percent: dist?.percent ?? (dist?.betDistribution != null ? dist.betDistribution / 100 : null),
    v75Trend: dist?.trend ?? null,
    publicRank,
    isPublicFavorite: Boolean(isPublicFavorite)
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


export const buildV75Suggestion = async (racedayId, options = {}, sharedContext = null) => {
  const {
    templateKey,
    stake,
    maxCost,
    maxBudget,
    mode = 'balanced'
  } = options || {}

  try {
    const template = templateMap.get(templateKey) || V75_TEMPLATES[0]
    const modeKey = typeof mode === 'string' ? mode : 'balanced'
    const budgetInput = [maxCost, maxBudget, stake].map(v => toNumber(v, NaN)).find(val => Number.isFinite(val))
    const budgetLimit = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : DEFAULT_MAX_BUDGET
    const stakePerRow = ROW_COST

    const context = await buildSuggestionContext(racedayId, sharedContext || null)
    if (!context) {
      return { error: 'Raceday not found' }
    }

    const {
      aiData,
      v75ByRaceNumber = new Map(),
      v75Available = false,
      v75Info = null
    } = context

    const modeConfigs = {
      balanced: {
        label: 'Balanserad',
        spikScoreWeight: 1,
        publicScoreWeight: 1,
        pickWeights: { composite: 0.5, rank: 0.25, distribution: 0.25 }
      },
      public: {
        label: 'Publikfavorit',
        spikScoreWeight: 1.25,
        publicScoreWeight: 2.0,
        pickWeights: { composite: 0.4, rank: 0.2, distribution: 0.4 }
      },
      value: {
        label: 'Värdejakt',
        spikScoreWeight: 1,
        publicScoreWeight: -0.6,
        pickWeights: { composite: 0.6, rank: 0.3, distribution: 0.15 }
      }
    }

    const modeCfg = modeConfigs[modeKey] || modeConfigs.balanced

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

    const legScore = (leg) => (
      (leg.metrics?.spikScore ?? 0) * (modeCfg.spikScoreWeight ?? 1) +
      (leg.metrics?.publicSpikScore ?? 0) * (modeCfg.publicScoreWeight ?? 1)
    )

    const order = template.assignment === 'worstToBest'
      ? [...legs].sort((a, b) => legScore(a) - legScore(b))
      : [...legs].sort((a, b) => legScore(b) - legScore(a))

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
    const baseRows = product(baseLegs)
    const maxRows = budgetLimit === Infinity ? Infinity : Math.floor(budgetLimit / stakePerRow)

    const reduceCounts = () => {
      const copy = baseLegs.map(l => ({ ...l }))
      if (maxRows === Infinity) return { legs: copy, rows: product(copy) }
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

      const rows = product(copy)
      if (rows > maxRows) {
        throw new Error(`Kupongen kan inte anpassas till max ${budgetLimit} kr (minst ${rows} rader krävs).`)
      }
      return { legs: copy, rows }
    }

    const reduced = reduceCounts()
    const adjustedLegs = reduced.legs
    let rows = reduced.rows

    if (maxRows !== Infinity) {
      const sizeByLeg = new Map(baseLegs.map(leg => {
        const rankingSize = Array.isArray(leg.ranking) ? leg.ranking.length : 0
        const distributionSize = leg.distribution ? leg.distribution.size : 0
        const poolSize = Math.max(rankingSize, distributionSize)
        return [leg.leg, poolSize]
      }))

      let iterations = 0
      const maxIterations = 128
      while (rows < maxRows - SCORE_EPSILON && iterations < maxIterations) {
        let best = null
        for (const leg of adjustedLegs) {
          const maxPoolSize = sizeByLeg.get(leg.leg) || leg.count
          const cap = Math.max(leg.count, Math.min(MAX_SELECTIONS_PER_LEG, maxPoolSize))
          if (leg.count >= cap) continue
          const newCount = leg.count + 1
          const newRows = rows / Math.max(1, leg.count) * Math.max(1, newCount)
          if (newRows > maxRows + SCORE_EPSILON) continue

          const metrics = leg.metrics || {}
          const favouriteStrength = Number.isFinite(metrics.publicTop) ? metrics.publicTop : 0
          const depthScore = Number(metrics.depthScore || 0)
          const publicDepth = Number(metrics.publicDepthScore || 0)
          const guardScore = Math.max(0, 1 - favouriteStrength)
          let expandScore = depthScore * 0.6 + publicDepth * 0.35 + guardScore * 0.45
          if (leg.count <= 1) expandScore += 0.2
          const diff = maxRows - newRows

          if (
            !best ||
            expandScore > best.expandScore + SCORE_EPSILON ||
            (Math.abs(expandScore - best.expandScore) <= SCORE_EPSILON && diff < best.diff)
          ) {
            best = { leg, newCount, newRows, expandScore, diff }
          }
        }

        if (!best) break
        best.leg.count = best.newCount
        rows = best.newRows
        iterations += 1
      }
    }

    const pickWeights = modeCfg.pickWeights || {}

    const detailedLegs = adjustedLegs.map(leg => {
      const selections = pickHorses(leg, leg.count, leg.distribution, pickWeights)
      const type = classifyLegType(leg.count)
      const poolSize = Math.max(
        Array.isArray(leg.ranking) ? leg.ranking.length : 0,
        leg.distribution ? leg.distribution.size : 0
      )
      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        distance: leg.distance,
        startTime: leg.startTime,
        count: leg.count,
        type,
        poolSize,
        selections,
        v75Distribution: Array.from((leg.distribution || new Map()).values())
      }
    })

    const totalCost = rows * stakePerRow

    if (Number.isFinite(budgetLimit) && totalCost > budgetLimit + 1e-6) {
      throw new Error(`Kupongen kostar ${totalCost.toFixed(2)} kr vilket överstiger max ${budgetLimit.toFixed(2)} kr.`)
    }

    const spikes = detailedLegs
      .filter(leg => leg.count === 1)
      .map(leg => ({
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        selections: leg.selections,
        publicTop: baseLegs.find(b => b.leg === leg.leg)?.metrics?.publicTop ?? null
      }))

    const spikeCandidates = legs.map(leg => {
      const distribution = Array.from((leg.distribution || new Map()).values())
        .sort((a, b) => (
          Number(b.percent ?? (b.betDistribution ?? 0) / 100) -
          Number(a.percent ?? (a.betDistribution ?? 0) / 100)
        ))
        .slice(0, 3)
        .map(sel => ({
          horseId: sel.horseId,
          horseName: sel.horseName,
          programNumber: sel.programNumber,
          percent: sel.percent ?? (sel.betDistribution != null ? sel.betDistribution / 100 : null)
        }))

      const aiTop = (leg.ranking || []).slice(0, 3).map(horse => ({
        id: horse.id,
        name: horse.name,
        programNumber: horse.programNumber,
        rank: horse.rank,
        compositeScore: toNumber(horse.compositeScore ?? horse.rating ?? 0)
      }))

      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        selections: distribution,
        aiSelections: aiTop
      }
    })

    const budgetSummary = Number.isFinite(budgetLimit)
      ? {
          maxCost: budgetLimit,
          rowCost: stakePerRow,
          rows,
          maxRows: maxRows === Infinity ? null : maxRows,
          remaining: Number(Math.max(0, budgetLimit - totalCost).toFixed(2))
        }
      : {
          maxCost: null,
          rowCost: stakePerRow,
          rows,
          maxRows: null,
          remaining: null
        }

    return {
      template: { key: template.key, label: template.label },
      mode: modeKey,
      modeLabel: modeCfg.label,
      stakePerRow,
      rows,
      totalCost,
      maxBudget: Number.isFinite(budgetLimit) ? budgetLimit : null,
      budget: budgetSummary,
      generatedAt: new Date().toISOString(),
      v75: {
        used: v75Available,
        updatedAt: v75Info?.updatedAt ? new Date(v75Info.updatedAt).toISOString() : null,
        gameId: v75Info?.gameId || null
      },
      legs: detailedLegs,
      spikes,
      spikeCandidates,
      metadata: {
        templateCounts: [...template.counts],
        baseRows
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    throw err
  }
}

export const buildV75Suggestions = async (racedayId, options = {}) => {
  const { modes, ...rest } = options || {}
  const modeCandidates = Array.isArray(modes) && modes.length ? modes : DEFAULT_SUGGESTION_MODES
  const uniqueModes = []
  const seen = new Set()
  for (const rawMode of modeCandidates) {
    const modeKey = typeof rawMode === 'string' ? rawMode : ''
    if (!modeKey || seen.has(modeKey)) continue
    seen.add(modeKey)
    uniqueModes.push(modeKey)
  }

  const context = await buildSuggestionContext(racedayId, null)
  if (!context) {
    return { error: 'Raceday not found' }
  }

  const suggestions = []
  const errors = []
  for (const mode of uniqueModes) {
    const result = await buildV75Suggestion(racedayId, { ...rest, mode }, context)
    if (result?.error) {
      errors.push({ mode, error: result.error })
      continue
    }
    suggestions.push(result)
  }

  if (!suggestions.length) {
    return { error: errors.length ? errors[0]?.error : 'Det gick inte att skapa V75-spelförslag' }
  }

  return {
    suggestions,
    errors,
    suggestion: suggestions[0] || null,
    generatedAt: new Date().toISOString()
  }
}
export default {
  V75_TEMPLATES,
  listV75Templates,
  updateV75DistributionForRaceday,
  buildV75Suggestion,
  buildV75Suggestions
}
