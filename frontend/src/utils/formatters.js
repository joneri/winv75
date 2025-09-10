// Generic small formatting utilities

export const formatElo = (val) => {
  const n = Number(val)
  if (!isFinite(n) || n <= 0) return '—'
  return Math.round(n).toString()
}

export const formatStartPosition = (pos) => {
  if (pos === null || pos === undefined) return '—'
  const n = Number(pos)
  if (!isFinite(n) || n <= 0) return '—'
  return String(n)
}

export const formatPct = (p) => {
  const n = Number(p)
  if (!isFinite(n)) return '—'
  return `${Math.round(n * 100)}%`
}

// New: format a percentage already given in 0–100 scale
export const formatPct100 = (p) => {
  const n = Number(p)
  if (!isFinite(n)) return '—'
  return `${Math.round(n)}%`
}

export const formatNum = (v) => {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))
}

// New: format an integer safely, or em dash
export const formatInt = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return String(Math.round(n))
}
