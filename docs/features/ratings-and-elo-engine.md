# Ratings and Elo engine

## Purpose
Maintain and evaluate horse/driver Elo ratings, including per-race updates, full rebuilds, form-vs-career variants, and auto-tune experimentation.

## User experience
These are maintenance-oriented backend flows used for controlled rating updates, evaluation, and driver Elo recomputation.

## How it works
Horse and driver Elo services process race placements with configurable K/decay parameters. Rating routes expose update/eval/auto-tune APIs for controlled maintenance use.

## Inputs and outputs
- Inputs:
  - `POST /api/rating/update`
  - `POST /api/rating/race/:raceId`
  - `GET /api/rating/eval`
  - `POST /api/rating/auto-tune/start`
  - `GET /api/rating/auto-tune/status/:jobId`
  - `POST /api/rating/auto-tune/cancel/:jobId`
  - `PUT /api/driver/:id/elo`
  - `POST /api/driver/recompute`
- Outputs:
  - Updated rating rows/history and job status payloads.

## Key decisions
- Keep separate form and career horizons (different decay/race-count behavior).
- Persist rating history snapshots for horse Elo updates.
- Allow driver manual override and full recompute path.

## Defaults and fallbacks
- Defaults come from env constants when request params are missing.
- Invalid payloads return `400`; runtime failures return `500`.

## Edge cases
- Missing horses/drivers are seeded with default/derived starting ratings.
- Invalid or incomplete race placements are filtered out.

## Data correctness and trust
- Elo updates are placement-driven and deterministic for same input parameters.
- Evaluation endpoints perform read-only computation (no rating writes).

## Debugging
- Primary log: route-level failures (`Manual rating update failed`, `Elo evaluation failed`, `Failed to start auto-tune`).
- What "good" looks like: status endpoints progress and distribution stats are returned after recompute.
- What "bad" looks like: auto-tune stuck with no processed combinations.

## Related files
- `backend/src/rating/elo-routes.js`
- `backend/src/rating/elo-service.js`
- `backend/src/rating/elo-engine.js`
- `backend/src/rating/elo-eval.js`
- `backend/src/rating/auto-tune.js`
- `backend/src/driver/driver-elo-service.js`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-04: Removed references to the deleted admin frontend surface.
