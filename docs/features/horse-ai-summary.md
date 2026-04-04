# Horse AI summary

## Purpose
Generate short AI-written horse summary text for a specific race/horse context and persist it with metadata.

## User experience
In race view, users can trigger AI summary per horse and later reload previously generated summary without re-running generation.

## How it works
Backend endpoint builds contextual prompt inputs (field Elo context, start method, comments, probabilities), calls summary generator, then persists `aiSummary` and `aiSummaryMeta` on race horse node.

## Inputs and outputs
- Inputs:
  - `POST /api/race/horse-summary` (`raceId`, `horseId`, optional context)
  - `GET /api/race/:id/horse/:horseId/summary`
  - `GET /api/race/horse/:horseId/past-comments`
- Outputs:
  - Generated summary text.
  - Persisted summary + metadata attached to horse in raceday document.

## Key decisions
- Persist summary by race+horse and user context to support reload and auditability.
- Use stored comments fallback when request does not supply comments.

## Defaults and fallbacks
- If request has no comments, service falls back to latest stored ATG comments.
- Missing summary service text returns `502` with explicit error.

## Edge cases
- Missing race/horse ids returns `400`.
- Unknown race/horse path returns `404`.

## Data correctness and trust
- Context fields (rank, Elo percentile, implied win percent) are derived from stored race data.
- Metadata tracks generation time and source context for traceability.

## Debugging
- Primary log: `Failed to generate horse AI summary` in race routes.
- What "good" looks like: summary saved and returned by follow-up GET endpoint.
- What "bad" looks like: generation success but no persisted `aiSummaryMeta` in raceday horse entry.

## Related files
- `backend/src/race/race-routes.js`
- `backend/src/ai-horse-summary.js`
- `backend/src/horse/horse-model.js`
- `frontend/src/ai/horseSummaryClient.js`
- `frontend/src/views/race/RaceHorsesView.vue`
- `frontend/src/views/race/components/HorseCommentBlock.vue`

## Change log
- 2026-02-27: Initial feature documentation.
