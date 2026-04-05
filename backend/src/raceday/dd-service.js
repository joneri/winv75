import axios from 'axios'
import Raceday from './raceday-model.js'
import gameService from '../game/game-service.js'
import horseService from '../horse/horse-service.js'
import {
  DEFAULT_SUGGESTION_MODES,
  clamp,
  createModeConfigs,
  createRng
} from './betting-suggestion-support.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'
const DD_ROW_COST = Number.isFinite(Number(process.env.DD_ROW_COST))
  ? Number(process.env.DD_ROW_COST)
  : 10
const DD_MAX_SELECTIONS_PER_LEG = Number.isFinite(Number(process.env.DD_MAX_SELECTIONS_PER_LEG))
  ? Math.max(1, Number(process.env.DD_MAX_SELECTIONS_PER_LEG))
  : 3
const DD_DEFAULT_MAX_BUDGET = Number.isFinite(Number(process.env.DD_DEFAULT_MAX_BUDGET))
  ? Number(process.env.DD_DEFAULT_MAX_BUDGET)
  : 120
const DD_PWIN_WEIGHT = Number.isFinite(Number(process.env.DD_PWIN_WEIGHT))
  ? Number(process.env.DD_PWIN_WEIGHT)
  : 30

const DD_TEMPLATES = [
  { key: 'single', label: 'Rak DD', counts: [1, 1] },
  { key: 'front-press', label: '1x2', counts: [1, 2] },
  { key: 'back-press', label: '2x1', counts: [2, 1] },
  { key: 'combo-cover', label: '2x2', counts: [2, 2] },
  { key: 'value-cover', label: '1x3', counts: [1, 3] }
]

const MODE_CONFIGS = createModeConfigs()
const TEMPLATE_MAP = new Map(DD_TEMPLATES.map(template => [template.key, template]))

export const listDdTemplates = () => DD_TEMPLATES.map(template => ({ key: template.key, label: template.label, counts: template.counts }))

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
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

const fetchCalendarForDate = async (date) => {
  if (!date) return {}
  const url = `${ATG_BASE_URL}/calendar/day/${date}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data?.games || {}
}

const fetchRaceDetails = async (raceKey) => {
  const url = `${ATG_BASE_URL}/races/${raceKey}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data
}

const fetchGameDetails = async (gameId) => {
  const url = `${ATG_BASE_URL}/games/${gameId}`
  const { data } = await axios.get(url, { timeout: 10000 })
  return data
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

const buildTrackIndex = (racedays) => {
  const map = new Map()
  for (const raceday of racedays || []) {
    const key = normalizeTrackName(raceday?.trackName)
    if (!key || map.has(key)) continue
    map.set(key, raceday)
  }
  return map
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
      list.push({ raceData, trackName, trackKey, raceNumber, startTime, startTs: Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY })
    } catch {
      // ignore missing race
    }
  }

  list.sort((a, b) => a.startTs - b.startTs)

  return list.map((info, index) => {
    const raceday = trackIndex.get(info.trackKey) || null
    const raceDoc = raceday
      ? (raceday.raceList || []).find(race => Number(race.raceNumber) === info.raceNumber) || null
      : null

    return {
      legNumber: index + 1,
      raceNumber: Number.isFinite(info.raceNumber) ? info.raceNumber : null,
      raceDayId: raceday?._id ?? null,
      raceId: raceDoc?.raceId ?? null,
      trackName: raceday?.trackName || info.trackName || null,
      startTime: raceDoc?.startDateTime ?? info.startTime ?? null
    }
  })
}

const getDdEntries = (games = {}) => {
  if (Array.isArray(games?.dd) && games.dd.length) return games.dd
  if (Array.isArray(games?.DD) && games.DD.length) return games.DD
  return []
}

export const getDdGameViewForRaceday = async (racedayId) => {
  const raceday = await Raceday.findById(racedayId)
  if (!raceday) {
    return { status: 'not_found', message: 'Tävlingsdag hittades inte.' }
  }

  const dateKey = resolveDateKey(raceday)
  if (!dateKey) {
    return { status: 'missing_date', message: 'Saknar datum för att hitta Dagens Dubbel.' }
  }

  await gameService.getGameTypesForRaceday(raceday._id)
  let games = raceday.atgCalendarGamesRaw || {}
  if (!games || !Object.keys(games).length) {
    games = await fetchCalendarForDate(dateKey)
  }

  const entries = getDdEntries(games)
  if (!entries.length) {
    return { status: 'missing_game', message: 'Ingen Dagens Dubbel hittades för denna tävlingsdag.' }
  }

  const racedaysForDate = await fetchRacedaysForDate(dateKey)
  const trackIndex = buildTrackIndex(racedaysForDate)

  let selected = null
  for (const entry of entries) {
    const legs = await buildLegsFromRaceKeys(entry?.races || [], trackIndex)
    const containsCurrent = legs.some(leg => String(leg.raceDayId || '') === String(racedayId))
    if (!containsCurrent) continue
    selected = { entry, legs }
    break
  }

  if (!selected) {
    return { status: 'missing_game', message: 'Ingen Dagens Dubbel kunde kopplas till denna tävlingsdag.' }
  }

  return {
    status: 'ok',
    message: null,
    gameId: selected.entry?.id || null,
    date: dateKey,
    legs: selected.legs
  }
}

const buildDdLegBase = async (gameView, gameData) => {
  const raceDayIds = [...new Set((gameView?.legs || []).map(leg => String(leg.raceDayId || '')).filter(Boolean))]
  const racedays = raceDayIds.length
    ? await Raceday.find({ _id: { $in: raceDayIds } }, { trackName: 1, raceList: 1 }).lean()
    : []
  const racedaysById = new Map(racedays.map(r => [String(r._id), r]))
  const racesByNumber = new Map((gameData?.races || []).map(race => [Number(race?.number), race]))

  const legs = []
  for (const leg of gameView?.legs || []) {
    const raceId = Number(leg?.raceId)
    if (!Number.isFinite(raceId)) continue
    const ranking = await horseService.getHorseRankings(String(raceId))
    const raceData = racesByNumber.get(Number(leg?.raceNumber)) || null
    const startMap = new Map((raceData?.starts || []).map(start => [Number(start?.horse?.id), start]))
    const raceday = racedaysById.get(String(leg.raceDayId || '')) || null
    const raceDoc = (raceday?.raceList || []).find(race => Number(race.raceId) === raceId) || null
    legs.push({
      leg: leg.legNumber,
      raceId,
      raceNumber: leg.raceNumber,
      raceDayId: leg.raceDayId,
      trackName: leg.trackName,
      startTime: leg.startTime,
      ranking,
      race: raceDoc,
      startMap
    })
  }

  return legs.sort((a, b) => a.leg - b.leg)
}

const winnerOddsOf = (start) => {
  const odds = toNumber(start?.pools?.vinnare?.odds, NaN)
  if (Number.isFinite(odds) && odds > 0) return odds / 100
  const finalOdds = toNumber(start?.pools?.vinnare?.finalOdds, NaN)
  if (Number.isFinite(finalOdds) && finalOdds > 0) return finalOdds / 100
  return null
}

const toHorseEntry = (horse, startMap, comboSupport = {}) => {
  const start = startMap.get(Number(horse?.id)) || {}
  const winnerOdds = winnerOddsOf(start)
  const marketProbRaw = Number.isFinite(winnerOdds) && winnerOdds > 0 ? 1 / winnerOdds : null
  return {
    ...horse,
    winnerOdds,
    marketProbabilityRaw: marketProbRaw,
    comboSupport: comboSupport?.[Number(horse?.programNumber)] ?? 0
  }
}

const buildComboOddsMap = (gameData, legs) => {
  const comboMatrix = gameData?.pools?.dd?.comboOdds
  if (!Array.isArray(comboMatrix) || comboMatrix.length < 1 || legs.length < 2) {
    return { comboOddsMap: new Map(), comboSupportByLeg: [new Map(), new Map()] }
  }

  const leg1Starts = [...(gameData?.races?.[0]?.starts || [])].sort((a, b) => Number(a?.number) - Number(b?.number))
  const leg2Starts = [...(gameData?.races?.[1]?.starts || [])].sort((a, b) => Number(a?.number) - Number(b?.number))
  const comboOddsMap = new Map()
  const leg1Support = new Map()
  const leg2Support = new Map()

  for (let rowIndex = 0; rowIndex < comboMatrix.length; rowIndex += 1) {
    const program1 = Number(leg1Starts[rowIndex]?.number)
    const row = comboMatrix[rowIndex]
    if (!Array.isArray(row) || !Number.isFinite(program1)) continue
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const program2 = Number(leg2Starts[colIndex]?.number)
      const raw = Number(row[colIndex])
      if (!Number.isFinite(program2) || !Number.isFinite(raw) || raw <= 0) continue
      const odds = raw / 100
      comboOddsMap.set(`${program1}:${program2}`, odds)
      const support = 1 / odds
      leg1Support.set(program1, Math.max(leg1Support.get(program1) || 0, support))
      leg2Support.set(program2, Math.max(leg2Support.get(program2) || 0, support))
    }
  }

  return { comboOddsMap, comboSupportByLeg: [leg1Support, leg2Support] }
}

const scoreDdHorse = (horse, modeKey) => {
  const modelProb = Number(horse?.modelProbability ?? horse?.winProbability ?? 0)
  const composite = toNumber(horse?.compositeScore ?? horse?.effectiveElo ?? horse?.rating, 0)
  const marketProb = Number(horse?.marketProbabilityRaw ?? 0)
  const comboSupport = Number(horse?.comboSupport ?? 0)
  const valueGap = modelProb - marketProb

  if (modeKey === 'public') {
    return composite * 0.25 + modelProb * 180 + marketProb * 220 + comboSupport * 90
  }
  if (modeKey === 'value') {
    return composite * 0.3 + modelProb * 220 + valueGap * 260 + comboSupport * 45
  }
  if (modeKey === 'mix') {
    return composite * 0.28 + modelProb * 200 + marketProb * 120 + valueGap * 120 + comboSupport * 80
  }
  return composite * 0.32 + modelProb * 210 + marketProb * 140 + comboSupport * 60
}

const pickDdSelections = (leg, count, modeKey, rng) => {
  const ranked = (leg?.ranking || []).map(horse => ({ ...horse, ddScore: scoreDdHorse(horse, modeKey) }))
  ranked.sort((a, b) => {
    if (Math.abs(b.ddScore - a.ddScore) > 1e-6) return b.ddScore - a.ddScore
    return Number(b.modelProbability ?? 0) - Number(a.modelProbability ?? 0)
  })

  if (modeKey === 'mix' && typeof rng === 'function' && ranked.length > 2) {
    for (let i = 0; i < Math.min(3, ranked.length - 1); i += 1) {
      if (rng() > 0.55) {
        const next = i + 1
        ;[ranked[i], ranked[next]] = [ranked[next], ranked[i]]
      }
    }
  }

  return ranked.slice(0, count).map(horse => ({
    id: horse.id,
    programNumber: horse.programNumber ?? null,
    name: horse.name || '',
    rating: Math.round(toNumber(horse.rating, 0)),
    compositeScore: toNumber(horse.compositeScore ?? horse.effectiveElo ?? horse.rating, null),
    modelProbability: Number(horse.modelProbability ?? horse.winProbability ?? 0),
    winnerOdds: horse.winnerOdds,
    comboSupport: Number(horse.comboSupport ?? 0)
  }))
}

const buildComboInsights = (legs, comboOddsMap) => {
  if (legs.length < 2) return []
  const [first, second] = legs
  const combos = []
  for (const left of first.selections || []) {
    for (const right of second.selections || []) {
      const key = `${left.programNumber}:${right.programNumber}`
      const odds = comboOddsMap.get(key)
      const modelProbability = Number(left.modelProbability || 0) * Number(right.modelProbability || 0)
      combos.push({
        key,
        programs: [left.programNumber, right.programNumber],
        horses: [left.name, right.name],
        comboOdds: odds ?? null,
        modelProbability: Number(modelProbability.toFixed(4)),
        valueScore: odds != null ? Number((modelProbability * odds).toFixed(4)) : null
      })
    }
  }

  return combos.sort((a, b) => {
    const valueA = Number(a.valueScore ?? -Infinity)
    const valueB = Number(b.valueScore ?? -Infinity)
    if (valueB !== valueA) return valueB - valueA
    return Number(b.modelProbability) - Number(a.modelProbability)
  }).slice(0, 8)
}

export const buildDdSuggestion = async (racedayId, options = {}) => {
  const {
    templateKey,
    stake,
    maxCost,
    maxBudget,
    mode = 'balanced',
    variantKey = null,
    variantLabel = null
  } = options || {}

  try {
    const gameView = await getDdGameViewForRaceday(racedayId)
    if (gameView?.status !== 'ok') {
      return { error: gameView?.message || 'Ingen Dagens Dubbel hittades för denna tävlingsdag.' }
    }

    const gameData = await fetchGameDetails(gameView.gameId)
    const legBase = await buildDdLegBase(gameView, gameData)
    if (legBase.length !== 2) {
      return { error: 'Dagens Dubbel kräver två lopp men kunde inte matchas korrekt.' }
    }

    const { comboOddsMap, comboSupportByLeg } = buildComboOddsMap(gameData, legBase)
    const template = TEMPLATE_MAP.get(templateKey) || DD_TEMPLATES[0]
    const modeKey = typeof mode === 'string' ? mode : 'balanced'
    const modeCfg = MODE_CONFIGS[modeKey] || MODE_CONFIGS.balanced
    const budgetInput = [maxCost, maxBudget, stake].map(v => toNumber(v, NaN)).find(val => Number.isFinite(val))
    const budgetLimit = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : DD_DEFAULT_MAX_BUDGET
    const maxRows = budgetLimit === Infinity ? Infinity : Math.floor(budgetLimit / DD_ROW_COST)

    const desiredCounts = template.counts.map(count => Math.min(DD_MAX_SELECTIONS_PER_LEG, Math.max(1, count)))
    let rows = desiredCounts[0] * desiredCounts[1]
    while (maxRows !== Infinity && rows > maxRows) {
      const targetIndex = desiredCounts[0] >= desiredCounts[1] ? 0 : 1
      if (desiredCounts[targetIndex] <= 1) {
        throw new Error(`Kupongen kan inte anpassas till max ${budgetLimit} kr.`)
      }
      desiredCounts[targetIndex] -= 1
      rows = desiredCounts[0] * desiredCounts[1]
    }

    const rng = createRng(`${racedayId}:${template.key}:${modeKey}`)
    const enrichedLegs = legBase.map((leg, index) => {
      const comboSupport = Object.fromEntries(comboSupportByLeg[index]?.entries?.() || [])
      const ranking = (leg.ranking || []).map(horse => toHorseEntry(horse, leg.startMap, comboSupport))
      const selections = pickDdSelections({ ...leg, ranking }, desiredCounts[index], modeKey, rng)
      return {
        leg: leg.leg,
        raceId: leg.raceId,
        raceNumber: leg.raceNumber,
        raceDayId: leg.raceDayId,
        trackName: leg.trackName,
        startTime: leg.startTime,
        count: desiredCounts[index],
        type: desiredCounts[index] === 1 ? 'spik' : 'gardering',
        selections,
        winnerOddsView: ranking
          .filter(horse => Number.isFinite(Number(horse.winnerOdds)))
          .sort((a, b) => Number(a.winnerOdds) - Number(b.winnerOdds))
          .slice(0, 6)
          .map(horse => ({
            id: horse.id,
            programNumber: horse.programNumber,
            name: horse.name,
            winnerOdds: horse.winnerOdds
          }))
      }
    })

    const rowsCount = enrichedLegs.reduce((acc, leg) => acc * Math.max(1, leg.count), 1)
    const totalCost = rowsCount * DD_ROW_COST
    const comboInsights = buildComboInsights(enrichedLegs, comboOddsMap)

    return {
      gameType: 'DD',
      template: { key: template.key, label: template.label },
      mode: modeKey,
      modeLabel: modeCfg.label,
      variant: {
        key: variantKey || `${modeKey}-${template.key}`,
        label: variantLabel || null,
        strategy: modeKey,
        strategyLabel: modeCfg.label,
        summary: comboInsights[0]?.comboOdds != null
          ? `Toppkombo ${comboInsights[0].programs.join('-')} till ${comboInsights[0].comboOdds.toFixed(2)}`
          : 'Välj två vinnare'
      },
      stakePerRow: DD_ROW_COST,
      rows: rowsCount,
      totalCost,
      maxBudget: Number.isFinite(budgetLimit) ? budgetLimit : null,
      generatedAt: new Date().toISOString(),
      dd: {
        used: true,
        gameId: gameView.gameId,
        date: gameView.date
      },
      legs: enrichedLegs,
      spikes: enrichedLegs.filter(leg => leg.count === 1).map(leg => ({
        leg: leg.leg,
        raceNumber: leg.raceNumber,
        selections: leg.selections
      })),
      metadata: {
        comboInsights,
        rules: {
          rowCost: DD_ROW_COST,
          totalLegs: 2,
          winRequirement: '2 av 2'
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) return { error: err.message }
    throw err
  }
}

export const buildDdSuggestions = async (racedayId, options = {}) => {
  const { modes, ...rest } = options || {}
  const modeCandidates = Array.isArray(modes) && modes.length ? modes : DEFAULT_SUGGESTION_MODES
  const uniqueModes = [...new Set(modeCandidates.filter(Boolean))]

  const suggestions = []
  const errors = []
  for (const mode of uniqueModes) {
    const result = await buildDdSuggestion(racedayId, {
      ...rest,
      mode,
      variantKey: `${mode}-${rest.templateKey || 'single'}`,
      variantLabel: mode
    })
    if (result?.error) {
      errors.push({ mode, error: result.error })
      continue
    }
    suggestions.push(result)
  }

  if (!suggestions.length) {
    return { error: errors.length ? errors[0]?.error : 'Det gick inte att skapa DD-spelförslag' }
  }

  return {
    suggestions,
    errors,
    suggestion: suggestions[0] || null,
    generatedAt: new Date().toISOString()
  }
}

export default {
  listDdTemplates,
  getDdGameViewForRaceday,
  buildDdSuggestion,
  buildDdSuggestions
}
