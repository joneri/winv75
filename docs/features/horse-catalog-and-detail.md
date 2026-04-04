# Horse catalog and detail

## Purpose
Expose searchable horse catalog and detailed horse profile with metrics, ratings, and result history.

## User experience
Users can search and paginate horses by form Elo, then open horse detail page with metrics cards and completed/upcoming result tables.

## How it works
Backend list endpoint supports query + cursor pagination. Detail endpoint computes derived form metrics and merges horse ratings. Frontend uses abortable requests and infinite-scroll observers.

## Inputs and outputs
- Inputs:
  - `GET /api/horses` (`q`, `cursor`, `limit`)
  - `GET /api/horses/:horseId`
  - `PUT /api/horses/:horseId` (refresh from external source)
- Outputs:
  - List payload with `items`, `hasMore`, `nextCursor`.
  - Horse detail payload with form model fields and result list.

## Key decisions
- Cursor uses form rating sort tuple to keep stable pagination.
- Detail view separates completed vs upcoming results with local normalization.

## Defaults and fallbacks
- Invalid cursor returns `400`.
- Missing horse returns `404`.
- Form metrics fall back to base rating when form rating missing.

## Edge cases
- Rate fields may arrive as strings/percentages and are normalized in UI.
- Result entries without race metadata still render with fallback labels.

## Data correctness and trust
- Form Elo and derived win probability come from backend compute pipeline, not frontend approximation.
- External refresh is explicit via `PUT` endpoint.

## Debugging
- Primary log: `Error listing horses` / `Error fetching horse data` in horse routes/service.
- What "good" looks like: infinite scroll advances and detail page renders both metrics and results.
- What "bad" looks like: repeated cursor loops or missing `nextCursor` while `hasMore=true`.

## Related files
- `backend/src/horse/horse-routes.js`
- `backend/src/horse/horse-service.js`
- `backend/src/horse/horse-form-metrics.js`
- `frontend/src/views/horses/HorseSearchView.vue`
- `frontend/src/views/horse/HorseView.vue`
- `frontend/src/api.ts`

## Change log
- 2026-02-27: Initial feature documentation.
