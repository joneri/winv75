# Race analysis and AI ranking

## Purpose
Provide the active race view with horse ranking support, Elo/form context, and linked navigation inside a raceday.

## User experience
In race view, users get a sortable horse table with Elo, form, driver context, past performance lines, game badges, and quick links to horse, driver, and neighboring races.

## How it works
Backend race detail fetch enriches horses with horse and driver Elo data. Frontend combines that race payload with horse score endpoints, race metadata, and navigation context to render the protected race flow.

## Inputs and outputs
- Inputs:
  - `GET /api/race/:id`
  - `GET /api/horses/rankings/:raceId`
  - `GET /api/horses/scores`
  - `GET /api/driver/ratings`
- Outputs:
  - Enriched race payload with horse and driver Elo values.
  - Ranking and score support data used by the race table.

## Key decisions
- Keep race detail fetch separate from horse ranking and score support so the view can degrade gracefully.
- Merge horse and driver rating enrichment server-side to reduce frontend joins.

## Defaults and fallbacks
- If score/ranking support fails, the race view still renders from the main race payload.
- Missing enrichment values fall back to base race payload fields.

## Edge cases
- Race not found returns `404`.
- Missing or malformed horse/driver ids are filtered during enrichment.

## Data correctness and trust
- Ranking calculations are derived from stored race, horse, and driver datasets.
- The race view does not rely on removed AI summary or profile layers.

## Debugging
- Primary log: backend race route warnings plus frontend race-service failures.
- What "good" looks like: race view renders one consistent horse list with working horse and driver links.
- What "bad" looks like: duplicated or missing horses, missing Elo enrichment, or broken race navigation.

## Related files
- `backend/src/race/race-routes.js`
- `backend/src/horse/horse-service.js`
- `frontend/src/views/race/RaceHorsesView.vue`
- `frontend/src/views/race/services/RaceHorsesService.js`
- `frontend/src/views/race/components/RaceHeader.vue`
- `frontend/src/views/race/components/RaceNavigation.vue`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-04: Removed old AI-list, tier, and summary framing so the doc matches the active race flow.
