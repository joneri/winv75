# V85 suggestion engine

## Purpose
Generate V85 betting suggestions using templates, strategy modes, and optional user seed selections.

## User experience
From raceday UI, users open V85 modal, choose template, modes, variants and budget, optionally lock origin horses, and receive one or multiple V85 ticket proposals. Generated tickets first appear in the live session on the raceday and are saved only if the user explicitly selects them.

## How it works
Backend maps V85 legs for selected raceday, builds per-leg AI scores, allocates pick counts by template and strategy, emits ticket structure and budget summary, and returns the proposals to the raceday session. Frontend renders mode and variant switcher, ticket breakdown and raceday-level access to saved suggestions. Only explicitly saved tickets become frozen suggestion snapshots.

Special template note:
- `Stalstomme (900-2000 kr)` is a high-budget V85 template that keeps exactly 4 assigned spikes and uses broader coverage in the remaining 4 legs.
- If the user does not enter a max cost, `Stalstomme` defaults to `2000 kr` as its ceiling.
- If the requested max cost is outside `900-2000 kr`, or if the generated ticket cannot stay within that template contract, the endpoint returns an explicit error.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/v85/templates`
  - `GET /api/raceday/:id/v85/info`
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v85/update`
- Outputs:
  - Single suggestion or multi-suggestion payload (`suggestions`, `errors`, mode/variant metadata).
  - Updated V85 distribution info for raceday.
  - Persisted snapshot ids on saved tickets.

## Key decisions
- Support deterministic variant generation via seeded RNG.
- Support multi-mode + multi-variant generation in one request.
- Allow user seed horses per leg while still auto-filling remaining picks.
- Persist the generated ticket immediately so later Elo or UI changes do not rewrite history.

## Defaults and fallbacks
- Default modes: balanced/mix/public/value.
- Default variants per mode from env (clamped to max 5).
- `Stalstomme` applies its own budget window of `900-2000 kr` and keeps the original 4 spike legs fixed during budget expansion.
- If no V85 legs found, endpoint returns explicit error payload.

## Edge cases
- Template-leg count mismatch returns user-facing error.
- `Stalstomme` can reject too-low or too-high requested max cost even if other V85 templates would accept it.
- Some mode/variant combinations may fail; response can include partial success plus `errors` list.

## Data correctness and trust
- Leg mapping and percentages rely on stored raceday + game data.
- Ticket row cost and budget calculations are explicit in response.
- `Stalstomme` must keep exactly 4 spike legs instead of letting budget fill-up create fewer or more spikes.

## Debugging
- Primary log: `Failed to build V85 suggestion` and service error messages.
- What "good" looks like: generated legs align with V85 game legs and budget constraints.
- What "bad" looks like: repeated "Ingen V85 hittades" for raceday known to have V85.

## Related files
- `backend/src/raceday/v85-service.js`
- `backend/src/raceday/raceday-betting-routes.js`
- `backend/src/suggestion/suggestion-service.js`
- `frontend/src/views/raceday/components/V85SuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `docs/features/spelforslag-guide.md`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-05: Changed V85 generation to raceday-session-first flow with explicit save into suggestion history.
- 2026-04-25: Added the `Stalstomme` high-budget template with a 900-2000 kr budget window and preserved 4-spike structure.
