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

async function getJson(path) {
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

test('proposition translation overview API exposes locked rule and runtime coverage fields', async () => {
  const { response, body } = await getJson('/api/proposition-translations/overview?limit=1000&propLanguage=fi')

  assert.equal(response.status, 200)
  assert.equal(body.language, 'fi')
  assert.equal(typeof body.page?.ruleCoveragePct, 'number')
  assert.equal(typeof body.page?.translatedCoveragePct, 'number')
  assert.equal(typeof body.page?.fallbackSentenceCount, 'number')
  assert.ok(body.page.translatedCoveragePct >= body.page.ruleCoveragePct)
  assert.ok(body.page.fallbackSentenceCount > 0, 'Expected fallback coverage at page level for Finnish overview')

  assert.ok(Array.isArray(body.propositions) && body.propositions.length > 0, 'Expected proposition overview rows')

  const proposition = body.propositions.find((item) => Array.isArray(item?.propTexts) && item.propTexts.length > 0)
  assert.ok(proposition, 'Expected at least one proposition row with proposition texts')
  assert.equal(typeof proposition.ruleCoveragePct, 'number')
  assert.equal(typeof proposition.translatedCoveragePct, 'number')
  assert.equal(typeof proposition.fallbackSentenceCount, 'number')
  assert.equal(typeof proposition.ruleQuality, 'string')
  assert.equal(typeof proposition.quality, 'string')
  assert.ok(proposition.translatedCoveragePct >= proposition.ruleCoveragePct)

  const propText = proposition.propTexts[0]
  assert.equal(typeof propText.ruleCoveragePct, 'number')
  assert.equal(typeof propText.translatedCoveragePct, 'number')
  assert.equal(typeof propText.fallbackSentenceCount, 'number')
  assert.equal(typeof propText.ruleQuality, 'string')
  assert.equal(typeof propText.quality, 'string')
  assert.equal(typeof propText.translation?.ruleSentenceCount, 'number')
  assert.equal(typeof propText.translation?.translatedSentenceCount, 'number')
  assert.equal(typeof propText.translation?.fallbackSentenceCount, 'number')
  assert.ok(propText.translatedCoveragePct >= propText.ruleCoveragePct)

  const fallbackAwareRow = body.propositions.find((item) => (
    item.fallbackSentenceCount > 0 &&
    item.translatedCoveragePct >= item.ruleCoveragePct &&
    item.quality !== item.ruleQuality
  ))
  assert.ok(fallbackAwareRow, 'Expected at least one proposition row where runtime translation quality differs from explicit rule quality')
})