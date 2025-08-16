// filepath: /Users/jonas.eriksson/dev-stuff/winv75/backend/src/ai-profile/ai-profile-service.js
import AIProfile from './ai-profile-model.js'
import AIProfileHistory from './ai-profile-history-model.js'
import Raceday from '../raceday/raceday-model.js'

// Simple in-memory cache with TTL
const cache = {
  active: null,
  expiresAt: 0,
}
const TTL_MS = 60 * 1000 // 1 minute

function now() { return Date.now() }

function envBool(v, def=false) {
  if (v == null) return def
  return ['1','true','yes','on'].includes(String(v).toLowerCase())
}

function toNum(v, def) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

function seedFromEnv() {
  // Map a subset of existing .env knobs to profile.settings
  return {
    // Ranking weights and bonuses
    eloDiv: toNum(process.env.AI_RANK_FORM_ELO_DIVISOR || process.env.AI_RANK_ELO_DIVISOR, 50),
    wForm: toNum(process.env.AI_RANK_W_FORM, 0),
    bonusShoe: toNum(process.env.AI_RANK_BONUS_SHOE, 0.5),
    bonusFavoriteTrack: toNum(process.env.AI_RANK_BONUS_FAVORITE_TRACK, 0.75),
    bonusFavoriteSpar: toNum(process.env.AI_RANK_BONUS_FAVORITE_SPAR, 0.5),
    bonusBarfotaRuntom: toNum(process.env.AI_RANK_BONUS_BARFOTA_RUNTOM, 0.6),
    bonusTrackFavoriteSpar: toNum(process.env.AI_RANK_BONUS_TRACK_FAVORITE_SPAR, 0.6),
    handicapDivisor: toNum(process.env.AI_RANK_HANDICAP_DIVISOR, 40),

    // Tiering basis and thresholds
    tierBy: String(process.env.AI_RANK_TIER_BY || 'composite'),
    aWithinForm: toNum(process.env.AI_RANK_TIER_A_WITHIN, 5),
    bWithinForm: toNum(process.env.AI_RANK_TIER_B_WITHIN, 15),
    aWithinComp: toNum(process.env.AI_RANK_TIER_A_WITHIN_COMPOSITE, 0.25),
    bWithinComp: toNum(process.env.AI_RANK_TIER_B_WITHIN_COMPOSITE, 0.75),

    // Up/downgrade knobs
    classTopK: toNum(process.env.AI_TIER_CLASS_TOP_K, 3),
    formEloEps: toNum(process.env.AI_TIER_FORM_ELO_EPS, 3),
    plusUpgradeMin: toNum(process.env.AI_TIER_PLUSPOINTS_UPGRADE_MIN, 1.0),

    // Softmax / probabilities
    softmaxBeta: toNum(process.env.AI_TIER_SOFTMAX_BETA, 3.0),

    // Sanity demotion
    minProbForA: toNum(process.env.AI_TIER_MIN_PROB_FOR_A, 0.03),
    minZForA: toNum(process.env.AI_TIER_MIN_Z_FOR_A, -1e9),

    // Banner guidance
    wideOpenMaxTopProb: toNum(process.env.AI_GUIDE_WIDE_OPEN_MAX_TOP_PROB, 0.22),
    spikMinTopProb: toNum(process.env.AI_GUIDE_SPIK_MIN_TOP_PROB, 0.45),
    spikMinGap: toNum(process.env.AI_GUIDE_SPIK_MIN_GAP, 0),
    spikMaxACoverage: toNum(process.env.AI_GUIDE_SPIK_MAX_A_COVERAGE, 1.0),

    // Highlights
    topNbase: toNum(process.env.AI_TOP_N_BASE, 3),
    topNmax: toNum(process.env.AI_TOP_N_MAX, 6),
    zGapMax: toNum(process.env.AI_TOP_ZGAP_MAX, 0.35),
    formEloEpsTop: toNum(process.env.AI_TOP_FORM_ELO_EPS, 3),
    probCoverageMin: toNum(process.env.AI_TOP_PROB_COVERAGE_MIN, 0.65),
  }
}

async function seedDefaultsIfEmpty() {
  const count = await AIProfile.countDocuments()
  if (count > 0) return

  const baseSettings = seedFromEnv()
  const profiles = [
    { key: 'aggressiv', label: 'Aggressiv', description: 'Tydliga spik-lägen, smal A-grupp', settings: { ...baseSettings, softmaxBeta: (baseSettings.softmaxBeta || 3) * 1.2, spikMinTopProb: 0.5, aWithinComp: Math.max(0.15, baseSettings.aWithinComp - 0.05), probCoverageMin: 0.6 } },
    { key: 'balanserad', label: 'Balanserad', description: 'Standardprofil', settings: { ...baseSettings } },
    { key: 'chans', label: 'Chans', description: 'Bredare A-grupp, mer skrällvänlig', settings: { ...baseSettings, softmaxBeta: (baseSettings.softmaxBeta || 3) * 0.8, aWithinComp: (baseSettings.aWithinComp || 0.25) + 0.1, probCoverageMin: 0.7, wideOpenMaxTopProb: 0.25 } },
  ]

  const now = new Date()
  for (const [i, p] of profiles.entries()) {
    await AIProfile.create({ ...p, isActive: i === 1, lastActivatedAt: i === 1 ? now : null })
    await AIProfileHistory.create({ profileKey: p.key, action: 'create', summary: `Seeded profile ${p.label}`, settings: p.settings })
    if (i === 1) {
      await AIProfileHistory.create({ profileKey: p.key, action: 'activate', summary: `Activated ${p.label}`, settings: p.settings })
    }
  }
}

export async function listProfiles() {
  await seedDefaultsIfEmpty()
  const items = await AIProfile.find({}).lean()
  return items
}

export async function getActiveProfile() {
  if (cache.active && cache.expiresAt > now()) return cache.active
  await seedDefaultsIfEmpty()
  const active = await AIProfile.findOne({ isActive: true }).lean()
  cache.active = active
  cache.expiresAt = now() + TTL_MS
  return active
}

export async function getProfileByKey(key) {
  const doc = await AIProfile.findOne({ key }).lean()
  return doc
}

export async function createProfile(data, userId = 'system') {
  const { key, label, description = '', settings = {} } = data || {}
  if (!key || !label) throw new Error('key and label required')
  const exists = await AIProfile.findOne({ key })
  if (exists) throw new Error('Profile key already exists')
  const doc = await AIProfile.create({ key, label, description, settings, isActive: false, createdBy: userId, updatedBy: userId })
  await AIProfileHistory.create({ profileKey: key, action: 'create', summary: `Created ${label}`, settings, userId })
  return doc.toObject()
}

export async function updateProfile(key, patch, userId = 'system') {
  const before = await AIProfile.findOne({ key })
  if (!before) throw new Error('Profile not found')
  const next = {
    label: patch.label ?? before.label,
    description: patch.description ?? before.description,
    settings: patch.settings ? { ...before.settings, ...patch.settings } : before.settings,
    updatedBy: userId,
  }
  const updated = await AIProfile.findOneAndUpdate({ key }, next, { new: true })
  const diff = { before: before.settings, after: next.settings }
  await AIProfileHistory.create({ profileKey: key, action: 'update', summary: `Updated ${updated.label}`, settings: updated.settings, diff, userId })
  cache.active = null
  cache.expiresAt = 0
  return updated.toObject()
}

export async function duplicateProfile(key, newKey, userId = 'system') {
  const base = await AIProfile.findOne({ key }).lean()
  if (!base) throw new Error('Profile not found')
  if (!newKey) throw new Error('newKey required')
  const exists = await AIProfile.findOne({ key: newKey })
  if (exists) throw new Error('newKey already exists')
  const doc = await AIProfile.create({ key: newKey, label: `${base.label} (kopia)`, description: base.description, settings: base.settings, isActive: false, createdBy: userId, updatedBy: userId })
  await AIProfileHistory.create({ profileKey: newKey, action: 'duplicate', summary: `Duplicated from ${key}`, settings: base.settings, userId })
  return doc.toObject()
}

export async function activateProfile(key, userId = 'system') {
  const prof = await AIProfile.findOne({ key })
  if (!prof) throw new Error('Profile not found')
  await AIProfile.updateMany({ isActive: true }, { $set: { isActive: false } })
  prof.isActive = true
  prof.lastActivatedAt = new Date()
  prof.updatedBy = userId
  await prof.save()
  await AIProfileHistory.create({ profileKey: key, action: 'activate', summary: `Activated ${prof.label}`, settings: prof.settings, userId })
  cache.active = prof.toObject()
  cache.expiresAt = now() + TTL_MS

  // Optional: clear cached raceday AI lists so next fetch rebuilds with new preset
  if (envBool(process.env.AI_CLEAR_RACEDAY_CACHE_ON_ACTIVATE, false)) {
    try {
      await Raceday.updateMany({}, { $set: { aiListCache: { generatedAt: null, races: [], presetKey: null } } })
    } catch (e) {
      console.warn('Failed to clear raceday AI cache after activation', e)
    }
  }

  return cache.active
}

export default {
  listProfiles,
  getActiveProfile,
  getProfileByKey,
  createProfile,
  updateProfile,
  duplicateProfile,
  activateProfile,
}
