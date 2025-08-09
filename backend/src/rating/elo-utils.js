export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function rmse(actual, predicted) {
  if (!Array.isArray(actual) || !Array.isArray(predicted) || actual.length !== predicted.length || actual.length === 0) {
    return NaN
  }
  let sum = 0
  for (let i = 0; i < actual.length; i++) {
    const a = Number(actual[i])
    const p = Number(predicted[i])
    if (!Number.isFinite(a) || !Number.isFinite(p)) return NaN
    const e = a - p
    sum += e * e
  }
  return Math.sqrt(sum / actual.length)
}
