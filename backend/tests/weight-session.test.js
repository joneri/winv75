import test from 'node:test'
import assert from 'node:assert/strict'

import { recordWeightSession, listSessionsForRace } from '../src/weight/weight-session-service.js'
import { listSessionsHandler } from '../src/weight/weight-preset-routes.js'

test('recordWeightSession sanitises payload before persisting', async (t) => {
  let savedDoc = null
  class StubSession {
    constructor(doc) {
      savedDoc = doc
    }

    async save() {
      return {
        toObject() {
          return {
            ...savedDoc,
            _id: 'stub-id',
            createdAt: new Date('2024-01-01T00:00:00Z')
          }
        }
      }
    }
  }

  const longNote = 'x'.repeat(2100)
  const result = await recordWeightSession({
    raceId: '42',
    signalVersion: '',
    user: { id: 7, role: 'analyst', teamId: 'TEAM-1' },
    preset: { id: 'preset-1', scope: 'team', name: 'Team preset' },
    durationMs: '1500',
    changes: [
      { signalId: 'classElo', before: '1.2', after: '1.7' },
      { signalId: '', before: 'x', after: '2' },
      null
    ],
    dominanceSignals: ['classElo', null, 123],
    weights: { classElo: '1', bonus: 'bad', driver: 0.75 },
    summary: {
      topUp: [
        { horseId: 123, horseName: 'Bolt', rankBefore: '5', rankAfter: '2', delta: '-3', totalBefore: '12.4', totalAfter: '15.1' },
        { horseName: null }
      ],
      topDown: [
        { horseId: '456', horseName: 'Flash', rankBefore: 1, rankAfter: '4', delta: 'oops', totalBefore: null, totalAfter: '9.2' }
      ],
      topProb: [
        { horseId: '789', horseName: 'Lucky', prob: '0.42' },
        { horseId: null }
      ],
      coverageDiff: '0.18'
    },
    notes: longNote
  }, { sessionModel: StubSession })

  assert.equal(result.raceId, 42)
  assert.equal(result.signalVersion, 'ai-signals-v1')
  assert(result.createdAt instanceof Date)

  assert.ok(savedDoc)
  assert.equal(savedDoc.raceId, 42)
  assert.equal(savedDoc.userId, 7)
  assert.equal(savedDoc.userRole, 'analyst')
  assert.equal(savedDoc.teamId, 'TEAM-1')
  assert.equal(savedDoc.presetId, 'preset-1')
  assert.equal(savedDoc.durationMs, 1500)
  assert.deepEqual(savedDoc.changes, [{ signalId: 'classElo', before: 1.2, after: 1.7 }])
  assert.deepEqual(savedDoc.dominanceSignals, ['classElo'])
  assert.deepEqual(savedDoc.weightMap, { classElo: 1, driver: 0.75 })
  assert.equal(savedDoc.summary.topUp.length, 1)
  assert.deepEqual(savedDoc.summary.topUp[0], {
    horseId: '123',
    horseName: 'Bolt',
    rankBefore: 5,
    rankAfter: 2,
    delta: -3,
    totalBefore: 12.4,
    totalAfter: 15.1
  })
  assert.deepEqual(savedDoc.summary.topDown[0], {
    horseId: '456',
    horseName: 'Flash',
    rankBefore: 1,
    rankAfter: 4,
    delta: null,
    totalBefore: 0,
    totalAfter: 9.2
  })
  assert.deepEqual(savedDoc.summary.topProb, [{ horseId: '789', horseName: 'Lucky', prob: 0.42 }])
  assert.equal(savedDoc.summary.coverageDiff, 0.18)
  assert.equal(savedDoc.notes.length, 2000)
})

test('recordWeightSession rejects missing raceId with status code 400', async () => {
  await assert.rejects(
    () => recordWeightSession({ raceId: 'not-a-number' }, { sessionModel: class { async save() {} } }),
    (error) => error?.statusCode === 400
  )
})

test('listSessionsForRace normalises inputs and maps fields', async () => {
  const operations = []
  const docs = [{
    _id: 'abc',
    raceId: 77,
    signalVersion: 'signals-v2',
    userId: 'u1',
    userRole: 'analyst',
    teamId: 'team-9',
    presetId: 'preset-x',
    presetScope: 'team',
    presetName: 'Team preset',
    durationMs: 2100,
    changes: [{ signalId: 'classElo', before: 1, after: 1.5 }],
    dominanceSignals: ['classElo'],
    summary: { coverageDiff: 0.05 },
    createdAt: new Date('2024-05-01T10:00:00Z'),
    updatedAt: new Date('2024-05-01T11:00:00Z')
  }]

  const stubQuery = {
    sort(sortSpec) { operations.push({ type: 'sort', sortSpec }); return this },
    limit(limitValue) { operations.push({ type: 'limit', limitValue }); return this },
    async lean() { operations.push({ type: 'lean' }); return docs }
  }

  const stubModel = {
    find(criteria) {
      operations.push({ type: 'find', criteria })
      return stubQuery
    }
  }

  const result = await listSessionsForRace({ raceId: '77', limit: '500' }, { sessionModel: stubModel })

  const findOp = operations.find((op) => op.type === 'find')
  assert.deepEqual(findOp.criteria, { raceId: 77 })
  const limitOp = operations.find((op) => op.type === 'limit')
  assert.equal(limitOp.limitValue, 100)
  assert.equal(result.length, 1)
  assert.deepEqual(result[0], {
    id: 'abc',
    raceId: 77,
    signalVersion: 'signals-v2',
    userId: 'u1',
    userRole: 'analyst',
    teamId: 'team-9',
    presetId: 'preset-x',
    presetScope: 'team',
    presetName: 'Team preset',
    durationMs: 2100,
    changes: [{ signalId: 'classElo', before: 1, after: 1.5 }],
    dominanceSignals: ['classElo'],
    summary: { coverageDiff: 0.05 },
    createdAt: docs[0].createdAt,
    updatedAt: docs[0].updatedAt
  })
})

test('GET /weight-presets/sessions enforces analyst role', async () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
  const next = (err) => { if (err) throw err }

  let called = false
  const listStub = async () => {
    called = true
    return []
  }

  await listSessionsHandler({ query: {}, headers: { 'x-user-role': 'viewer', 'x-user-id': 'viewer-1' } }, res, next, {
    listSessionsForRace: listStub
  })

  assert.equal(res.statusCode, 403)
  assert(res.body?.error)
  assert.equal(called, false)
})

test('GET /weight-presets/sessions returns sessions for analysts', async () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
  const next = (err) => { if (err) throw err }

  let capturedParams = null
  const listStub = async (params) => {
    capturedParams = params
    return [{ id: 's1', raceId: 99 }]
  }

  await listSessionsHandler({ query: { raceId: '99', limit: '15' }, headers: { 'x-user-role': 'analyst', 'x-user-id': 'u1' } }, res, next, {
    listSessionsForRace: listStub
  })

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { sessions: [{ id: 's1', raceId: 99 }] })
  assert.deepEqual(capturedParams, { raceId: '99', limit: '15' })
})
