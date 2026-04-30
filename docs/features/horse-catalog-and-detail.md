# Horse catalog and detail

## Purpose
Expose searchable horse catalog and detailed horse profile with metrics, ratings, and result history.

## User experience
Users can search and paginate horses by form-oriented ranking, then open horse detail with explicit career Elo, form Elo, effective Elo debug, a plain Elo freshness status, explainable KPI help overlays and result history.

## How it works
Backend list endpoint supports query and cursor pagination and now computes both visible row metrics and cursor ordering with the same runtime Elo prediction layer as horse detail. Detail endpoint merges stored horse ratings with the runtime Elo prediction layer, which rebuilds form from recent results and exposes debug metadata. The same detail payload now also exposes stored Elo freshness fields such as last update timestamps and stored Elo version. Frontend uses abortable requests and infinite-scroll observers.

## Inputs and outputs
- Inputs:
  - `GET /api/horses` (`q`, `cursor`, `limit`)
  - `GET /api/horses/:horseId`
  - `PUT /api/horses/:horseId` (refresh from external source)
- Outputs:
  - List payload with `items`, `hasMore`, `nextCursor`.
  - Horse detail payload with Elo prediction fields and result list.

## Key decisions
- Cursor uses the runtime tuple `formRating -> rating -> id` so both pagination and visible rows follow the same ordering.
- Visible list metrics should match horse detail for the same horse.
- Detail view separates completed vs upcoming results with local normalization.
- Clickable result rows route through the stored raceday document `_id` exposed as `racedayId`; the external Travsport `raceDayId` remains separate as `externalRaceDayId`.
- Legacy fields stay available for compatibility, but `careerElo`, `formElo`, `effectiveElo` and `eloDebug` are the canonical runtime prediction fields.
- Stored Elo freshness is shown as a simple status, latest Elo run, latest processed result date and version so users can distinguish persisted rating age from read-time prediction recomputation.
- Horse detail KPI cards include help overlays that explain what the number means and which payload field or model layer it comes from.
- The `Score` KPI is an internal weighted score. It includes Svensk Travsport points as one input, but it is not the official start-points value.

## Defaults and fallbacks
- Invalid cursor returns `400`.
- Missing horse returns `404`.
- Prediction falls back to stored career Elo when form data is weak or missing.

## Edge cases
- Rate fields may arrive as strings/percentages and are normalized in UI.
- Result entries without race metadata still render with fallback labels.
- Result entries with only an external `raceDayId` are not used for `/raceday/:racedayId` links unless backend can match the result `raceId` to a stored raceday.

## Data correctness and trust
- Elo outputs come from backend prediction logic, not frontend approximation.
- Horse catalog and horse detail use the same runtime prediction chain for the numbers they display.
- Horse detail uses the same runtime prediction chain as race ranking so the model is explainable across views.
- External refresh is explicit via `PUT` endpoint.
- Horse detail also shows stored Elo freshness from backend rating rows, not guessed frontend timestamps. The UI labels the status as fresh, warning or older from the latest stored Elo update timestamp.
- Horse result race links use the internal raceday route id so Race view can load props, game context, and the raceday back-link from the same stored raceday document.

## Debugging
- Primary log: `Error listing horses` / `Error fetching horse data` in horse routes/service.
- What "good" looks like: infinite scroll advances and detail page renders metrics, question-mark help overlays, a clear Elo-status panel and results.
- What "bad" looks like: repeated cursor loops or missing `nextCursor` while `hasMore=true`.
- For result navigation, inspect `GET /api/horses/:horseId`: linked rows should include `raceInformation.racedayId` as a Mongo id and `raceInformation.externalRaceDayId` as the Travsport id.

## Related files
- `backend/src/horse/horse-routes.js`
- `backend/src/horse/horse-service.js`
- `backend/src/rating/horse-elo-prediction.js`
- `frontend/src/views/horses/HorseSearchView.vue`
- `frontend/src/views/horse/HorseView.vue`
- `frontend/src/api.ts`

## Change log
- 2026-04-10: Switched horse catalog cursor ordering to the same runtime prediction tuple that is rendered in the list.
- 2026-04-10: Aligned horse catalog row metrics with horse detail runtime prediction so form Elo and trend no longer disagree between the two views.
- 2026-04-30: Added internal raceday route ids to horse detail results so result-row race links load the full raceday/race context.
- 2026-04-30: Replaced raw horse-detail Elo freshness metadata with a clearer user-facing status label plus latest Elo run, processed result date and version.
- 2026-04-30: Added question-mark help overlays for horse detail KPI cards.
- 2026-02-27: Initial feature documentation.
- 2026-04-05: Switched horse detail from legacy form metrics to explicit Elo prediction fields and debug.
- 2026-04-08: Added stored Elo freshness fields to horse detail.
