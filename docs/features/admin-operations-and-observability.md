# Admin operations and observability

## Purpose
Provide operational controls for ratings, AI precompute, tuning/evaluation, profile management, metrics visibility, and session inspection.

## User experience
Admin screen offers one place to run rating jobs, precompute AI caches, evaluate Elo, manage AI profiles, run auto-tune, update driver Elo, inspect metrics, and browse Weight Studio sessions.

## How it works
Admin view orchestrates multiple backend admin endpoints and exposes status/result data in cards/tables. It also persists some tuning knobs locally for repeated evaluation runs.

## Inputs and outputs
- Inputs:
  - `POST /api/rating/update`
  - `POST /api/raceday/_admin/precompute-ai`
  - `GET /api/_metrics`
  - `GET /api/rating/eval`
  - `POST /api/rating/auto-tune/start`
  - `GET /api/rating/auto-tune/status/:jobId`
  - `POST /api/rating/auto-tune/cancel/:jobId`
  - `GET/PUT/POST` driver and AI-profile admin endpoints
  - `GET /api/weight-presets/sessions`
- Outputs:
  - Job status, evaluation payloads, profile/session data, and user feedback snackbars.

## Key decisions
- Keep operational actions explicit (button-triggered) rather than automatic.
- Support both manual driver Elo update and bulk recompute flows.

## Defaults and fallbacks
- Auto-tune and evaluation parameters have UI defaults with localStorage persistence for key Elo knobs.
- Metrics fetch failures are shown without breaking remaining admin controls.

## Edge cases
- Concurrent auto-tune jobs are rejected by backend (`409`).
- Weight session list requires analyst permissions.

## Data correctness and trust
- Admin values shown are fetched from backend authoritative endpoints.
- Driver Elo update flow reads current values before write to reduce accidental overwrite.

## Debugging
- Primary log: AdminService/API failures and backend route logs.
- What "good" looks like: actions return success feedback and updated values/status.
- What "bad" looks like: silent no-op after action click or stale status never advancing.

## Related files
- `frontend/src/views/Admin/AdminView.vue`
- `frontend/src/views/Admin/services/AdminService.js`
- `frontend/src/views/Admin/services/AutoTuneService.js`
- `frontend/src/views/Admin/services/AiProfilesService.js`
- `backend/src/rating/elo-routes.js`
- `backend/src/raceday/raceday-routes.js`
- `backend/src/driver/driver-routes.js`
- `backend/src/ai-profile/ai-profile-routes.js`
- `backend/src/middleware/metrics.js`

## Change log
- 2026-02-27: Initial feature documentation.
