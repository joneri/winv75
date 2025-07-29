import { getWeights } from '../config/scoring.js'

export function calculateHorseScore(horse, weights = getWeights()) {
  const pointsNumeric =
    horse.pointsNumeric ??
    (typeof horse.points === 'string'
      ? parseFloat(horse.points.replace(/\s/g, '')) || 0
      : horse.points || 0)

  const winningRateNumeric =
    horse.winningRateNumeric ?? (parseFloat(horse.winningRate) || 0)

  const placementRateNumeric =
    horse.placementRatesNumeric ?? (parseFloat(horse.placementRate) || 0)

  const placementString =
    horse.placements ?? horse.statistics?.[0]?.placements ?? '0-0-0'

  const [first = 0, second = 0, third = 0] = placementString
    .split('-')
    .map(n => parseInt(n) || 0)

  const consistencyScore =
    horse.consistencyScore ?? first * 3 + second * 2 + third

  return (
    pointsNumeric * weights.points +
    consistencyScore * weights.consistency +
    winningRateNumeric * weights.winRate +
    placementRateNumeric * weights.placementRate
  )
}
