# Horse catalog and detail

## Purpose
Expose searchable horse catalog and detailed horse profile with metrics, ratings, and result history.

## User experience
Users can search and paginate horses by form-oriented ranking, then open horse detail with explicit career Elo, form Elo, effective Elo debug and result history.

## How it works
Backend list endpoint supports query and cursor pagination. Detail endpoint merges stored horse ratings with the runtime Elo prediction layer, which rebuilds form from recent results and exposes debug metadata. Frontend uses abortable requests and infinite-scroll observers.

## Inputs and outputs
- Inputs:
  - `GET /api/horses` (`q`, `cursor`, `limit`)
  - `GET /api/horses/:horseId`
  - `PUT /api/horses/:horseId` (refresh from external source)
- Outputs:
  - List payload with `items`, `hasMore`, `nextCursor`.
  - Horse detail payload with Elo prediction fields and result list.

## Key decisions
- Cursor uses form rating sort tuple to keep stable pagination.
- Detail view separates completed vs upcoming results with local normalization.
- Legacy fields stay available for compatibility, but `careerElo`, `formElo`, `effectiveElo` and `eloDebug` are the canonical runtime prediction fields.

## Defaults and fallbacks
- Invalid cursor returns `400`.
- Missing horse returns `404`.
- Prediction falls back to stored career Elo when form data is weak or missing.

## Edge cases
- Rate fields may arrive as strings/percentages and are normalized in UI.
- Result entries without race metadata still render with fallback labels.

## Data correctness and trust
- Elo outputs come from backend prediction logic, not frontend approximation.
- Horse detail uses the same runtime prediction chain as race ranking so the model is explainable across views.
- External refresh is explicit via `PUT` endpoint.

## Debugging
- Primary log: `Error listing horses` / `Error fetching horse data` in horse routes/service.
- What "good" looks like: infinite scroll advances and detail page renders both metrics and results.
- What "bad" looks like: repeated cursor loops or missing `nextCursor` while `hasMore=true`.

## Related files
- `backend/src/horse/horse-routes.js`
- `backend/src/horse/horse-service.js`
- `backend/src/rating/horse-elo-prediction.js`
- `frontend/src/views/horses/HorseSearchView.vue`
- `frontend/src/views/horse/HorseView.vue`
- `frontend/src/api.ts`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-05: Switched horse detail from legacy form metrics to explicit Elo prediction fields and debug.
