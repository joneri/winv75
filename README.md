# winv75

Vue 3 frontend + Express/MongoDB backend for trotting analytics: startlists, Elo-based ratings, and “Jonas AI” raceday/race insights.

## Architecture
- Frontend: Vue 3 + Vite (`frontend/`)
- Backend: Express + Mongoose (`backend/`)
- DB: MongoDB (local by default)

Key features
- Raceday summary API with pagination and lean projection for fast lists.
- Infinite scroll UI showing date, track, first start, and race count.
- Elo ratings with initial seeding from Svensk Travsport points and purse-based class weighting.
- “Jonas AI” insights for a race and for an entire raceday, with caching and cron precompute.
- Observability: timing/logging middleware and lightweight metrics endpoint.

## Prerequisites
- Node.js 18+
- Yarn
- MongoDB running locally on mongodb://localhost:27017

## Quick start
1) Install deps
- Backend
  - cd backend && yarn install
- Frontend
  - cd frontend && yarn install

2) Configure .env
- Frontend `frontend/.env`:
  - `VITE_BE_URL=http://localhost:3001`
- Backend: environment variables are optional; see Configuration below. Mongo URI is currently defined in `backend/src/config/db.js` and defaults to `mongodb://localhost:27017/winv75`.

3) Run
- Backend: `cd backend && yarn dev`
- Frontend: `cd frontend && yarn dev`
- App: http://localhost:5173 (proxying to `VITE_BE_URL` for API)

## Configuration (backend env)
General
- `PORT` — API port (default 3001)

Elo seeding (from ST points)
- `ELO_SEED_BASE` — base for log-scale seeding
- `ELO_SEED_ALPHA` — multiplier for log(points)
- `ELO_SEED_MIN` — lower bound for seed
- `ELO_SEED_MAX` — upper bound for seed

Class weighting (purse → class)
- `ELO_CLASS_MIN` — min purse reference
- `ELO_CLASS_MAX` — max purse reference
- `ELO_CLASS_REF` — reference purse (neutral class)
- `ELO_K_CLASS_MULTIPLIER` — scales K-factor by class

Ranking (AI composite ordering)
- `AI_RANK_ELO_DIVISOR` — scales Elo contribution (default 50)
- `AI_RANK_W_FORM` — weight for formScore (default 1.0)
- `AI_RANK_BONUS_SHOE` — bonus for Skobyte (default 0.5)
- `AI_RANK_BONUS_FAVORITE_TRACK` — bonus for Favoritbana (default 0.75)
- `AI_RANK_BONUS_FAVORITE_SPAR` — bonus for Favoritspår (default 0.5)

“Jonas AI” raceday caching & cron
- `AI_RACEDAY_CACHE_TTL_MINUTES` — cache freshness window (default 120)
- `AI_RACEDAY_CRON` — cron schedule for precompute (default `15 6 * * *`)
- `AI_RACEDAY_DAYS_AHEAD` — lookahead window for precompute (default 3)

Evaluation/tuning
- No env required; pass query params to the eval endpoint (see API).

## API quick reference
Raceday
- GET `/api/raceday/summary?skip=0&limit=40&fields=firstStart,trackName,raceDayDate,raceCount,hasResults`
  - Server-side pagination; fields is a comma list of projected fields.
- GET `/api/raceday/:id` — full raceday document
- GET `/api/raceday/:id/ai-list?force=true|false`
  - Returns cached raceday insights; force bypasses cache and refreshes.
- POST `/api/raceday/_admin/precompute-ai?daysAhead=3`
  - Precompute AI lists for upcoming racedays; body empty.
- POST `/api/raceday/:id/_admin/refresh-ai`
  - Force refresh cache for a specific raceday; body empty.

Race
- GET `/api/race/:id/ai-list` — per‑race insights (Elo top, form, plus points, composite ranking)
- GET `/api/race/:id` — raw race data
- POST `/api/race/horse-summary` — AI-generated natural language summary for a horse (JSON payload)

Ratings
- POST `/api/rating/update` — run ratings update across recent results
- GET `/api/rating/eval?from=YYYY-MM-DD&to=YYYY-MM-DD&kClassMultiplier=..&classMin=..&classMax=..&classRef=..`
  - Simulates Elo over a range without writing to DB. Returns mean RMSE and purse coverage.

Metrics
- GET `/api/_metrics` — lightweight JSON counters for AI endpoints (incl. raceday cache hits/misses)

## “Jonas AI” outputs
- topByElo — top 3 by Elo
- bestForm — top 3 by recent form (weighted last 5 starts)
- plusPoints — shoe change, favorite track, favorite start position
- ranking — composite list per race with fields:
  - rating (Elo), formScore, plusPoints, compositeScore, rank

Composite ranking formula (tunable via env)
- `compositeScore = rating/AI_RANK_ELO_DIVISOR + AI_RANK_W_FORM * formScore + bonuses`
- Bonuses are sums of configured values for detected plusPoints.

## Tuning workflow
1) Seed and class weighting are active by default. To analyze/tune:
2) Call `/api/rating/eval` over a date window. Example parameters to vary:
   - `kClassMultiplier`, `classMin`, `classMax`, `classRef`
3) Compare mean RMSE before/after. Update env values accordingly.
4) Optionally adjust composite rank envs to influence UI ordering.

## Dev tips
- If precompute returns `{count: 0}`: there may be no racedays with `firstStart` in the lookahead window. Increase `daysAhead` or use the per‑raceday refresh endpoint.
- Route ordering avoids param conflicts: fixed routes (e.g. `/summary`, `/ai-list`) are declared before `/:id`.
- Raceday list uses narrow projections; fetch full details on navigation.

## Scripts (backend)
- `yarn dev` — start API with nodemon
- `yarn update-ratings` — manual ratings rebuild
- `yarn build-drivers` — build driver collection
- `yarn update-driver-elo` — recalc driver Elo

## Notes
- Mongo URI is currently defined in `backend/src/config/db.js`. Change there if needed.
- Frontend lists can optionally request `raceCount` and `hasResults` in the summary fields for indicators without heavy payloads.
