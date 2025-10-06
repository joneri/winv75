import WeightSession from './weight-session-model.js'

const sanitizeNumber = (value, fallback = null) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const sanitizeChanges = (changes = []) => {
  if (!Array.isArray(changes)) return []
  return changes
    .map(change => {
      if (!change || typeof change !== 'object') return null
      const signalId = typeof change.signalId === 'string' ? change.signalId : null
      if (!signalId) return null
      const before = sanitizeNumber(change.before, 0)
      const after = sanitizeNumber(change.after, 0)
      return { signalId, before, after }
    })
    .filter(Boolean)
}

const sanitizeHorseSummary = (items = []) => {
  if (!Array.isArray(items)) return []
  return items
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const horseId = item.horseId != null ? String(item.horseId) : null
      const horseName = typeof item.horseName === 'string' ? item.horseName : null
      const rankBefore = sanitizeNumber(item.rankBefore)
      const rankAfter = sanitizeNumber(item.rankAfter)
      const delta = sanitizeNumber(item.delta)
      const totalBefore = sanitizeNumber(item.totalBefore)
      const totalAfter = sanitizeNumber(item.totalAfter)
      if (!horseId && !horseName) return null
      return {
        horseId,
        horseName,
        rankBefore,
        rankAfter,
        delta,
        totalBefore,
        totalAfter
      }
    })
    .filter(Boolean)
}

const sanitizeProbList = (items = []) => {
  if (!Array.isArray(items)) return []
  return items
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const horseId = item.horseId != null ? String(item.horseId) : null
      const horseName = typeof item.horseName === 'string' ? item.horseName : null
      const prob = sanitizeNumber(item.prob)
      if (!horseId && !horseName) return null
      return { horseId, horseName, prob }
    })
    .filter(Boolean)
}

const sanitizeDominance = (signals = []) => {
  if (!Array.isArray(signals)) return []
  return signals
    .map(sig => (typeof sig === 'string' ? sig : null))
    .filter(Boolean)
}

const sanitizeWeights = (weights = {}) => {
  if (!weights || typeof weights !== 'object') return {}
  const cleaned = {}
  for (const [key, value] of Object.entries(weights)) {
    const num = sanitizeNumber(value)
    if (num == null) continue
    cleaned[key] = num
  }
  return cleaned
}

export const recordWeightSession = async ({
  raceId,
  signalVersion,
  user,
  preset,
  durationMs,
  changes,
  dominanceSignals,
  weights,
  summary,
  notes
}, options = {}) => {
  const sessionModel = options.sessionModel || WeightSession
  const raceIdNum = sanitizeNumber(raceId)
  if (!Number.isFinite(raceIdNum)) {
    throw Object.assign(new Error('raceId is required'), { statusCode: 400 })
  }

  const session = new sessionModel({
    raceId: raceIdNum,
    signalVersion: typeof signalVersion === 'string' && signalVersion ? signalVersion : 'ai-signals-v1',
    userId: user?.id || 'anon',
    userRole: user?.role || 'viewer',
    teamId: user?.teamId || null,
    presetId: preset?.id || null,
    presetScope: preset?.scope || null,
    presetName: preset?.name || null,
    durationMs: sanitizeNumber(durationMs),
    changes: sanitizeChanges(changes),
    dominanceSignals: sanitizeDominance(dominanceSignals),
    weightMap: sanitizeWeights(weights),
    summary: {
      topUp: sanitizeHorseSummary(summary?.topUp),
      topDown: sanitizeHorseSummary(summary?.topDown),
      topProb: sanitizeProbList(summary?.topProb),
      coverageDiff: sanitizeNumber(summary?.coverageDiff, null)
    },
    notes: typeof notes === 'string' ? notes.slice(0, 2000) : ''
  })

  const saved = await session.save()
  const obj = saved.toObject()
  return {
    id: String(obj._id),
    raceId: obj.raceId,
    signalVersion: obj.signalVersion,
    createdAt: obj.createdAt
  }
}

export const listSessionsForRace = async ({ raceId, limit = 20 }, options = {}) => {
  const sessionModel = options.sessionModel || WeightSession
  const raceIdNum = sanitizeNumber(raceId)
  if (!Number.isFinite(raceIdNum)) {
    throw Object.assign(new Error('raceId is required'), { statusCode: 400 })
  }
  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const docs = await sessionModel.find({ raceId: raceIdNum })
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean()
  return docs.map(doc => ({
    id: String(doc._id),
    raceId: doc.raceId,
    signalVersion: doc.signalVersion,
    userId: doc.userId,
    userRole: doc.userRole,
    teamId: doc.teamId,
    presetId: doc.presetId,
    presetScope: doc.presetScope,
    presetName: doc.presetName,
    durationMs: doc.durationMs,
    changes: doc.changes || [],
    dominanceSignals: doc.dominanceSignals || [],
    summary: doc.summary || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }))
}
