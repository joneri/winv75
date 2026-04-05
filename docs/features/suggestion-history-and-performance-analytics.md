# Suggestion history and performance analytics

## Purpose
Turn generated V85 and V86 tickets into a persistent evaluation surface by saving frozen snapshots, settling them against real results and exposing performance analytics over time.

## User experience
- Generated V85 and V86 suggestions first appear as transient session output on the raceday.
- The user explicitly chooses what gets saved to history, either one ticket at a time or in bulk.
- The raceday view shows a compact saved-history overview for that day and lets the user reopen saved tickets.
- The user can remove one saved ticket at a time or clear all saved tickets for the current raceday when test runs or experiments created noise.
- Unsaved session suggestions can still be opened directly from the raceday session list for inspection before saving.
- A ticket detail view shows the frozen receipt together with settled results per leg and lets the user refresh results from the source.
- An analytics view shows saved-ticket volume, average correct legs, hit tiers, strategy splits and timeline markers in a dark-first evaluation surface.

## How it works
- `POST /api/raceday/:id/v85` and `POST /api/raceday/:id/v86` generate suggestions without persisting everything by default.
- `POST /api/suggestions/save` persists only the tickets the user selected.
- The snapshot stores the full ticket payload plus a selected-state snapshot, request snapshot and version markers when available.
- Settlement is derived from stored horse results by `raceId`, so old suggestions stay frozen while result overlays can be refreshed later.
- `POST /api/suggestions/:id/refresh-results` refreshes the saved ticket's raceday data from the upstream source and then re-runs settlement.
- `DELETE /api/suggestions/:id` removes one saved snapshot.
- `DELETE /api/raceday/:id/suggestions` removes all saved snapshots for one raceday.
- Raceday history, detail and analytics endpoints opportunistically settle snapshots before returning data.

## Inputs and outputs
- Inputs:
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v86`
  - `POST /api/suggestions/save`
  - `GET /api/raceday/:id/suggestions`
  - `GET /api/suggestions/:id`
  - `POST /api/suggestions/:id/refresh-results`
  - `DELETE /api/suggestions/:id`
  - `DELETE /api/raceday/:id/suggestions`
  - `GET /api/suggestions/analytics`
  - `GET /api/suggestions/markers`
  - `POST /api/suggestions/markers`
- Outputs:
  - Saved suggestion summaries for a raceday.
  - One frozen ticket detail with settlement overlay.
  - Aggregated analytics over time plus timeline markers.

## Key decisions
- Store the full generated ticket as a historical snapshot instead of trying to rebuild old tickets from live data.
- Keep the archive curated by requiring explicit save instead of auto-saving every generated variant.
- Derive settlement from existing horse result storage so protected horse, race and Elo flows stay intact.
- Keep analytics simple in v1 with server-side aggregation and a lightweight frontend chart.

## Defaults and fallbacks
- Missing results keep the snapshot in `pending_results` or `partial_results`.
- Missing version markers are allowed and surfaced as unknown instead of blocking snapshot creation.
- Timeline markers are optional metadata and do not affect settlement or analytics math.

## Edge cases
- Old V85 tickets are enriched with race references from the raceday before saving so they can still be settled and reopened with race links.
- Race links in saved tickets must use the repository raceday `ObjectId`, because the race view and its return path are keyed by `/raceday/:racedayId` rather than the external numeric `raceDayId`.
- Partial result availability settles the completed legs and leaves the rest unresolved.
- Saved suggestions remain valid even if Elo, UI or strategy code changes later.
- Unsaved session suggestions are intentionally transient and disappear when the user clears them instead of saving them.
- Deleting a saved suggestion removes the stored snapshot only. It does not touch raceday, race, horse, Elo or result data.

## Data correctness and trust
- The snapshot is immutable historical input.
- Settlement is stored on the snapshot and can be refreshed when more result data exists.
- Analytics are based on saved snapshots, not on current generator output.

## Debugging
- Primary logs:
  - `Failed to build suggestion`
  - `Failed to fetch suggestion analytics`
  - `Failed to load saved suggestions`
  - `Failed to refresh suggestion results`
- What "good" looks like:
  - a generated ticket appears in the raceday session section first
  - an explicitly saved ticket appears in the raceday saved-ticket section
  - saved test tickets can be removed from raceday history or the ticket detail page
  - the detail view shows winners and misses per leg when results exist
  - analytics show recent saved tickets and marker lines on the timeline
- What "bad" looks like:
  - every generated variant instantly floods the saved archive
  - a saved ticket cannot be refreshed from source when results should exist
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
- 2026-04-05: Changed save behavior to explicit user-controlled persistence, added transient raceday preview flow and added manual result refresh for saved tickets.
- 2026-04-05: Added deletion of saved suggestion snapshots from raceday history and ticket detail so test-created archives can be cleaned from the app.
