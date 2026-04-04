# AIM 1.4 state transition model

## Purpose
Define a formal runtime state model for `state.json` so AIM can persist gate progression, pause and block states, increment acceptance, and Epic completion without ambiguity.

## User experience
Users should be able to inspect `state.json` and understand:
- whether AIM is waiting for Gate A, Gate B, or Gate E approval
- whether an increment is being built, reviewed, or validated
- whether work is paused or blocked
- whether the current increment was accepted
- whether the Epic is complete

## How it works
Canonical runtime states:
- `epic_initialized`
- `gate_a_pending`
- `gate_b_pending`
- `increment_in_progress`
- `review_in_progress`
- `tdo_validation_in_progress`
- `po_approval_pending`
- `done_increment_accepted`
- `epic_paused`
- `blocked`
- `epic_complete`

### Normal path
- `epic_initialized` -> `gate_a_pending`
- `gate_a_pending` -> `gate_b_pending`
- `gate_b_pending` -> `increment_in_progress`
- `increment_in_progress` -> `review_in_progress`
- `review_in_progress` -> `tdo_validation_in_progress`
- `tdo_validation_in_progress` -> `po_approval_pending`
- `po_approval_pending` -> `done_increment_accepted`

After increment acceptance:
- `done_increment_accepted` -> `gate_b_pending` for the next increment
- `done_increment_accepted` -> `epic_complete` if the Epic is fully accepted

### Exceptional states
- `epic_paused`:
  - work is intentionally paused
  - the Epic is not blocked, rejected, or complete
- `blocked`:
  - safe continuation is impossible without escalation or new input

Paused and blocked states are resumable.
They are not success states and do not imply acceptance.

### Transition ownership
- only the main AIM thread may persist transitions in `state.json`
- `Dev` and `Reviewer` provide evidence that transitions are ready
- `TDO` owns synthesis into the next runtime checkpoint before PO acceptance
- `PO` owns acceptance decisions that move the runtime to `done_increment_accepted` or `epic_complete`

### Persistence model
`state.json` should make at least these fields meaningful together:
- `epicStatus`
- `activeIncrementId`
- `currentRole`
- `lastGatePassed`
- `updatedAt`

The runtime state must agree with the latest authoritative gate outcome.
Helper artifacts may explain the state, but they must not override it.

## Inputs and outputs
- Inputs:
  - current runtime checkpoint
  - gate outcomes
  - escalation conditions
  - PO acceptance decisions
- Outputs:
  - one durable runtime status for resume
  - explicit transition rules
  - clear distinction between active, paused, blocked, accepted, and complete states

## Key decisions
- keep the state vocabulary small enough to map directly to Gate A-E behavior
- distinguish paused and blocked from accepted and complete
- keep transition persistence centralized in the main AIM thread
- use the state model to support resume instead of inferring state from scattered artifacts

## Defaults and fallbacks
- a new Epic starts at `epic_initialized` then moves to `gate_a_pending`
- if state is missing but recoverable, recreate it from the latest authoritative gate outcome and report the assumption
- if state is contradictory to authoritative artifacts, stop and escalate rather than guessing a transition

## Edge cases
- review completion does not equal increment acceptance; Gate E is still required
- an increment can be paused without being blocked
- a blocked Epic can return to an active in-progress state only through explicit main-thread reactivation
- the next increment must not silently start from `done_increment_accepted` without a new Gate B plan

## Data correctness and trust
Must remain true:
- only one runtime state is authoritative at a time
- `blocked` and `epic_paused` are visibly different
- `done_increment_accepted` does not automatically mean `epic_complete`
- persisted state matches the last accepted gate outcome

## Debugging
The single best check to verify behavior:
- compare `state.json` with the latest Gate output and confirm the runtime state name, `lastGatePassed`, and `currentRole` all agree

What “good” looks like:
- runtime state clearly maps to the visible gate and role
- paused and blocked behavior are distinguishable
- accepted increment state can continue into the next increment or Epic completion without ambiguity

What “bad” looks like:
- `state.json` says accepted while the run is still waiting at Gate E
- blocked and paused are treated as the same thing
- helper files imply a later state than the persisted checkpoint

## Related files
- AGENTS.md
- docs/workflow/agile-iteration-method.md
- docs/features/aim-1.4-runtime-workspace.md
- docs/features/aim-1.4-bootstrap-and-resume.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 state transition model covering canonical runtime states, transitions, ownership, persistence, and pause/block semantics.
