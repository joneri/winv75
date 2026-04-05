import axios from 'axios'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'
import horseService from '../horse/horse-service.js'
import {
  DEFAULT_SUGGESTION_MODES,
  MAX_VARIANTS_PER_MODE,
  buildAllocationWithStrategy,
  clamp,
  cloneSuggestionTemplates,
  createModeConfigs,
  createRng,
  createSuggestionTemplateMap,
  describeSpikeSummary,
  normalizeUserSeeds,
  resolveVariantDescriptors
} from './betting-suggestion-support.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const V5_ROW_COST = Number.isFinite(Number(process.env.V5_ROW_COST))
  ? Number(process.env.V5_ROW_COST)
  : 1
const DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.V5_DEFAULT_MAX_BUDGET))
  ? Number(process.env.V5_DEFAULT_MAX_BUDGET)
  : 960
const MAX_SELECTIONS_PER_LEG = Number.isFinite(Number(process.env.V5_MAX_SELECTIONS_PER_LEG))
  ? Math.max(1, Number(process.env.V5_MAX_SELECTIONS_PER_LEG))
  : 8
const V5_PWIN_WEIGHT = Number.isFinite(Number(process.env.V5_PWIN_WEIGHT))
  ? Number(process.env.V5_PWIN_WEIGHT)
  : 26
const DEFAULT_VARIANTS_PER_MODE = Number.isFinite(Number(process.env.V5_VARIANTS_PER_MODE))
  ? Math.min(MAX_VARIANTS_PER_MODE, Number(process.env.V5_VARIANTS_PER_MODE))
  : 3

export const V5_TEMPLATES = cloneSuggestionTemplates([
  {
    key: 'one-spike-one-lock',
    label: '1 spik 1 lås',
    counts: [1, 2, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'one-spike-wide',
    label: '1 spik bred gardering',
    counts: [1, 3, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'no-spike-balanced',
    label: 'Ingen spik',
    counts: [2, 3, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'late-chaos',
    label: 'Sista loppen brett',
    counts: [1, 2, 4, 6, 7],
    assignment: 'sequential'
  }
])

const templateMap = createSuggestionTemplateMap(V5_TEMPLATES)
const MODE_CONFIGS = createModeConfigs()

export const listV5Templates = () => V5_TEMPLATES.map(t => ({ key: t.key, label: t.label, counts: t.counts }))

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toScore = (horse) => {
  if (!horse) return 0
  const composite = toNumber(horse.compositeScore ?? horse.rating ?? 0, 0)
  const pWin = Number(horse.winProbability)
  if (Number.isFinite(pWin) && pWin > 0) {
    return composite + V5_PWIN_WEIGHT * pWin
  }
  return composite
}

const classifyLegType = (count) => {
  if (count <= 1) return 'spik'
  if (count === 2) return 'lås'
  if (count >= 5) return 'bred gardering'
  return 'gardering'
}

const fetchGameDetails = async (gameId) => {
  const url = `${ATG_BASE_URL}/games/${gameId}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data
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

const buildAiRacesForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(
    racedayId,
    { trackName: 1, raceDayDate: 1, raceList: 1, gameTypes: 1 }
  ).lean()
  if (!raceday) return null

  const gamesMap = {}
  for (const [game, ids] of Object.entries(raceday.gameTypes || {})) {
    ;(ids || []).forEach((raceId, index) => {
      if (!gamesMap[raceId]) gamesMap[raceId] = []
      gamesMap[raceId].push({ game, leg: index + 1 })
    })
  }

  const races = []
  for (const race of raceday.raceList || []) {
    const ranking = await horseService.getHorseRankings(String(race.raceId))
    races.push({
      race: {
        raceId: race.raceId,
        raceNumber: race.raceNumber,
        distance: race.distance,
        startDateTime: race.startDateTime,
        trackName: raceday.trackName
      },
      ranking,
      games: gamesMap[race.raceId] || []
    })
  }

  return {
    raceday: {
      id: raceday._id,
      trackName: raceday.trackName,
      raceDayDate: raceday.raceDayDate
    },
    races
  }
}

const buildSuggestionContext = async (racedayId, context = null) => {
  const ctx = context || {}
  if (!ctx.aiData) {
    ctx.aiData = await buildAiRacesForRaceday(racedayId)
  }
  if (!ctx.aiData) return null

  if (!ctx.v5InfoResolved) {
    const racedayDoc = await Raceday.findById(racedayId, { v5Info: 1 }).lean()
    ctx.v5Info = racedayDoc?.v5Info || null
    ctx.v5InfoResolved = true
  }

  if (!ctx.v5Prepared) {
    const map = new Map()
    const infoLegs = ctx.v5Info?.legs || []
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
      map.set(raceNumber, { leg, map: new Map(selections.map(sel => [sel.horseId, sel])), selections })
    }
    ctx.v5ByRaceNumber = map
    ctx.v5Available = map.size > 0
    ctx.v5Prepared = true
  }

  return ctx
}

export const updateV5DistributionForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    throw new Error('Raceday not found')
  }

  await ensureGameDataForRaceday(raceday)

  const entries = raceday.atgCalendarGamesRaw?.V5 || []
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error('Ingen V5-omgång hittades för denna tävlingsdag')
  }

  const raceNumberMap = new Map((raceday.raceList || []).map(r => [Number(r.raceNumber), r]))

  let selectedEntry = null
  let selectedGameData = null
  let bestMatchCount = -1

  for (const entry of entries) {
    try {
      const gameData = await fetchGameDetails(entry.id)
      const matchCount = (gameData.races || []).reduce((acc, race) => {
        const num = Number(race?.number)
        return raceNumberMap.has(num) ? acc + 1 : acc
      }, 0)
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        selectedEntry = entry
        selectedGameData = gameData
      }
    } catch {
      // try next entry
    }
  }

  if (!selectedEntry || !selectedGameData) {
    throw new Error('Misslyckades med att hämta V5-data från ATG')
  }

  for (const race of raceday.raceList || []) {
    for (const horse of race.horses || []) {
      horse.v5Percent = null
      horse.v5Trend = null
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
      const poolInfo = start?.pools?.V5
      if (!poolInfo || poolInfo.betDistribution == null) continue
      const betDistribution = toNumber(poolInfo.betDistribution, null)
      if (!Number.isFinite(betDistribution)) continue
      const percent = betDistribution / 100
      const trend = poolInfo.trend != null ? Number(poolInfo.trend) : null
      const programNumber = toNumber(start?.number, null)
      const horseName = start?.horse?.name || ''

      const horseDoc = horseMap.get(horseId)
      if (horseDoc) {
        horseDoc.v5Percent = percent
        horseDoc.v5Trend = trend
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

  raceday.v5Info = {
    updatedAt,
    gameId: selectedEntry.id,
    source: 'ATG',
    legs
  }

  raceday.markModified('raceList')
  raceday.markModified('v5Info')
  await raceday.save()

  const info = raceday.v5Info?.toObject ? raceday.v5Info.toObject() : raceday.v5Info
  return info
}

const pickHorses = (legData, count, distributionMap = new Map(), options = {}) => {
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
      .map(([horseId, info]) => ({
        horseId: Number(horseId),
        percent: info?.percent != null ? toNumber(info.percent, null) : (info?.betDistribution != null ? toNumber(info.betDistribution, null) / 100 : null)
      }))
      .filter(entry => entry.percent != null)
      .sort((a, b) => b.percent - a.percent)
    rankedByPublic.forEach((entry, index) => percentRanks.set(entry.horseId, index + 1))
  }

  const forcedOrder = Array.isArray(options.forcedIds)
    ? options.forcedIds.map(id => Number(id)).filter(id => Number.isFinite(id))
    : []
  const forcedSet = new Set(forcedOrder)
  const chaosFactor = Number(options.chaosFactor || 0)
  const rng = typeof options.rng === 'function' ? options.rng : null
  const weightOverrides = options.weights || {}

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
    const distNorm = distPercent != null ? (maxDistribution > 0 ? distPercent / maxDistribution : distPercent / 100) : 0

    const weights = {
      composite: weightOverrides.composite ?? 0.5,
      rank: weightOverrides.rank ?? 0.25,
      distribution: distPercent != null ? (weightOverrides.distribution ?? 0.25) : 0
    }
    const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0) || 1
    let score = ((compNorm * weights.composite) + (rankNorm * weights.rank) + (distNorm * weights.distribution)) / totalWeight

    if (chaosFactor > 0 && rng) {
      score = Math.max(0, score + ((rng() - 0.5) * 2 * chaosFactor))
    }

    return {
      id,
      score,
      composite,
      rank,
      base,
      distInfo,
      distPercent,
      publicRank: percentRanks.get(Number(id)) ?? null
    }
  })

  entries.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-6) return b.score - a.score
    if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank
    return b.composite - a.composite
  })

  const selected = []
  const used = new Set()

  for (const forcedId of forcedOrder) {
    const entry = entries.find(item => Number(item.id) === forcedId)
    if (!entry || used.has(entry.id)) continue
    selected.push(entry)
    used.add(entry.id)
    if (selected.length >= count) break
  }

  for (const entry of entries) {
    if (selected.length >= count) break
    if (used.has(entry.id)) continue
    selected.push(entry)
    used.add(entry.id)
  }

  return selected.map((entry, index) => {
    const base = entry.base || {}
    const dist = entry.distInfo || {}
    const isPublicFavorite = index === 0 && entry.publicRank === 1
    return {
      id: entry.id,
      programNumber: base?.programNumber ?? dist?.programNumber ?? null,
      name: base?.name ?? dist?.horseName ?? '',
      tier: base?.tier || null,
      rating: Math.round(toNumber(base?.rating, 0)),
      compositeScore: toNumber(base?.compositeScore ?? entry.composite, null),
      plusPoints: Array.isArray(base?.plusPoints) ? base.plusPoints : [],
      formScore: toNumber(base?.formScore, null),
      v5Percent: dist?.percent ?? (dist?.betDistribution != null ? dist.betDistribution / 100 : null),
      v5Trend: dist?.trend ?? null,
      publicRank: entry.publicRank,
      isPublicFavorite,
      isUserPick: forcedSet.has(Number(entry.id))
    }
  })
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
  const distValues = [...distributionMap.values()]
    .map(sel => sel.percent ?? (sel.betDistribution != null ? sel.betDistribution / 100 : null))
    .filter(v => v != null)
    .sort((a, b) => b - a)
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

export const buildV5Suggestion = async (racedayId, options = {}, sharedContext = null) => {
  const {
    templateKey,
    stake,
    maxCost,
    maxBudget,
    mode = 'balanced',
    userSeeds = [],
    variantStrategy = 'default',
    variantLabel = null,
    variantKey = null,
    variantStrategyLabel = null,
    variantSeed = null
  } = options || {}

  try {
    const template = templateMap.get(templateKey) || V5_TEMPLATES[0]
    const modeKey = typeof mode === 'string' ? mode : 'balanced'
    const budgetInput = [maxCost, maxBudget, stake].map(v => toNumber(v, NaN)).find(val => Number.isFinite(val))
    const budgetLimit = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : DEFAULT_MAX_BUDGET
    const stakePerRow = V5_ROW_COST
    const resolvedVariantStrategy = variantStrategy || (modeKey === 'mix' ? 'chaos' : 'default')

    const context = await buildSuggestionContext(racedayId, sharedContext || null)
    if (!context) return { error: 'Raceday not found' }

    const {
      aiData,
      v5ByRaceNumber = new Map(),
      v5Available = false,
      v5Info = null
    } = context

    const userSeedMap = normalizeUserSeeds(userSeeds)
    const variantId = variantKey || resolvedVariantStrategy || 'default'
    const seedBase = variantSeed || `${racedayId}:${template.key}:${modeKey}:${variantId}`
    const allocationRng = createRng(`${seedBase}:alloc`)
    const modeCfg = MODE_CONFIGS[modeKey] || MODE_CONFIGS.balanced

    const legs = (aiData.races || [])
      .map(r => {
        const game = (r.games || []).find(g => g.game === 'V5')
        if (!game) return null
        const raceNumber = Number(r.race?.raceNumber ?? game.leg)
        const distributionEntry = v5ByRaceNumber.get(raceNumber)
        const distributionMap = distributionEntry?.map || new Map()
        return {
          leg: game.leg,
          raceNumber,
          ranking: r.ranking || [],
          race: r.race || null,
          metrics: computeLegMetrics(r, distributionMap),
          distribution: distributionMap
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.leg - b.leg)

    if (!legs.length) return { error: 'Ingen V5 hittades för denna tävlingsdag' }
    if (legs.length !== template.counts.length) {
      return { error: `Mall ${template.label} förväntar ${template.counts.length} avdelningar men hittade ${legs.length}` }
    }

    const legScore = (leg) => (
      (leg.metrics?.spikScore ?? 0) * (modeCfg.spikScoreWeight ?? 1) +
      (leg.metrics?.publicSpikScore ?? 0) * (modeCfg.publicScoreWeight ?? 1)
    )
    const sanitizeCount = (value) => Math.min(MAX_SELECTIONS_PER_LEG, Math.max(1, toNumber(value, 1)))
    const allocation = buildAllocationWithStrategy(legs, template, resolvedVariantStrategy, legScore, sanitizeCount, allocationRng)

    const baseLegs = legs.map(leg => {
      const forcedCount = userSeedMap.get(leg.leg)?.ids.length ?? 0
      const assignedCount = sanitizeCount(allocation.get(leg.leg) ?? template.counts[leg.leg - 1] ?? 3)
      const count = Math.min(MAX_SELECTIONS_PER_LEG, Math.max(assignedCount, forcedCount || 0))
      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        distance: leg.race?.distance ?? null,
        startTime: leg.race?.startDateTime ?? null,
        metrics: leg.metrics,
        ranking: leg.ranking,
        distribution: leg.distribution,
        count,
        forcedCount
      }
    })

    const product = (items) => items.reduce((acc, item) => acc * Math.max(1, item.count), 1)
    const maxRows = budgetLimit === Infinity ? Infinity : Math.floor(budgetLimit / stakePerRow)
    const reducedLegs = baseLegs.map(leg => ({ ...leg }))
    let rows = product(reducedLegs)

    if (maxRows !== Infinity) {
      if (maxRows < 1) {
        throw new Error('Angivet maxbelopp är för lågt – minst 1 kr krävs.')
      }

      const minCountFor = (leg) => Math.max(1, leg.forcedCount || 0)
      while (rows > maxRows) {
        const target = reducedLegs
          .filter(leg => leg.count > minCountFor(leg))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return ((a.metrics?.spikScore ?? 0) + (a.metrics?.publicSpikScore ?? 0)) -
              ((b.metrics?.spikScore ?? 0) + (b.metrics?.publicSpikScore ?? 0))
          })[0]
        if (!target) {
          throw new Error(`Kupongen kan inte anpassas till max ${budgetLimit} kr.`)
        }
        target.count -= 1
        rows = product(reducedLegs)
      }
    }

    if (reducedLegs.filter(leg => leg.count === 1).length > 1) {
      const extraSpikeLegs = reducedLegs.filter(leg => leg.count === 1).slice(1)
      for (const leg of extraSpikeLegs) {
        leg.count = 2
      }
      rows = product(reducedLegs)
    }

    if (reducedLegs.filter(leg => leg.count === 2).length > 1) {
      const extraLocks = reducedLegs.filter(leg => leg.count === 2).slice(1)
      for (const leg of extraLocks) {
        leg.count = 3
      }
      rows = product(reducedLegs)
    }

    const pickWeightsSource = modeCfg.pickWeights || {}
    const chaosFactor = Number(modeCfg.chaosFactor || 0)

    const detailedLegs = reducedLegs.map(leg => {
      const legSeedBase = `${seedBase}:leg-${leg.leg}`
      const weightRng = createRng(`${legSeedBase}:weights`)
      const selectionRng = createRng(`${legSeedBase}:pick`)
      const weightInput = typeof pickWeightsSource === 'function'
        ? pickWeightsSource({ leg, template, mode: modeKey, rng: weightRng })
        : pickWeightsSource
      const forcedIds = userSeedMap.get(leg.leg)?.ids || []
      const selections = pickHorses(leg, leg.count, leg.distribution, {
        weights: weightInput || {},
        forcedIds,
        chaosFactor,
        rng: selectionRng
      })
      return {
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        distance: leg.distance,
        startTime: leg.startTime,
        count: leg.count,
        type: classifyLegType(leg.count),
        poolSize: Math.max(Array.isArray(leg.ranking) ? leg.ranking.length : 0, leg.distribution ? leg.distribution.size : 0),
        selections,
        v5Distribution: Array.from((leg.distribution || new Map()).values())
      }
    })

    rows = detailedLegs.reduce((acc, leg) => acc * Math.max(1, leg.count), 1)
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

    return {
      gameType: 'V5',
      template: { key: template.key, label: template.label },
      mode: modeKey,
      modeLabel: modeCfg.label,
      variant: {
        key: variantKey || variantId,
        label: variantLabel || null,
        strategy: resolvedVariantStrategy || 'default',
        strategyLabel: variantStrategyLabel || null,
        summary: describeSpikeSummary(spikes)
      },
      stakePerRow,
      rows,
      totalCost,
      maxBudget: Number.isFinite(budgetLimit) ? budgetLimit : null,
      generatedAt: new Date().toISOString(),
      v5: {
        used: v5Available,
        updatedAt: v5Info?.updatedAt ? new Date(v5Info.updatedAt).toISOString() : null,
        gameId: v5Info?.gameId || null
      },
      legs: detailedLegs,
      spikes,
      metadata: {
        templateCounts: [...template.counts],
        variantStrategy: resolvedVariantStrategy || 'default',
        rules: {
          maxSpikes: 1,
          maxLocks: 1,
          rowCost: V5_ROW_COST
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) return { error: err.message }
    throw err
  }
}

export const buildV5Suggestions = async (racedayId, options = {}) => {
  const { modes, variantCount, ...rest } = options || {}
  const modeCandidates = Array.isArray(modes) && modes.length ? modes : DEFAULT_SUGGESTION_MODES
  const uniqueModes = [...new Set(modeCandidates.filter(Boolean))]

  const context = await buildSuggestionContext(racedayId, null)
  if (!context) return { error: 'Raceday not found' }

  const suggestions = []
  const errors = []
  const variantsPerMode = clamp(Number.isFinite(Number(variantCount)) ? Number(variantCount) : DEFAULT_VARIANTS_PER_MODE, 1, MAX_VARIANTS_PER_MODE)
  for (const mode of uniqueModes) {
    const descriptors = resolveVariantDescriptors(mode, variantsPerMode)
    for (const descriptor of descriptors) {
      const result = await buildV5Suggestion(racedayId, {
        ...rest,
        mode,
        variantStrategy: descriptor.strategy,
        variantLabel: descriptor.label,
        variantStrategyLabel: descriptor.strategyLabel,
        variantKey: descriptor.key,
        variantSeed: `${racedayId}:${mode}:${descriptor.seedSuffix}`
      }, context)
      if (result?.error) {
        errors.push({ mode, variant: descriptor.key, variantLabel: descriptor.label, error: result.error })
        continue
      }
      suggestions.push(result)
    }
  }

  if (!suggestions.length) {
    return { error: errors.length ? errors[0]?.error : 'Det gick inte att skapa V5-spelförslag' }
  }

  return {
    suggestions,
    errors,
    suggestion: suggestions[0] || null,
    generatedAt: new Date().toISOString()
  }
}

export default {
  V5_TEMPLATES,
  listV5Templates,
  updateV5DistributionForRaceday,
  buildV5Suggestion,
  buildV5Suggestions
}
