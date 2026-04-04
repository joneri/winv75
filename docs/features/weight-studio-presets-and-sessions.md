# Weight Studio presets and sessions

## Purpose
Enable what-if weighting of AI signals per race, with preset persistence/export and analyst session telemetry.

## User experience
In race view Weight Studio, users adjust signal weights, see live ranking shifts, save/load presets, export preset manifest, and log analysis sessions.

## How it works
Frontend computes weighted rows from ranking+signal config. Backend stores presets with scope-based access control and stores session logs with summary metadata. Admin can query sessions by race.

## Inputs and outputs
- Inputs:
  - `GET /api/weight-presets`
  - `POST /api/weight-presets`
  - `GET /api/weight-presets/:id/manifest`
  - `POST /api/weight-presets/sessions`
  - `GET /api/weight-presets/sessions`
- Outputs:
  - Grouped presets (`system/team/personal`), manifest JSON, session ids/list.

## Key decisions
- Preset scope RBAC: system/team presets require analyst role.
- Session logging captures rank movement, dominance signals, and coverage diff telemetry.
- Preset compatibility filtered by `signalsVersion` in frontend.

## Defaults and fallbacks
- Default preset is local "Standard" when no saved preset selected.
- Missing/unauthorized session listing returns explicit API error (frontend surfaces message).

## Edge cases
- Team scope requires `teamId`; otherwise request is rejected.
- Locked/system presets are represented distinctly in selection UI.

## Data correctness and trust
- Saved preset manifest includes owner/team/timestamps for provenance.
- Session logs include race id, user, role, and change list for auditability.

## Debugging
- Primary log: backend errors from preset/session services, plus frontend console messages.
- What "good" looks like: weight changes update live rank and session log returns created id.
- What "bad" looks like: preset save succeeds but not returned in grouped preset list due to version mismatch.

## Related files
- `backend/src/weight/weight-preset-routes.js`
- `backend/src/weight/weight-preset-service.js`
- `backend/src/weight/weight-session-service.js`
- `backend/src/utils/request-user.js`
- `frontend/src/views/race/components/WeightStudio.vue`
- `frontend/src/api.ts`
- `frontend/src/views/Admin/AdminView.vue`

## Change log
- 2026-02-27: Initial feature documentation.
