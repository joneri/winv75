# Epic: Race prediction and tips engine v1
(Read more in docs/features/race-analysis-and-ai-ranking.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Deliver the core race-level prediction and tipping engine for every ATG race with confidence-aware outputs.

## non-goals
- V85/V86 ticket composition details.
- Analyst preset UI.

## user experience
- normal case: each race has ranking, probabilities, tiers, and actionable tip guidance.
- edge case: race with uncertain data gets explicit confidence downgrade.
- failure / stale / uncertain data: system favors "low-confidence" over misleading strong advice.

## trust rules
- Every tip must be traceable to model outputs and confidence.
- Confidence and uncertainty must be first-class response fields.

## key kpis
- primary kpi: race-level tip quality uplift vs baseline.
- secondary kpis: confidence calibration and coverage of ATG race catalog.
- never-a-kpi: high confidence without calibration support.

## data sources and truth
- source of truth: foundational race entities + modeled scores/probabilities.
- fallbacks: conservative scoring path when full signals unavailable.
- freshness rules: race predictions updated with latest valid ingest snapshot.

## acceptance criteria
- [ ] Tip engine contract documented (inputs, outputs, confidence fields).
- [ ] Ranking + probability + tier behavior specified with uncertainty handling.
- [ ] Full ATG race coverage strategy is documented.
- [ ] Safety/fallback behavior for missing/stale data is explicit.

## debug and verification
- how to reproduce: run prediction pipeline on a historical race window and evaluate results.
- expected logs (only if needed): race id, model version, confidence summary.
- manual checks: inspect representative race outputs for sanity and explainability.
- automated checks: prediction contract and calibration regression tests.

## risks
- risk: quality varies across race classes/time windows.
- mitigation: segmented performance monitoring and fallback thresholds.

## dependencies
- prerequisites: `epic-platform-data-foundation.md`, `epic-modeling-elo-and-form-elo.md`, `epic-track-and-race-context-intelligence.md`.
- downstream: `epic-v85-v86-and-ticket-strategy.md`.

## files likely involved
- docs/epics/epic-race-prediction-and-tips-engine.md
- docs/features/race-analysis-and-ai-ranking.md
- docs/features/raceday-overview-and-game-context.md

## documentation update rule
Before starting:
- read: docs/features/race-analysis-and-ai-ranking.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
