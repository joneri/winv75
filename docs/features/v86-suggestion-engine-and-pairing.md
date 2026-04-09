# V86 suggestion engine and pairing

## Purpose
Resolve V86 paired game context and generate V86 ticket suggestions with robust status/fallback handling.

## User experience
Users can open V86 modal, inspect pairing and game readiness, run suggestion generation with modes, variants and seeds, and then choose which generated tickets should actually be saved.

## How it works
Backend resolves V86 pairing and game view across raceday context, computes V86 distributions and AI list, generates suggestions similarly to the V85 engine with V86-specific status handling, and returns those tickets to the raceday session. Only explicitly saved tickets become frozen snapshots for later settlement and analytics.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/:id/v86/info`
  - `GET /api/raceday/:id/v86/pairing`
  - `GET /api/raceday/:id/v86/game`
  - `GET /api/raceday/:id/v86/ai-list`
  - `POST /api/raceday/:id/v86/update`
  - `POST /api/raceday/:id/v86`
- Outputs:
  - V86 status/game payloads and suggestion payloads.

## Key decisions
- V86 exposes explicit status codes/messages for missing date/game/pairing/legs.
- Suggestion generation can proceed with multi-mode variants and structured partial-error reporting.
- Generated V86 tickets are persisted immediately so paired-game performance can be evaluated over time.

## Defaults and fallbacks
- Default modes and variant logic mirror V85 design.
- Pairing resolver uses fallback selection path when primary candidate is not fully available.

## Edge cases
- Missing paired game data returns structured `ok:false`/status response.
- No V86 legs for raceday results in explicit user-facing message.

## Data correctness and trust
- Leg pairing and game context are validated before distribution update and suggestion generation.
- Returned V86 percentages/trends are attached per horse selection when available.

## Debugging
- Primary log: route/service logs around `Failed to fetch V86 ...` and generation errors.
- What "good" looks like: `status: ok` game view and modal suggestions contain 8 legs.
- What "bad" looks like: persistent `missing_pair` despite known paired raceday.

## Related files
- `backend/src/raceday/v86-service.js`
- `backend/src/raceday/raceday-betting-routes.js`
- `backend/src/suggestion/suggestion-service.js`
- `frontend/src/views/raceday/components/V86SuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/race/RaceHorsesView.vue`
- `docs/features/spelforslag-guide.md`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-05: Changed V86 generation to raceday-session-first flow with explicit save into suggestion history.
