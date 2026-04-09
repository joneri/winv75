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
- When stored horse results still lag behind but a supported ATG game already exposes official placings, settlement can use that game result as a fallback for the unresolved leg.
- `POST /api/suggestions/:id/refresh-results` refreshes the saved ticket's raceday data from the upstream source, but only for races that actually need attention right now.
- The refresh path skips races that already have a stored winner, skips races that should not be finished yet, and only refreshes horses in ticket races that are old enough or explicitly marked ready.
- For multi-track games such as V86, the refresh path follows each ticket leg's own `raceDayId` and can therefore refresh both paired raceday documents in one run.
- The response reports both the refresh plan and whether a global Elo follow-up was run or is still recommended.
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
- Result refresh uses a grace window after planned start time before it assumes a race should be finished. `resultsReady` from the source can still activate a race earlier.

## Edge cases
- Old V85 tickets are enriched with race references from the raceday before saving so they can still be settled and reopened with race links.
- Race links in saved tickets must use the repository raceday `ObjectId`, because the race view and its return path are keyed by `/raceday/:racedayId` rather than the external numeric `raceDayId`.
- Partial result availability settles the completed legs and leaves the rest unresolved.
- A race may be marked `resultsReady` in Travsport before horse histories have caught up. In that case the ticket settlement now falls back to ATG game results for supported game types instead of staying pending unnecessarily.
- Saved suggestions remain valid even if Elo, UI or strategy code changes later.
- Unsaved session suggestions are intentionally transient and disappear when the user clears them instead of saving them.
- Deleting a saved suggestion removes the stored snapshot only. It does not touch raceday, race, horse, Elo or result data.
- A saved ticket refresh may legitimately do nothing if every leg is still in the future or already has a stored winner. That is treated as a correct no-op, not a failed refresh.
- A V86 ticket can span two tracks. Result refresh therefore cannot assume that every leg belongs to the snapshot's primary raceday document.

## Data correctness and trust
- The snapshot is immutable historical input.
- Settlement is stored on the snapshot and can be refreshed when more result data exists.
- Manual result refresh now targets only the races on the saved ticket, then re-reads settlement from the same stored horse results that settlement always uses.
- Manual result refresh is also time-aware. It only refreshes races that are expected to be finished, unless upstream has already flagged them as ready.
- Manual result refresh is also ticket-aware across multiple raceday documents, so paired V86 legs can update from both tracks before settlement is recalculated.
- If a refreshed race still lacks a winner in `Horse.results`, settlement now tries the matching ATG game payload before leaving the leg unresolved.
- If refreshed results are newer than the stored Elo checkpoint, the refresh path also triggers an incremental Elo update. If not, the response tells the user to run global Elo update explicitly.
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
- 2026-04-05: Changed manual result refresh to wait for horse-result storage refresh before settlement is re-read, so the button updates real stored winners rather than only the raceday shell.
- 2026-04-08: Changed saved-ticket result refresh to target only the relevant races and report Elo follow-up explicitly.
- 2026-04-08: Changed saved-ticket result refresh to skip future or already-settled races and only fetch results for ticket legs that should be finished.
