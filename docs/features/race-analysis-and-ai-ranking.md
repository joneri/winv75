# Race analysis and AI ranking

## Purpose
Produce race-level ranking and insights for each horse, combining rating, form, signals, and confidence/tier outputs.

## User experience
In race view, users get ranked horses, AI tier indicators, race banners, ranking table, and integrated context (track, game legs, probabilities).

## How it works
Backend `buildRaceInsights` computes normalized scores, tiers, and highlights. Race endpoint enriches horses with horse/driver ratings. Frontend composes ranking + AI insight data into sortable table/tabs.

## Inputs and outputs
- Inputs:
  - `GET /api/race/:id`
  - `GET /api/race/:id/ai-list`
  - `GET /api/horses/rankings/:raceId`
  - `GET /api/horses/scores`
- Outputs:
  - Ranked race payload with horse-level fields (`rating`, `formRating`, AI metrics).
  - AI list payload with tier/config guidance.

## Key decisions
- Keep race detail fetch separate from AI insight build to allow partial rendering.
- Merge horse and driver rating enrichment server-side to reduce frontend joins.

## Defaults and fallbacks
- If AI insight fetch fails, race view still renders from race/ranking endpoints.
- Missing enrichment values fall back to base race payload fields.

## Edge cases
- Race not found returns `404`.
- Missing or malformed horse/driver ids are filtered during enrichment.

## Data correctness and trust
- Ranking calculations are derived from stored race and horse datasets plus profile settings.
- UI preserves saved AI summary metadata per horse when available.

## Debugging
- Primary log: backend race route and `race-insights` logs/warnings.
- What "good" looks like: consistent horse ordering and AI tier presence across same race/profile.
- What "bad" looks like: duplicated/missing horses or mismatch between displayed rank and AI payload ids.

## Related files
- `backend/src/race/race-routes.js`
- `backend/src/race/race-insights.js`
- `backend/src/horse/horse-service.js`
- `frontend/src/views/race/RaceHorsesView.vue`
- `frontend/src/views/race/services/RaceHorsesService.js`
- `frontend/src/views/race/components/AiBanner.vue`
- `frontend/src/views/race/components/AiTierCell.vue`
- `frontend/src/views/race/components/RankedHorsesTable.vue`

## Change log
- 2026-02-27: Initial feature documentation.
