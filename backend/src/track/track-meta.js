// Centralized track metadata: defaults and overrides

const DEFAULTS = {
  trackLengthMeters: 1000,
  hasOpenStretch: false,
  openStretchLanes: 0
}

// Overrides keyed by track code
// Notes:
// - Å (Åby): open stretch x2
// - Åm (Åmål): 800 m, open stretch x1
// - Sk (Skellefteå): open stretch x1
// - T/Ti (Tingsryd): 1609 m
// - Ar (Arvika), Ho/Hg (Hoting), Kh (Karlshamn), Ov (Oviken): 800 m
// - Sä (Solänget): 1000 m (historically 1004)
const OVERRIDES = {
  'Å': { hasOpenStretch: true, openStretchLanes: 2 },
  'Åm': { trackLengthMeters: 800, hasOpenStretch: true, openStretchLanes: 1 },
  'Sk': { hasOpenStretch: true, openStretchLanes: 1 },
  'T': { trackLengthMeters: 1609 },
  'Ti': { trackLengthMeters: 1609 },
  'Ar': { trackLengthMeters: 800 },
  'Ho': { trackLengthMeters: 800 },
  'Hg': { trackLengthMeters: 800 },
  'Kh': { trackLengthMeters: 800 },
  'Ov': { trackLengthMeters: 800 },
  'Sä': { trackLengthMeters: 1000 }
}

// Equivalent overrides by track name, to use when only trackName is known
const NAME_OVERRIDES = {
  'Åby': { hasOpenStretch: true, openStretchLanes: 2 },
  'Åmål': { trackLengthMeters: 800, hasOpenStretch: true, openStretchLanes: 1 },
  'Skellefteå': { hasOpenStretch: true, openStretchLanes: 1 },
  'Tingsryd': { trackLengthMeters: 1609 },
  'Arvika': { trackLengthMeters: 800 },
  'Hoting': { trackLengthMeters: 800 },
  'Karlshamn': { trackLengthMeters: 800 },
  'Oviken': { trackLengthMeters: 800 },
  'Solänget': { trackLengthMeters: 1000 }
}

export const getSeededMetaForTrack = (trackCode) => {
  const base = { ...DEFAULTS }
  const ov = (trackCode && OVERRIDES[trackCode]) || {}
  const merged = { ...base, ...ov }
  // Validator: if hasOpenStretch true but lanes missing => 1
  if (merged.hasOpenStretch && (!merged.openStretchLanes || merged.openStretchLanes < 1)) {
    merged.openStretchLanes = 1
  }
  return merged
}

export const getSeededMetaForTrackName = (trackName) => {
  const base = { ...DEFAULTS }
  const ov = (trackName && NAME_OVERRIDES[trackName]) || {}
  const merged = { ...base, ...ov }
  if (merged.hasOpenStretch && (!merged.openStretchLanes || merged.openStretchLanes < 1)) {
    merged.openStretchLanes = 1
  }
  return merged
}

export default {
  DEFAULTS,
  OVERRIDES,
  NAME_OVERRIDES,
  getSeededMetaForTrack,
  getSeededMetaForTrackName
}
