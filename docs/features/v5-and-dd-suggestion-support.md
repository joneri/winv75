# V5 and DD suggestion support

## Purpose
Extend the betting engine with live, playable support for V5 and Dagens Dubbel so winv75 can test suggestions beyond V85 and V86.

## User experience
From the raceday page, users can update V5 percentages, open V5 suggestions, and open Dagens Dubbel suggestions for the current day. Generated tickets remain selectable in the session and can be saved explicitly to suggestion history.

## How it works
V5 reuses the Elo-driven ranking flow but adds V5 market percentages from ATG, a five-leg template set, row cost `1 kr`, and a conservative structure that aims for at most one spik and one lås. DD resolves the active double game for the raceday date, builds two-leg tickets from horse rankings, winner odds, and DD combo odds, then returns a `10 kr` row-cost ticket plus combo insights.

## Inputs and outputs
- Inputs:
  - `GET /api/raceday/v5/templates`
  - `GET /api/raceday/dd/templates`
  - `GET /api/raceday/:id/dd/game`
  - `POST /api/raceday/:id/v5/update`
  - `POST /api/raceday/:id/v5`
  - `POST /api/raceday/:id/dd`
- Outputs:
  - V5 ticket suggestions with five legs, V5% context, and strategy metadata.
  - DD ticket suggestions with two legs, winner-odds context, and combo insights.

## Key decisions
- V5 is more defensive than V85/V86: broad guards are preferred, with max one spik and max one lås in the generated structure.
- DD treats winner odds and most-played combinations as support signals, not a replacement for the Elo ranking.
- `dd` from stored game data is normalized to `DD` in the frontend so the shell and badges stay coherent.

## Defaults and fallbacks
- V5 uses stored `v5Info` if available and can refresh it directly from the raceday page.
- DD can span more than one track on the same date, so the backend resolves the matching game view from the full date calendar.
- Missing V5 or DD support keeps those game cards hidden without breaking the rest of the raceday page.

## Edge cases
- If no V5 game is available for a raceday, the update and generation routes return explicit errors.
- If DD exists on the date but cannot be mapped back to the current raceday, the DD game endpoint returns `missing_game`.
- DD horse-level market data is limited to winner odds and combo odds because there is no per-start DD percentage pool.

## Debugging
- Primary logs: `Failed to build suggestion`, `Failed to load DD game view`, and `Failed to update distribution`.
- What "good" looks like: V5 returns five legs with `stakePerRow = 1`, DD returns two legs with `stakePerRow = 10`, and the raceday page exposes the new cards only when the games exist.

## Related files
- `backend/src/raceday/v5-service.js`
- `backend/src/raceday/dd-service.js`
- `backend/src/raceday/raceday-betting-routes.js`
- `backend/src/raceday/raceday-model.js`
- `frontend/src/views/raceday/RacedayView.vue`
- `frontend/src/views/raceday/components/V5SuggestionModal.vue`
- `frontend/src/views/raceday/components/DdSuggestionModal.vue`
- `frontend/src/views/raceday/services/RacedayService.js`

## Change log
- 2026-04-05: Initial feature documentation for V5 and Dagens Dubbel suggestion support.
