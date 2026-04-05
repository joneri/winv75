# Elo prediction model

## Purpose
Turn winv75 Elo into an explainable race prediction model with explicit career, form, driver and effective Elo plus normalized race win probabilities.

## How it works
- Stored horse `rating` remains the long-horizon `careerElo`.
- Stored horse `formRating` remains the persisted short-horizon base that the runtime starts from.
- Runtime prediction rebuilds a stronger `formElo` from recent results by applying:
  - explicit result scoring
  - recency decay
  - inactivity penalty
  - a controlled anchor back toward the persisted form Elo
- Driver Elo is used as a support delta, not as a dominant score.
- Race context adds structured adjustments for:
  - start method
  - distance bucket
  - track when the context exists
- `effectiveElo` is then converted to normalized field probabilities with a softmax step per race.

## Effective Elo formula
`effectiveElo = careerElo * 0.42 + formElo * 0.58 + driverSupportDelta + contextAdjustment`

Driver support is calculated from driver Elo around a baseline of `1000` and shrunk when the sample is weak.

## Result and recency handling
- Wins and strong placings score clearly positive.
- Weak placings score negative.
- `withdrawn` results are ignored.
- Gallop and disqualification are explicit negative outcomes but do not nuke form unrealistically on their own.
- Newer races get higher weight through exponential decay.
- Stale horses lose form through an inactivity penalty after a grace window.

## Outputs
Race and horse prediction payloads now expose:
- `careerElo`
- `storedFormElo`
- `formElo`
- `driverElo`
- `effectiveElo`
- `modelProbability` on race-level payloads
- `eloVersion`
- `eloWeights`
- `eloDebug`

Legacy compatibility fields still exist:
- `rating` maps to `careerElo`
- `formRating` maps to `formElo`
- `winProbability` maps to normalized `modelProbability` in race fields
- `formComponents` mirrors `eloDebug`

## Debugging
Inspect `eloDebug` for:
- component weights
- recent races used
- per-race recency weights
- result codes and scores
- inactivity penalty
- context adjustments
- final effective Elo

## Evaluation
Use `GET /api/rating/eval` to compare:
- `career_elo_only`
- `effective_elo_blend`

The response includes baseline vs upgraded RMSE and the delta between them.

## Related files
- `backend/src/rating/horse-elo-prediction.js`
- `backend/src/horse/horse-service.js`
- `backend/src/race/race-read-service.js`
- `backend/src/rating/elo-eval.js`
- `backend/src/suggestion/suggestion-service.js`

## Change log
- 2026-04-05: Added explicit career/form/driver/effective Elo prediction model with debug and field-normalized probabilities.
