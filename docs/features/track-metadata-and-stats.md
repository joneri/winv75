# Track metadata and stats

## Purpose
Provide track-specific metadata and statistics for race context (track length, open stretch, fastest winning start position, favorite start position, records).

## User experience
Race pages can display track characteristics even when DB metadata is incomplete.

## How it works
Track service resolves DB row by track code and merges missing fields from seeded metadata. Winner-history aggregation updates favorite starting position and track record.

## Inputs and outputs
- Inputs:
  - `GET /api/track/:trackCode`
  - Internal updates from horse/race refresh flows.
- Outputs:
  - Track metadata payload with normalized keys (`trackLengthMeters`, `hasOpenStretch`, `openStretchLanes`) and lane stats (`fastestStartingPosition`, `favouriteStartingPosition`, `trackRecord`).

## Key decisions
- Seeded defaults are returned when DB row is missing (not `404`).
- Legacy `trackLength` is kept aligned with `trackLengthMeters`.

## Defaults and fallbacks
- Missing DB track row returns seeded baseline object.
- Open stretch lanes default to at least 1 if open stretch is true.

## Edge cases
- Invalid start positions (e.g. 99) are excluded from favorite-position stats.
- No winner samples yields minimal/empty computed stats.

## Data correctness and trust
- Track stats are derived from horse result history aggregation.
- Service avoids presenting null critical fields when seeded defaults exist.

## Debugging
- Primary log: warnings when no valid starting positions are found.
- What "good" looks like: track endpoint always returns stable shape for known code.
- What "bad" looks like: repeated null open-stretch fields despite seeded metadata.

## Related files
- `backend/src/track/track-routes.js`
- `backend/src/track/track-service.js`
- `backend/src/track/track-meta.js`
- `backend/src/track/track-model.js`
- `frontend/src/views/race/services/TrackService.js`

## Change log
- 2026-02-27: Initial feature documentation.
