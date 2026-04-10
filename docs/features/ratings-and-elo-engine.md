# Ratings and Elo engine

## Purpose
Maintain and evaluate horse and driver Elo ratings, plus expose the race-time prediction layer that turns those ratings into effective Elo and normalized model probability.

## User experience
These are maintenance-oriented backend flows used for controlled rating updates, evaluation, and driver Elo recomputation.

## How it works
Horse and driver Elo services process historical race placements with configurable K and explicit profile policies. That persistent layer stores:
- horse `rating` as career Elo
- horse `formRating` as persisted short-horizon Elo
- driver `careerElo`
- driver `elo` as driver form Elo

Horse rebuild, direct race update, and runtime prediction now share the same result-code and recency policy layer. At read time, the prediction layer rebuilds a race-time `formElo`, adds controlled driver support, applies race context, applies start-method affinity when the horse has enough auto/volt history, applies start-position affinity when the horse has enough history from the active start position within the active start method, applies distance affinity when the horse has enough bucket history, applies track x distance affinity when the horse has enough exact joint-context history, applies same-track affinity when the sample is strong enough, applies shoe signal when the shoe taxonomy is trustworthy, applies driver-horse affinity when the active driver has real shared history with the horse, applies lane bias through hierarchical shrinkage, and produces `effectiveElo` plus field-normalized `modelProbability`.
If a horse has no results inside the active runtime lookback window, the prediction layer now uses the latest known completed race date anyway to compute inactivity and reverts stale stored form back toward career Elo instead of preserving an old hot form signal.

## Inputs and outputs
- Inputs:
  - `POST /api/rating/update`
  - `GET /api/rating/status`
  - `POST /api/rating/race/:raceId`
  - `GET /api/rating/eval`
  - `POST /api/rating/auto-tune/start`
  - `GET /api/rating/auto-tune/status/:jobId`
  - `POST /api/rating/auto-tune/cancel/:jobId`
  - `PUT /api/driver/:id/elo`
  - `POST /api/driver/recompute`
- Outputs:
  - Updated rating rows and history.
  - Evaluation payloads that compare baseline career Elo against the upgraded effective Elo blend.

## When Elo updates
There are two separate update moments:

- Stored Elo updates when the backend runs a real rating write path:
  - full rebuild through `backend/src/horse/update-elo-ratings.js`
  - direct race update through `backend/src/rating/elo-service.js`
- Runtime prediction updates when horse or race payloads are read:
  - rebuild race-time `formElo`
  - apply context features
  - produce `effectiveElo` and `modelProbability`
- Saved-ticket result refresh may also trigger an incremental global Elo update when refreshed race results are newer than the stored Elo checkpoint.

That means stored rating freshness and runtime prediction freshness are related, but they are not exactly the same thing.

## Key decisions
- Keep separate form and career horizons (different decay/race-count behavior).
- Make between-race recency explicit through stored `lastRaceDate` and `formLastRaceDate` on horse ratings.
- Keep runtime prediction explainable instead of hiding the final score in ad hoc horse helpers.
- Model context features with one shared contract: raw measurement, sample size, confidence, capped `deltaElo`, and reason.
- Keep lane bias conservative by shrinking exact start-position buckets toward broader track/method/distance baselines.
- Persist rating history snapshots for horse Elo updates.
- Allow driver manual override and full recompute path.

## Defaults and fallbacks
- Defaults come from env constants when request params are missing.
- Invalid payloads return `400`; runtime failures return `500`.

## Edge cases
- Missing horses/drivers are seeded with default/derived starting ratings.
- Invalid or incomplete race placements are filtered out.
- Withdrawn and pending results are ignored.
- Gallop and disqualification are handled as explicit negative outcomes in both rating updates and runtime form rebuilding.
- Unknown or unreliable shoe codes, especially raw code `9`, are allowed in stored data but are suppressed in the prediction layer.

## Data correctness and trust
- Elo updates are placement-driven and deterministic for same input parameters.
- Rating updates no longer depend on `Date.now()` for historical race weighting.
- Evaluation endpoints perform read-only computation and now report baseline vs upgraded model quality.
- Race and horse payloads expose `eloDebug` so suspicious rankings can be traced to specific recent results, context signals, shrink values and weights.
- Horse detail now separates trend movement (`formTrendDelta`, versus stored form) from gap to class (`formGapToCareer`, versus career Elo) so the UI does not present those as the same thing.
- Stored horse ratings keep `lastUpdated`, `formLastUpdated`, `lastRaceDate`, `formLastRaceDate` and `eloVersion`.
- The app now exposes a simple Elo status surface through `GET /api/rating/status`, a start-page update action, and horse-detail freshness fields.

## Debugging
- Primary log: route-level failures (`Manual rating update failed`, `Elo evaluation failed`, `Failed to start auto-tune`).
- What "good" looks like: race and horse payloads include `effectiveElo`, `eloVersion`, `eloWeights`, `eloDebug.contextAdjustments.startMethodAffinity`, `eloDebug.contextAdjustments.startPositionAffinity`, `eloDebug.contextAdjustments.distanceAffinity`, `eloDebug.contextAdjustments.trackDistanceAffinity`, `eloDebug.contextAdjustments.trackAffinity`, `eloDebug.contextAdjustments.shoeSignal`, `eloDebug.contextAdjustments.driverHorseAffinity`, `eloDebug.contextAdjustments.laneBias`, and `eloDebug.effectiveEloBreakdown`; context features show sample sizes plus capped deltas; evaluation returns baseline and upgraded RMSE.
- What "good" looks like for freshness: `GET /api/rating/status` returns `lastProcessedRaceDate`, latest rating timestamps, stored Elo version and rated horse count; horse detail shows stored Elo freshness alongside runtime prediction data.
- What "bad" looks like: auto-tune stuck with no processed combinations.

## Related files
- `backend/src/rating/elo-routes.js`
- `backend/src/rating/elo-service.js`
- `backend/src/rating/elo-engine.js`
- `backend/src/rating/horse-elo-prediction.js`
- `backend/src/rating/elo-eval.js`
- `backend/src/rating/auto-tune.js`
- `backend/src/driver/driver-elo-service.js`
- `backend/src/horse/horse-service.js`
- `backend/src/race/race-read-service.js`

## Change log
- 2026-04-10: Added stale-form fallback logic for horses with only old starts and split trend-vs-stored-form from gap-vs-career in horse detail payloads.
- 2026-02-27: Initial feature documentation.
- 2026-04-04: Removed references to the deleted admin frontend surface.
- 2026-04-05: Added explicit runtime prediction model with effective Elo, normalized probabilities, debug and comparative evaluation.
- 2026-04-05: Unified stored Elo update paths with the runtime result and recency policy layer.
- 2026-04-05: Added min-sample-protected track affinity in the runtime prediction layer and exposed its delta in debug.
- 2026-04-05: Added normalized shoe taxonomy and a capped horse-relative shoe signal as context feature #2.
- 2026-04-05: Added capped distance affinity based on horse-relative short/medium/long history.
- 2026-04-05: Added capped track x distance affinity based on horse-relative exact track plus distance-bucket history.
- 2026-04-05: Added capped start-method affinity based on horse-relative auto/volt history.
- 2026-04-05: Added capped start-position affinity based on horse-relative history from the active start position within the active start method.
- 2026-04-05: Added capped driver-horse affinity based on horse-relative shared-driver history.
- 2026-04-05: Added lane bias as context feature #3 with hierarchical shrinkage and capped runtime impact.
- 2026-04-08: Added Elo status endpoint, start-page Elo update action and horse-detail Elo freshness fields.
