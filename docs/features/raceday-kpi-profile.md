# Raceday KPI profile

## Purpose
Give each raceday a compact analytical profile with useful KPIs and a readable Swedish summary that helps users understand the shape of the day before building tickets.

## How it works
Backend exposes `GET /api/raceday/:id/kpis`. The service loads the raceday, joins active starters to `HorseRating` and `Driver`, resolves track metadata, computes day-level and race-level metrics, and builds a deterministic narrative from several text variants. The text varies by raceday seed, so it is stable for the same raceday but not identical across all racedays.

## Key decisions
- Keep the first version read-only and compute from existing MongoDB collections.
- Use deterministic template variation instead of random text on every reload.
- Show the narrative before the KPI grid so the profile reads like an interpretation, not only raw numbers.
- Do not claim the text is human-written; it is app-generated from stored data.

## Inputs and outputs
- Input: MongoDB raceday `_id`.
- Output: `narrative`, `tags`, ordered KPI list, compact race profiles, generation timestamp and debug counts.

## Edge cases
- Missing horse ratings reduce rating coverage instead of failing the endpoint.
- Missing driver ratings are ignored for the driver-strength average.
- Missing public percentages return low public-data coverage.
- Missing track lane stats fall back to explicit narrative text that lane data is currently unavailable.
- Invalid raceday IDs return validation errors through the existing route middleware.

## Debugging
Best check: call `GET /api/raceday/:id/kpis` and confirm `ratingCoverage`, `kpis`, `tags`, and `narrative` are populated for a known imported raceday.

## Related files
- `backend/src/raceday/raceday-kpi-service.js`
- `backend/src/raceday/raceday-core-routes.js`
- `backend/src/raceday/raceday-service.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/raceday/services/RacedayService.js`
