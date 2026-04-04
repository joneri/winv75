# AIM 1.4 validator support

## Purpose
Define validator support so AIM can run one quick integrity check over `.aim` and the accepted runtime contracts before trusting startup, resume, or repair actions.

## User experience
Users should be able to run or trigger one quick check and understand:
- what was checked
- whether AIM is safe to continue
- whether the issue is recoverable
- whether the runtime is blocked or contradictory
- what exact artifact or rule caused the result

## How it works
The validator checks:
- `.aim` structure
- required versus optional artifacts
- `state.json` syntax and semantic coherence
- active increment alignment with increment, review, and decision artifacts
- normalized repo-aware context availability
- ownership-rule violations around shared state and subagent outputs

### Result classes
- `healthy`
  - runtime state is coherent and safe to continue
- `recoverable`
  - runtime state has a repairable gap that does not require guessing across trust boundaries
- `blocked`
  - safe continuation requires explicit user input
- `contradictory`
  - authoritative artifacts disagree and escalation is required

### Quick-check output
The quick check should report:
- the checks performed
- the result class
- the exact failing artifact or rule
- the best next action

### Production expectation

Use `validate` before trusting:
- resume after interruption
- recovery after manual file edits
- migration from older AIM layouts
- any situation where `.aim` looks incomplete or contradictory

What users can trust:
- `healthy`:
  - the runtime checkpoint is coherent enough to continue
- `recoverable`:
  - the runtime can be repaired without crossing trust boundaries
- `blocked`:
  - the runtime must stop for explicit user input
- `contradictory`:
  - the runtime must escalate because authoritative artifacts disagree

Automatic repair boundary:
- the main AIM thread may repair `recoverable` state only when the repair is mechanical and trust-preserving
- `blocked` and `contradictory` states must not be auto-repaired through guesswork

### Relationship to runtime behavior
- startup may run a quick check before trusting an existing checkpoint
- resume should treat `blocked` and `contradictory` as stop-and-ask outcomes
- `recoverable` may allow repair only when the main AIM thread can restore coherence without trust loss
- validator recommendations do not themselves mutate shared state

## Inputs and outputs
- Inputs:
  - `.aim` artifacts
  - `state.json`
  - normalized repo-aware context
  - active platform capability information
- Outputs:
  - one integrity result class
  - a list of checks and failures
  - a recommended next action

## Key decisions
- keep the validator aligned with accepted runtime contracts instead of inventing new rules
- distinguish recoverable issues from blocked or contradictory conditions
- keep repair authority centralized in the main AIM thread
- make validator output precise enough to guide later implementation and troubleshooting

## Defaults and fallbacks
- if all checks pass, result is `healthy`
- if gaps are repairable without trust loss, result is `recoverable`
- if safe continuation depends on explicit value judgment, result is `blocked`
- if authoritative artifacts disagree, result is `contradictory`

## Edge cases
- stale optional artifacts should not fail validation if required artifacts and shared state remain coherent
- subagent analysis files may exist without affecting validity as long as they do not masquerade as authoritative shared state
- a repo can be structurally valid while still blocked by contradictory repo-aware policy

## Data correctness and trust
Must remain true:
- validator checks accepted runtime contracts instead of replacing them
- recoverable does not permit silent trust-breaking repairs
- contradictory always escalates
- only the main AIM thread may repair shared runtime state

## Debugging
The single best check to verify behavior:
- compare validator output with `.aim/state.json`, the newest increment/review/decision artifacts, and the normalized repo-aware context and confirm the reported result class matches the actual inconsistency

What “good” looks like:
- validator failures identify exact artifacts or rules
- recoverable versus blocked is easy to distinguish
- contradictory results clearly explain why escalation is required
- users can tell what the runtime may repair automatically and what must be escalated

What “bad” looks like:
- the validator says healthy while required artifacts disagree
- recoverable is used for trust-affecting contradictions
- validator output recommends a repair that would rewrite shared state without main-thread ownership

## Related files
- AGENTS.md
- docs/workflow/agile-iteration-method.md
- docs/features/aim-1.4-runtime-workspace.md
- docs/features/aim-1.4-bootstrap-and-resume.md
- docs/features/aim-1.4-state-transition-model.md
- docs/features/aim-1.4-repo-aware-runtime-context.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 validator support contract covering integrity checks, quick-check output, result classes, and repair ownership.
