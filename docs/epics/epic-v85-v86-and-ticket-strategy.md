# Epic: V85/V86 and ticket strategy v1
(Read more in docs/features/v85-suggestion-engine.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Provide high-quality, strategy-aware ticket suggestions for V85/V86 that leverage race predictions while preserving bankroll discipline and transparency.

## non-goals
- Raw race ranking model training.
- Generic global search features.

## user experience
- normal case: users can generate robust V85/V86 suggestions with mode and budget controls.
- edge case: partial game data still yields clear status and actionable fallback.
- failure / stale / uncertain data: suggestions are blocked or downgraded with explicit reason.

## trust rules
- Ticket composition logic must be auditable and deterministic by seed.
- Budget and row-cost math must be exact.

## key kpis
- primary kpi: ticket performance uplift vs baseline strategy over holdout period.
- secondary kpis: stability across modes, user seed usefulness, and error clarity.
- never-a-kpi: number of generated variants without quality validation.

## data sources and truth
- source of truth: race prediction outputs + game-leg mapping + public distribution inputs.
- fallbacks: status-driven fallback when pairing/game data missing.
- freshness rules: use latest verified game distribution snapshot.

## acceptance criteria
- [ ] V85/V86 strategy contract documented including mode/variant/seed behavior.
- [ ] Pairing and status fallback model defined.
- [ ] Budgeting and risk controls documented.
- [ ] Validation strategy for suggestion quality is specified.

## debug and verification
- how to reproduce: run deterministic suggestion generation with fixed seed and compare outputs.
- expected logs (only if needed): mode, variant, row count, budget, status path.
- manual checks: verify spikes/locks and budget math by sample tickets.
- automated checks: deterministic generation tests and status fallback tests.

## risks
- risk: strategy complexity makes outputs hard to trust.
- mitigation: expose concise rationale and strict deterministic replay.

## dependencies
- prerequisites: `epic-race-prediction-and-tips-engine.md`.
- downstream: none.

## files likely involved
- docs/epics/epic-v85-v86-and-ticket-strategy.md
- docs/features/v85-suggestion-engine.md
- docs/features/v86-suggestion-engine-and-pairing.md

## documentation update rule
Before starting:
- read: docs/features/v85-suggestion-engine.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
