import axios from 'axios'
import raceDayService from './raceday-service.js'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const ENV_ROW_COST = Number(process.env.V86_ROW_COST)
const ROW_COST = Number.isFinite(ENV_ROW_COST) && ENV_ROW_COST > 0 ? ENV_ROW_COST : 0.25
const DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.V86_DEFAULT_MAX_BUDGET))
  ? Number(process.env.V86_DEFAULT_MAX_BUDGET)
  : Infinity
const ENV_MAX_SELECTIONS = Number(process.env.V86_MAX_SELECTIONS_PER_LEG)
const MAX_SELECTIONS_PER_LEG = Number.isFinite(ENV_MAX_SELECTIONS) && ENV_MAX_SELECTIONS > 0
  ? ENV_MAX_SELECTIONS
  : 8
const SCORE_EPSILON = 1e-6
const DEFAULT_SUGGESTION_MODES = ['balanced', 'mix', 'public', 'value']
const V86_PWIN_WEIGHT = Number.isFinite(Number(process.env.V86_PWIN_WEIGHT))
  ? Number(process.env.V86_PWIN_WEIGHT)
  : 24
const MAX_VARIANTS_PER_MODE = 5
const ENV_VARIANTS_PER_MODE = Number(process.env.V86_VARIANTS_PER_MODE)
const DEFAULT_VARIANTS_PER_MODE = Number.isFinite(ENV_VARIANTS_PER_MODE) && ENV_VARIANTS_PER_MODE > 0
  ? Math.min(MAX_VARIANTS_PER_MODE, ENV_VARIANTS_PER_MODE)
  : 3
const DEFAULT_VARIANT_LABELS = ['Variant A', 'Variant B', 'Variant C', 'Variant D', 'Variant E']

export const V86_TEMPLATES = [
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

const templateMap = new Map(V86_TEMPLATES.map(t => [t.key, t]))

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

export const listV86Templates = () => V86_TEMPLATES.map(t => ({ key: t.key, label: t.label, counts: t.counts }))

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toScore = (horse) => {
  if (!horse) return 0
  const composite = toNumber(horse.compositeScore ?? horse.rating ?? 0, 0)
  const pWin = Number(horse.winProbability)
  if (Number.isFinite(pWin) && pWin > 0) {
    return composite + V86_PWIN_WEIGHT * pWin
  }
  return composite
}

const normalizeTrackName = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '')
  .trim()

const resolveDateKey = (raceday) => {
  const date = raceday?.raceDayDate
  if (date) return date
  const firstStart = raceday?.firstStart ? new Date(raceday.firstStart) : null
  if (!firstStart || Number.isNaN(firstStart.getTime())) return null
  return firstStart.toISOString().slice(0, 10)
}

const fetchRacedaysForDate = async (date) => {
  if (!date) return []
  const projection = { trackName: 1, raceList: 1, raceDayDate: 1, raceDayId: 1 }
  const direct = await Raceday.find({ raceDayDate: date }, projection).lean()
  if (direct.length) return direct
  const start = new Date(`${date}T00:00:00`)
  if (Number.isNaN(start.getTime())) return []
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return await Raceday.find({ firstStart: { $gte: start, $lt: end } }, projection).lean()
}

const fetchCalendarForDate = async (date) => {
  if (!date) return {}
  const url = `${ATG_BASE_URL}/calendar/day/${date}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data?.games || {}
}

const buildSuggestionContext = async (racedayId, context = null) => {
  const ctx = context || {}

  if (!ctx.gameViewResolved) {
    ctx.gameView = await resolveV86GameForRaceday(racedayId, { includeGameData: false })
    ctx.gameViewResolved = true
  }

  if (!ctx.gameView) {
    return null
  }

  ctx.gameViewStatus = ctx.gameView.status
  ctx.gameViewMessage = ctx.gameView.message

  if (ctx.gameView.status !== 'ok') {
    ctx.legBase = []
    ctx.v86Available = false
    return ctx
  }

  if (!ctx.aiByRaceId) {
    const aiByRaceId = new Map()
    const raceDayIds = [...new Set((ctx.gameView.legs || [])
      .map(leg => leg.raceDayId)
      .filter(Boolean)
      .map(id => String(id)))]
    for (const raceDayId of raceDayIds) {
      const aiData = await raceDayService.getRacedayAiList(raceDayId)
      const races = Array.isArray(aiData?.races) ? aiData.races : []
      for (const race of races) {
        const raceId = Number(race?.race?.raceId ?? race?.raceId)
        if (!Number.isFinite(raceId)) continue
        if (!aiByRaceId.has(raceId)) {
          aiByRaceId.set(raceId, race)
        }
      }
    }
    ctx.aiByRaceId = aiByRaceId
  }

  if (!ctx.v86InfoResolved) {
    const racedayDoc = await Raceday.findById(racedayId, { v86Info: 1 }).lean()
    const gameId = ctx.gameView?.gameId || null
    let info = racedayDoc?.v86Info || null
    if (info && gameId && info.gameId && info.gameId !== gameId) {
      info = null
    }
    if (!info && gameId && Array.isArray(ctx.gameView?.racedays)) {
      const otherIds = ctx.gameView.racedays.map(r => r.id).filter(Boolean)
      if (otherIds.length) {
        const alt = await Raceday.findOne(
          { _id: { $in: otherIds }, 'v86Info.gameId': gameId },
          { v86Info: 1 }
        ).lean()
        info = alt?.v86Info || null
      }
    }
    ctx.v86Info = info
    ctx.v86InfoResolved = true
  }

  if (!ctx.v86Prepared) {
    const map = new Map()
    const infoLegs = ctx.v86Info?.legs || []
    for (const leg of infoLegs) {
      const raceId = Number(leg?.raceId)
      if (!Number.isFinite(raceId)) continue
      const selections = (leg.selections || []).map(sel => ({
        ...sel,
        horseId: Number(sel?.horseId),
        percent: sel?.percent != null
          ? toNumber(sel.percent, null)
          : (sel?.betDistribution != null ? toNumber(sel.betDistribution, null) / 100 : null)
      }))
      const legMap = new Map(selections.map(sel => [sel.horseId, sel]))
      map.set(raceId, { leg, map: legMap, selections })
    }
    ctx.v86ByRaceId = map
    ctx.v86Available = map.size > 0
    ctx.v86Prepared = true
  }

  if (!ctx.legBase) {
    const legs = (ctx.gameView.legs || [])
      .map(leg => {
        const raceId = Number(leg?.raceId)
        if (!Number.isFinite(raceId)) return null
        const aiRace = ctx.aiByRaceId.get(raceId)
        if (!aiRace) return null
        const raceData = aiRace.race || null
        return {
          leg: leg.legNumber,
          raceNumber: leg.raceNumber ?? raceData?.raceNumber ?? leg.legNumber,
          raceId,
          raceDayId: leg.raceDayId ?? null,
          trackName: leg.trackName ?? raceData?.trackName ?? null,
          startTime: leg.startTime ?? raceData?.startDateTime ?? null,
          ranking: aiRace.ranking || [],
          race: raceData
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.leg - b.leg)
    ctx.legBase = legs
  }

  return ctx
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

const fetchRaceDetails = async (raceKey) => {
  if (!raceKey) return null
  const url = `${ATG_BASE_URL}/races/${raceKey}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data
}

const V86_STATUS_MESSAGES = {
  not_found: 'Tävlingsdag hittades inte.',
  missing_date: 'Saknar datum för att hitta V86-omgången.',
  missing_game: 'Ingen V86-omgång hittades för denna tävlingsdag.',
  missing_racedays: 'Ingen tävlingsdag hittades i databasen för datumet.',
  missing_game_data: 'Misslyckades med att hämta V86-data från ATG.',
  missing_pair: 'Kunde inte matcha båda banorna för V86-omgången.',
  missing_legs: 'Kunde inte matcha V86-lopp mot tävlingsdagarna.'
}

const buildTrackIndex = (racedays) => {
  const map = new Map()
  for (const raceday of racedays || []) {
    const key = normalizeTrackName(raceday?.trackName)
    if (!key || map.has(key)) continue
    map.set(key, raceday)
  }
  return map
}

const buildLegsFromGameData = (gameData, trackIndex) => {
  const legs = []
  const races = Array.isArray(gameData?.races) ? gameData.races : []
  races.forEach((raceData, index) => {
    const trackName = raceData?.track?.name || ''
    const trackKey = normalizeTrackName(trackName)
    const raceday = trackIndex.get(trackKey) || null
    const raceNumber = Number(raceData?.number)
    let raceDoc = null
    if (raceday) {
      raceDoc = (raceday.raceList || []).find(r => Number(r.raceNumber) === raceNumber) || null
      if (!raceDoc) {
        console.warn(`[V86] Missing race ${raceNumber} for ${raceday.trackName || trackName}`)
      }
    } else if (trackName) {
      console.warn(`[V86] Missing raceday for track ${trackName}`)
    }
    legs.push({
      legNumber: index + 1,
      raceNumber: Number.isFinite(raceNumber) ? raceNumber : null,
      raceDayId: raceday?._id ?? null,
      raceId: raceDoc?.raceId ?? null,
      trackName: raceday?.trackName || trackName || null,
      startTime: raceDoc?.startDateTime ?? raceData?.startTime ?? null
    })
  })
  return legs
}

const buildLegsFromRaceKeys = async (raceKeys, trackIndex) => {
  const list = []
  for (const raceKey of raceKeys || []) {
    try {
      const raceData = await fetchRaceDetails(raceKey)
      if (!raceData) continue
      const trackName = raceData?.track?.name || ''
      const trackKey = normalizeTrackName(trackName)
      const raceNumber = Number(raceData?.number)
      const startTime = raceData?.startTime || raceData?.scheduledStartTime || null
      const ts = startTime ? new Date(startTime).getTime() : Number.POSITIVE_INFINITY
      const startTs = Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY
      list.push({ raceData, trackName, trackKey, raceNumber, startTime, startTs })
    } catch (err) {
      // ignore missing race
    }
  }

  if (!list.length) return []

  list.sort((a, b) => a.startTs - b.startTs)

  const legs = []
  list.forEach((info, index) => {
    const raceday = trackIndex.get(info.trackKey) || null
    let raceDoc = null
    if (raceday) {
      raceDoc = (raceday.raceList || []).find(r => Number(r.raceNumber) === info.raceNumber) || null
      if (!raceDoc) {
        console.warn(`[V86] Fallback missing race ${info.raceNumber} for ${raceday.trackName || info.trackName}`)
      }
    }

    legs.push({
      legNumber: index + 1,
      raceNumber: Number.isFinite(info.raceNumber) ? info.raceNumber : null,
      raceDayId: raceday?._id ?? null,
      raceId: raceDoc?.raceId ?? null,
      trackName: raceday?.trackName || info.trackName || null,
      startTime: raceDoc?.startDateTime ?? info.startTime ?? null
    })
  })

  return legs
}

const resolveV86GameForRaceday = async (racedayId, { includeGameData = false } = {}) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    return { status: 'not_found', message: V86_STATUS_MESSAGES.not_found }
  }

  const dateKey = resolveDateKey(raceday)
  if (!dateKey) {
    return { status: 'missing_date', message: V86_STATUS_MESSAGES.missing_date }
  }

  await ensureGameDataForRaceday(raceday)

  let games = raceday.atgCalendarGamesRaw || {}
  if (!games || !Object.keys(games).length) {
    games = await fetchCalendarForDate(dateKey)
  }

  const v86Entries = games?.V86 || []
  if (!Array.isArray(v86Entries) || !v86Entries.length) {
    return { status: 'missing_game', message: V86_STATUS_MESSAGES.missing_game }
  }

  const racedaysForDate = await fetchRacedaysForDate(dateKey)
  if (!racedaysForDate.length) {
    return { status: 'missing_racedays', message: V86_STATUS_MESSAGES.missing_racedays }
  }

  const trackIndex = buildTrackIndex(racedaysForDate)
  let selected = null
  let bestMatchCount = -1

  for (const entry of v86Entries) {
    try {
      const gameData = await fetchGameDetails(entry.id)
      const legs = buildLegsFromGameData(gameData, trackIndex)
      const matchCount = legs.reduce((acc, leg) => (leg.raceId ? acc + 1 : acc), 0)
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        selected = { entry, gameData, legs }
      }
    } catch (err) {
      // try next entry
    }
  }

  const hasAtgLegs = Array.isArray(selected?.gameData?.races) && selected.gameData.races.length
  if (!selected || !hasAtgLegs) {
    bestMatchCount = -1
    let fallbackSelected = null
    for (const entry of v86Entries) {
      const raceKeys = Array.isArray(entry?.races) ? entry.races : []
      if (!raceKeys.length) continue
      const legs = await buildLegsFromRaceKeys(raceKeys, trackIndex)
      const matchCount = legs.reduce((acc, leg) => (leg.raceId ? acc + 1 : acc), 0)
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        fallbackSelected = { entry, gameData: null, legs }
      }
    }
    selected = fallbackSelected || selected
  }

  if (!selected) {
    return { status: 'missing_game_data', message: V86_STATUS_MESSAGES.missing_game_data }
  }

  const legIds = selected.legs || []
  if (!legIds.length) {
    return { status: 'missing_legs', message: V86_STATUS_MESSAGES.missing_legs }
  }

  const uniqueRaceDayIds = [...new Set(legIds.map(leg => leg.raceDayId).filter(Boolean).map(id => String(id)))]
  const racedays = uniqueRaceDayIds.map(id => {
    const match = racedaysForDate.find(r => String(r._id) === id)
    return {
      id,
      raceDayId: match?.raceDayId ?? null,
      trackName: match?.trackName ?? ''
    }
  })

  const status = uniqueRaceDayIds.length >= 2 ? 'ok' : 'missing_pair'
  const message = status === 'ok' ? null : V86_STATUS_MESSAGES[status]

  return {
    status,
    message,
    gameId: selected.entry?.id || null,
    date: dateKey,
    legs: selected.legs,
    racedays,
    ...(includeGameData ? { gameData: selected.gameData } : {})
  }
}

export const getV86PairingForRaceday = async (racedayId) => {
  const result = await resolveV86GameForRaceday(racedayId, { includeGameData: false })
  return {
    status: result?.status || 'missing_game',
    message: result?.message || V86_STATUS_MESSAGES.missing_game,
    gameId: result?.gameId || null,
    racedays: result?.racedays || []
  }
}

export const getV86GameViewForRaceday = async (racedayId) => {
  return await resolveV86GameForRaceday(racedayId, { includeGameData: false })
}

export const updateV86DistributionForRaceday = async (racedayId) => {
  const game = await resolveV86GameForRaceday(racedayId, { includeGameData: true })
  if (!game || game.status !== 'ok') {
    return {
      ok: false,
      status: game?.status || 'missing_game',
      message: game?.message || V86_STATUS_MESSAGES.missing_game
    }
  }

  if (!Array.isArray(game.gameData?.races) || !game.gameData.races.length) {
    return { ok: false, status: 'missing_game_data', message: V86_STATUS_MESSAGES.missing_game_data }
  }

  const racedayIds = (game.racedays || []).map(r => r.id).filter(Boolean)
  if (!racedayIds.length) {
    return { ok: false, status: 'missing_pair', message: V86_STATUS_MESSAGES.missing_pair }
  }

  const racedays = await Raceday.find({ _id: { $in: racedayIds } })
  if (!racedays.length) {
    return { ok: false, status: 'missing_racedays', message: V86_STATUS_MESSAGES.missing_racedays }
  }

  for (const raceday of racedays) {
    for (const race of raceday.raceList || []) {
      for (const horse of race.horses || []) {
        horse.v86Percent = null
        horse.v86Trend = null
      }
    }
  }

  const raceDocById = new Map()
  for (const raceday of racedays) {
    for (const race of raceday.raceList || []) {
      const raceId = Number(race.raceId)
      if (Number.isFinite(raceId)) {
        raceDocById.set(raceId, race)
      }
    }
  }

  const legs = []
  const updatedAt = new Date()
  const raceDataList = Array.isArray(game.gameData?.races) ? game.gameData.races : []
  raceDataList.forEach((raceData, index) => {
    const legInfo = (game.legs || [])[index] || {}
    const raceId = Number(legInfo?.raceId)
    const raceDoc = Number.isFinite(raceId) ? raceDocById.get(raceId) : null
    const selections = []

    if (raceDoc) {
      const horseMap = new Map((raceDoc.horses || []).map(h => [Number(h.id), h]))
      for (const start of raceData?.starts || []) {
        const horseId = Number(start?.horse?.id)
        if (!Number.isFinite(horseId)) continue
        const poolInfo = start?.pools?.V86
        if (!poolInfo || poolInfo.betDistribution == null) continue
        const betDistribution = toNumber(poolInfo.betDistribution, null)
        if (!Number.isFinite(betDistribution)) continue
        const percent = betDistribution / 100
        const trend = poolInfo.trend != null ? Number(poolInfo.trend) : null
        const programNumber = toNumber(start?.number, null)
        const horseName = start?.horse?.name || ''

        const horseDoc = horseMap.get(horseId)
        if (horseDoc) {
          horseDoc.v86Percent = percent
          horseDoc.v86Trend = trend
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
    }

    const raceNumber = Number(raceData?.number)
    legs.push({
      leg: index + 1,
      raceNumber: Number.isFinite(raceNumber) ? raceNumber : (legInfo?.raceNumber ?? null),
      raceId: raceDoc?.raceId ?? legInfo?.raceId ?? null,
      raceDayId: legInfo?.raceDayId ?? null,
      trackName: legInfo?.trackName ?? raceData?.track?.name ?? null,
      selections
    })
  })

  const info = {
    updatedAt,
    gameId: game.gameId,
    source: 'ATG',
    legs
  }

  for (const raceday of racedays) {
    raceday.v86Info = info
    raceday.markModified('raceList')
    raceday.markModified('v86Info')
    await raceday.save()
  }

  return { ok: true, info }
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
    v86Percent: dist?.percent ?? (dist?.betDistribution != null ? dist.betDistribution / 100 : null),
    v86Trend: dist?.trend ?? null,
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


export const buildV86Suggestion = async (racedayId, options = {}, sharedContext = null) => {
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
    const template = templateMap.get(templateKey) || V86_TEMPLATES[0]
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
      legBase = [],
      v86ByRaceId = new Map(),
      v86Available = false,
      v86Info = null,
      gameView = null,
      gameViewStatus = null,
      gameViewMessage = null
    } = context

    if (gameViewStatus && gameViewStatus !== 'ok') {
      return { error: gameViewMessage || 'Ingen V86 hittades för denna tävlingsdag' }
    }

    const userSeedMap = normalizeUserSeeds(userSeeds)
    const variantId = variantKey || resolvedVariantStrategy || 'default'
    const seedBase = variantSeed || `${racedayId}:${template.key}:${modeKey}:${variantId}`
    const allocationRng = createRng(`${seedBase}:alloc`)

    const modeCfg = MODE_CONFIGS[modeKey] || MODE_CONFIGS.balanced

    const legs = (legBase || [])
      .map(leg => {
        const distributionEntry = v86ByRaceId.get(leg.raceId)
        const distributionMap = distributionEntry?.map || new Map()
        return {
          ...leg,
          metrics: computeLegMetrics(leg, distributionMap),
          distribution: distributionMap
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.leg - b.leg)

    if (!legs.length) {
      return { error: 'Ingen V86 hittades för denna tävlingsdag' }
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
        raceId: leg.raceId ?? null,
        raceDayId: leg.raceDayId ?? null,
        trackName: leg.trackName ?? null,
        distance: leg.race?.distance ?? null,
        startTime: leg.startTime ?? leg.race?.startDateTime ?? null,
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
        const minLabel = ROW_COST.toFixed(2).replace('.', ',')
        throw new Error(`Angivet maxbelopp är för lågt – minst ${minLabel} kr krävs.`)
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
        raceId: leg.raceId ?? null,
        raceDayId: leg.raceDayId ?? null,
        trackName: leg.trackName ?? null,
        distance: leg.distance,
        startTime: leg.startTime,
        count: leg.count,
        type,
        poolSize,
        selections,
        v86Distribution: Array.from((leg.distribution || new Map()).values())
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
        raceId: leg.raceId ?? null,
        raceDayId: leg.raceDayId ?? null,
        trackName: leg.trackName ?? null,
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
        raceId: leg.raceId ?? null,
        raceDayId: leg.raceDayId ?? null,
        trackName: leg.trackName ?? null,
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
      v86: {
        used: v86Available,
        updatedAt: v86Info?.updatedAt ? new Date(v86Info.updatedAt).toISOString() : null,
        gameId: v86Info?.gameId || gameView?.gameId || null
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

export const buildV86Suggestions = async (racedayId, options = {}) => {
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
      const result = await buildV86Suggestion(
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
    return { error: errors.length ? errors[0]?.error : 'Det gick inte att skapa V86-spelförslag' }
  }

  return {
    suggestions,
    errors,
    suggestion: suggestions[0] || null,
    generatedAt: new Date().toISOString()
  }
}

export const getV86AiListForRaceday = async (racedayId) => {
  const context = await buildSuggestionContext(racedayId, null)
  if (!context) {
    return { status: 'not_found', message: V86_STATUS_MESSAGES.not_found, legs: [] }
  }

  if (context.gameViewStatus && context.gameViewStatus !== 'ok') {
    return {
      status: context.gameViewStatus,
      message: context.gameViewMessage || V86_STATUS_MESSAGES.missing_game,
      gameId: context.gameView?.gameId || null,
      legs: []
    }
  }

  const legs = (context.legBase || []).map(leg => ({
    leg: leg.leg,
    raceNumber: leg.raceNumber,
    raceId: leg.raceId ?? null,
    raceDayId: leg.raceDayId ?? null,
    trackName: leg.trackName ?? null,
    startTime: leg.startTime ?? null,
    horses: (leg.ranking || []).slice(0, 15).map(horse => ({
      id: horse.id,
      programNumber: horse.programNumber,
      name: horse.name,
      tier: horse.tier || '',
      rank: horse.rank ?? null
    }))
  }))

  return {
    status: 'ok',
    message: null,
    gameId: context.gameView?.gameId || null,
    legs
  }
}

export default {
  V86_TEMPLATES,
  listV86Templates,
  getV86PairingForRaceday,
  getV86GameViewForRaceday,
  getV86AiListForRaceday,
  updateV86DistributionForRaceday,
  buildV86Suggestion,
  buildV86Suggestions
}
