import Raceday from '../raceday/raceday-model.js'
import SuggestionSnapshot from './suggestion-snapshot-model.js'
import SuggestionMarker from './suggestion-marker-model.js'
import { buildSettlementFromTicket, loadRaceWinnerMap } from './suggestion-settlement-service.js'
import { fetchAtgGameById, fetchStartlistById } from '../raceday/raceday-atg-client.js'
import { upsertStartlistData } from '../raceday/raceday-write-service.js'
import { ELO_PREDICTION_VERSION } from '../rating/horse-elo-prediction.js'
import { refreshTargetRaceHorses } from '../raceday/raceday-refresh-service.js'
import Horse from '../horse/horse-model.js'
import updateRatings from '../horse/update-elo-ratings.js'
import RatingMeta from '../horse/rating-meta-model.js'

const DEFAULT_LIMIT = 200
const RESULT_REFRESH_GRACE_MINUTES = Number(process.env.RESULT_REFRESH_GRACE_MINUTES || 25)
const GAME_INFO_FIELD_BY_TYPE = {
  V86: 'v86Info',
  V85: 'v85Info',
  V5: 'v5Info'
}

const toNumber = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toDate = (value) => {
  if (!value) return null
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const toObjectIdString = (value, fallback = null) => {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (/^[a-f0-9]{24}$/i.test(normalized)) {
    return normalized
  }
  return fallback
}

const normalizeTrackName = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '')
  .trim()

const buildRaceLookupKey = ({ trackName, raceNumber }) => {
  const number = Number(raceNumber)
  if (!Number.isFinite(number)) return null
  const trackKey = normalizeTrackName(trackName)
  if (!trackKey) return null
  return `${trackKey}::${number}`
}

const buildSuggestionSelectionSignature = (suggestion = {}) => JSON.stringify({
  templateKey: suggestion?.template?.key || null,
  mode: suggestion?.mode || null,
  variantKey: suggestion?.variant?.key || null,
  generatedAt: suggestion?.generatedAt || null,
  rows: Number(suggestion?.rows || 0),
  totalCost: Number(suggestion?.totalCost || 0),
  legs: (suggestion?.legs || []).map((leg) => ({
    leg: Number(leg?.leg) || null,
    raceId: Number(leg?.raceId) || null,
    selections: (leg?.selections || []).map((selection) => Number(selection?.id) || null)
  }))
})

const enrichLeg = (leg = {}, raceByNumber = new Map(), spikeByLeg = new Map()) => {
  const raceNumber = toNumber(leg?.raceNumber, null)
  const race = Number.isFinite(raceNumber) ? raceByNumber.get(raceNumber) || null : null
  const spikeCandidate = Number.isFinite(toNumber(leg?.leg, null)) ? spikeByLeg.get(Number(leg.leg)) || null : null

  return {
    ...cloneData(leg),
    raceId: toNumber(leg?.raceId, race?.raceId ?? null),
    raceDayId: toObjectIdString(leg?.raceDayId, race?.raceDayId ?? null),
    trackName: leg?.trackName || race?.trackName || null,
    aiSelections: Array.isArray(spikeCandidate?.aiSelections) ? cloneData(spikeCandidate.aiSelections) : []
  }
}

const enrichTicketSnapshot = (raceday, suggestion) => {
  const raceByNumber = new Map(
    (raceday?.raceList || []).map((race) => [
      Number(race?.raceNumber),
      {
        raceId: Number(race?.raceId) || null,
        raceDayId: String(raceday?._id || ''),
        trackName: raceday?.trackName || ''
      }
    ])
  )

  const spikeByLeg = new Map(
    (suggestion?.spikeCandidates || []).map((candidate) => [Number(candidate?.leg), candidate])
  )

  const legs = (suggestion?.legs || []).map((leg) => enrichLeg(leg, raceByNumber, spikeByLeg))
  const spikes = (suggestion?.spikes || []).map((spike) => {
    const enriched = enrichLeg(spike, raceByNumber, spikeByLeg)
    return {
      ...enriched,
      publicTop: spike?.publicTop ?? null
    }
  })

  return {
    ...cloneData(suggestion),
    legs,
    spikes
  }
}

const buildSelectedStateSnapshot = (ticket = {}) => ({
  legs: (ticket?.legs || []).map((leg) => ({
    leg: Number(leg?.leg) || null,
    raceId: toNumber(leg?.raceId, null),
    raceNumber: toNumber(leg?.raceNumber, null),
    count: Number(leg?.count || 0),
    type: leg?.type || '',
    selections: (leg?.selections || []).map((selection) => ({
      id: toNumber(selection?.id, null),
      name: selection?.name || '',
      programNumber: toNumber(selection?.programNumber, null),
      tier: selection?.tier || null,
      isUserPick: Boolean(selection?.isUserPick)
    }))
  }))
})

const normalizeTicketRouteRefs = (ticket = {}, racedayObjectId) => {
  const fallbackRacedayId = String(racedayObjectId || '')
  const normalizeLeg = (leg = {}) => ({
    ...leg,
    raceDayId: toObjectIdString(leg?.raceDayId, fallbackRacedayId || null)
  })

  return {
    ...ticket,
    legs: (ticket?.legs || []).map(normalizeLeg),
    spikes: (ticket?.spikes || []).map(normalizeLeg)
  }
}

const buildVersionSnapshot = (gameType, requestSnapshot = {}) => ({
  gameType,
  eloVersion: process.env.ELO_VERSION || process.env.FORM_ELO_VERSION || ELO_PREDICTION_VERSION,
  algorithmVersion: process.env.SUGGESTION_ALGORITHM_VERSION || process.env.ALGORITHM_VERSION || null,
  strategyVersion: process.env.STRATEGY_VERSION || null,
  configValues: {
    templateKey: requestSnapshot?.templateKey || null,
    maxCost: toNumber(requestSnapshot?.maxCost, null),
    maxBudget: toNumber(requestSnapshot?.maxBudget, null),
    mode: requestSnapshot?.mode || null,
    modes: Array.isArray(requestSnapshot?.modes) ? [...requestSnapshot.modes] : [],
    variantCount: toNumber(requestSnapshot?.variantCount, null)
  }
})

const buildSnapshotSummary = (doc, extra = {}) => ({
  id: String(doc._id),
  racedayObjectId: String(doc.racedayObjectId),
  raceDayId: doc.raceDayId ?? null,
  raceDayDate: doc.raceDayDate || null,
  trackName: doc.trackName || '',
  gameType: doc.gameType,
  generatedAt: doc.generatedAt,
  strategy: doc.strategy || {},
  template: doc.template || {},
  rowCount: doc.rowCount || 0,
  totalCost: doc.totalCost || 0,
  stakePerRow: doc.stakePerRow || 0,
  settlement: doc.settlement || {},
  ...extra
})

async function settleSnapshotsIfPossible(snapshotDocs = []) {
  const docs = snapshotDocs.filter(Boolean)
  if (!docs.length) return docs

  const raceIds = docs.flatMap((doc) => (doc.ticket?.legs || []).map((leg) => Number(leg?.raceId))).filter((raceId) => Number.isFinite(raceId))
  const winnerMap = await loadRaceWinnerMap(raceIds)
  const ticketRacedayIds = [...new Set(
    docs.flatMap((doc) => (doc.ticket?.legs || []).map((leg) => toObjectIdString(leg?.raceDayId, String(doc?.racedayObjectId || '')))).filter(Boolean)
  )]
  const racedays = await loadRacedaysForSnapshots(ticketRacedayIds)
  const racedaysById = new Map((racedays || []).map((raceday) => [String(raceday?._id || ''), raceday]))
  const atgGameCache = new Map()

  for (const doc of docs) {
    const docWinnerMap = new Map(winnerMap)
    const unresolvedRaceIds = [...new Set(
      (doc?.ticket?.legs || [])
        .map((leg) => Number(leg?.raceId))
        .filter((raceId) => Number.isFinite(raceId) && !docWinnerMap.has(raceId))
    )]

    if (unresolvedRaceIds.length > 0) {
      const fallbackWinnerMap = await loadAtgFallbackWinnerMapForTicket({
        doc,
        unresolvedRaceIds,
        racedaysById,
        atgGameCache
      })

      for (const [raceId, winner] of fallbackWinnerMap.entries()) {
        if (!docWinnerMap.has(raceId)) {
          docWinnerMap.set(raceId, winner)
        }
      }
    }

    const nextSettlement = buildSettlementFromTicket(doc.ticket, docWinnerMap)
    const current = doc.settlement || {}
    const currentKey = JSON.stringify({
      status: current.status,
      correctLegs: current.correctLegs,
      hitLegs: current.hitLegs,
      missedLegs: current.missedLegs,
      unresolvedLegs: current.unresolvedLegs,
      summary: current.summary
    })
    const nextKey = JSON.stringify({
      status: nextSettlement.status,
      correctLegs: nextSettlement.correctLegs,
      hitLegs: nextSettlement.hitLegs,
      missedLegs: nextSettlement.missedLegs,
      unresolvedLegs: nextSettlement.unresolvedLegs,
      summary: nextSettlement.summary
    })

    if (currentKey !== nextKey) {
      doc.settlement = nextSettlement
      await doc.save()
    }
  }

  return docs
}

async function loadRacedayForSnapshots(racedayId) {
  const raceday = await Raceday.findById(racedayId, {
    _id: 1,
    raceDayId: 1,
    raceDayDate: 1,
    trackName: 1,
    raceList: 1
  }).lean()

  return raceday || null
}

async function loadRacedaysForSnapshots(racedayIds = []) {
  const ids = [...new Set((racedayIds || []).map((id) => toObjectIdString(id, null)).filter(Boolean))]
  if (!ids.length) return []

  return await Raceday.find({
    _id: { $in: ids }
  }, {
    _id: 1,
    raceDayId: 1,
    raceDayDate: 1,
    trackName: 1,
    raceList: 1,
    v85Info: 1,
    v86Info: 1,
    v5Info: 1
  }).lean()
}

export function buildAtgWinnerFallbackMap({ gameData, ticket = {}, unresolvedRaceIds = [], racedaysById = new Map() }) {
  const unresolvedSet = new Set((unresolvedRaceIds || []).map((raceId) => Number(raceId)).filter((raceId) => Number.isFinite(raceId)))
  const legByLookupKey = new Map()

  for (const leg of ticket?.legs || []) {
    const raceId = Number(leg?.raceId)
    if (!unresolvedSet.has(raceId)) continue
    const raceday = racedaysById.get(String(leg?.raceDayId || '')) || null
    const lookupKey = buildRaceLookupKey({
      trackName: leg?.trackName || raceday?.trackName || '',
      raceNumber: leg?.raceNumber
    })
    if (!lookupKey || legByLookupKey.has(lookupKey)) continue
    legByLookupKey.set(lookupKey, { ...leg, raceId })
  }

  const winners = new Map()
  for (const race of gameData?.races || []) {
    const lookupKey = buildRaceLookupKey({
      trackName: race?.track?.name || '',
      raceNumber: race?.number
    })
    if (!lookupKey) continue

    const leg = legByLookupKey.get(lookupKey)
    if (!leg) continue

    const winnerStart = (race?.starts || []).find((start) => {
      const place = Number(start?.result?.place)
      const finishOrder = Number(start?.result?.finishOrder)
      return place === 1 || finishOrder === 1
    })
    if (!winnerStart?.horse?.id) continue

    const raceday = racedaysById.get(String(leg?.raceDayId || '')) || null
    const startPosition = Number(winnerStart?.number ?? winnerStart?.result?.startNumber)

    winners.set(Number(leg.raceId), {
      raceId: Number(leg.raceId),
      horseId: Number(winnerStart.horse.id),
      horseName: winnerStart?.horse?.name || '',
      placement: 1,
      raceDayId: Number(raceday?.raceDayId) || null,
      raceNumber: Number(leg?.raceNumber) || null,
      placementDisplay: '1',
      startPosition: Number.isFinite(startPosition) ? startPosition : null,
      withdrawn: false,
      source: 'atg_game_results'
    })
  }

  return winners
}

async function loadAtgFallbackWinnerMapForTicket({ doc, unresolvedRaceIds = [], racedaysById = new Map(), atgGameCache = new Map() }) {
  const gameType = String(doc?.gameType || '').toUpperCase()
  const infoField = GAME_INFO_FIELD_BY_TYPE[gameType]
  if (!infoField || !unresolvedRaceIds.length) return new Map()

  const ticketRacedayIds = [...new Set(
    (doc?.ticket?.legs || [])
      .filter((leg) => unresolvedRaceIds.includes(Number(leg?.raceId)))
      .map((leg) => toObjectIdString(leg?.raceDayId, String(doc?.racedayObjectId || '')))
      .filter(Boolean)
  )]

  let gameId = null
  for (const racedayId of ticketRacedayIds) {
    const raceday = racedaysById.get(String(racedayId || '')) || null
    const info = raceday?.[infoField]
    if (info?.gameId) {
      gameId = info.gameId
      break
    }
  }
  if (!gameId) return new Map()

  let gameData = atgGameCache.get(gameId)
  if (gameData === undefined) {
    try {
      gameData = await fetchAtgGameById(gameId)
    } catch (error) {
      gameData = null
    }
    atgGameCache.set(gameId, gameData)
  }
  if (!gameData) return new Map()

  return buildAtgWinnerFallbackMap({
    gameData,
    ticket: doc?.ticket || {},
    unresolvedRaceIds,
    racedaysById
  })
}

const buildRacedayDateFallback = (raceday) => {
  const value = typeof raceday?.raceDayDate === 'string' ? raceday.raceDayDate : null
  if (!value) return null
  const dt = new Date(`${value}T23:59:59`)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function buildSuggestionRaceRefreshPlan({ raceday, raceIds = [], winnerMap = new Map(), now = new Date() }) {
  const nowDate = toDate(now) || new Date()
  const cutoff = new Date(nowDate.getTime() - (RESULT_REFRESH_GRACE_MINUTES * 60 * 1000))
  const raceById = new Map((raceday?.raceList || []).map((race) => [Number(race?.raceId), race]))
  const requestedRaceIds = [...new Set((raceIds || []).map((raceId) => Number(raceId)).filter((raceId) => Number.isFinite(raceId)))]
  const racedayDateFallback = buildRacedayDateFallback(raceday)
  const eligibleRaces = []
  const skippedRaces = []

  for (const raceId of requestedRaceIds) {
    const race = raceById.get(raceId)
    if (!race) {
      skippedRaces.push({
        raceId,
        raceNumber: null,
        reason: 'missing_race_metadata'
      })
      continue
    }

    const raceNumber = Number(race?.raceNumber) || null
    const startDate = toDate(race?.startDateTime)
    const hasStoredWinner = winnerMap.has(raceId)
    const resultsReady = Boolean(race?.resultsReady)

    if (hasStoredWinner) {
      skippedRaces.push({
        raceId,
        raceNumber,
        reason: 'already_has_winner',
        startDateTime: startDate ? startDate.toISOString() : null,
        resultsReady
      })
      continue
    }

    if (resultsReady) {
      eligibleRaces.push({
        raceId,
        raceNumber,
        reason: 'results_marked_ready',
        startDateTime: startDate ? startDate.toISOString() : null,
        resultsReady
      })
      continue
    }

    if (startDate) {
      if (startDate <= cutoff) {
        eligibleRaces.push({
          raceId,
          raceNumber,
          reason: 'elapsed_since_start',
          startDateTime: startDate.toISOString(),
          resultsReady
        })
      } else {
        skippedRaces.push({
          raceId,
          raceNumber,
          reason: 'not_expected_finished_yet',
          startDateTime: startDate.toISOString(),
          resultsReady
        })
      }
      continue
    }

    if (racedayDateFallback && racedayDateFallback <= cutoff) {
      eligibleRaces.push({
        raceId,
        raceNumber,
        reason: 'past_raceday_without_precise_start',
        startDateTime: null,
        resultsReady
      })
      continue
    }

    skippedRaces.push({
      raceId,
      raceNumber,
      reason: 'missing_start_time',
      startDateTime: null,
      resultsReady
    })
  }

  return {
    requestedRaceIds,
    eligibleRaces,
    eligibleRaceIds: eligibleRaces.map((race) => race.raceId),
    skippedRaces,
    cutoffTime: cutoff.toISOString(),
    now: nowDate.toISOString()
  }
}

export function buildSuggestionTicketRefreshPlan({
  ticket = {},
  fallbackRacedayId = null,
  racedays = [],
  winnerMap = new Map(),
  now = new Date()
}) {
  const raceRefsByRacedayId = new Map()

  for (const leg of ticket?.legs || []) {
    const raceId = Number(leg?.raceId)
    if (!Number.isFinite(raceId)) continue
    const racedayId = toObjectIdString(leg?.raceDayId, fallbackRacedayId)
    if (!racedayId) continue

    if (!raceRefsByRacedayId.has(racedayId)) {
      raceRefsByRacedayId.set(racedayId, [])
    }
    raceRefsByRacedayId.get(racedayId).push(raceId)
  }

  const racedaysById = new Map((racedays || []).map((raceday) => [String(raceday?._id || ''), raceday]))
  const racedayPlans = []

  for (const [racedayObjectId, raceIds] of raceRefsByRacedayId.entries()) {
    const raceday = racedaysById.get(racedayObjectId) || null
    const plan = buildSuggestionRaceRefreshPlan({
      raceday,
      raceIds,
      winnerMap,
      now
    })

    racedayPlans.push({
      racedayObjectId,
      raceDayId: Number(raceday?.raceDayId) || null,
      trackName: raceday?.trackName || null,
      raceDayDate: raceday?.raceDayDate || null,
      ...plan
    })
  }

  const requestedRaceIds = [...new Set(racedayPlans.flatMap((plan) => plan.requestedRaceIds))]
  const eligibleRaces = racedayPlans.flatMap((plan) => plan.eligibleRaces.map((race) => ({
    ...race,
    racedayObjectId: plan.racedayObjectId,
    raceDayId: plan.raceDayId,
    trackName: plan.trackName,
    raceDayDate: plan.raceDayDate
  })))
  const skippedRaces = racedayPlans.flatMap((plan) => plan.skippedRaces.map((race) => ({
    ...race,
    racedayObjectId: plan.racedayObjectId,
    raceDayId: plan.raceDayId,
    trackName: plan.trackName,
    raceDayDate: plan.raceDayDate
  })))

  return {
    requestedRaceIds,
    eligibleRaces,
    eligibleRaceIds: [...new Set(eligibleRaces.map((race) => Number(race.raceId)).filter((raceId) => Number.isFinite(raceId)))],
    skippedRaces,
    cutoffTime: racedayPlans[0]?.cutoffTime || null,
    now: racedayPlans[0]?.now || (toDate(now)?.toISOString() || new Date().toISOString()),
    racedays: racedayPlans.map((plan) => ({
      racedayObjectId: plan.racedayObjectId,
      raceDayId: plan.raceDayId,
      trackName: plan.trackName,
      raceDayDate: plan.raceDayDate,
      requestedRaceIds: plan.requestedRaceIds,
      eligibleRaceIds: plan.eligibleRaceIds,
      skippedRaces: plan.skippedRaces
    }))
  }
}

async function loadResolvedRaceSummaries(raceIds = []) {
  const ids = [...new Set((raceIds || []).map((raceId) => Number(raceId)).filter((raceId) => Number.isFinite(raceId)))]
  if (!ids.length) return []

  const rows = await Horse.aggregate([
    { $unwind: '$results' },
    {
      $project: {
        raceId: '$results.raceInformation.raceId',
        raceDate: '$results.raceInformation.date',
        placement: '$results.placement.sortValue',
        withdrawn: '$results.withdrawn'
      }
    },
    { $match: { raceId: { $in: ids }, withdrawn: { $ne: true }, placement: { $gt: 0, $lt: 99 } } },
    {
      $group: {
        _id: '$raceId',
        raceDate: { $first: '$raceDate' },
        finishers: { $sum: 1 },
        winnerCount: {
          $sum: {
            $cond: [{ $eq: ['$placement', 1] }, 1, 0]
          }
        }
      }
    }
  ])

  return rows.map((row) => ({
    raceId: Number(row._id),
    raceDate: row.raceDate ? new Date(row.raceDate) : null,
    finishers: Number(row.finishers || 0),
    winnerCount: Number(row.winnerCount || 0),
    hasResults: Number(row.finishers || 0) >= 2 && Number(row.winnerCount || 0) >= 1
  }))
}

async function refreshSuggestionTicketResults(doc) {
  const raceIds = [...new Set((doc?.ticket?.legs || []).map((leg) => Number(leg?.raceId)).filter((raceId) => Number.isFinite(raceId)))]
  const racedayObjectId = doc?.racedayObjectId || null
  const fallbackRacedayId = toObjectIdString(racedayObjectId, null)
  const beforeMeta = await RatingMeta.findById('elo').lean()
  const ticketRacedayIds = [...new Set(
    (doc?.ticket?.legs || [])
      .map((leg) => toObjectIdString(leg?.raceDayId, fallbackRacedayId))
      .filter(Boolean)
  )]
  const currentRacedays = await loadRacedaysForSnapshots(ticketRacedayIds)
  const existingWinnerMap = await loadRaceWinnerMap(raceIds)
  const refreshNow = new Date()
  const initialPlan = buildSuggestionTicketRefreshPlan({
    ticket: doc?.ticket || {},
    fallbackRacedayId,
    racedays: currentRacedays,
    winnerMap: existingWinnerMap,
    now: refreshNow
  })

  let targetedRefresh = {
    raceIds: [],
    requestedHorseCount: 0,
    updatedHorseCount: 0,
    failedHorseIds: [],
    racedays: []
  }
  let refreshPlan = initialPlan

  const eligibleRacedays = (initialPlan?.racedays || []).filter((plan) => Number.isFinite(Number(plan?.raceDayId)) && (plan?.eligibleRaceIds || []).length > 0)

  if (eligibleRacedays.length > 0) {
    const refreshedRacedays = []

    for (const racedayPlan of eligibleRacedays) {
      const startlist = await fetchStartlistById(racedayPlan.raceDayId)
      const persistedRaceday = await upsertStartlistData(startlist, {
        refreshHorses: false
      })
      refreshedRacedays.push(persistedRaceday)
    }

    const mergedRacedays = new Map(currentRacedays.map((raceday) => [String(raceday?._id || ''), raceday]))
    for (const raceday of refreshedRacedays) {
      mergedRacedays.set(String(raceday?._id || ''), raceday)
    }

    refreshPlan = buildSuggestionTicketRefreshPlan({
      ticket: doc?.ticket || {},
      fallbackRacedayId,
      racedays: [...mergedRacedays.values()],
      winnerMap: existingWinnerMap,
      now: refreshNow
    })

    const refreshRuns = []
    for (const racedayPlan of refreshPlan.racedays.filter((plan) => (plan?.eligibleRaceIds || []).length > 0)) {
      const persistedRaceday = mergedRacedays.get(String(racedayPlan.racedayObjectId || ''))
      if (!persistedRaceday) continue

      const result = await refreshTargetRaceHorses(persistedRaceday, racedayPlan.eligibleRaceIds, { concurrency: 8 })
      refreshRuns.push({
        racedayObjectId: racedayPlan.racedayObjectId,
        raceDayId: racedayPlan.raceDayId,
        trackName: racedayPlan.trackName,
        ...result
      })
    }

    targetedRefresh = {
      raceIds: [...new Set(refreshRuns.flatMap((result) => result.raceIds))],
      requestedHorseCount: refreshRuns.reduce((sum, result) => sum + Number(result.requestedHorseCount || 0), 0),
      updatedHorseCount: refreshRuns.reduce((sum, result) => sum + Number(result.updatedHorseCount || 0), 0),
      failedHorseIds: [...new Set(refreshRuns.flatMap((result) => result.failedHorseIds || []))],
      racedays: refreshRuns
    }
  }

  const resolvedRaces = (await loadResolvedRaceSummaries(refreshPlan.eligibleRaceIds)).filter((race) => race.hasResults)
  const latestResolvedRaceDate = resolvedRaces
    .map((race) => race.raceDate)
    .filter((value) => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0] || null

  let eloFollowUp = {
    action: 'none',
    reason: refreshPlan.eligibleRaceIds.length > 0 ? 'no_new_results' : 'no_eligible_races'
  }

  const lastProcessedRaceDate = beforeMeta?.lastProcessedRaceDate ? new Date(beforeMeta.lastProcessedRaceDate) : null
  if (resolvedRaces.length > 0) {
    if (!lastProcessedRaceDate || (latestResolvedRaceDate && latestResolvedRaceDate > lastProcessedRaceDate)) {
      const eloRun = await updateRatings(undefined, undefined, true, { fullRecalc: false })
      eloFollowUp = {
        action: 'incremental_update_ran',
        reason: 'resolved_results_newer_than_stored_elo',
        summary: eloRun
      }
    } else {
      eloFollowUp = {
        action: 'manual_global_update_recommended',
        reason: 'resolved_results_are_not_newer_than_last_processed_elo_date'
      }
    }
  }

  return {
    refreshPlan,
    targetedRefresh,
    resolvedRaceCount: resolvedRaces.length,
    resolvedRaceIds: resolvedRaces.map((race) => race.raceId),
    latestResolvedRaceDate: latestResolvedRaceDate ? latestResolvedRaceDate.toISOString() : null,
    eloFollowUp
  }
}

async function saveSuggestionSnapshot({ raceday, gameType, suggestion, requestSnapshot = {}, clientKey = null }) {
  const enrichedTicket = enrichTicketSnapshot(raceday, suggestion)
  const generatedAt = suggestion?.generatedAt ? new Date(suggestion.generatedAt) : new Date()
  const dedupeKey = `${gameType}:${buildSuggestionSelectionSignature(enrichedTicket)}`

  let snapshot = await SuggestionSnapshot.findOne({
    racedayObjectId: raceday._id,
    dedupeKey
  })

  if (!snapshot) {
    snapshot = await SuggestionSnapshot.create({
      racedayObjectId: raceday._id,
      raceDayId: Number(raceday.raceDayId) || null,
      raceDayDate: raceday.raceDayDate || null,
      trackName: raceday.trackName || '',
      gameType,
      dedupeKey,
      template: suggestion?.template || {},
      strategy: {
        mode: suggestion?.mode || null,
        modeLabel: suggestion?.modeLabel || null,
        variantKey: suggestion?.variant?.key || null,
        variantLabel: suggestion?.variant?.label || null,
        variantStrategy: suggestion?.variant?.strategy || null,
        variantStrategyLabel: suggestion?.variant?.strategyLabel || null,
        summary: suggestion?.variant?.summary || ''
      },
      generatedAt,
      rowCount: Number(suggestion?.rows || 0),
      totalCost: Number(suggestion?.totalCost || 0),
      stakePerRow: Number(suggestion?.stakePerRow || 0),
      maxBudget: toNumber(suggestion?.maxBudget, null),
      ticket: enrichedTicket,
      selectedStateSnapshot: buildSelectedStateSnapshot(enrichedTicket),
      requestSnapshot: cloneData(requestSnapshot),
      versionSnapshot: buildVersionSnapshot(gameType, requestSnapshot)
    })
  }

  const [settledSnapshot] = await settleSnapshotsIfPossible([snapshot])
  return buildSnapshotSummary(settledSnapshot, {
    clientKey
  })
}

export async function saveSuggestionSelections({ racedayId, items = [] }) {
  const validItems = (items || []).filter((item) => item?.gameType && item?.suggestion && Array.isArray(item?.suggestion?.legs))
  if (!validItems.length) {
    return { items: [] }
  }

  const raceday = await loadRacedayForSnapshots(racedayId)
  if (!raceday) {
    return { items: [] }
  }

  const savedItems = []
  for (const item of validItems) {
    const summary = await saveSuggestionSnapshot({
      raceday,
      gameType: String(item.gameType).toUpperCase(),
      suggestion: item.suggestion,
      requestSnapshot: item.requestSnapshot || {},
      clientKey: item.clientKey || null
    })
    savedItems.push(summary)
  }

  return { items: savedItems }
}

export async function listSuggestionsByRaceday(racedayId, filters = {}) {
  const query = { racedayObjectId: racedayId }
  if (filters?.gameType) {
    query.gameType = String(filters.gameType).toUpperCase()
  }

  const limit = Math.max(1, Math.min(Number(filters?.limit) || DEFAULT_LIMIT, 500))
  const docs = await SuggestionSnapshot.find(query).sort({ generatedAt: -1 }).limit(limit)
  await settleSnapshotsIfPossible(docs)

  const items = docs.map((doc) => buildSnapshotSummary(doc))
  const groupedByGame = items.reduce((acc, item) => {
    const key = item.gameType || 'UNKNOWN'
    const bucket = acc[key] || { count: 0, strategies: new Set() }
    bucket.count += 1
    if (item.strategy?.modeLabel || item.strategy?.mode) {
      bucket.strategies.add(item.strategy?.modeLabel || item.strategy?.mode)
    }
    acc[key] = bucket
    return acc
  }, {})

  return {
    items,
    summary: Object.entries(groupedByGame).map(([gameType, value]) => ({
      gameType,
      count: value.count,
      strategies: [...value.strategies]
    }))
  }
}

export async function getSuggestionById(id) {
  const doc = await SuggestionSnapshot.findById(id)
  if (!doc) {
    return null
  }

  await settleSnapshotsIfPossible([doc])

  const relatedDocs = await SuggestionSnapshot.find({ racedayObjectId: doc.racedayObjectId })
    .sort({ generatedAt: -1 })
    .limit(50)
  await settleSnapshotsIfPossible(relatedDocs)

  return {
    item: {
      id: String(doc._id),
      racedayObjectId: String(doc.racedayObjectId),
      raceDayId: doc.raceDayId ?? null,
      raceDayDate: doc.raceDayDate || null,
      trackName: doc.trackName || '',
      gameType: doc.gameType,
      generatedAt: doc.generatedAt,
      template: doc.template || {},
      strategy: doc.strategy || {},
      rowCount: doc.rowCount || 0,
      totalCost: doc.totalCost || 0,
      stakePerRow: doc.stakePerRow || 0,
      maxBudget: doc.maxBudget ?? null,
      ticket: normalizeTicketRouteRefs(doc.ticket || {}, doc.racedayObjectId),
      selectedStateSnapshot: doc.selectedStateSnapshot || {},
      requestSnapshot: doc.requestSnapshot || {},
      versionSnapshot: doc.versionSnapshot || {},
      settlement: doc.settlement || {}
    },
    related: relatedDocs.map((relatedDoc) => buildSnapshotSummary(relatedDoc))
  }
}

export async function deleteSuggestionById(id) {
  const doc = await SuggestionSnapshot.findByIdAndDelete(id)
  if (!doc) {
    return null
  }

  return {
    id: String(doc._id),
    racedayObjectId: String(doc.racedayObjectId),
    gameType: doc.gameType,
    deleted: true
  }
}

export async function deleteSuggestionsByRaceday(racedayId, filters = {}) {
  const query = { racedayObjectId: racedayId }
  if (filters?.gameType) {
    query.gameType = String(filters.gameType).toUpperCase()
  }

  const result = await SuggestionSnapshot.deleteMany(query)
  return {
    racedayObjectId: String(racedayId),
    gameType: query.gameType || null,
    deletedCount: Number(result?.deletedCount || 0)
  }
}

export async function refreshSuggestionResults(id) {
  const doc = await SuggestionSnapshot.findById(id)
  if (!doc) {
    return null
  }
  const refreshSummary = await refreshSuggestionTicketResults(doc)
  const detail = await getSuggestionById(id)
  return {
    ...detail,
    refreshSummary
  }
}

const groupBy = (items, getKey) => {
  const map = new Map()
  for (const item of items) {
    const key = getKey(item)
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(item)
  }
  return map
}

const buildGroupStats = (items = [], labelBuilder) => {
  return items.map((item) => buildSnapshotSummary(item))
}

const summarizeSnapshotGroup = (docs = [], label) => {
  const settled = docs.filter((doc) => doc.settlement?.resultsAvailable)
  const total = docs.length
  const settledCount = settled.length
  const totalCorrect = settled.reduce((sum, doc) => sum + Number(doc.settlement?.correctLegs || 0), 0)
  const totalSpikes = settled.reduce((sum, doc) => sum + Number(doc.settlement?.spikeStats?.total || 0), 0)
  const spikeHits = settled.reduce((sum, doc) => sum + Number(doc.settlement?.spikeStats?.hits || 0), 0)
  const topRankTotal = settled.reduce((sum, doc) => sum + Number(doc.settlement?.topRankStats?.total || 0), 0)
  const topRankWins = settled.reduce((sum, doc) => sum + Number(doc.settlement?.topRankStats?.wins || 0), 0)

  return {
    label,
    totalSuggestions: total,
    settledSuggestions: settledCount,
    avgCorrect: settledCount ? Number((totalCorrect / settledCount).toFixed(2)) : null,
    right8: settled.reduce((sum, doc) => sum + Number(doc.settlement?.tiers?.right8 || 0), 0),
    right7: settled.reduce((sum, doc) => sum + Number(doc.settlement?.tiers?.right7 || 0), 0),
    right6: settled.reduce((sum, doc) => sum + Number(doc.settlement?.tiers?.right6 || 0), 0),
    spikHitRate: totalSpikes > 0 ? Number((spikeHits / totalSpikes).toFixed(4)) : null,
    topRankWinRate: topRankTotal > 0 ? Number((topRankWins / topRankTotal).toFixed(4)) : null
  }
}

export async function getSuggestionAnalytics(filters = {}) {
  const query = {}
  if (filters?.gameType) {
    query.gameType = String(filters.gameType).toUpperCase()
  }

  const docs = await SuggestionSnapshot.find(query).sort({ generatedAt: 1 })
  await settleSnapshotsIfPossible(docs)

  const timelineMap = new Map()
  for (const doc of docs) {
    const dateKey = new Date(doc.generatedAt).toISOString().slice(0, 10)
    const bucket = timelineMap.get(dateKey) || {
      date: dateKey,
      generatedCount: 0,
      settledCount: 0,
      totalCorrect: 0,
      right8: 0,
      right7: 0,
      right6: 0
    }
    bucket.generatedCount += 1
    if (doc.settlement?.resultsAvailable) {
      bucket.settledCount += 1
      bucket.totalCorrect += Number(doc.settlement?.correctLegs || 0)
      bucket.right8 += Number(doc.settlement?.tiers?.right8 || 0)
      bucket.right7 += Number(doc.settlement?.tiers?.right7 || 0)
      bucket.right6 += Number(doc.settlement?.tiers?.right6 || 0)
    }
    timelineMap.set(dateKey, bucket)
  }

  const timeline = [...timelineMap.values()].map((bucket) => ({
    ...bucket,
    avgCorrect: bucket.settledCount ? Number((bucket.totalCorrect / bucket.settledCount).toFixed(2)) : null
  }))

  const strategyGroups = groupBy(docs, (doc) => doc.strategy?.modeLabel || doc.strategy?.mode || 'Okänd')
  const strategyStats = [...strategyGroups.entries()].map(([label, items]) => summarizeSnapshotGroup(items, label))

  const gameTypeGroups = groupBy(docs, (doc) => doc.gameType || 'UNKNOWN')
  const gameTypeStats = [...gameTypeGroups.entries()].map(([label, items]) => summarizeSnapshotGroup(items, label))

  const versionGroups = groupBy(docs, (doc) => {
    const parts = [
      doc.versionSnapshot?.algorithmVersion || 'algo:okand',
      doc.versionSnapshot?.strategyVersion || 'strategi:okand',
      doc.versionSnapshot?.eloVersion || 'elo:okand'
    ]
    return parts.join(' | ')
  })
  const versionStats = [...versionGroups.entries()].map(([label, items]) => summarizeSnapshotGroup(items, label))

  const markers = await SuggestionMarker.find().sort({ occurredAt: 1 }).lean()
  const overall = summarizeSnapshotGroup(docs, 'Alla förslag')

  return {
    summary: overall,
    timeline,
    strategyStats,
    gameTypeStats,
    versionStats,
    markers,
    recentSuggestions: docs.slice(-20).reverse().map((doc) => buildSnapshotSummary(doc))
  }
}

export async function listMarkers() {
  return SuggestionMarker.find().sort({ occurredAt: 1 }).lean()
}

export async function createMarker(payload = {}) {
  const marker = await SuggestionMarker.create({
    occurredAt: payload?.occurredAt ? new Date(payload.occurredAt) : new Date(),
    label: String(payload?.label || '').trim(),
    description: String(payload?.description || '').trim(),
    category: payload?.category || 'other'
  })
  return marker.toObject()
}

export default {
  saveSuggestionSelections,
  listSuggestionsByRaceday,
  getSuggestionById,
  deleteSuggestionById,
  deleteSuggestionsByRaceday,
  refreshSuggestionResults,
  getSuggestionAnalytics,
  listMarkers,
  createMarker
}
