# Raceday ingestion and listing

## Purpose
Ingest raceday/startlist data from external horse-racing APIs into local storage and provide paginated raceday discovery in UI.

## User experience
Users can fetch racedays by date, then browse a scrolling list of stored racedays with race count and result-ready indicator.

## How it works
Backend fetches raceday and startlist payloads, upserts `Raceday`, triggers asynchronous horse refresh, and exposes paged summary endpoints. Frontend consumes summary for infinite-scroll list.

## Inputs and outputs
- Inputs:
  - `POST /api/raceday/fetch?date=YYYY-MM-DD`
  - `GET /api/raceday/summary`
  - `GET /api/raceday`
- Outputs:
  - Stored `Raceday` documents with race list and metadata.
  - Paginated summary payload (`items`, `total`).

## Key decisions
- Keep ingestion and horse-refresh decoupled (horse refresh is async after raceday upsert).
- Preserve previously generated per-horse AI summary fields during new upserts.
- Provide lightweight summary projection for list performance.

## Defaults and fallbacks
- Summary default fields: `firstStart`, `raceDayDate`, `trackName`, `raceStandard`.
- List API falls back to generic error when fetch fails.

## Edge cases
- Invalid/missing date on fetch request returns `400`.
- Partial external API failures skip problematic raceday instead of failing all ingestion.

## Data correctness and trust
- `raceCount` and `hasResults` are computed from stored `raceList` state.
- Earliest horse update timestamp is recomputed after horse refresh loop.

## Debugging
- Primary log: backend logs in raceday service/routes during fetch/upsert/update loops.
- What "good" looks like: new racedays appear in summary list, sorted by `firstStart`.
- What "bad" looks like: empty summary after fetch or repeated upsert errors per raceday id.

## Related files
- `backend/src/raceday/raceday-routes.js`
- `backend/src/raceday/raceday-service.js`
- `backend/src/raceday/raceday-model.js`
- `frontend/src/views/raceday-input/RacedayInputView.vue`
- `frontend/src/views/raceday-input/store.js`
- `frontend/src/views/raceday-input/services/RacedayInputService.js`

## Change log
- 2026-02-27: Initial feature documentation.
