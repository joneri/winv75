import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attachFieldProbabilities,
  buildHorseEloPrediction
} from '../src/rating/horse-elo-prediction.js'
import { ELO_PROFILES, processRace } from '../src/rating/elo-engine.js'

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

test('form profile decays faster than career profile between races', () => {
  const raceDate = daysAgo(0)
  const longGap = daysAgo(120)
  const careerRatings = new Map([
    ['1', { rating: 1120, numberOfRaces: 12, seedRating: 1000, lastRaceDate: longGap }],
    ['2', { rating: 1000, numberOfRaces: 12, seedRating: 1000, lastRaceDate: longGap }]
  ])
  const formRatings = new Map([
    ['1', { rating: 1120, numberOfRaces: 12, seedRating: 1000, lastRaceDate: longGap }],
    ['2', { rating: 1000, numberOfRaces: 12, seedRating: 1000, lastRaceDate: longGap }]
  ])

  processRace({
    1: { placement: 1, date: raceDate },
    2: { placement: 2, date: raceDate }
  }, careerRatings, {
    k: 0,
    raceDate,
    referenceDate: raceDate,
    profile: ELO_PROFILES.career
  })

  processRace({
    1: { placement: 1, date: raceDate },
    2: { placement: 2, date: raceDate }
  }, formRatings, {
    k: 0,
    raceDate,
    referenceDate: raceDate,
    profile: ELO_PROFILES.form,
    anchorRatings: careerRatings
  })

  const careerGapToSeed = careerRatings.get('1').rating - 1000
  const formGapToCareer = formRatings.get('1').rating - careerRatings.get('1').rating
  assert.ok(formGapToCareer < careerGapToSeed, 'Expected form profile to decay back toward career faster than career decays toward seed')
})

test('gallop hurts form but does not erase a strong recent profile, and withdrawn results are ignored', () => {
  const prediction = buildHorseEloPrediction({
    horse: {
      id: 2,
      results: [
        {
          raceInformation: { raceId: 21, date: daysAgo(7) },
          placement: { displayValue: 'g' },
          startMethod: 'Voltstart',
          distance: { sortValue: 2140 },
          trackCode: 'B'
        },
        {
          raceInformation: { raceId: 22, date: daysAgo(18) },
          placement: { sortValue: 1, displayValue: '1' },
          startMethod: 'Voltstart',
          distance: { sortValue: 2140 },
          trackCode: 'B'
        },
        {
          raceInformation: { raceId: 23, date: daysAgo(30) },
          withdrawn: true,
          placement: { displayValue: 's' },
          startMethod: 'Voltstart',
          distance: { sortValue: 2140 },
          trackCode: 'B'
        }
      ]
    },
    ratingDoc: {
      rating: 1010,
      formRating: 1030
    },
    raceContext: {
      startMethod: 'Voltstart',
      distance: 2140,
      trackCode: 'B',
      raceDate: new Date()
    }
  })

  assert.ok(prediction.debug.recentRaces.some((race) => race.code === 'gallop'), 'Expected gallop to be visible in debug')
  assert.ok(!prediction.debug.recentRaces.some((race) => race.code === 'withdrawn'), 'Expected withdrawn result to be ignored')
  assert.ok(prediction.formElo > prediction.careerElo - 50, 'Expected one gallop to hurt without collapsing form completely')
})

test('track affinity adds a positive delta when the horse consistently outperforms its baseline on the current track', () => {
  const prediction = buildHorseEloPrediction({
    horse: {
      id: 3,
      results: [
        {
          raceInformation: { raceId: 31, date: daysAgo(5) },
          placement: { sortValue: 1, displayValue: '1' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 32, date: daysAgo(14) },
          placement: { sortValue: 2, displayValue: '2' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 33, date: daysAgo(27) },
          placement: { sortValue: 1, displayValue: '1' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 34, date: daysAgo(39) },
          placement: { sortValue: 6, displayValue: '6' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'B'
        },
        {
          raceInformation: { raceId: 35, date: daysAgo(50) },
          placement: { sortValue: 7, displayValue: '7' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'J'
        }
      ]
    },
    ratingDoc: {
      rating: 1000,
      formRating: 1010
    },
    raceContext: {
      startMethod: 'Autostart',
      distance: 2140,
      trackCode: 'S',
      raceDate: new Date()
    }
  })

  assert.equal(prediction.debug.contextAdjustments.trackAffinity.track, 'S')
  assert.equal(prediction.debug.contextAdjustments.trackAffinity.sampleSize, 3)
  assert.ok(prediction.debug.contextAdjustments.trackAffinity.rawMeasurement > 0, 'Expected positive relative track signal')
  assert.ok(prediction.debug.contextAdjustments.trackAffinity.confidence > 0, 'Expected track affinity confidence')
  assert.ok(prediction.debug.contextAdjustments.trackAffinity.deltaElo > 0, 'Expected track affinity to lift effective Elo')
  assert.equal(
    prediction.debug.effectiveEloBreakdown.trackAffinityDelta,
    prediction.debug.contextAdjustments.trackAffinity.deltaElo
  )
})

test('track affinity stays inactive below the minimum sample threshold', () => {
  const prediction = buildHorseEloPrediction({
    horse: {
      id: 4,
      results: [
        {
          raceInformation: { raceId: 41, date: daysAgo(7) },
          placement: { sortValue: 1, displayValue: '1' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'S'
        },
        {
          raceInformation: { raceId: 42, date: daysAgo(21) },
          placement: { sortValue: 2, displayValue: '2' },
          startMethod: 'Autostart',
          distance: { sortValue: 2140 },
          trackCode: 'B'
        }
      ]
    },
    ratingDoc: {
      rating: 1000,
      formRating: 1005
    },
    raceContext: {
      startMethod: 'Autostart',
      distance: 2140,
      trackCode: 'S',
      raceDate: new Date()
    }
  })

  assert.equal(prediction.debug.contextAdjustments.trackAffinity.sampleSize, 1)
  assert.equal(prediction.debug.contextAdjustments.trackAffinity.confidence, 0)
  assert.equal(prediction.debug.contextAdjustments.trackAffinity.deltaElo, 0)
  assert.equal(prediction.debug.contextAdjustments.trackAffinity.reason, 'insufficient_sample')
})
