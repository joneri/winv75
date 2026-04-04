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

  const seedHorse = race.horses.find((horse) => Number.isFinite(Number(horse?.id)))
  assert.ok(seedHorse?.id, 'Expected a horse id from race detail')

  const { response: horseResponse, body: horse } = await getJson(`/api/horses/${seedHorse.id}`)
  assert.equal(horseResponse.status, 200)
  assert.equal(Number(horse?.id), Number(seedHorse.id))
  assert.ok(typeof horse?.name === 'string' && horse.name.length > 0, 'Expected horse detail name')

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
