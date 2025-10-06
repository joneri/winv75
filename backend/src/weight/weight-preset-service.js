import WeightPreset from './weight-preset-model.js'

const sanitizeWeights = (weights = {}) => {
  if (!weights || typeof weights !== 'object') return {}
  const sanitized = {}
  for (const [key, value] of Object.entries(weights)) {
    const num = Number(value)
    if (Number.isFinite(num)) sanitized[key] = num
  }
  return sanitized
}

export const listPresetsForUser = async (user) => {
  const or = [{ scope: 'system' }, { scope: 'personal', ownerId: user.id }]
  if (user.teamId) {
    or.push({ scope: 'team', teamId: user.teamId })
  }
  const query = { $or: or }
  const docs = await WeightPreset.find(query).sort({ scope: 1, updatedAt: -1 }).lean()

  const grouped = { system: [], team: [], personal: [] }
  for (const doc of docs) {
    const payload = formatPreset(doc)
    grouped[doc.scope].push(payload)
  }
  return grouped
}

export const createPreset = async ({ name, description, scope, weights, signalsVersion, user, teamId, locked = false }) => {
  const preset = new WeightPreset({
    name,
    description,
    scope,
    teamId: scope === 'team' ? teamId ?? null : null,
    ownerId: scope === 'personal' ? user.id : null,
    weights: sanitizeWeights(weights),
    signalsVersion: signalsVersion || 'ai-signals-v1',
    locked: scope === 'system' ? true : locked,
    metadata: {
      savedBy: user.id,
      savedByRole: user.role
    }
  })
  await preset.save()
  return formatPreset(preset.toObject())
}

export const getPresetById = async (id, user) => {
  const preset = await WeightPreset.findById(id).lean()
  if (!preset) return null

  if (preset.scope === 'personal' && preset.ownerId !== user.id) return null
  if (preset.scope === 'team' && preset.teamId && preset.teamId !== user.teamId) return null
  return formatPreset(preset)
}

const formatPreset = (doc) => ({
  id: String(doc._id),
  name: doc.name,
  description: doc.description || '',
  scope: doc.scope,
  teamId: doc.teamId || null,
  ownerId: doc.ownerId || null,
  weights: Object.fromEntries(Object.entries(doc.weights || {}).map(([k, v]) => [k, Number(v)])),
  signalsVersion: doc.signalsVersion,
  locked: !!doc.locked,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  metadata: doc.metadata || {}
})
