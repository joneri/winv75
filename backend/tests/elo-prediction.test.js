import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attachFieldProbabilities,
  buildHorseEloPrediction
} from '../src/rating/horse-elo-prediction.js'

const daysAgo = (days) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date
}

test('recent strong form lifts form and effective elo', () => {
  const prediction = buildHorseEloPrediction({
    horse: {
      id: 1,
      results: [
        {
          raceInformation: { raceId: 11, date: daysAgo(6) },
          placement: { sortValue: 1, displayValue: '1' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 12, date: daysAgo(22) },
          placement: { sortValue: 2, displayValue: '2' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 13, date: daysAgo(48) },
          placement: { sortValue: 3, displayValue: '3' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        }
      ]
    },
    ratingDoc: {
      rating: 1000,
      formRating: 1008
    },
    driver: {
      elo: 1040,
      careerElo: 1015
    },
    raceContext: {
      startMethod: 'Autostart',
      distance: 2140,
      trackCode: 'S',
      raceDate: new Date()
    }
  })

  assert.equal(prediction.careerElo, 1000)
  assert.ok(prediction.formElo > prediction.careerElo, 'Expected strong recent form to lift formElo')
  assert.ok(prediction.effectiveElo >= prediction.formElo - 30, 'Expected effective Elo to stay close to the strong form signal')
  assert.ok(prediction.debug.recentRaces.length >= 3, 'Expected recent race debug rows')
})

test('field probabilities are normalized and ordered by effective elo', () => {
  const field = attachFieldProbabilities([
    { id: 1, prediction: { probabilityScore: 1090, effectiveElo: 1090 } },
    { id: 2, prediction: { probabilityScore: 1040, effectiveElo: 1040 } },
    { id: 3, prediction: { probabilityScore: 980, effectiveElo: 980 } }
  ])

  const total = field.reduce((sum, horse) => sum + Number(horse.modelProbability || 0), 0)
  assert.ok(Math.abs(total - 1) < 0.0002, 'Expected model probabilities to sum to ~1')
  assert.equal(field[0].id, 1)
  assert.equal(field[0].prediction.fieldRank, 1)
  assert.ok(field[0].modelProbability > field[1].modelProbability)
  assert.ok(field[1].modelProbability > field[2].modelProbability)
})
