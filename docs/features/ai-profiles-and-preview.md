# AI profiles and preview

## Purpose
Manage configurable AI ranking profiles, activate one profile at a time, preview profile quality metrics, and keep profile change history.

## User experience
Admins can list/edit/create/duplicate profiles, activate selected profile, run preview over raceday/date scope, and inspect profile history.

## How it works
Profile service seeds defaults from env if empty, keeps active-profile cache with TTL, tracks history entries for create/update/duplicate/activate/preview, and optionally clears raceday AI cache on activation.

## Inputs and outputs
- Inputs:
  - `GET /api/ai-profiles`
  - `GET /api/ai-profiles/active`
  - `GET /api/ai-profiles/:key`
  - `POST /api/ai-profiles`
  - `PUT /api/ai-profiles/:key`
  - `POST /api/ai-profiles/:key/duplicate`
  - `POST /api/ai-profiles/:key/activate`
  - `GET /api/ai-profiles/:key/history`
  - `POST /api/ai-profiles/preview`
- Outputs:
  - Profile records and preview metrics (Brier/RMSE-like aggregates).

## Key decisions
- Keep active profile lookup cached for short TTL to reduce repeated DB reads.
- History log is first-class for profile lifecycle and preview runs.

## Defaults and fallbacks
- If no profiles exist, service auto-seeds baseline presets.
- Missing profile key returns not-found style error path.

## Edge cases
- Duplicate or missing profile keys are validated and rejected.
- Preview requires either `racedayId` or `dateFrom/dateTo`.

## Data correctness and trust
- Preview uses same race-insight builder path as production ranking.
- Activation changes are explicit and auditable via history entries.

## Debugging
- Primary log: profile preview/activation route errors.
- What "good" looks like: active profile endpoint changes after activation and preview metrics include race count > 0.
- What "bad" looks like: active profile unchanged after activation or preview always returns zero races.

## Related files
- `backend/src/ai-profile/ai-profile-routes.js`
- `backend/src/ai-profile/ai-profile-service.js`
- `backend/src/ai-profile/ai-profile-model.js`
- `backend/src/ai-profile/ai-profile-history-model.js`
- `frontend/src/views/Admin/services/AiProfilesService.js`
- `frontend/src/views/Admin/AdminView.vue`

## Change log
- 2026-02-27: Initial feature documentation.
