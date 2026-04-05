const MODE_PICK_WEIGHTS = {
  balanced: { composite: 0.5, rank: 0.25, distribution: 0.25 },
  public: { composite: 0.15, rank: 0.05, distribution: 0.8 },
  value: { composite: 0.6, rank: 0.3, distribution: 0.15 }
}

const VARIANT_STRATEGY_LABELS = {
  default: 'Original',
  'shift-forward': 'Skifta fram',
  'shift-back': 'Skifta bak',
  spread: 'Spridning',
  mirror: 'Spegel',
  chaos: 'Fri mix'
}

const MODE_VARIANT_ORDER = {
  balanced: ['default', 'shift-forward', 'spread', 'mirror', 'chaos'],
  mix: ['chaos', 'shift-forward', 'spread', 'mirror', 'default'],
  public: ['default', 'mirror', 'shift-back', 'spread', 'chaos'],
  value: ['default', 'spread', 'shift-back', 'chaos', 'mirror'],
  default: ['default', 'shift-forward', 'spread', 'mirror', 'chaos']
}

export const DEFAULT_SUGGESTION_MODES = ['balanced', 'mix', 'public', 'value']
export const MAX_VARIANTS_PER_MODE = 5
export const DEFAULT_VARIANT_LABELS = ['Variant A', 'Variant B', 'Variant C', 'Variant D', 'Variant E']

export const BASE_SUGGESTION_TEMPLATES = [
  {
    key: 'two-spikes-one-lock',
    label: '2 spikar ett lås',
    counts: [1, 1, 2, 3, 4, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'three-spikes-one-lock',
    label: '3 spikar ett lås',
    counts: [1, 1, 1, 2, 3, 4, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'one-spike',
    label: '2 spikar',
    counts: [1, 1, 2, 3, 4, 5, 5, 6],
    assignment: 'bestToWorst'
  },
  {
    key: 'tv-system',
    label: 'TV-system',
    counts: [6, 5, 4, 4, 3, 3, 2, 1],
    assignment: 'sequential'
  },
  {
    key: 'inverse-t',
    label: 'Omvänt TV-system',
    counts: [1, 2, 3, 3, 4, 4, 5, 6],
    assignment: 'sequential'
  },
  {
    key: 'no-spikes',
    label: 'Inga spikar',
    counts: [3, 3, 4, 4, 4, 5, 5, 5],
    assignment: 'worstToBest'
  }
]

export const cloneSuggestionTemplates = (templates = BASE_SUGGESTION_TEMPLATES) => templates.map(template => ({
  ...template,
  counts: [...template.counts]
}))

export const createSuggestionTemplateMap = (templates = []) => new Map(templates.map(template => [template.key, template]))

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const rotateArray = (list = [], steps = 0) => {
  if (!Array.isArray(list) || !list.length) return []
  const len = list.length
  const offset = ((steps % len) + len) % len
  if (offset === 0) return [...list]
  return [...list.slice(offset), ...list.slice(0, offset)]
}

const interleaveCounts = (list = []) => {
  const result = []
  let start = 0
  let end = list.length - 1
  let toggle = true
  while (start <= end) {
    if (toggle) {
      result.push(list[start])
      start += 1
    } else {
      result.push(list[end])
      end -= 1
    }
    toggle = !toggle
  }
  return result
}

const shuffleArray = (list = [], rng = Math.random) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const rand = typeof rng === 'function' ? rng() : Math.random()
    const j = Math.floor(rand * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const hashString = (value) => {
  const str = String(value ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = Math.imul(31, hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (value) => clamp(value, 0, 1)

const blendWeights = (a = {}, b = {}, mix = 0.5) => ({
  composite: clamp01(lerp(a.composite ?? 0, b.composite ?? 0, mix)),
  rank: clamp01(lerp(a.rank ?? 0, b.rank ?? 0, mix)),
  distribution: clamp01(lerp(a.distribution ?? 0, b.distribution ?? 0, mix))
})

const transformCountsByStrategy = (counts, strategy, rng) => {
  if (!Array.isArray(counts) || !counts.length) return []
  switch (strategy) {
    case 'shift-forward':
      return rotateArray(counts, 1)
    case 'shift-back':
      return rotateArray(counts, -1)
    case 'spread':
      return interleaveCounts(counts)
    case 'mirror':
      return [...counts].reverse()
    case 'chaos':
      return shuffleArray(counts, rng)
    default:
      return [...counts]
  }
}

export const createRng = (seedValue = Date.now()) => {
  let seed = typeof seedValue === 'number' ? seedValue >>> 0 : hashString(seedValue)
  if (seed === 0) seed = 0x6d2b79f5
  return () => {
    seed += 0x6d2b79f5
    let t = seed
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const createModeConfigs = () => ({
  balanced: {
    label: 'Balanserad',
    spikScoreWeight: 1,
    publicScoreWeight: 1,
    pickWeights: MODE_PICK_WEIGHTS.balanced,
    chaosFactor: 0
  },
  public: {
    label: 'Publikfavorit',
    spikScoreWeight: 0.8,
    publicScoreWeight: 3.5,
    pickWeights: MODE_PICK_WEIGHTS.public,
    chaosFactor: 0
  },
  value: {
    label: 'Värdejakt',
    spikScoreWeight: 1,
    publicScoreWeight: -0.6,
    pickWeights: MODE_PICK_WEIGHTS.value,
    chaosFactor: 0.05
  },
  mix: {
    label: 'MIX',
    spikScoreWeight: 1.05,
    publicScoreWeight: 0.5,
    pickWeights: ({ rng }) => {
      const mixValue = typeof rng === 'function' ? rng() : Math.random()
      const base = blendWeights(MODE_PICK_WEIGHTS.balanced, MODE_PICK_WEIGHTS.value, mixValue)
      const jitter = ((typeof rng === 'function' ? rng() : Math.random()) - 0.5) * 0.35
      return {
        composite: clamp01(base.composite + jitter * 0.4),
        rank: clamp01(base.rank + jitter * 0.2),
        distribution: clamp01(base.distribution - jitter * 0.3)
      }
    },
    chaosFactor: 0.35
  }
})

export const resolveVariantDescriptors = (
  modeKey,
  requestedCount,
  {
    defaultVariantsPerMode = 3,
    maxVariantsPerMode = MAX_VARIANTS_PER_MODE,
    defaultVariantLabels = DEFAULT_VARIANT_LABELS
  } = {}
) => {
  const count = clamp(Math.floor(Number(requestedCount) || defaultVariantsPerMode), 1, maxVariantsPerMode)
  const order = MODE_VARIANT_ORDER[modeKey] || MODE_VARIANT_ORDER.default
  const descriptors = []
  let idx = 0
  while (descriptors.length < count && idx < order.length) {
    const strategy = order[idx]
    descriptors.push({
      strategy,
      label: defaultVariantLabels[descriptors.length] || `Variant ${descriptors.length + 1}`,
      strategyLabel: VARIANT_STRATEGY_LABELS[strategy] || strategy
    })
    idx += 1
  }
  while (descriptors.length < count) {
    descriptors.push({
      strategy: 'chaos',
      label: defaultVariantLabels[descriptors.length] || `Variant ${descriptors.length + 1}`,
      strategyLabel: VARIANT_STRATEGY_LABELS.chaos
    })
  }
  return descriptors.map((entry, index) => ({
    ...entry,
    key: `${modeKey}-${entry.strategy}-${index}`,
    seedSuffix: `${entry.strategy}-${index}`
  }))
}

export const buildAllocationWithStrategy = (legs, template, strategy, legScore, sanitizeCount, rng) => {
  const strategyKey = strategy || 'default'
  const allocation = new Map()
  if (template.assignment === 'sequential') {
    const variantCounts = transformCountsByStrategy([...template.counts], strategyKey, rng)
    for (let i = 0; i < legs.length; i += 1) {
      const leg = legs[i]
      const count = variantCounts[i] ?? variantCounts[variantCounts.length - 1] ?? template.counts[template.counts.length - 1]
      allocation.set(leg.leg, sanitizeCount(count))
    }
    return allocation
  }

  const order = template.assignment === 'worstToBest'
    ? [...legs].sort((a, b) => legScore(a) - legScore(b))
    : [...legs].sort((a, b) => legScore(b) - legScore(a))

  const baseCounts = template.assignment === 'worstToBest'
    ? [...template.counts].sort((a, b) => b - a)
    : [...template.counts].sort((a, b) => a - b)

  const variantCounts = transformCountsByStrategy(baseCounts, strategyKey, rng)

  for (let i = 0; i < order.length; i += 1) {
    const leg = order[i]
    const count = variantCounts[i] ?? variantCounts[variantCounts.length - 1] ?? baseCounts[baseCounts.length - 1]
    allocation.set(leg.leg, sanitizeCount(count))
  }

  return allocation
}

export const describeSpikeSummary = (spikes = []) => {
  if (!Array.isArray(spikes) || !spikes.length) {
    return 'Inga spikar – bred gardering'
  }
  const legs = spikes
    .map(spike => Number(spike?.leg))
    .filter(num => Number.isFinite(num))
    .sort((a, b) => a - b)
  if (!legs.length) {
    return 'Inga spikar – bred gardering'
  }
  if (legs.length === 1) {
    return `Spik i Avd ${legs[0]}`
  }
  if (legs.length === 2) {
    return `Spikar Avd ${legs[0]} & Avd ${legs[1]}`
  }
  const prefix = legs.slice(0, -1).map(num => `Avd ${num}`).join(', ')
  return `Spikar ${prefix} & Avd ${legs[legs.length - 1]}`
}

export const normalizeUserSeeds = (value) => {
  const map = new Map()
  if (!value) return map
  const entries = Array.isArray(value)
    ? value
    : Object.entries(value).map(([leg, horseIds]) => ({ leg, horseIds }))
  for (const entry of entries) {
    const legNumber = Number(entry?.leg)
    if (!Number.isFinite(legNumber)) continue
    const ids = Array.isArray(entry?.horseIds) ? entry.horseIds : []
    const normalized = []
    const seen = new Set()
    for (const rawId of ids) {
      const id = Number(rawId)
      if (!Number.isFinite(id) || seen.has(id)) continue
      seen.add(id)
      normalized.push(id)
    }
    if (!normalized.length) continue
    map.set(legNumber, { ids: normalized, set: seen })
  }
  return map
}
