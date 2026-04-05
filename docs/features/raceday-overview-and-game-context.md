# Raceday overview and game context

## Purpose
Provide a raceday-centric overview with race cards, available game forms, and suggestion actions for the protected betting core.

## User experience
On a raceday page, users see track/day context, race cards, game badges, saved/session suggestion history, update status for supported market percentages, and actions to generate V85, V5, V86, and DD ticket suggestions when those games exist.

## How it works
Frontend loads raceday detail, game types, DD/V86 game views, and saved suggestion history. The page opens modal flows for each supported game, fetches server-defined templates, and submits ticket-generation requests to the betting services.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/:id`
  - `GET /api/spelformer/:racedayId`
  - `GET /api/raceday/:id/dd/game`
  - `GET /api/raceday/:id/v86/game`
  - `GET /api/raceday/v5/templates`
  - `GET /api/raceday/v85/templates`
  - `GET /api/raceday/v86/templates`
  - `GET /api/raceday/dd/templates`
  - `POST /api/raceday/:id/v5/update`
  - `POST /api/raceday/:id/v85/update`
  - `POST /api/raceday/:id/v86/update`
  - `POST /api/raceday/:id/v5`
  - `POST /api/raceday/:id/v85`
  - `POST /api/raceday/:id/v86`
  - `POST /api/raceday/:id/dd`
- Outputs:
  - Race-card rendering context.
  - Ticket proposals for the supported game forms plus update status for betting percentages where that market exists.

## Key decisions
- Keep raceday page focused on the real betting flows instead of old AI export helpers.
- Let the backend own template lists and ticket generation so UI stays thin.

## Defaults and fallbacks
- Missing game support hides the corresponding action group.
- Suggestion errors stay inside the modal and do not break the rest of the raceday page.

## Edge cases
- Raceday not found returns `404`.
- Missing V86 game view is handled client-side by disabling/limiting V86-specific actions.
- DD is sourced from date-level game data and may still be available even when the raceday stores the game key as lowercase `dd`.

## Data correctness and trust
- Game-leg mapping is sourced from stored `gameTypes`, DD game view, and V86 game view.
- Ticket output reflects the stored race data, Elo-derived ranking inputs, and latest fetched V5/V85/V86 percentages when available.

## Debugging
- Primary log: raceday suggestion modal errors in frontend and betting route logs in backend.
- What "good" looks like: a modal opens, loads templates, and renders a ticket after generate.
- What "bad" looks like: template load errors, modal setup crashes, or ticket generation returning no suggestions.

## Related files
- `backend/src/raceday/raceday-routes.js`
- `backend/src/raceday/dd-service.js`
- `backend/src/raceday/v5-service.js`
- `backend/src/raceday/v85-service.js`
- `backend/src/raceday/v86-service.js`
- `backend/src/game/game-service.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/raceday/components/RaceCardComponent.vue`
- `frontend/src/views/raceday/components/DdSuggestionModal.vue`
- `frontend/src/views/raceday/components/V5SuggestionModal.vue`
- `frontend/src/views/raceday/components/V85SuggestionModal.vue`
- `frontend/src/views/raceday/components/V86SuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`

## Change log
- 2026-02-27: Initial feature documentation.
- 2026-04-04: Reframed around the active raceday and betting flows after AI helper runtime removal.
- 2026-04-05: Added raceday support for V5 and Dagens Dubbel suggestion flows.
