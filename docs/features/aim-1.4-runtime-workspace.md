# AIM 1.4 runtime workspace

## Purpose
Define the official `.aim` workspace contract so AIM state is portable, inspectable, resumable, and safe across Codex, Copilot, and other compatible AIM runtimes.

## User experience
Users should be able to inspect `.aim` and answer:
- what Epic is active
- what increment is active
- what gate and role are current
- what evidence, review output, and decisions exist
- whether parallel analysis artifacts are part of the current working set

If `.aim` is missing when AIM starts or resumes, the runtime creates it automatically before entering the role loop.

## How it works
The official AIM 1.4 workspace contract has these required artifacts:
- `.aim/epic.md`
- `.aim/state.json`
- `.aim/increments/`
- `.aim/decisions/`
- `.aim/reviews/`

Optional artifacts:
- `.aim/handoffs/`
- `.aim/logs/`
- `.aim/archive/`
- `.aim/runtime-context.md`
- `.aim/analysis/`

Adapter helper artifacts may exist if they are documented and do not override the official runtime contract.

### Ownership rules
- only the main AIM thread may write `.aim/state.json`
- only the main AIM thread may advance gates or change increment or Epic status
- `PO` owns Epic intent updates
- `TDO` owns plan synthesis, decision records, and release-validation summaries
- `Dev` owns implementation traces in `.aim/increments/`
- `Reviewer` owns review findings in `.aim/reviews/`
- subagents may write only scoped outputs in `.aim/analysis/` or another explicitly approved adapter location

### `state.json`
`state.json` is the durable runtime checkpoint.

It should carry, at minimum:
- `aimVersion`
- `mode`
- `epicId`
- `epicStatus`
- `activeIncrementId`
- `currentRole`
- `lastGatePassed`
- `platform`
- `parallelSupport`
- `updatedAt`

Markdown artifacts are human-readable context.
`state.json` is the adapter-facing checkpoint for startup and resume.

### Housekeeping rules
- live increment artifacts stay in active locations while work is in progress
- completed increment artifacts may move to `.aim/archive/` when they no longer belong in the active working set
- stale logs and analysis notes may be deleted or archived after their decision value is captured elsewhere
- runtime context files should describe the current repo-aware environment, not become a long-term dump

### Commit and ignore guidance

Recommended default for a normal team repository:
- ignore live `.aim/` runtime state in `.gitignore`
- commit only intentionally curated examples or templates, not active runtime artifacts

Recommended default for the official AIM repository:
- ignore live `.aim/` runtime state as a working area
- document the official `.aim` contract in docs instead of treating the live workspace as release content
- if reference artifacts are intentionally published, keep them clearly separated from the active runtime working set

Never commit by default:
- logs
- temporary helper files
- analysis scratch output
- anything that looks like private or machine-local runtime residue

### Forbidden storage
The following must never be stored in `.aim`:
- secrets, credentials, access tokens, or private keys
- unrelated application data or production datasets
- destructive command history that should remain outside AIM runtime state
- ambiguous parallel outputs that pretend to be authoritative gate or acceptance state

## Inputs and outputs
- Inputs:
  - current Epic and increment context
  - repo-aware policy
  - platform capability limits
  - main-thread decisions
- Outputs:
  - one inspectable workspace contract
  - durable resume state in `state.json`
  - scoped human-readable artifacts for planning, review, and decisions

## Key decisions
- make `.aim` official across adapters instead of letting each adapter invent its own state layout
- keep `state.json` as the durable runtime checkpoint
- allow optional and helper artifacts without letting them replace the official contract
- keep subagent writes narrow and non-authoritative

## Defaults and fallbacks
- the runtime creates `.aim` if it is missing at startup or resume
- if a platform does not support subagents, `.aim/analysis/` may remain unused without affecting the contract
- if adapter helper artifacts exist, they must remain secondary to the official runtime artifacts

## Edge cases
- older AIM repositories can contain helper files such as `.aim/plan.md`; these may persist during migration but should not redefine the official contract
- a repo can forbid parallel execution entirely; in that case analysis artifacts remain sequential and ownership rules are unchanged
- some increments may not need logs or handoff files; optional artifacts are not required for correctness

## Data correctness and trust
Must remain true:
- `.aim/state.json` is the only shared state checkpoint
- gate advancement and acceptance remain centralized
- subagent outputs are clearly non-authoritative unless synthesized by the main AIM thread
- archived artifacts do not replace the active checkpoint

## Debugging
The single best check to verify behavior:
- inspect `.aim/state.json` together with `.aim/epic.md`, the newest increment artifact, the newest review artifact, and the newest decision artifact

What “good” looks like:
- required and optional artifacts are easy to distinguish
- the active increment in `state.json` matches the newest live increment artifacts
- review and decision records line up with the current gate
- analysis artifacts never masquerade as gate state

What “bad” looks like:
- multiple files appear to own the current gate or increment status
- helper artifacts contradict `state.json`
- secrets or unrelated runtime data are written into `.aim`

## Related files
- AGENTS.md
- docs/workflow/agile-iteration-method.md
- docs/features/aim-1.4-runtime-architecture.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 runtime workspace contract covering required artifacts, optional artifacts, ownership rules, `state.json`, housekeeping, and forbidden storage.
