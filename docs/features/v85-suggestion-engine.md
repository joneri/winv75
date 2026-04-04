# V85 suggestion engine

## Purpose
Generate V85 betting suggestions using templates, strategy modes, and optional user seed selections.

## User experience
From raceday UI, users open V85 modal, choose template/modes/variants/budget, optionally lock origin horses, and receive one or multiple V85 ticket proposals.

## How it works
Backend maps V85 legs for selected raceday, builds per-leg AI scores, allocates pick counts by template/strategy, then emits ticket structure and budget summary. Frontend renders mode/variant switcher and ticket breakdown.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/v85/templates`
  - `GET /api/raceday/:id/v85/info`
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v85/update`
- Outputs:
  - Single suggestion or multi-suggestion payload (`suggestions`, `errors`, mode/variant metadata).
  - Updated V85 distribution info for raceday.

## Key decisions
- Support deterministic variant generation via seeded RNG.
- Support multi-mode + multi-variant generation in one request.
- Allow user seed horses per leg while still auto-filling remaining picks.

## Defaults and fallbacks
- Default modes: balanced/mix/public/value.
- Default variants per mode from env (clamped to max 5).
- If no V85 legs found, endpoint returns explicit error payload.

## Edge cases
- Template-leg count mismatch returns user-facing error.
- Some mode/variant combinations may fail; response can include partial success plus `errors` list.

## Data correctness and trust
- Leg mapping and percentages rely on stored raceday + game data.
- Ticket row cost and budget calculations are explicit in response.

## Debugging
- Primary log: `Failed to build V85 suggestion` and service error messages.
- What "good" looks like: generated legs align with V85 game legs and budget constraints.
- What "bad" looks like: repeated "Ingen V85 hittades" for raceday known to have V85.

## Related files
- `backend/src/raceday/v85-service.js`
- `backend/src/raceday/raceday-routes.js`
- `frontend/src/views/raceday/components/V85SuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`

## Change log
- 2026-02-27: Initial feature documentation.
