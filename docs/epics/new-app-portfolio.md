# Epic: Winv75 Next portfolio v1
(Read more in docs/features/index.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Define the full Epic portfolio for a new Winv75-class product that provides better ATG race tips, uses Svensk Travsport data at scale, and preserves historical truth from existing MongoDB.

## non-goals
- Implementing code in this portfolio doc.
- Final architecture lock for all technical choices.

## user experience
- normal case: team can execute the rewrite using a clear epic sequence.
- edge case: if feature overlap exists, ownership is resolved in epic dependency notes.
- failure / stale / uncertain data: portfolio enforces trust-first behavior over forced predictions.

## trust rules
- No hidden model logic: all prediction-critical behavior must be auditable.
- Historical Mongo data is mandatory input for calibration, not optional.
- Coverage and confidence must be visible per race tip.

## key kpis
- primary kpi: 100% mapping from `docs/features/index.md` to rewrite epics.
- secondary kpis: executable dependency graph and rollout order.
- never-a-kpi: number of docs without measurable acceptance.

## data sources and truth
- source of truth: feature docs + existing MongoDB historical data.
- fallbacks: current service behavior when documentation is incomplete.
- freshness rules: portfolio versioned and updated when source feature set changes.

## acceptance criteria
- [ ] Every feature in `docs/features/index.md` is mapped to one primary rewrite epic.
- [ ] Epic sequence is defined with prerequisites and downstream dependencies.
- [ ] Data migration/calibration requirements are explicit where model quality depends on history.

## debug and verification
- how to reproduce: compare feature inventory against mapping table below.
- expected logs (only if needed): none.
- manual checks: validate mapping completeness and dependency coherence.
- automated checks: file existence checks for all target epic docs.

## risks
- risk: portfolio too broad for practical sprint planning.
- mitigation: each epic has bounded acceptance and dependency notes.

## dependencies
- prerequisites: none.
- downstream: all listed rewrite epics.

## files likely involved
- docs/features/index.md
- docs/epics/*.md

## documentation update rule
Before starting:
- read: docs/features/index.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## epic sequence
1. `epic-platform-data-foundation.md`
2. `epic-modeling-elo-and-form-elo.md`
3. `epic-track-and-race-context-intelligence.md`
4. `epic-race-prediction-and-tips-engine.md`
5. `epic-v85-v86-and-ticket-strategy.md`
6. `epic-ai-explanation-and-transparency.md`
7. `epic-horse-and-driver-intelligence.md`
8. `epic-global-search-and-discovery.md`
9. `epic-weights-presets-and-analyst-workbench.md`
10. `epic-observability-ops-and-governance.md`

## feature mapping
- `raceday-ingestion-and-listing.md` -> `epic-platform-data-foundation.md`
- `raceday-overview-and-game-context.md` -> `epic-race-prediction-and-tips-engine.md`
- `race-analysis-and-ai-ranking.md` -> `epic-race-prediction-and-tips-engine.md`
- `horse-ai-summary.md` -> `epic-ai-explanation-and-transparency.md`
- `horse-catalog-and-detail.md` -> `epic-horse-and-driver-intelligence.md`
- `driver-catalog-and-detail.md` -> `epic-horse-and-driver-intelligence.md`
- `track-metadata-and-stats.md` -> `epic-track-and-race-context-intelligence.md`
- `ratings-and-elo-engine.md` -> `epic-modeling-elo-and-form-elo.md`
- `ai-profiles-and-preview.md` -> `epic-weights-presets-and-analyst-workbench.md`
- `v85-suggestion-engine.md` -> `epic-v85-v86-and-ticket-strategy.md`
- `v86-suggestion-engine-and-pairing.md` -> `epic-v85-v86-and-ticket-strategy.md`
- `global-search.md` -> `epic-global-search-and-discovery.md`
- `weight-studio-presets-and-sessions.md` -> `epic-weights-presets-and-analyst-workbench.md`
- `admin-operations-and-observability.md` -> `epic-observability-ops-and-governance.md`

## change log
- 2026-02-27: Initial rewrite portfolio mapped from current feature inventory.
