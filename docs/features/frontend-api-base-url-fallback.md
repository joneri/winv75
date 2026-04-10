# Frontend API Base URL Fallback

## Purpose
Make the frontend keep working in local development even when `frontend/.env` is missing and `VITE_BE_URL` is not explicitly set.

## How it works
Frontend services may call the backend in two ways:
- relative `/api/...` requests that rely on Vite's proxy during local development
- explicit absolute URLs built from `VITE_BE_URL`

The shared helper in [frontend/src/config/api-base.js](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/src/config/api-base.js) now falls back to relative `/api` requests when `VITE_BE_URL` is empty.

## Key decisions
We preserve support for explicit backend URLs when `VITE_BE_URL` is set, but avoid breaking local screens just because the env file is absent.

## Inputs/outputs
Input: optional `VITE_BE_URL`.
Output: a valid backend URL for frontend service calls in both proxied local dev and explicit-host setups.

## Edge cases
Without this fallback, browser `fetch`/`axios` calls can fail before reaching the backend because the constructed URL is invalid.

## Debugging
If a page shows network-like errors while the backend is healthy, inspect whether it uses the shared helper or constructs URLs directly from `import.meta.env.VITE_BE_URL`.

## Related files
- [frontend/src/config/api-base.js](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/src/config/api-base.js)
- [frontend/src/views/raceday-input/services/RacedayInputService.js](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/src/views/raceday-input/services/RacedayInputService.js)
- [frontend/vite.config.ts](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/vite.config.ts)
