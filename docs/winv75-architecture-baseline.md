# Winv75 architecture baseline

## Protected core
The protected core remains:
- horses and horse endpoints
- drivers plus driver Elo and history
- historical racedays and results
- raceday, race, and game structure
- Elo logic and stored Elo values
- V85 and V86 suggestion generation
- core frontend flows for start, raceday, race, horse, and driver

## Main backend domains

### Startup
- `backend/src/index.js`
  - loads env
  - connects MongoDB
  - starts active schedulers
  - starts the HTTP server
- `backend/src/app.js`
  - creates the Express app
  - applies middleware
  - registers API routes
- `backend/src/startup/register-api-routes.js`
  - groups route registration by active product domain
- `backend/src/startup/start-schedulers.js`
  - groups active scheduler startup

### Raceday
- `backend/src/raceday/raceday-atg-client.js`
  - fetches external raceday and startlist payloads
- `backend/src/raceday/raceday-import-service.js`
  - orchestrates fetch plus store by date
- `backend/src/raceday/raceday-write-service.js`
  - upserts raceday payloads and persists ATG past comments
- `backend/src/raceday/raceday-refresh-service.js`
  - refreshes horses triggered by raceday updates
  - recomputes earliest horse-update timestamps per race
- `backend/src/raceday/raceday-query-service.js`
  - owns raceday list, detail, and summary queries
- `backend/src/raceday/raceday-core-routes.js`
  - import, upsert, list, summary, detail, and timestamp routes
- `backend/src/raceday/raceday-betting-routes.js`
  - V85 and V86 template, info, update, pairing, game-view, and suggestion routes
- `backend/src/raceday/betting-suggestion-support.js`
  - shared template definitions, variant descriptors, seeded RNG, and allocation helpers used by both V85 and V86
- `backend/src/raceday/raceday-service.js`
  - now acts as a compatibility facade over the smaller raceday modules

### Race
- `backend/src/race/race-service.js`
  - loads race data and ATG extended race payload when needed
- `backend/src/race/race-read-service.js`
  - enriches race reads with horse and driver Elo context
  - loads saved horse past comments for the race domain
- `backend/src/race/race-routes.js`
  - thin route layer for race reads, results updates, and horse comment reads

### Other active domains
- `backend/src/horse/*`
  - horse storage, read APIs, ranking support, and horse refresh logic
- `backend/src/driver/*`
  - driver storage, driver detail, and driver Elo/history
- `backend/src/rating/*`
  - horse and driver Elo updates, evaluation, and related maintenance routes
- `backend/src/game/*`
  - game-form mapping used by raceday and betting flows
- `backend/src/search/*`
  - global search across the protected catalogues

## What was split in this increment
- `backend/src/raceday/raceday-service.js`
  - before: one mixed module for external fetch, startlist upsert, ATG comment persistence, horse refresh, timestamp updates, list queries, detail reads, and summary projection
  - after: split into `raceday-atg-client`, `raceday-import-service`, `raceday-write-service`, `raceday-refresh-service`, and `raceday-query-service`
- `backend/src/raceday/raceday-routes.js`
  - before: one mixed route file for import, read, summary, timestamp update, and all V85/V86 betting routes
  - after: route composition layer over `raceday-core-routes` and `raceday-betting-routes`
- `backend/src/race/race-routes.js`
  - before: route file contained race read enrichment logic directly
  - after: read enrichment moved into `race-read-service.js`, leaving routes thinner
- startup wiring
  - before: `app.js` and `index.js` manually listed every route and scheduler
  - after: route and scheduler registration are grouped in dedicated startup modules
- `backend/src/raceday/v85-service.js` and `backend/src/raceday/v86-service.js`
  - before: both files duplicated template definitions, variant math, seeded RNG, and spike/seed helpers alongside their product-specific betting logic
  - after: shared mechanics live in `betting-suggestion-support.js`, leaving each betting service focused on its own game-specific orchestration

## Current ownership boundaries
- import and external fetch logic belongs in `*-client.js` and import services
- read/query logic belongs in `*-query-service.js` or `*-read-service.js`
- mutation and persistence logic belongs in write or update services
- route files should validate inputs, call domain services, and translate errors
- shared betting mechanics belong in `betting-suggestion-support.js`
- game-specific betting orchestration remains owned by `v85-service.js` and `v86-service.js`

## Refactor next
- split the remaining game-specific orchestration inside `v85-service.js` and `v86-service.js` without changing betting semantics
- reduce old logging noise in race and horse flows
- reconcile `docs/features/` with the now-cleaner module structure and domain ownership
