# Raceday overview and game context

## Purpose
Provide a raceday-centric overview with race cards, available game forms (V85/V86/etc), and AI-list export/regeneration actions.

## User experience
On a raceday page, users see track/day context, race cards, game badges, update status for V85/V86 percentages, and actions to generate/regenerate AI list output.

## How it works
Frontend loads raceday detail + game types + V86 game view. Backend resolves game mapping from ATG calendar and serves cached or refreshed raceday AI list.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/:id`
  - `GET /api/spelformer/:racedayId`
  - `GET /api/raceday/:id/ai-list`
  - `POST /api/raceday/:id/_admin/refresh-ai`
- Outputs:
  - Race-card rendering context.
  - Raceday AI-list payload suitable for download/export.

## Key decisions
- Use raceday-level AI cache with TTL to avoid rebuilding each race list repeatedly.
- Support `force=true` and explicit admin refresh endpoint for deterministic regeneration.

## Defaults and fallbacks
- AI-list cache TTL defaults to `AI_RACEDAY_CACHE_TTL_MINUTES` (default 120).
- If cache missing/stale, backend rebuilds from race insights.

## Edge cases
- Raceday not found returns `404`.
- Missing V86 game view is handled client-side by disabling/limiting V86-specific actions.

## Data correctness and trust
- Game-leg mapping is sourced from stored `gameTypes` and V86 game view.
- AI list reflects current active profile unless stale cache is served.

## Debugging
- Primary log: backend raceday route/service logs for AI-list and refresh calls.
- What "good" looks like: AI list downloads with races ordered by race number.
- What "bad" looks like: repeated cache misses without persistence or missing games for known raceday.

## Related files
- `backend/src/raceday/raceday-routes.js`
- `backend/src/raceday/raceday-service.js`
- `backend/src/game/game-service.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/raceday/components/RaceCardComponent.vue`
- `frontend/src/views/raceday/services/RacedayService.js`

## Change log
- 2026-02-27: Initial feature documentation.
