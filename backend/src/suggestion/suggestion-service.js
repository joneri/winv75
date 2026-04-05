import Raceday from '../raceday/raceday-model.js'
import SuggestionSnapshot from './suggestion-snapshot-model.js'
import SuggestionMarker from './suggestion-marker-model.js'
import { buildSettlementFromTicket, loadRaceWinnerMap } from './suggestion-settlement-service.js'

const DEFAULT_LIMIT = 200

const toNumber = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const enrichLeg = (leg = {}, raceByNumber = new Map(), spikeByLeg = new Map()) => {
  const raceNumber = toNumber(leg?.raceNumber, null)
  const race = Number.isFinite(raceNumber) ? raceByNumber.get(raceNumber) || null : null
  const spikeCandidate = Number.isFinite(toNumber(leg?.leg, null)) ? spikeByLeg.get(Number(leg.leg)) || null : null

  return {
    ...cloneData(leg),
    raceId: toNumber(leg?.raceId, race?.raceId ?? null),
    raceDayId: toNumber(leg?.raceDayId, race?.raceDayId ?? null),
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
        raceDayId: Number(raceday?.raceDayId) || null,
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

const buildVersionSnapshot = (gameType, requestSnapshot = {}) => ({
  gameType,
  eloVersion: process.env.ELO_VERSION || process.env.FORM_ELO_VERSION || null,
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

const buildSnapshotSummary = (doc) => ({
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
  settlement: doc.settlement || {}
})

async function settleSnapshotsIfPossible(snapshotDocs = []) {
  const docs = snapshotDocs.filter(Boolean)
  if (!docs.length) return docs

  const raceIds = docs.flatMap((doc) => (doc.ticket?.legs || []).map((leg) => Number(leg?.raceId))).filter((raceId) => Number.isFinite(raceId))
  const winnerMap = await loadRaceWinnerMap(raceIds)

  for (const doc of docs) {
    const nextSettlement = buildSettlementFromTicket(doc.ticket, winnerMap)
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

export async function persistGeneratedSuggestions({ racedayId, gameType, requestSnapshot = {}, responsePayload = {} }) {
  const suggestions = Array.isArray(responsePayload?.suggestions)
    ? responsePayload.suggestions
    : [responsePayload?.suggestion || responsePayload].filter((entry) => entry && !entry?.error && Array.isArray(entry?.legs))

  if (!suggestions.length) {
    return responsePayload
  }

  const raceday = await Raceday.findById(racedayId, {
    _id: 1,
    raceDayId: 1,
    raceDayDate: 1,
    trackName: 1,
    raceList: 1
  }).lean()

  if (!raceday) {
    return responsePayload
  }

  const savedSuggestions = []

  for (let index = 0; index < suggestions.length; index += 1) {
    const suggestion = suggestions[index]
    const enrichedTicket = enrichTicketSnapshot(raceday, suggestion)
    const generatedAt = suggestion?.generatedAt ? new Date(suggestion.generatedAt) : new Date()

    const snapshot = await SuggestionSnapshot.create({
      racedayObjectId: raceday._id,
      raceDayId: Number(raceday.raceDayId) || null,
      raceDayDate: raceday.raceDayDate || null,
      trackName: raceday.trackName || '',
      gameType,
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

    const [settledSnapshot] = await settleSnapshotsIfPossible([snapshot])
    const summary = buildSnapshotSummary(settledSnapshot)

    suggestion.snapshotId = String(settledSnapshot._id)
    suggestion.settlement = settledSnapshot.settlement || null
    savedSuggestions.push(summary)
  }

  if (Array.isArray(responsePayload?.suggestions)) {
    responsePayload.savedSuggestions = savedSuggestions
  } else if (savedSuggestions[0]) {
    responsePayload.savedSuggestion = savedSuggestions[0]
  }

  return responsePayload
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
      ticket: doc.ticket || {},
      selectedStateSnapshot: doc.selectedStateSnapshot || {},
      requestSnapshot: doc.requestSnapshot || {},
      versionSnapshot: doc.versionSnapshot || {},
      settlement: doc.settlement || {}
    },
    related: relatedDocs.map((relatedDoc) => buildSnapshotSummary(relatedDoc))
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
  persistGeneratedSuggestions,
  listSuggestionsByRaceday,
  getSuggestionById,
  getSuggestionAnalytics,
  listMarkers,
  createMarker
}
