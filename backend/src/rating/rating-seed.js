// Utilities to compute initial Elo seed ratings from Svensk Travsport points

export function parsePoints(points) {
  if (points == null) return 0
  if (typeof points === 'number') return points
  if (typeof points === 'string') {
    const n = Number(String(points).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function seedFromPoints(pointsNumber, opts = {}) {
  const base = Number(process.env.ELO_SEED_BASE ?? opts.base ?? 1000)
  const alpha = Number(process.env.ELO_SEED_ALPHA ?? opts.alpha ?? 15)
  const min = Number(process.env.ELO_SEED_MIN ?? opts.min ?? 900)
  const max = Number(process.env.ELO_SEED_MAX ?? opts.max ?? 1200)

  const p = Math.max(0, pointsNumber)
  // Log-scale to compress extremes; add 1 to handle 0 points
  const raw = base + alpha * Math.log1p(p)
  const bounded = Math.max(min, Math.min(max, Math.round(raw)))
  return bounded
}

export function seedFromHorseDoc(horseDoc, opts = {}) {
  const p = parsePoints(horseDoc?.points)
  return seedFromPoints(p, opts)
}
