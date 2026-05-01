# Raceday ingestion and listing

## Purpose
Ingest raceday/startlist data from external horse-racing APIs into local storage and provide paginated raceday discovery in UI.

## User experience
Users can fetch racedays by date, browse a scrolling list of stored racedays with race count, a visible result-ready indicator, refresh older racedays that still lack stored results, and open a missing-racedays view to import calendar dates that have no local raceday stored.

## How it works
Backend fetches raceday and startlist payloads, upserts `Raceday`, persists ATG past comments in bulk, queues asynchronous horse refresh, and exposes paged summary endpoints. It also supports batch-refresh of stale past racedays that still have no `resultsReady` races in storage. Frontend consumes summary for infinite-scroll list and exposes that refresh action when stale rows are present. The missing-racedays view generates a local date range, checks whether MongoDB has at least one raceday for each date, and imports a selected missing date through the existing date import path.

## Inputs and outputs
- Inputs:
  - `POST /api/raceday/fetch?date=YYYY-MM-DD`
  - `GET /api/raceday/missing?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `POST /api/raceday/missing/import?date=YYYY-MM-DD`
  - `POST /api/raceday/refresh-stale-results`
  - `GET /api/raceday/summary`
  - `GET /api/raceday`
- Outputs:
  - Stored `Raceday` documents with race list and metadata.
  - Paginated summary payload (`items`, `total`).
  - Missing-racedays payload (`dateCount`, `storedDateCount`, `missingCount`, `missing`).

## Key decisions
- Keep ingestion and horse-refresh decoupled (horse refresh is async after raceday upsert).
- Queue full-raceday horse refresh globally so importing several racedays cannot start unlimited concurrent background refresh loops.
- Start horse refreshes at a configurable interval, defaulting to 200 ms, while allowing bounded per-raceday concurrency.
- Recompute earliest horse timestamps for affected races in one raceday save instead of saving once per race.
- Recompute winner-derived track stats once per touched track after a refresh batch, not once per horse.
- Provide lightweight summary projection for list performance.
- Treat a date as present when at least one local `Raceday` has that `raceDayDate`; the import action then asks Travsport for all race days on that date.

## Defaults and fallbacks
- Summary default fields: `firstStart`, `raceDayDate`, `trackName`, `raceStandard`.
- List API falls back to generic error when fetch fails.
- Horse refresh defaults:
  - `RACEDAY_HORSE_REFRESH_DELAY_MS=200`
  - `RACEDAY_HORSE_REFRESH_CONCURRENCY=4`
  - `RACEDAY_HORSE_REFRESH_QUEUE_CONCURRENCY=1`

## Edge cases
- Invalid/missing date on fetch request returns `400`.
- Invalid missing-raceday ranges return `400`; future scan is capped to 14 days ahead.
- Partial external API failures skip problematic raceday instead of failing all ingestion.
- Travsport can return `500` for individual startlist IDs even when the date listing includes them; those IDs are skipped and logged as concise provider/status summaries.
- Some Travsport horse statistics omit `points`, and some historical result rows omit valid start positions. Those are normal data gaps and should not create warning noise during import.

## Data correctness and trust
- `raceCount` and `hasResults` are computed from stored `raceList` state.
- A stale result candidate is a stored raceday whose `raceDayDate` is before today and whose `raceList` still has no `resultsReady` race.
- Earliest horse update timestamp is recomputed after the horse refresh loop with one save for all affected races.

## Debugging
- Primary log: backend logs in raceday service/routes during fetch/upsert/update loops. Raceday upsert, ATG comment persistence, full save pipeline, and horse refresh duration are timed separately. Travsport fetch failures should appear as short warnings with `status`, `code`, and provider response message, not full Axios request/response dumps.
- What "good" looks like: new racedays appear in summary list, sorted by `firstStart`, completed racedays show an obvious green status, and stale past days can be refreshed into a result-ready state.
- What "bad" looks like: empty summary after fetch, nearly invisible result status in dark mode, or repeated refresh failures for stale racedays.

## Related files
- `backend/src/raceday/raceday-routes.js`
- `backend/src/raceday/raceday-atg-client.js`
- `backend/src/raceday/raceday-service.js`
- `backend/src/raceday/raceday-query-service.js`
- `backend/src/raceday/raceday-import-service.js`
- `backend/src/raceday/raceday-result-refresh-service.js`
- `backend/src/raceday/raceday-refresh-service.js`
- `backend/src/raceday/raceday-model.js`
- `backend/src/horse/horse-service.js`
- `backend/src/track/track-service.js`
- `frontend/src/views/raceday-input/RacedayInputView.vue`
- `frontend/src/views/raceday-missing/MissingRacedaysView.vue`
- `frontend/src/views/raceday-input/store.js`
- `frontend/src/views/raceday-input/services/RacedayInputService.js`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-10: Added dark-mode-safe result badges and stale past-raceday refresh support.
- 2026-04-30: Added missing-date scan and one-click date import.
- 2026-04-30: Added queued full-raceday horse refresh, 200 ms default start interval, bulk ATG comment persistence, and single-save earliest timestamp recomputation.
- 2026-04-30: Changed Travsport fetch failures to concise warnings and kept per-raceday startlist failures non-fatal during date import.
- 2026-04-30: Batched winner-derived track-stat recomputation after horse refresh and stopped warning for normal missing horse points/start-position data gaps.
