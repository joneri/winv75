import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import mongoose from 'mongoose'
import { config } from 'dotenv'

import connectDB from '../src/config/db.js'
import createApp from '../src/app.js'

config()

let server
let baseUrl

const getJson = async (path) => {
  const response = await fetch(`${baseUrl}${path}`)
  const body = await response.json()
  return { response, body }
}

const postJson = async (path, payload) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const body = await response.json()
  return { response, body }
}

const deleteJson = async (path) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE'
  })
  const body = await response.json()
  return { response, body }
}

before(async () => {
  await connectDB()

  const app = createApp()
  server = createServer(app)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
})

test('preserved core read endpoints return live data', async () => {
  const { response: racedayListResponse, body: racedays } = await getJson('/api/raceday?limit=5')
  assert.equal(racedayListResponse.status, 200)
  assert.ok(Array.isArray(racedays) && racedays.length > 0, 'Expected stored racedays')

  const seedRaceday = racedays.find((item) => Array.isArray(item?.raceList) && item.raceList.length > 0)
  assert.ok(seedRaceday?._id, 'Expected a raceday with races')

  const { response: summaryResponse, body: summary } = await getJson('/api/raceday/summary?limit=5')
  assert.equal(summaryResponse.status, 200)
  assert.ok(Array.isArray(summary?.items) && summary.items.length > 0, 'Expected raceday summary rows')

  const { response: racedayDetailResponse, body: racedayDetail } = await getJson(`/api/raceday/${seedRaceday._id}`)
  assert.equal(racedayDetailResponse.status, 200)
  assert.equal(String(racedayDetail?._id), String(seedRaceday._id))
  assert.ok(Array.isArray(racedayDetail?.raceList) && racedayDetail.raceList.length > 0, 'Expected race list on raceday detail')

  const seedRace = racedayDetail.raceList.find((race) => Number.isFinite(Number(race?.raceId)))
  assert.ok(seedRace?.raceId, 'Expected a concrete race id from raceday detail')

  const { response: raceResponse, body: race } = await getJson(`/api/race/${seedRace.raceId}`)
  assert.equal(raceResponse.status, 200)
  assert.equal(Number(race?.raceId), Number(seedRace.raceId))
  assert.ok(Array.isArray(race?.horses) && race.horses.length > 0, 'Expected horses on race detail')
  const raceHorseWithPrediction = race.horses.find((item) => Number.isFinite(Number(item?.effectiveElo)))
  assert.ok(raceHorseWithPrediction, 'Expected race detail to expose effective Elo')
  assert.ok(Number.isFinite(Number(raceHorseWithPrediction?.modelProbability)), 'Expected race detail to expose model probability')
  assert.ok(raceHorseWithPrediction?.eloDebug?.weights, 'Expected race detail to expose Elo debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.startMethodAffinity, 'Expected race detail to expose start-method affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.startPositionAffinity, 'Expected race detail to expose start-position affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.distanceAffinity, 'Expected race detail to expose distance affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.trackDistanceAffinity, 'Expected race detail to expose track-distance affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.trackAffinity, 'Expected race detail to expose track affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.shoeSignal, 'Expected race detail to expose shoe signal debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.driverHorseAffinity, 'Expected race detail to expose driver-horse affinity debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.contextAdjustments?.laneBias, 'Expected race detail to expose lane-bias placeholder debug')
  assert.ok(raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown, 'Expected race detail to expose effective Elo breakdown')
  assert.ok('shoeSignalDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose shoe signal delta')
  assert.ok('driverHorseAffinityDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose driver-horse affinity delta')
  assert.ok('laneBiasDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose lane-bias delta')
  assert.ok('distanceDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose distance delta')
  assert.ok('trackDistanceDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose track-distance delta')
  assert.ok('startMethodDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose start-method delta')
  assert.ok('startPositionDelta' in (raceHorseWithPrediction?.eloDebug?.effectiveEloBreakdown || {}), 'Expected race detail breakdown to expose start-position delta')

  const { response: rankingResponse, body: rankings } = await getJson(`/api/horses/rankings/${seedRace.raceId}`)
  assert.equal(rankingResponse.status, 200)
  assert.ok(Array.isArray(rankings) && rankings.length > 0, 'Expected horse rankings for race')
  assert.ok(Number.isFinite(Number(rankings[0]?.effectiveElo)), 'Expected ranking rows to expose effective Elo')
  assert.ok(Number.isFinite(Number(rankings[0]?.modelProbability)), 'Expected ranking rows to expose model probability')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.startMethodAffinity, 'Expected ranking rows to expose start-method affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.startPositionAffinity, 'Expected ranking rows to expose start-position affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.distanceAffinity, 'Expected ranking rows to expose distance affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.trackDistanceAffinity, 'Expected ranking rows to expose track-distance affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.trackAffinity, 'Expected ranking rows to expose track affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.shoeSignal, 'Expected ranking rows to expose shoe signal debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.driverHorseAffinity, 'Expected ranking rows to expose driver-horse affinity debug')
  assert.ok(rankings[0]?.eloDebug?.contextAdjustments?.laneBias, 'Expected ranking rows to expose lane-bias debug')

  const seedHorse = race.horses.find((horse) => Number.isFinite(Number(horse?.id)))
  assert.ok(seedHorse?.id, 'Expected a horse id from race detail')

  const { response: horseResponse, body: horse } = await getJson(`/api/horses/${seedHorse.id}`)
  assert.equal(horseResponse.status, 200)
  assert.equal(Number(horse?.id), Number(seedHorse.id))
  assert.ok(typeof horse?.name === 'string' && horse.name.length > 0, 'Expected horse detail name')
  assert.ok(Number.isFinite(Number(horse?.careerElo ?? horse?.rating)), 'Expected horse detail career Elo')
  assert.ok(Number.isFinite(Number(horse?.formElo ?? horse?.formRating)), 'Expected horse detail form Elo')
  assert.ok(Number.isFinite(Number(horse?.effectiveElo)), 'Expected horse detail effective Elo')
  assert.ok(horse?.eloDebug?.recentRaces, 'Expected horse detail Elo debug')

  const { response: horseListResponse, body: horseList } = await getJson('/api/horses?limit=5')
  assert.equal(horseListResponse.status, 200)
  assert.ok(Array.isArray(horseList?.items) && horseList.items.length > 0, 'Expected horse list items')

  const driverId = race.horses
    .map((horse) => Number(horse?.driver?.licenseId ?? horse?.driver?.id))
    .find((value) => Number.isFinite(value))
  assert.ok(Number.isFinite(driverId), 'Expected a driver id from race detail')

  const { response: driverResponse, body: driver } = await getJson(`/api/driver/${driverId}?resultsLimit=5`)
  assert.equal(driverResponse.status, 200)
  assert.equal(Number(driver?.id), Number(driverId))
  assert.ok(typeof driver?.name === 'string' && driver.name.length > 0, 'Expected driver detail name')
  assert.ok(Array.isArray(driver?.recentResults), 'Expected recent driver results array')

  const { response: driverListResponse, body: driverList } = await getJson('/api/driver?limit=5')
  assert.equal(driverListResponse.status, 200)
  assert.ok(Array.isArray(driverList?.items) && driverList.items.length > 0, 'Expected driver list items')
})

test('suggestion history endpoints persist and expose saved snapshots', async () => {
  const { response: racedayListResponse, body: racedays } = await getJson('/api/raceday?limit=200')
  assert.equal(racedayListResponse.status, 200)
  const seedRaceday = racedays.find((item) => Array.isArray(item?.gameTypes?.V85) && item.gameTypes.V85.length > 0)
  assert.ok(seedRaceday?._id, 'Expected a raceday with V85 support')

  const { response: generateResponse, body: generateBody } = await postJson(`/api/raceday/${seedRaceday._id}/v85`, {
    multi: true,
    modes: ['balanced', 'value'],
    variantCount: 1
  })
  assert.equal(generateResponse.status, 200)
  assert.ok(Array.isArray(generateBody?.suggestions) && generateBody.suggestions.length > 0, 'Expected generated suggestions')

  const sourceSuggestions = generateBody.suggestions.slice(0, 2)
  assert.ok(sourceSuggestions.length > 0, 'Expected at least one suggestion to save')

  const { response: saveResponse, body: saveBody } = await postJson('/api/suggestions/save', {
    racedayId: seedRaceday._id,
    items: sourceSuggestions.map((suggestion, index) => ({
      clientKey: `smoke-${Date.now()}-${index}`,
      gameType: 'V85',
      suggestion,
      requestSnapshot: {
        multi: true,
        modes: ['balanced', 'value'],
        variantCount: 1
      }
    }))
  })
  assert.equal(saveResponse.status, 201)
  assert.ok(Array.isArray(saveBody?.items) && saveBody.items.length > 0, 'Expected explicit save to persist suggestion')
  const savedIds = saveBody.items.map((item) => String(item.id)).filter(Boolean)

  const { response: historyResponse, body: historyBody } = await getJson(`/api/raceday/${seedRaceday._id}/suggestions`)
  assert.equal(historyResponse.status, 200)
  assert.ok(Array.isArray(historyBody?.items) && historyBody.items.length > 0, 'Expected saved suggestion history')

  const savedItem = historyBody.items.find((item) => String(item.id) === String(saveBody.items[0].id)) || historyBody.items[0]
  assert.ok(savedItem?.id, 'Expected a saved suggestion item')

  const { response: detailResponse, body: detailBody } = await getJson(`/api/suggestions/${savedItem.id}`)
  assert.equal(detailResponse.status, 200)
  assert.equal(String(detailBody?.item?.id), String(savedItem.id))
  assert.ok(Array.isArray(detailBody?.item?.ticket?.legs) && detailBody.item.ticket.legs.length > 0, 'Expected stored ticket legs')
  const linkedLeg = detailBody?.item?.ticket?.legs?.find((leg) => leg?.raceId && leg?.raceDayId)
  assert.ok(linkedLeg, 'Expected at least one linked ticket leg')
  assert.equal(String(linkedLeg.raceDayId), String(seedRaceday._id), 'Expected ticket race links to use raceday ObjectId')

  const { response: refreshResponse, body: refreshBody } = await postJson(`/api/suggestions/${savedItem.id}/refresh-results`, {})
  assert.equal(refreshResponse.status, 200)
  assert.equal(String(refreshBody?.item?.id), String(savedItem.id))
  assert.ok(refreshBody?.refreshSummary, 'Expected result refresh summary')
  assert.ok(Number.isFinite(Number(refreshBody?.refreshSummary?.targetedRefresh?.requestedHorseCount || 0)), 'Expected targeted refresh horse count')

  const { response: deleteResponse, body: deleteBody } = await deleteJson(`/api/suggestions/${savedItem.id}`)
  assert.equal(deleteResponse.status, 200)
  assert.equal(String(deleteBody?.id), String(savedItem.id))

  const { response: missingResponse } = await getJson(`/api/suggestions/${savedItem.id}`)
  assert.equal(missingResponse.status, 404)

  const { response: analyticsResponse, body: analyticsBody } = await getJson('/api/suggestions/analytics')
  assert.equal(analyticsResponse.status, 200)
  assert.ok(Number.isFinite(Number(analyticsBody?.summary?.totalSuggestions || 0)), 'Expected analytics summary')

  const markerLabel = `Smoke marker ${Date.now()}`
  const { response: markerResponse, body: markerBody } = await postJson('/api/suggestions/markers', {
    label: markerLabel,
    category: 'strategy',
    description: 'Created by smoke test',
    occurredAt: new Date().toISOString()
  })
  assert.equal(markerResponse.status, 201)
  assert.equal(markerBody?.label, markerLabel)

  for (const suggestionId of savedIds.filter((id) => id !== String(savedItem.id))) {
    const { response } = await deleteJson(`/api/suggestions/${suggestionId}`)
    assert.ok([200, 404].includes(response.status))
  }
})

test('V5 and DD suggestion endpoints return playable live suggestions', async () => {
  const { response: racedayListResponse, body: racedays } = await getJson('/api/raceday?limit=400')
  assert.equal(racedayListResponse.status, 200)

  const v5Raceday = racedays.find((item) => Array.isArray(item?.gameTypes?.V5) && item.gameTypes.V5.length > 0)
  assert.ok(v5Raceday?._id, 'Expected a raceday with V5 support')

  const { response: v5UpdateResponse, body: v5UpdateBody } = await postJson(`/api/raceday/${v5Raceday._id}/v5/update`, {})
  assert.equal(v5UpdateResponse.status, 200)
  assert.ok(v5UpdateBody?.info?.updatedAt || v5UpdateBody?.updatedAt, 'Expected V5 update metadata')

  const { response: v5Response, body: v5Body } = await postJson(`/api/raceday/${v5Raceday._id}/v5`, {
    multi: true,
    modes: ['balanced', 'public'],
    variantCount: 1,
    maxCost: 960
  })
  assert.equal(v5Response.status, 200)
  assert.ok(Array.isArray(v5Body?.suggestions) && v5Body.suggestions.length > 0, 'Expected generated V5 suggestions')
  const v5Suggestion = v5Body.suggestions[0]
  assert.equal(v5Suggestion?.gameType, 'V5')
  assert.equal(Number(v5Suggestion?.stakePerRow), 1)
  assert.equal(v5Suggestion?.legs?.length, 5)

  const v5Spikes = (v5Suggestion?.legs || []).filter((leg) => String(leg?.type || '').toLowerCase().includes('spik'))
  const v5Locks = (v5Suggestion?.legs || []).filter((leg) => String(leg?.type || '').toLowerCase().includes('lås') || String(leg?.type || '').toLowerCase().includes('las'))
  assert.ok(v5Spikes.length <= 1, 'Expected at most one V5 spik')
  assert.ok(v5Locks.length <= 1, 'Expected at most one V5 lås')

  const { response: v5TwoSpikesResponse, body: v5TwoSpikesBody } = await postJson(`/api/raceday/${v5Raceday._id}/v5`, {
    templateKey: 'two-spikes',
    mode: 'balanced',
    maxCost: 960
  })
  assert.equal(v5TwoSpikesResponse.status, 200)
  const v5TwoSpikes = v5TwoSpikesBody?.suggestion || v5TwoSpikesBody
  assert.equal(v5TwoSpikes?.template?.key, 'two-spikes')
  assert.equal((v5TwoSpikes?.legs || []).filter((leg) => String(leg?.type || '').toLowerCase().includes('spik')).length, 2)

  const { response: v5TwoSpikesLockResponse, body: v5TwoSpikesLockBody } = await postJson(`/api/raceday/${v5Raceday._id}/v5`, {
    templateKey: 'two-spikes-one-lock',
    mode: 'balanced',
    maxCost: 960
  })
  assert.equal(v5TwoSpikesLockResponse.status, 200)
  const v5TwoSpikesLock = v5TwoSpikesLockBody?.suggestion || v5TwoSpikesLockBody
  assert.equal(v5TwoSpikesLock?.template?.key, 'two-spikes-one-lock')
  assert.equal((v5TwoSpikesLock?.legs || []).filter((leg) => String(leg?.type || '').toLowerCase().includes('spik')).length, 2)
  assert.equal((v5TwoSpikesLock?.legs || []).filter((leg) => String(leg?.type || '').toLowerCase().includes('lås') || String(leg?.type || '').toLowerCase().includes('las')).length, 1)

  const ddRaceday = racedays.find((item) => Array.isArray(item?.gameTypes?.dd) && item.gameTypes.dd.length > 0)
  assert.ok(ddRaceday?._id, 'Expected a raceday with DD support')

  const { response: ddViewResponse, body: ddViewBody } = await getJson(`/api/raceday/${ddRaceday._id}/dd/game`)
  assert.equal(ddViewResponse.status, 200)
  assert.equal(ddViewBody?.status, 'ok')
  assert.equal(ddViewBody?.legs?.length, 2)

  const { response: ddResponse, body: ddBody } = await postJson(`/api/raceday/${ddRaceday._id}/dd`, {
    templateKey: 'combo-cover',
    mode: 'balanced',
    maxCost: 120
  })
  assert.equal(ddResponse.status, 200)
  const ddSuggestion = ddBody?.suggestion || ddBody
  assert.equal(ddSuggestion?.gameType, 'DD')
  assert.equal(Number(ddSuggestion?.stakePerRow), 10)
  assert.equal(ddSuggestion?.legs?.length, 2)
  assert.ok(Array.isArray(ddSuggestion?.metadata?.comboInsights), 'Expected DD combo insights')
})
