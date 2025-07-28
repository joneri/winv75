export const DEFAULT_WEIGHTS = {
  points: 0.30,
  consistency: 0.30,
  winRate: 0.25,
  placementRate: 0.15
}

export function getWeights() {
  return {
    points: Number(process.env.SCORE_WEIGHT_POINTS) || DEFAULT_WEIGHTS.points,
    consistency: Number(process.env.SCORE_WEIGHT_CONSISTENCY) || DEFAULT_WEIGHTS.consistency,
    winRate: Number(process.env.SCORE_WEIGHT_WIN_RATE) || DEFAULT_WEIGHTS.winRate,
    placementRate: Number(process.env.SCORE_WEIGHT_PLACEMENT_RATE) || DEFAULT_WEIGHTS.placementRate
  }
}

// TODO: Allow injecting probability estimates from external models or APIs
// to further tune the scoring of each horse.
