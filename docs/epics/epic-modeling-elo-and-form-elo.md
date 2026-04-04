# Epic: Modeling Elo and form Elo v1
(Read more in docs/features/ratings-and-elo-engine.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Create a significantly stronger rating system for horses and drivers (Elo + form Elo) that improves predictive quality and remains explainable.

## non-goals
- Final tip UX copy.
- Ticket generation strategy rules.

## user experience
- normal case: users see more accurate race rankings and confidence levels.
- edge case: sparse-history horses/drivers still receive robust, calibrated baseline ratings.
- failure / stale / uncertain data: model confidence is reduced when data support is weak.

## trust rules
- Model quality must be validated on historical holdout sets.
- No rating update without clear placement/event evidence.
- Driver and horse components must remain separately explainable.

## key kpis
- primary kpi: improvement in out-of-sample ranking quality vs current baseline.
- secondary kpis: calibration error, drift stability, feature importance stability.
- never-a-kpi: overfitted in-sample lift.

## data sources and truth
- source of truth: migrated historical race results + driver/horse history from Mongo.
- fallbacks: seeded baseline ratings for cold-start entities.
- freshness rules: update cadence by race completion events.

## acceptance criteria
- [ ] New Elo/form-Elo spec documented with update equations and parameter governance.
- [ ] Backtest protocol documented with train/validation split strategy.
- [ ] Driver Elo and horse Elo interaction rules are explicit.
- [ ] Calibration and drift monitoring requirements are specified.

## debug and verification
- how to reproduce: rerun backtest notebook/service with fixed seed and compare metrics.
- expected logs (only if needed): parameter set id, sample window, quality metrics.
- manual checks: inspect model behavior on known historical race scenarios.
- automated checks: deterministic backtest regression checks.

## risks
- risk: quality gains not stable across race classes/tracks.
- mitigation: stratified validation and per-segment diagnostics.

## dependencies
- prerequisites: `epic-platform-data-foundation.md`.
- downstream: `epic-race-prediction-and-tips-engine.md`, `epic-v85-v86-and-ticket-strategy.md`.

## files likely involved
- docs/epics/epic-modeling-elo-and-form-elo.md
- docs/features/ratings-and-elo-engine.md

## documentation update rule
Before starting:
- read: docs/features/ratings-and-elo-engine.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
