# Epic: AI explanation and transparency v1
(Read more in docs/features/horse-ai-summary.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Make every prediction and tip understandable: explain what drove the recommendation, what confidence means, and where uncertainty is high.

## non-goals
- Core Elo model implementation.
- Admin operations tooling.

## user experience
- normal case: users receive clear race and horse explanations linked to signals and confidence.
- edge case: if context is thin, explanation clearly states uncertainty and limits.
- failure / stale / uncertain data: explanation layer reports unavailable rationale instead of fabricating narrative.

## trust rules
- Explanation text must never contradict model outputs.
- Confidence language must match calibrated confidence values.

## key kpis
- primary kpi: user trust/clarity score improvement and reduced misleading interpretation.
- secondary kpis: explanation coverage and consistency checks.
- never-a-kpi: persuasive text quality without factual grounding.

## data sources and truth
- source of truth: race prediction outputs, feature contributions, confidence metadata.
- fallbacks: minimal factual summary when full rationale unavailable.
- freshness rules: explanations tied to model version and prediction timestamp.

## acceptance criteria
- [ ] Explanation contract documented for race-level and horse-level outputs.
- [ ] Confidence communication rules are explicit and testable.
- [ ] Narrative safeguards are defined for low-confidence contexts.
- [ ] Persistence/retrieval strategy for generated explanations is documented.

## debug and verification
- how to reproduce: generate explanations for sample races and compare with source signals.
- expected logs (only if needed): explanation id, model version, confidence band.
- manual checks: verify no contradiction between explanation and ranking data.
- automated checks: consistency tests against source prediction payload.

## risks
- risk: overconfident language despite weak evidence.
- mitigation: confidence-gated response templates.

## dependencies
- prerequisites: `epic-race-prediction-and-tips-engine.md`.
- downstream: none.

## files likely involved
- docs/epics/epic-ai-explanation-and-transparency.md
- docs/features/horse-ai-summary.md

## documentation update rule
Before starting:
- read: docs/features/horse-ai-summary.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
