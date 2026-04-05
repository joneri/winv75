# Suggestion history and performance analytics

## Purpose
Turn generated V85 and V86 tickets into a persistent evaluation surface by saving frozen snapshots, settling them against real results and exposing performance analytics over time.

## User experience
- Every generated V85 or V86 suggestion is saved automatically.
- The raceday view shows saved tickets for that day and lets the user reopen them.
- A ticket detail view shows the frozen receipt together with settled results per leg.
- An analytics view shows saved-ticket volume, average correct legs, hit tiers, strategy splits and timeline markers for important algorithm changes.

## How it works
- `POST /api/raceday/:id/v85` and `POST /api/raceday/:id/v86` still generate suggestions, then immediately persist each generated ticket as a snapshot.
- The snapshot stores the full ticket payload plus a selected-state snapshot, request snapshot and version markers when available.
- Settlement is derived from stored horse results by `raceId`, so old suggestions stay frozen while result overlays can be refreshed later.
- Raceday history, detail and analytics endpoints opportunistically settle snapshots before returning data.

## Inputs and outputs
- Inputs:
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v86`
  - `GET /api/raceday/:id/suggestions`
  - `GET /api/suggestions/:id`
  - `GET /api/suggestions/analytics`
  - `GET /api/suggestions/markers`
  - `POST /api/suggestions/markers`
- Outputs:
  - Saved suggestion summaries for a raceday.
  - One frozen ticket detail with settlement overlay.
  - Aggregated analytics over time plus timeline markers.

## Key decisions
- Store the full generated ticket as a historical snapshot instead of trying to rebuild old tickets from live data.
- Derive settlement from existing horse result storage so protected horse, race and Elo flows stay intact.
- Keep analytics simple in v1 with server-side aggregation and a lightweight frontend chart.

## Defaults and fallbacks
- Missing results keep the snapshot in `pending_results` or `partial_results`.
- Missing version markers are allowed and surfaced as unknown instead of blocking snapshot creation.
- Timeline markers are optional metadata and do not affect settlement or analytics math.

## Edge cases
- Old V85 tickets are enriched with race references from the raceday before saving so they can still be settled and reopened with race links.
- Partial result availability settles the completed legs and leaves the rest unresolved.
- Saved suggestions remain valid even if Elo, UI or strategy code changes later.

## Data correctness and trust
- The snapshot is immutable historical input.
- Settlement is stored on the snapshot and can be refreshed when more result data exists.
- Analytics are based on saved snapshots, not on current generator output.

## Debugging
- Primary logs:
  - `Failed to build suggestion`
  - `Failed to fetch suggestion analytics`
  - `Failed to load saved suggestions`
- What "good" looks like:
  - a generated ticket appears in the raceday saved-ticket section
  - the detail view shows winners and misses per leg when results exist
  - analytics show recent saved tickets and marker lines on the timeline
- What "bad" looks like:
  - generated suggestions without `snapshotId`
  - empty raceday history right after generation
  - settled suggestions stuck in `pending_results` despite available race winners

## Related files
- `backend/src/suggestion/suggestion-snapshot-model.js`
- `backend/src/suggestion/suggestion-marker-model.js`
- `backend/src/suggestion/suggestion-settlement-service.js`
- `backend/src/suggestion/suggestion-service.js`
- `backend/src/suggestion/suggestion-routes.js`
- `backend/src/raceday/raceday-betting-routes.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/suggestion/SuggestionDetailView.vue`
- `frontend/src/views/suggestion/SuggestionAnalyticsView.vue`
- `frontend/src/views/suggestion/services/SuggestionService.js`

## Change log
- 2026-04-05: Added frozen suggestion snapshots, settlement, raceday history access and analytics plus timeline markers.
