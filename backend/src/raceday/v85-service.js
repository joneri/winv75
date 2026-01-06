import axios from 'axios'
import raceDayService from './raceday-service.js'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const ROW_COST = 0.5
const DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.V85_DEFAULT_MAX_BUDGET))
  ? Number(process.env.V85_DEFAULT_MAX_BUDGET)
  : Infinity
const ENV_MAX_SELECTIONS = Number(process.env.V85_MAX_SELECTIONS_PER_LEG)
const MAX_SELECTIONS_PER_LEG = Number.isFinite(ENV_MAX_SELECTIONS) && ENV_MAX_SELECTIONS > 0
  ? ENV_MAX_SELECTIONS
  : 8
const SCORE_EPSILON = 1e-6
const DEFAULT_SUGGESTION_MODES = ['balanced', 'mix', 'public', 'value']
const V85_PWIN_WEIGHT = Number.isFinite(Number(process.env.V85_PWIN_WEIGHT))
  ? Number(process.env.V85_PWIN_WEIGHT)
  : 24
const MAX_VARIANTS_PER_MODE = 5
const ENV_VARIANTS_PER_MODE = Number(process.env.V85_VARIANTS_PER_MODE)
const DEFAULT_VARIANTS_PER_MODE = Number.isFinite(ENV_VARIANTS_PER_MODE) && ENV_VARIANTS_PER_MODE > 0
  ? Math.min(MAX_VARIANTS_PER_MODE, ENV_VARIANTS_PER_MODE)
  : 3
const DEFAULT_VARIANT_LABELS = ['Variant A', 'Variant B', 'Variant C', 'Variant D', 'Variant E']

export const V85_TEMPLATES = [
  {
    key: 'two-spikes-one-lock',
    label: '2 spikar ett lås',
    counts: [1, 1, 2, 3, 4, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'three-spikes-one-lock',
    label: '3 spikar ett lås',
    counts: [1, 1, 1, 2, 3, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'one-spike',
    label: '2 spikar',
    counts: [1, 1, 2, 3, 4, 5, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'tv-system',
    label: 'TV-system',
    counts: [6, 5, 4, 4, 3, 3, 2, 1],
    assignment: 'sequential'
  },
  {
    key: 'inverse-t',
    label: 'Omvänt TV-system',
    counts: [1, 2, 3, 3, 4, 4, 5, 6],
    assignment: 'sequential'
  },
  {
    key: 'no-spikes',
    label: 'Inga spikar',
    counts: [3, 3, 4, 4, 4, 5, 5, 5],
    assignment: 'worstToBest'
  }
]

const templateMap = new Map(V85_TEMPLATES.map(t => [t.key, t]))

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const rotateArray = (list = [], steps = 0) => {
  if (!Array.isArray(list) || !list.length) return []
  const len = list.length
  const offset = ((steps % len) + len) % len
  if (offset === 0) return [...list]
  return [...list.slice(offset), ...list.slice(0, offset)]
}

const interleaveCounts = (list = []) => {
  const result = []
  let start = 0
  let end = list.length - 1
  let toggle = true
  while (start <= end) {
    if (toggle) {
      result.push(list[start])
      start += 1
    } else {
      result.push(list[end])
      end -= 1
    }
    toggle = !toggle
  }
  return result
}

const shuffleArray = (list = [], rng = Math.random) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const rand = typeof rng === 'function' ? rng() : Math.random()
    const j = Math.floor(rand * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const hashString = (value) => {
  const str = String(value ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = Math.imul(31, hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const createRng = (seedValue = Date.now()) => {
  let seed = typeof seedValue === 'number' ? seedValue >>> 0 : hashString(seedValue)
  if (seed === 0) seed = 0x6d2b79f5
  return () => {
    seed += 0x6d2b79f5
    let t = seed
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (value) => clamp(value, 0, 1)

const MODE_PICK_WEIGHTS = {
  balanced: { composite: 0.5, rank: 0.25, distribution: 0.25 },
  public: { composite: 0.15, rank: 0.05, distribution: 0.8 },
  value: { composite: 0.6, rank: 0.3, distribution: 0.15 }
}

const blendWeights = (a = {}, b = {}, mix = 0.5) => ({
  composite: clamp01(lerp(a.composite ?? 0, b.composite ?? 0, mix)),
  rank: clamp01(lerp(a.rank ?? 0, b.rank ?? 0, mix)),
  distribution: clamp01(lerp(a.distribution ?? 0, b.distribution ?? 0, mix))
})

const MODE_CONFIGS = {
  balanced: {
    label: 'Balanserad',
    spikScoreWeight: 1,
    publicScoreWeight: 1,
    pickWeights: MODE_PICK_WEIGHTS.balanced,
    chaosFactor: 0
  },
  public: {
    label: 'Publikfavorit',
    spikScoreWeight: 0.8,
    publicScoreWeight: 3.5,
    pickWeights: MODE_PICK_WEIGHTS.public,
    chaosFactor: 0
  },
  value: {
    label: 'Värdejakt',
    spikScoreWeight: 1,
    publicScoreWeight: -0.6,
    pickWeights: MODE_PICK_WEIGHTS.value,
    chaosFactor: 0.05
  },
  mix: {
    label: 'MIX',
    spikScoreWeight: 1.05,
    publicScoreWeight: 0.5,
    pickWeights: ({ rng }) => {
      const mixValue = typeof rng === 'function' ? rng() : Math.random()
      const base = blendWeights(MODE_PICK_WEIGHTS.balanced, MODE_PICK_WEIGHTS.value, mixValue)
      const jitter = ((typeof rng === 'function' ? rng() : Math.random()) - 0.5) * 0.35
      return {
        composite: clamp01(base.composite + jitter * 0.4),
        rank: clamp01(base.rank + jitter * 0.2),
        distribution: clamp01(base.distribution - jitter * 0.3)
      }
    },
    chaosFactor: 0.35
  }
}

const VARIANT_STRATEGY_LABELS = {
  default: 'Original',
  'shift-forward': 'Skifta fram',
  'shift-back': 'Skifta bak',
  spread: 'Spridning',
  mirror: 'Spegel',
  chaos: 'Fri mix'
}

const MODE_VARIANT_ORDER = {
  balanced: ['default', 'shift-forward', 'spread', 'mirror', 'chaos'],
  mix: ['chaos', 'shift-forward', 'spread', 'mirror', 'default'],
  public: ['default', 'mirror', 'shift-back', 'spread', 'chaos'],
  value: ['default', 'spread', 'shift-back', 'chaos', 'mirror'],
  default: ['default', 'shift-forward', 'spread', 'mirror', 'chaos']
}

const resolveVariantDescriptors = (modeKey, requestedCount = DEFAULT_VARIANTS_PER_MODE) => {
  const count = clamp(Math.floor(Number(requestedCount) || DEFAULT_VARIANTS_PER_MODE), 1, MAX_VARIANTS_PER_MODE)
  const order = MODE_VARIANT_ORDER[modeKey] || MODE_VARIANT_ORDER.default
  const descriptors = []
  let idx = 0
  while (descriptors.length < count && idx < order.length) {
    const strategy = order[idx]
    descriptors.push({
      strategy,
      label: DEFAULT_VARIANT_LABELS[descriptors.length] || `Variant ${descriptors.length + 1}`,
      strategyLabel: VARIANT_STRATEGY_LABELS[strategy] || strategy
    })
    idx += 1
  }
  while (descriptors.length < count) {
    descriptors.push({
      strategy: 'chaos',
      label: DEFAULT_VARIANT_LABELS[descriptors.length] || `Variant ${descriptors.length + 1}`,
      strategyLabel: VARIANT_STRATEGY_LABELS.chaos
    })
  }
  return descriptors.map((entry, index) => ({
    ...entry,
    key: `${modeKey}-${entry.strategy}-${index}`,
    seedSuffix: `${entry.strategy}-${index}`
  }))
}

const transformCountsByStrategy = (counts, strategy, rng) => {
  if (!Array.isArray(counts) || !counts.length) return []
  switch (strategy) {
    case 'shift-forward':
      return rotateArray(counts, 1)
    case 'shift-back':
      return rotateArray(counts, -1)
    case 'spread':
      return interleaveCounts(counts)
    case 'mirror':
      return [...counts].reverse()
    case 'chaos':
      return shuffleArray(counts, rng)
    default:
      return [...counts]
  }
}

const buildAllocationWithStrategy = (legs, template, strategy, legScore, sanitizeCount, rng) => {
  const strategyKey = strategy || 'default'
  const allocation = new Map()
  if (template.assignment === 'sequential') {
    const variantCounts = transformCountsByStrategy([...template.counts], strategyKey, rng)
    for (let i = 0; i < legs.length; i += 1) {
      const leg = legs[i]
      const count = variantCounts[i] ?? variantCounts[variantCounts.length - 1] ?? template.counts[template.counts.length - 1]
      allocation.set(leg.leg, sanitizeCount(count))
    }
    return allocation
  }

  const order = template.assignment === 'worstToBest'
    ? [...legs].sort((a, b) => legScore(a) - legScore(b))
    : [...legs].sort((a, b) => legScore(b) - legScore(a))

  const baseCounts = template.assignment === 'worstToBest'
    ? [...template.counts].sort((a, b) => b - a)
    : [...template.counts].sort((a, b) => a - b)

  const variantCounts = transformCountsByStrategy(baseCounts, strategyKey, rng)

  for (let i = 0; i < order.length; i += 1) {
    const leg = order[i]
    const count = variantCounts[i] ?? variantCounts[variantCounts.length - 1] ?? baseCounts[baseCounts.length - 1]
    allocation.set(leg.leg, sanitizeCount(count))
  }

  return allocation
}

const describeSpikeSummary = (spikes = []) => {
  if (!Array.isArray(spikes) || !spikes.length) {
    return 'Inga spikar – bred gardering'
  }
  const legs = spikes
    .map(spike => Number(spike?.leg))
    .filter(num => Number.isFinite(num))
    .sort((a, b) => a - b)
  if (!legs.length) {
    return 'Inga spikar – bred gardering'
  }
  if (legs.length === 1) {
    return `Spik i Avd ${legs[0]}`
  }
  if (legs.length === 2) {
    return `Spikar Avd ${legs[0]} & Avd ${legs[1]}`
  }
  const prefix = legs.slice(0, -1).map(num => `Avd ${num}`).join(', ')
  return `Spikar ${prefix} & Avd ${legs[legs.length - 1]}`
}

const normalizeUserSeeds = (value) => {
  const map = new Map()
  if (!value) return map
  const entries = Array.isArray(value)
    ? value
    : Object.entries(value).map(([leg, horseIds]) => ({ leg, horseIds }))
  for (const entry of entries) {
    const legNumber = Number(entry?.leg)
    if (!Number.isFinite(legNumber)) continue
    const ids = Array.isArray(entry?.horseIds) ? entry.horseIds : []
    const normalized = []
    const seen = new Set()
    for (const rawId of ids) {
      const id = Number(rawId)
      if (!Number.isFinite(id) || seen.has(id)) continue
      seen.add(id)
      normalized.push(id)
    }
    if (!normalized.length) continue
    map.set(legNumber, { ids: normalized, set: seen })
  }
  return map
}

export const listV85Templates = () => V85_TEMPLATES.map(t => ({ key: t.key, label: t.label, counts: t.counts }))

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toScore = (horse) => {
  if (!horse) return 0
  const composite = toNumber(horse.compositeScore ?? horse.rating ?? 0, 0)
  const pWin = Number(horse.winProbability)
  if (Number.isFinite(pWin) && pWin > 0) {
    return composite + V85_PWIN_WEIGHT * pWin
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

  if (!ctx.v85InfoResolved) {
    const racedayDoc = await Raceday.findById(racedayId, { v85Info: 1 }).lean()
    ctx.v85Info = racedayDoc?.v85Info || null
    ctx.v85InfoResolved = true
  }

  if (!ctx.v85Prepared) {
    const map = new Map()
    const infoLegs = ctx.v85Info?.legs || []
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
    ctx.v85ByRaceNumber = map
    ctx.v85Available = map.size > 0
    ctx.v85Prepared = true
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

export const updateV85DistributionForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    throw new Error('Raceday not found')
  }

  await ensureGameDataForRaceday(raceday)

  const v85Entries = raceday.atgCalendarGamesRaw?.V85 || []
  if (!Array.isArray(v85Entries) || v85Entries.length === 0) {
    throw new Error('Ingen V85-omgång hittades för denna tävlingsdag')
  }

  const raceNumberMap = new Map((raceday.raceList || []).map(r => [Number(r.raceNumber), r]))

  let selectedEntry = null
  let selectedGameData = null
  let bestMatchCount = -1

  for (const entry of v85Entries) {
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
    throw new Error('Misslyckades med att hämta V85-data från ATG')
  }

  // reset previous values
  for (const race of raceday.raceList || []) {
    for (const horse of race.horses || []) {
      horse.v85Percent = null
      horse.v85Trend = null
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
      const poolInfo = start?.pools?.V85
      if (!poolInfo || poolInfo.betDistribution == null) continue
      const betDistribution = toNumber(poolInfo.betDistribution, null)
      if (!Number.isFinite(betDistribution)) continue
      const percent = betDistribution / 100
      const trend = poolInfo.trend != null ? Number(poolInfo.trend) : null
      const programNumber = toNumber(start?.number, null)
      const horseName = start?.horse?.name || ''

      const horseDoc = horseMap.get(horseId)
      if (horseDoc) {
        horseDoc.v85Percent = percent
        horseDoc.v85Trend = trend
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

  raceday.v85Info = {
    updatedAt,
    gameId: selectedEntry.id,
    source: 'ATG',
    legs
  }

  raceday.markModified('raceList')
  raceday.markModified('v85Info')
  await raceday.save()

  const info = raceday.v85Info?.toObject ? raceday.v85Info.toObject() : raceday.v85Info
  return info
}

const classifyLegType = (count) => {
  if (count <= 1) return 'spik'
  if (count === 2) return 'lås'
  if (count >= 5) return 'bred gardering'
  return 'gardering'
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
    const distNorm = distPercent != null
      ? (maxDistribution > 0 ? distPercent / maxDistribution : distPercent / 100)
      : 0

    const weights = {
      composite: weightOverrides.composite ?? 0.5,
      rank: weightOverrides.rank ?? 0.25,
      distribution: distPercent != null ? (weightOverrides.distribution ?? 0.25) : 0
    }
    const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0) || 1
    let score = totalWeight > 0
      ? ((compNorm * weights.composite) + (rankNorm * weights.rank) + (distNorm * weights.distribution)) / totalWeight
      : 0

    if (chaosFactor > 0 && rng) {
      const noise = (rng() - 0.5) * 2 * chaosFactor
      score = Math.max(0, score + noise)
    }

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
      isPublicFavorite,
      tieBreaker: rng ? rng() : 0
    }
  })

  entries.sort((a, b) => {
    if (Math.abs(b.score - a.score) > SCORE_EPSILON) {
      return b.score - a.score
    }
    if (Math.abs((b.tieBreaker || 0) - (a.tieBreaker || 0)) > SCORE_EPSILON) {
      return (b.tieBreaker || 0) - (a.tieBreaker || 0)
    }
    return toNumber(a.rank, Number.MAX_SAFE_INTEGER) - toNumber(b.rank, Number.MAX_SAFE_INTEGER)
  })

  const ensureEntryForId = (targetId) => {
    const match = entries.find(entry => Number(entry.id) === targetId)
    if (match) return match
    const base = rankingMap.get(targetId)
    const distInfo = distributionMap.get(targetId)
    if (!base && !distInfo) return null
    return {
      id: targetId,
      score: -1,
      base,
      dist: distInfo,
      composite: toScore(base),
      rank: toNumber(base?.rank, 0),
      distPercent: distInfo?.percent ?? (distInfo?.betDistribution != null ? distInfo.betDistribution / 100 : null),
      publicRank: percentRanks.get(targetId) ?? null,
      isPublicFavorite: false,
      tieBreaker: 0
    }
  }

  const limit = Math.max(1, count)
  const usedIds = new Set()
  const selected = []

  for (const forcedId of forcedOrder) {
    if (usedIds.has(forcedId)) continue
    const entry = ensureEntryForId(forcedId)
    if (!entry) continue
    selected.push(entry)
    usedIds.add(forcedId)
    if (selected.length >= limit) break
  }

  if (selected.length < limit) {
    for (const entry of entries) {
      const idNum = Number(entry.id)
      if (usedIds.has(idNum) || forcedSet.has(idNum)) continue
      selected.push(entry)
      usedIds.add(idNum)
      if (selected.length >= limit) break
    }
  }

  const finalList = selected.slice(0, limit)

  return finalList.map(({ base, dist, composite, id, publicRank, isPublicFavorite }) => ({
    id,
    programNumber: base?.programNumber ?? dist?.programNumber ?? null,
    name: base?.name ?? dist?.horseName ?? '',
    tier: base?.tier || null,
    rating: Math.round(toNumber(base?.rating, 0)),
    compositeScore: toNumber(base?.compositeScore ?? composite, null),
    plusPoints: Array.isArray(base?.plusPoints) ? base.plusPoints : [],
    formScore: toNumber(base?.formScore, null),
    v85Percent: dist?.percent ?? (dist?.betDistribution != null ? dist.betDistribution / 100 : null),
    v85Trend: dist?.trend ?? null,
    publicRank,
    isPublicFavorite: Boolean(isPublicFavorite),
    isUserPick: forcedSet.has(Number(id))
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


export const buildV85Suggestion = async (racedayId, options = {}, sharedContext = null) => {
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
    const template = templateMap.get(templateKey) || V85_TEMPLATES[0]
    const modeKey = typeof mode === 'string' ? mode : 'balanced'
    const resolvedVariantStrategy = variantStrategy || (modeKey === 'mix' ? 'chaos' : 'default')
    const budgetInput = [maxCost, maxBudget, stake].map(v => toNumber(v, NaN)).find(val => Number.isFinite(val))
    const budgetLimit = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : DEFAULT_MAX_BUDGET
    const stakePerRow = ROW_COST

    const context = await buildSuggestionContext(racedayId, sharedContext || null)
    if (!context) {
      return { error: 'Raceday not found' }
    }

    const {
      aiData,
      v85ByRaceNumber = new Map(),
      v85Available = false,
      v85Info = null
    } = context

    const userSeedMap = normalizeUserSeeds(userSeeds)
    const variantId = variantKey || resolvedVariantStrategy || 'default'
    const seedBase = variantSeed || `${racedayId}:${template.key}:${modeKey}:${variantId}`
    const allocationRng = createRng(`${seedBase}:alloc`)

    const modeCfg = MODE_CONFIGS[modeKey] || MODE_CONFIGS.balanced

    const legs = (aiData.races || [])
      .map(r => {
        const v85Game = (r.games || []).find(g => g.game === 'V85')
        if (!v85Game) return null
        const raceNumber = Number(r.race?.raceNumber ?? v85Game.leg)
        const distributionEntry = v85ByRaceNumber.get(raceNumber)
        const distributionMap = distributionEntry?.map || new Map()
        return {
          leg: v85Game.leg,
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
      return { error: 'Ingen V85 hittades för denna tävlingsdag' }
    }

    if (legs.length !== template.counts.length) {
      return { error: `Mall ${template.label} förväntar ${template.counts.length} avdelningar men hittade ${legs.length}` }
    }

    const legScore = (leg) => (
      (leg.metrics?.spikScore ?? 0) * (modeCfg.spikScoreWeight ?? 1) +
      (leg.metrics?.publicSpikScore ?? 0) * (modeCfg.publicScoreWeight ?? 1)
    )

    const sanitizeCount = (value) => Math.min(
      MAX_SELECTIONS_PER_LEG,
      Math.max(1, toNumber(value, 1))
    )

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
    const baseRows = product(baseLegs)
    const maxRows = budgetLimit === Infinity ? Infinity : Math.floor(budgetLimit / stakePerRow)

    const reduceCounts = () => {
      const copy = baseLegs.map(l => ({ ...l }))
      if (maxRows === Infinity) return { legs: copy, rows: product(copy) }
      if (maxRows < 1) {
        throw new Error('Angivet maxbelopp är för lågt – minst 0,5 kr krävs.')
      }

      const minCountFor = (leg) => Math.max(1, leg.forcedCount || 0)
      const canReduce = () => copy.some(l => l.count > minCountFor(l))
      const chooseTarget = () => copy
        .filter(l => l.count > minCountFor(l))
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
        if (target.count < minCountFor(target)) {
          target.count = minCountFor(target)
        }
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

    const pickWeightsSource = modeCfg.pickWeights || {}
    const chaosFactor = Number(modeCfg.chaosFactor || 0)

    const detailedLegs = adjustedLegs.map(leg => {
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
        v85Distribution: Array.from((leg.distribution || new Map()).values())
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

    const variantInfo = {
      key: variantKey || variantId,
      label: variantLabel || null,
      strategy: resolvedVariantStrategy || 'default',
      strategyLabel: variantStrategyLabel || VARIANT_STRATEGY_LABELS[resolvedVariantStrategy] || null,
      summary: describeSpikeSummary(spikes)
    }

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
      variant: variantInfo,
      stakePerRow,
      rows,
      totalCost,
      maxBudget: Number.isFinite(budgetLimit) ? budgetLimit : null,
      budget: budgetSummary,
      generatedAt: new Date().toISOString(),
      v85: {
        used: v85Available,
        updatedAt: v85Info?.updatedAt ? new Date(v85Info.updatedAt).toISOString() : null,
        gameId: v85Info?.gameId || null
      },
      legs: detailedLegs,
      spikes,
      spikeCandidates,
      metadata: {
        templateCounts: [...template.counts],
        baseRows,
        variantStrategy: resolvedVariantStrategy || 'default'
    }
    }
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message }
    }
    throw err
  }
}

export const buildV85Suggestions = async (racedayId, options = {}) => {
  const { modes, variantCount, ...rest } = options || {}
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
  const variantsPerMode = clamp(Number.isFinite(Number(variantCount)) ? Number(variantCount) : DEFAULT_VARIANTS_PER_MODE, 1, MAX_VARIANTS_PER_MODE)
  for (const mode of uniqueModes) {
    const descriptors = resolveVariantDescriptors(mode, variantsPerMode)
    for (const descriptor of descriptors) {
      const result = await buildV85Suggestion(
        racedayId,
        {
          ...rest,
          mode,
          variantStrategy: descriptor.strategy,
          variantLabel: descriptor.label,
          variantStrategyLabel: descriptor.strategyLabel,
          variantKey: descriptor.key,
          variantSeed: `${racedayId}:${mode}:${descriptor.seedSuffix}`
        },
        context
      )
      if (result?.error) {
        errors.push({ mode, variant: descriptor.key, variantLabel: descriptor.label, error: result.error })
        continue
      }
      suggestions.push(result)
    }
  }

  if (!suggestions.length) {
    return { error: errors.length ? errors[0]?.error : 'Det gick inte att skapa V85-spelförslag' }
  }

  return {
    suggestions,
    errors,
    suggestion: suggestions[0] || null,
    generatedAt: new Date().toISOString()
  }
}
export default {
  V85_TEMPLATES,
  listV85Templates,
  updateV85DistributionForRaceday,
  buildV85Suggestion,
  buildV85Suggestions
}
