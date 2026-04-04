# Raceday overview and game context

## Purpose
Provide a raceday-centric overview with race cards, available game forms, and V85/V86 suggestion actions tied to the protected betting core.

## User experience
On a raceday page, users see track/day context, race cards, game badges, update status for V85/V86 percentages, and actions to generate V85/V86 ticket suggestions.

## How it works
Frontend loads raceday detail, game types, and V86 game view. The page opens modal flows for V85 and V86, fetches server-defined templates, and submits ticket-generation requests to the betting services.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/:id`
  - `GET /api/spelformer/:racedayId`
  - `GET /api/raceday/:id/v86/game`
  - `GET /api/raceday/v85/templates`
  - `GET /api/raceday/v86/templates`
  - `POST /api/raceday/:id/v85/update`
  - `POST /api/raceday/:id/v86/update`
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v86`
- Outputs:
  - Race-card rendering context.
  - V85 and V86 ticket proposals plus update status for betting percentages.

## Key decisions
- Keep raceday page focused on the real betting flows instead of old AI export helpers.
- Let the backend own template lists and ticket generation so UI stays thin.

## Defaults and fallbacks
- Missing V85 or V86 support disables the corresponding action group.
- Suggestion errors stay inside the modal and do not break the rest of the raceday page.

## Edge cases
- Raceday not found returns `404`.
- Missing V86 game view is handled client-side by disabling/limiting V86-specific actions.

## Data correctness and trust
- Game-leg mapping is sourced from stored `gameTypes` and V86 game view.
- Ticket output reflects the stored race data, Elo-derived ranking inputs, and latest fetched V85/V86 percentages when available.

## Debugging
- Primary log: raceday suggestion modal errors in frontend and V85/V86 route logs in backend.
- What "good" looks like: a modal opens, loads templates, and renders a ticket after generate.
- What "bad" looks like: template load errors, modal setup crashes, or ticket generation returning no suggestions.

## Related files
- `backend/src/raceday/raceday-routes.js`
- `backend/src/raceday/v85-service.js`
- `backend/src/raceday/v86-service.js`
- `backend/src/game/game-service.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/raceday/components/RaceCardComponent.vue`
- `frontend/src/views/raceday/components/V85SuggestionModal.vue`
- `frontend/src/views/raceday/components/V86SuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-04: Reframed around the active raceday and betting flows after AI helper runtime removal.
