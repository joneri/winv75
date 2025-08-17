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

export const formatNum = (v) => {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))
}
