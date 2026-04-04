# AIM 1.4 bootstrap and resume

## Purpose
Define one shared startup and resume flow so AIM behaves consistently across Codex, Copilot, and Claude Code before the role loop begins.

## User experience
Users should be able to trust that AIM always answers the same questions in the same order:
- which repository is active
- which repo-aware rules apply
- whether `.aim` already exists
- whether there is an active incomplete Epic to resume
- which mode is active
- whether platform capability changes how AIM can execute

If `.aim` is missing, AIM creates it.
If an incomplete Epic exists, AIM resumes it instead of silently starting a new one.

## How it works
The shared conceptual startup sequence is:
1. detect repo root
2. load repo-aware AIM context
3. detect or create `.aim`
4. load active Epic from `.aim/state.json` or initialize a new Epic
5. resolve execution mode
6. resolve platform capability and repo-policy limits
7. enter the AIM role sequence

### Resume behavior
- if `.aim/state.json` exists and describes an incomplete Epic, resume from that checkpoint
- use the checkpoint for active Epic, increment, gate, and mode unless an explicit stop-and-ask condition applies
- do not silently create a parallel Epic when a resumable checkpoint exists

### New-start behavior
- if there is no active incomplete checkpoint, initialize a new Epic at Gate A
- if `.aim` is missing, create it before entering the role loop

### Adapter differences
- Codex:
  - the interaction surface is Codex chat and its tool/runtime surface
  - the adapter must still preserve the shared startup and resume order
- Copilot:
  - `/aim start` and `/aim continue` are interface commands over the same conceptual flow
  - handoff UI and command routing may differ, but startup semantics must match Codex
- Claude Code:
  - the interaction surface is Claude Code plus `CLAUDE.md` and any repo-defined `.claude/commands/`
  - helper agents in `.claude/agents/` may assist, but startup and resume semantics must still match the shared runtime contract

## Inputs and outputs
- Inputs:
  - current workspace root
  - layered repo-aware context
  - `.aim/state.json` when present
  - explicit mode choice if provided
  - platform capability limits
- Outputs:
  - either a resumed Epic checkpoint or a new Gate A Epic start
  - a visible explanation of mode and runtime assumptions when needed
  - sequential fallback when unsupported capability does not block safe progress

## Key decisions
- keep the startup order fixed across adapters
- treat `.aim/state.json` as the primary resume checkpoint
- prefer safe resume over starting parallel sessions
- keep unsupported capability as a fallback concern, not a reason to redefine AIM semantics

## Defaults and fallbacks
- default to `Strict` when there is no explicit mode choice and no active checkpoint that already fixes the mode
- if repo-aware context cannot be loaded safely, stop and escalate
- if `.aim` is missing, create it and continue
- if runtime artifacts are missing but recoverable, recreate them and report the assumption
- if runtime state is contradictory or trust-impacting, stop and ask before continuing
- if platform capability is missing, continue sequentially without changing the runtime contract

## Edge cases
- `.aim` can exist while some non-authoritative helper artifacts are stale; helper artifacts do not override `state.json`
- a user can explicitly choose to start a new Epic, but AIM should not assume that intent when a resumable checkpoint already exists
- repo-aware policy can restrict automation or parallel work even if the adapter technically supports more

## Data correctness and trust
Must remain true:
- startup order is the same across adapters at the conceptual level
- an incomplete Epic is resumed rather than silently replaced
- fallback behavior is explicit when state or context is incomplete
- platform differences stay in adapters, not in AIM core semantics

## Debugging
The single best check to verify behavior:
- inspect `.aim/state.json`, the current gate output, and the adapter docs together and confirm they describe the same startup and resume decision

What “good” looks like:
- Codex, Copilot, and Claude Code docs describe the same startup sequence
- `/aim start` does not create a new session when an incomplete checkpoint exists
- missing `.aim` results in creation rather than silent failure
- unsupported capability leads to sequential fallback rather than behavior drift

What “bad” looks like:
- one adapter starts a new Epic while another resumes
- mode resolution differs without being documented
- missing repo context is handled by guessing instead of escalating

## Related files
- AGENTS.md
- CLAUDE.md
- docs/workflow/agile-iteration-method.md
- docs/workflow/copilot-layer.md
- docs/features/aim-1.4-runtime-workspace.md
- .github/agents/aim.agent.md

## Change log
- 2026-03-28: Created AIM 1.4 bootstrap and resume contract covering shared startup order, resume rules, adapter differences, and fallback behavior.
