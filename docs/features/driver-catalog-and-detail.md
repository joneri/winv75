# Driver catalog and detail

## Purpose
Expose searchable driver catalog and detailed driver profile with form/career Elo and enriched recent results.

## User experience
Users can search/paginate drivers, open a driver detail page, and inspect recent completed/upcoming race outcomes with links to race and horse pages.

## How it works
Backend list endpoint supports query + cursor pagination on Elo. Detail endpoint enriches driver results with raceday/race metadata and computes aggregate stats.

## Inputs and outputs
- Inputs:
  - `GET /api/driver` (`q`, `cursor`, `limit`)
  - `GET /api/driver/:id` (`resultsLimit`)
  - `GET /api/driver/ratings`
- Outputs:
  - List payload with Elo summary and cursor.
  - Detail payload with aggregated stats and normalized recent results.

## Key decisions
- Distinguish form Elo (`elo`) and career Elo (`careerElo`) at API and UI layers.
- Apply pending-result filtering for placement codes (`>=900` as pending).

## Defaults and fallbacks
- Invalid id returns `400`.
- Missing driver returns `404`.
- `resultsLimit` is clamped (25..500).
- Driver collection rebuild preserves existing `elo`, `careerElo`, race counts and `eloUpdatedAt` while refreshing names/results, so the UI does not temporarily lose kusk-Elo between collection rebuild and Elo recompute.

## Edge cases
- Missing race metadata still returns driver result record with null-safe fields.
- Withdrawn/invalid placements are excluded from aggregate start/win statistics.

## Data correctness and trust
- Driver aggregates are computed server-side from normalized placement criteria.
- Detail includes `eloUpdatedAt` and result date normalization for traceability.

## Debugging
- Primary log: `Error listing drivers` / `Error fetching driver detail`.
- What "good" looks like: sorted list by Elo and detail stats matching recent results.
- What "bad" looks like: negative/invalid placements counted in starts.
- If all race cards show missing `Kusk Form Elo`, check `db.drivers.countDocuments({ elo: { $gt: 0 } })`. A healthy local rebuild should have thousands of non-zero Elo values.

## Related files
- `backend/src/driver/driver-routes.js`
- `backend/src/driver/driver-elo-service.js`
- `backend/src/driver/driver-model.js`
- `frontend/src/views/drivers/DriverSearchView.vue`
- `frontend/src/views/driver/DriverView.vue`
- `frontend/src/api.ts`

## Change log
- 2026-05-01: Fixed driver collection rebuild so it preserves existing Elo fields and combined the daily collection/Elo cron flow to avoid an Elo-less window.
- 2026-02-27: Initial feature documentation.
