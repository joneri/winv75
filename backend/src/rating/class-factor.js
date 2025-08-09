// Map race "class" (e.g., purse/prize money) to a K multiplier.
// Keeps effect modest but meaningful.
// Config via env:
//  ELO_CLASS_MIN=0.9, ELO_CLASS_MAX=1.4, ELO_CLASS_REF=200000 (SEK)

export function classFactorFromPurse(purse, opts = {}) {
  const p = Number(purse) || 0
  const MIN = Number(opts.min ?? process.env.ELO_CLASS_MIN ?? 0.9)
  const MAX = Number(opts.max ?? process.env.ELO_CLASS_MAX ?? 1.4)
  const REF = Number(opts.ref ?? process.env.ELO_CLASS_REF ?? 200000) // reference purse

  if (p <= 0) return 1
  // Smooth compression using log; log1p handles small values well
  const score = Math.log1p(p) / Math.log1p(REF)
  const clamped = Math.max(0, Math.min(score, 2)) // cap extreme values
  // Map 0..2 to MIN..MAX with midpoint ~1 around REF
  const factor = MIN + (MAX - MIN) * (clamped / 2)
  return Number.isFinite(factor) ? factor : 1
}
