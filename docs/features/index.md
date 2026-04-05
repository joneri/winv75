# Feature Inventory

## Purpose
This file is the top-level inventory of repo features and links to each AIM feature doc.

## Scope and boundaries
- Feature means user-visible product behavior or operational capability backed by dedicated backend/frontend flow.
- Internal helpers are documented inside the closest feature, not as separate features.

## Feature list
- `raceday-ingestion-and-listing.md`: Fetch raceday data from external APIs, store it, and browse paginated racedays.
- `raceday-overview-and-game-context.md`: Show raceday details, race cards, game badges, and V85/V86 suggestion actions.
- `race-analysis-and-ai-ranking.md`: Show race detail, Elo/form context, ranking support, and race navigation.
- `horse-catalog-and-detail.md`: Search/list horses and show detailed horse profile with results timeline.
- `driver-catalog-and-detail.md`: Search/list drivers and show detailed driver profile with enriched race metadata.
- `track-metadata-and-stats.md`: Resolve track metadata and maintain seeded/fallback track characteristics.
- `ratings-and-elo-engine.md`: Horse/driver Elo updates, recomputation, evaluation, and auto-tune orchestration.
- `elo-prediction-model.md`: Runtime model for career/form/driver/effective Elo, normalized field probabilities, and debug output.
- `v85-suggestion-engine.md`: Build V85 ticket suggestions with modes, templates, variants, and optional seed horses.
- `v86-suggestion-engine-and-pairing.md`: Build V86 pairing/game view/suggestions with status fallbacks.
- `global-search.md`: Multi-entity global search (horses, drivers, upcoming races, racedays, tracks, results).

## Inputs and outputs
- Inputs: code in `backend/src` and `frontend/src`, plus route wiring and service usage.
- Outputs: one feature doc per feature in this folder.

## Data correctness and trust
- Every feature doc references concrete files in this repository.
- Unclear behavior is captured as fallback/edge-case notes instead of assumptions.

## Change log
- 2026-02-27: Initial full feature inventory for AIM Epic.
