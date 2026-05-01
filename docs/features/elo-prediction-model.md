# Elo prediction model

## Purpose
Turn winv75 Elo into an explainable race prediction model with explicit career, form, driver and effective Elo plus normalized race win probabilities.

## How it works
- Stored horse `rating` remains the long-horizon `careerElo`.
- Stored horse `formRating` remains the persisted short-horizon base that the runtime starts from.
- Rebuild and direct race updates now use the same Elo policy layer for:
  - result code handling
  - between-race recency decay
  - profile-specific K and half-life behavior
- Runtime prediction rebuilds a stronger `formElo` from recent results by applying:
  - explicit result scoring
  - unplaced `0`/`sortValue: 99` starts as active weak form results
  - recency decay
  - result-count confidence so several recent weak starts can move stored form even when older starts have low recency weight
  - inactivity penalty
  - a controlled anchor back toward the persisted form Elo
  - stale-form reversion toward `careerElo` when the horse has no in-window races but does have older completed starts
- Driver Elo is used as a support delta, not as a dominant score.
- Race context adds structured adjustments for:
  - start-method affinity when the horse has enough history in auto or volt
  - start method
  - start-position affinity when the horse has enough history from the active start position within the active start method
  - distance affinity when the horse has enough history in the active distance bucket
  - distance bucket
  - track x distance affinity when the horse has enough history in the active track-distance bucket
  - track affinity when the horse has enough same-track history
  - shoe signal when the current shoe setup can be matched safely against horse-relative history
  - driver-horse affinity when the current driver has enough shared history with this horse
  - lane bias when the contextual start-position bucket is strong enough after hierarchical shrinkage
- `effectiveElo` is then converted to normalized field probabilities with a softmax step per race.

## Effective Elo formula
`effectiveElo = careerElo * 0.38 + formElo * 0.62 + driverSupportDelta + contextAdjustment`

Driver support is calculated from driver Elo around a baseline of `1000` and shrunk when the sample is weak.
Track affinity is calculated as a same-track relative performance signal:
- compare weighted outcome on the current track against the horse's weighted overall baseline
- require a minimum same-track sample before it can affect the score
- shrink the signal hard before converting it into `deltaElo`
- cap the final impact so it cannot dominate the Elo blend

Shoe signal is calculated as a horse-relative shoe-context signal:
- raw codes are normalized into a canonical internal taxonomy
- trusted current states are `all_shoes`, `barefoot_front`, `barefoot_back` and `barefoot_all`
- raw code `9` and other non-canonical values are treated as unreliable and do not get model impact
- if the current horse setup represents a reliable change and there is enough same-change history, the model uses that change sample
- otherwise it falls back to same-state shoe history when the sample is strong enough
- the final shoe delta is confidence-weighted and hard-capped before it enters `effectiveElo`

Future context features should follow the same contract:
- `rawMeasurement`
- `sampleSize`
- `confidence`
- `deltaElo`
- `reason`

Driver-horse affinity is calculated as a horse-relative shared-driver signal:
- identify the current driver from the live race context
- compare the horse's weighted outcome with that same driver against the horse's overall baseline
- require a minimum shared-history sample
- shrink the effect before converting it into `deltaElo`
- cap the final impact so it remains a context nudge rather than a duplicate of driver Elo

Distance affinity is calculated as a horse-relative distance-bucket signal:
- current race distance is normalized to `short`, `medium` or `long`
- the horse's weighted outcome in that bucket is compared against the horse's overall baseline
- the feature only activates when the horse has enough history in that distance bucket
- the final `distanceDelta` is confidence-weighted and capped before it enters `effectiveElo`

Track x distance affinity is calculated as a horse-relative joint context signal:
- current race context is normalized to `track + distanceBucket`
- the horse's weighted outcome in that exact track-distance bucket is compared against the horse's overall baseline
- the feature only activates when the horse has enough history in that exact joint bucket
- the final `trackDistanceDelta` is confidence-weighted and capped before it enters `effectiveElo`

Start-method affinity is calculated as a horse-relative start-method signal:
- current race start method is normalized to `auto` or `volt`
- the horse's weighted outcome in that start method is compared against the horse's overall baseline
- the feature only activates when the horse has enough history in that start method
- the final `startMethodDelta` is confidence-weighted and capped before it enters `effectiveElo`

Start-position affinity is calculated as a horse-relative gate-position signal:
- current race start position is evaluated inside the active start method
- the horse's weighted outcome from that same start position is compared against the horse's overall baseline
- the feature only activates when the horse has enough history from that same start position in the same start method
- the final `startPositionDelta` is confidence-weighted and capped before it enters `effectiveElo`

Lane bias is now context feature #3:
- key = `trackCode + startMethod + distanceBucket + startPosition`
- exact bucket outcome is shrunk toward:
  - `trackCode + startMethod + distanceBucket`
  - `trackCode + startMethod`
  - global baseline
- the final lane effect is the exact bucket's shrunk outcome relative to the shrunk distance-context baseline
- the signal only activates when the exact bucket has enough starts
- the final `laneBiasDelta` is capped hard so it stays a context nudge, not a dominant score

## Result and recency handling
- Wins and strong placings score clearly positive.
- Weak placings score negative.
- Unplaced `0` results are treated as active weak results, not invalid rows.
- Unplaced `0` rows with explicit external-withdrawal reason text (for example `str, banforhallande` or `str, transporthinder`) are treated as withdrawn and ignored.
- `withdrawn` results are ignored.
- Gallop and disqualification are explicit negative outcomes but do not nuke form unrealistically on their own.
- Newer races get higher weight through explicit half-life based recency weights.
- Runtime Form Elo blends recent-result evidence by both recency weight and count confidence, so a cluster of poor recent starts can cool an over-hot stored `formRating`.
- Stored career and form ratings now decay between races using different half-life profiles instead of being tied to `Date.now()` at rebuild time.
- Form decays back toward career much faster than career decays toward its seed/base.
- When the latest real start is older than the prediction lookback window, runtime form no longer keeps a "hot" stored form untouched. It first cools an over-heated stored form back toward `careerElo`, then applies inactivity on the actual latest known race date.
- The stale fallback is one-sided: if stored form already sits below `careerElo`, stale reversion does not lift it upward without any fresh starts.

## Outputs
Race and horse prediction payloads now expose:
- `careerElo`
- `storedFormElo`
- `formElo`
- `formTrendDelta`
- `formGapToCareer`
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
- sample confidence used for blending recent evidence against stored form
- result codes and scores
- inactivity penalty
- latest known race date outside the active lookback window
- stale-form reversion ratio and reversion Elo when no recent races are available
- context adjustments
- track affinity raw measurement, sample size, confidence and `deltaElo`
- start method, sample size, confidence and `startMethodDelta`
- start method plus start position, sample size, confidence and `startPositionDelta`
- distance bucket, sample size, confidence and `distanceDelta`
- track plus distance bucket, sample size, confidence and `trackDistanceDelta`
- shoe raw codes, normalized states, change classification, sample sizes, confidence and `deltaElo`
- current driver id, shared-history sample size, confidence and `driverHorseAffinityDelta`
- lane bias keys, hierarchy sample sizes, shrunk baselines, confidence and `deltaElo`
- effective Elo breakdown by component
- recency profiles
- final effective Elo

## Evaluation
Use `GET /api/rating/eval` to compare:
- `career_elo_only`
- `effective_elo_blend`

The response includes baseline vs upgraded RMSE and the delta between them.

## Related files
- `backend/src/rating/horse-elo-prediction.js`
- `backend/src/rating/elo-policy.js`
- `backend/src/horse/update-elo-ratings.js`
- `backend/src/horse/horse-service.js`
- `backend/src/race/race-read-service.js`
- `backend/src/rating/elo-eval.js`
- `backend/src/suggestion/suggestion-service.js`

## Change log
- 2026-05-01: Added explicit external-withdrawal signal handling for unplaced `0` rows; plain `0` remains weak form when no such signal exists.
- 2026-05-01: Treated unplaced `0`/`sortValue: 99` starts as weak active results and added result-count confidence so runtime Form Elo cools over-hot stored form when recent form is visibly poor.
- 2026-04-25: Changed stale-form fallback to only cool over-hot stored form toward career Elo, so inactive horses do not get artificial positive trend from stale reversion.
- 2026-04-10: Fixed stale-form handling so inactive horses revert toward career Elo before inactivity is applied, and exposed separate trend-vs-stored-form plus gap-vs-career metrics.
- 2026-04-05: Added explicit career/form/driver/effective Elo prediction model with debug and field-normalized probabilities.
- 2026-04-05: Unified rebuild, direct update, and runtime prediction around shared Elo result and recency policies.
- 2026-04-05: Added track affinity as the first explicit contextual prediction signal with min-sample protection, shrinkage and detailed debug breakdown.
- 2026-04-05: Added normalized shoe taxonomy and shoe signal as context feature #2 with strict handling of unreliable shoe codes.
- 2026-04-05: Added distance affinity as a capped horse-relative bucket signal over short, medium and long distance.
- 2026-04-05: Added track x distance affinity as a capped horse-relative joint context signal over exact track and distance bucket.
- 2026-04-05: Added start-method affinity as a capped horse-relative signal over auto and volt.
- 2026-04-05: Added start-position affinity as a capped horse-relative signal over the active start position within the active start method.
- 2026-04-05: Added driver-horse affinity as a capped horse-relative shared-driver signal.
- 2026-04-05: Added lane bias as context feature #3 with hierarchical shrinkage over exact, distance, track-method and global context.
