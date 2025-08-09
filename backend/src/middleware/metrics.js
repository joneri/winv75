// Simple in-memory timing/logging middleware and counters for AI-list endpoints

export const aiMetrics = {
  race: { count: 0, totalMs: 0, errors: 0 },
  raceday: { count: 0, totalMs: 0, errors: 0, cacheHits: 0, cacheMisses: 0 },
  horseSummary: { count: 0, totalMs: 0, errors: 0 }
}

export function aiTimingMiddleware(req, res, next) {
  // Only measure AI endpoints
  const isRaceAI = req.path.startsWith('/api/race/') && req.path.endsWith('/ai-list')
  const isRacedayAI = req.path.startsWith('/api/raceday/') && req.path.endsWith('/ai-list')
  const isHorseSummary = req.path === '/api/race/horse-summary'
  if (!isRaceAI && !isRacedayAI && !isHorseSummary) return next()

  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const ms = Number((end - start) / 1000000n)
    const type = isRaceAI ? 'race' : (isRacedayAI ? 'raceday' : 'horseSummary')

    const bucket = aiMetrics[type]
    bucket.count += 1
    bucket.totalMs += ms
    if (res.statusCode >= 500) bucket.errors += 1

    const avg = bucket.count ? Math.round(bucket.totalMs / bucket.count) : 0
    console.log(
      `[AI] ${type} ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms} ms (avg ${avg} ms, count ${bucket.count}, errors ${bucket.errors})`
    )
  })

  next()
}
