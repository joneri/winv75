# Global search

## Purpose
Provide a single global search endpoint/UI across horses, drivers, tracks, upcoming races, racedays, and past results.

## User experience
Typing in global search reveals grouped results with direct links to horse, driver, race, or raceday pages.

## How it works
Search service builds flexible Swedish-aware pattern matching, executes multi-collection queries, ranks text categories by relevance, and returns stable payload shape even on failures.

## Inputs and outputs
- Inputs:
  - `GET /api/search?q=<term>`
- Outputs:
  - Response object with arrays: `horses`, `drivers`, `upcomingRaces`, `racedays`, `results`, `tracks`.

## Key decisions
- Keep endpoint resilient by always returning `200` with empty-structure fallback on errors.
- Normalize diacritics and relevance ranking for practical user search behavior.

## Defaults and fallbacks
- Query shorter than 2 chars returns empty result groups.
- Errors return empty arrays (stable contract) rather than hard failure.

## Edge cases
- Track-code searches map through track-name matching to raceday/result categories.
- Upcoming-race aggregation can return multiple entries per race when multiple horse/driver matches exist.

## Data correctness and trust
- Search sources are explicit DB collections (`Horse`, `Driver`, `Raceday`, `Track`).
- UI handles missing keys defensively and normalizes expected arrays.

## Debugging
- Primary log: `Error during search (service)` and route-level fallback logs.
- What "good" looks like: grouped suggestions appear and route links resolve.
- What "bad" looks like: repeated empty arrays for valid 2+ char queries with known data.

## Related files
- `backend/src/search/search-routes.js`
- `backend/src/search/search-service.js`
- `frontend/src/components/GlobalSearch.vue`
- `frontend/src/api.ts`

## Change log
- 2026-02-27: Initial feature documentation.
