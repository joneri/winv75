import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAtgWinnerFallbackMap,
  buildSuggestionRaceRefreshPlan,
  buildSuggestionTicketRefreshPlan
} from '../src/suggestion/suggestion-service.js'

const NOW = new Date('2026-04-08T18:00:00.000Z')

test('refresh plan skips races that are not expected to be finished yet', () => {
  const plan = buildSuggestionRaceRefreshPlan({
    now: NOW,
    raceday: {
      raceDayDate: '2026-04-08',
      raceList: [
        {
          raceId: 101,
          raceNumber: 1,
          startDateTime: '2026-04-08T17:50:00.000Z',
          resultsReady: false
        }
      ]
    },
    raceIds: [101],
    winnerMap: new Map()
  })

  assert.deepEqual(plan.eligibleRaceIds, [])
  assert.equal(plan.skippedRaces.length, 1)
  assert.equal(plan.skippedRaces[0].reason, 'not_expected_finished_yet')
})

test('refresh plan activates races marked ready even if grace window has not elapsed', () => {
  const plan = buildSuggestionRaceRefreshPlan({
    now: NOW,
    raceday: {
      raceDayDate: '2026-04-08',
      raceList: [
        {
          raceId: 102,
          raceNumber: 2,
          startDateTime: '2026-04-08T17:50:00.000Z',
          resultsReady: true
        }
      ]
    },
    raceIds: [102],
    winnerMap: new Map()
  })

  assert.deepEqual(plan.eligibleRaceIds, [102])
  assert.equal(plan.eligibleRaces[0].reason, 'results_marked_ready')
})

test('refresh plan skips races that already have a stored winner', () => {
  const plan = buildSuggestionRaceRefreshPlan({
    now: NOW,
    raceday: {
      raceDayDate: '2026-04-08',
      raceList: [
        {
          raceId: 103,
          raceNumber: 3,
          startDateTime: '2026-04-08T14:00:00.000Z',
          resultsReady: true
        }
      ]
    },
    raceIds: [103],
    winnerMap: new Map([[103, { horseId: 55 }]])
  })

  assert.deepEqual(plan.eligibleRaceIds, [])
  assert.equal(plan.skippedRaces[0].reason, 'already_has_winner')
})

test('refresh plan can use past raceday fallback when precise start time is missing', () => {
  const plan = buildSuggestionRaceRefreshPlan({
    now: NOW,
    raceday: {
      raceDayDate: '2026-04-07',
      raceList: [
        {
          raceId: 104,
          raceNumber: 4,
          resultsReady: false
        }
      ]
    },
    raceIds: [104],
    winnerMap: new Map()
  })

  assert.deepEqual(plan.eligibleRaceIds, [104])
  assert.equal(plan.eligibleRaces[0].reason, 'past_raceday_without_precise_start')
})

test('ticket refresh plan keeps separate raceday legs for multi-track tickets like V86', () => {
  const plan = buildSuggestionTicketRefreshPlan({
    now: NOW,
    fallbackRacedayId: '507f1f77bcf86cd799439011',
    ticket: {
      legs: [
        {
          leg: 1,
          raceId: 201,
          raceDayId: '507f1f77bcf86cd799439011'
        },
        {
          leg: 2,
          raceId: 202,
          raceDayId: '507f1f77bcf86cd799439012'
        }
      ]
    },
    racedays: [
      {
        _id: '507f1f77bcf86cd799439011',
        raceDayId: 9001,
        trackName: 'Bergsåker',
        raceDayDate: '2026-04-08',
        raceList: [
          {
            raceId: 201,
            raceNumber: 1,
            startDateTime: '2026-04-08T14:00:00.000Z',
            resultsReady: true
          }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439012',
        raceDayId: 9002,
        trackName: 'Solvalla',
        raceDayDate: '2026-04-08',
        raceList: [
          {
            raceId: 202,
            raceNumber: 2,
            startDateTime: '2026-04-08T14:15:00.000Z',
            resultsReady: true
          }
        ]
      }
    ],
    winnerMap: new Map()
  })

  assert.deepEqual(plan.eligibleRaceIds.sort((a, b) => a - b), [201, 202])
  assert.equal(plan.racedays.length, 2)
  assert.deepEqual(
    plan.racedays.map((entry) => entry.raceDayId).sort((a, b) => a - b),
    [9001, 9002]
  )
  assert.deepEqual(
    plan.eligibleRaces.map((race) => Number(race.raceDayId)).sort((a, b) => a - b),
    [9001, 9002]
  )
})

test('ATG fallback winner map resolves a winner when horse result history still lags behind', () => {
  const racedaysById = new Map([
    ['507f1f77bcf86cd799439012', { _id: '507f1f77bcf86cd799439012', raceDayId: 616230, trackName: 'Halmstad' }]
  ])

  const winners = buildAtgWinnerFallbackMap({
    ticket: {
      legs: [
        {
          leg: 7,
          raceId: 1290377,
          raceDayId: '507f1f77bcf86cd799439012',
          raceNumber: 9,
          trackName: 'Halmstad'
        }
      ]
    },
    unresolvedRaceIds: [1290377],
    racedaysById,
    gameData: {
      races: [
        {
          number: 9,
          track: { name: 'Halmstad' },
          starts: [
            { number: 2, horse: { id: 768172, name: 'Amazing Hazel' }, result: { place: 2 } },
            { number: 4, horse: { id: 788949, name: 'Ivan Mauger (DK)' }, result: { place: 1 } }
          ]
        }
      ]
    }
  })

  assert.equal(winners.size, 1)
  assert.equal(winners.get(1290377)?.horseId, 788949)
  assert.equal(winners.get(1290377)?.horseName, 'Ivan Mauger (DK)')
  assert.equal(winners.get(1290377)?.raceDayId, 616230)
  assert.equal(winners.get(1290377)?.raceNumber, 9)
})
