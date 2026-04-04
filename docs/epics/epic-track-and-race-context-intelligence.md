# Epic: Track and race context intelligence v1
(Read more in docs/features/track-metadata-and-stats.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Improve race understanding through richer track intelligence, start-method effects, lane bias, and race-context factors.

## non-goals
- Final betting ticket optimization.
- Full AI narrative generation.

## user experience
- normal case: race context visibly improves ranking relevance.
- edge case: unknown track metadata falls back to conservative defaults.
- failure / stale / uncertain data: track-sensitive boosts are suppressed when support is low.

## trust rules
- Track adjustments must be backed by historical evidence.
- Unknown/low-sample context must not be overconfident.

## key kpis
- primary kpi: measurable gain from context-aware model vs context-off baseline.
- secondary kpis: per-track calibration and confidence reliability.
- never-a-kpi: cosmetic complexity in context features.

## data sources and truth
- source of truth: historical race outcomes by track, distance, start method, and position.
- fallbacks: seeded track metadata with low-confidence flags.
- freshness rules: track statistics are recomputed on scheduled cadence.

## acceptance criteria
- [ ] Context feature catalog is documented with provenance.
- [ ] Track fallback strategy is defined for sparse tracks.
- [ ] Confidence degradation rules for low-sample contexts are specified.
- [ ] Validation plan includes per-track and per-distance slices.

## debug and verification
- how to reproduce: run context feature extraction on fixed race sample and compare outputs.
- expected logs (only if needed): context feature coverage and sample counts.
- manual checks: inspect top races with known track bias behavior.
- automated checks: context feature consistency tests.

## risks
- risk: context overfitting to a few tracks.
- mitigation: shrinkage and minimum sample constraints.

## dependencies
- prerequisites: `epic-platform-data-foundation.md`.
- downstream: `epic-race-prediction-and-tips-engine.md`.

## files likely involved
- docs/epics/epic-track-and-race-context-intelligence.md
- docs/features/track-metadata-and-stats.md

## documentation update rule
Before starting:
- read: docs/features/track-metadata-and-stats.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
