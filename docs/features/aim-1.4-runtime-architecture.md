# AIM 1.4 runtime architecture

## Purpose
Define AIM 1.4 as a product with a stable core method, an explicit runtime, repo-aware policy, and platform adapters so users can understand what AIM owns, what the repository owns, and how state is persisted.

## User experience
Users should be able to start or resume AIM from Codex, Copilot, or Claude Code and understand the same conceptual flow:
- AIM loads repo-aware policy
- AIM uses `.aim` as repo-local runtime state
- AIM reports the current Epic, increment, gate, and mode
- AIM falls back safely when platform capability or repo policy limits automation or parallelism

## How it works
AIM 1.4 separates four concerns:
1. `AIM core`
   - canonical role order
   - gates and approval semantics
   - Done Increment discipline
   - `Strict` and `Auto` execution modes
2. `AIM runtime`
   - bootstrap and resume behavior
   - `.aim` workspace ownership
   - persistent state and gate bookkeeping
   - validation and fallback rules
3. `repo-aware policy`
   - repository-specific verification, deployment, migration, and tool constraints
   - repository rules for automation and controlled parallel work
4. `platform adapters`
   - Codex, Copilot, or another compatible environment
   - entrypoints and capability differences
   - documented fallback where parity is impossible

The runtime owns `.aim`.
The main AIM thread owns gate progression and acceptance decisions.
Parallel work, if supported, is limited to scoped outputs and must not take ownership of shared runtime state.

## Inputs and outputs
- Inputs:
  - AIM core semantics
  - repository instructions (`AGENTS.md`, plus active adapter helper files such as `.github/agents/aim*.agent.md` or `CLAUDE.md`)
  - current `.aim` state when resuming
  - platform adapter capability limits
- Outputs:
  - one inspectable runtime model
  - repo-local state in `.aim`
  - explicit parity and fallback rules
  - bounded ownership model for controlled parallel work

## Key decisions
- Keep AIM core tool-agnostic and unchanged.
- Make `.aim` an official AIM runtime concept rather than an accidental side effect of one adapter.
- Keep repo-aware policy repo-owned instead of hardcoding tool behavior into AIM core.
- Prefer shared behavior first, then document adapter differences explicitly.
- Centralize gate and state ownership in the main AIM thread.

## Defaults and fallbacks
- Default execution mode remains `Strict`.
- If `.aim` does not exist when AIM starts or resumes, the runtime must create it before continuing.
- In Codex, that means AIM running through the Codex adapter creates `.aim`; it is not a native Codex app behavior outside AIM.
- In Claude Code, that means AIM running through the Claude adapter creates `.aim`; it is not a native Claude Code behavior outside AIM.
- If platform support for bounded parallelism is unavailable, AIM degrades to sequential execution.
- If parity is impossible, the adapter must document the difference instead of silently changing the method.

## Edge cases
- Adapter files can lag architecture docs during migration; in that case, runtime ownership and core semantics must remain explicit in the docs.
- Repositories can forbid automation or parallel work; repo-aware policy wins over adapter capability.
- A platform can support subagents without supporting shared state safety; parallel writes must still remain forbidden.

## Data correctness and trust
Must remain true:
- AIM core semantics do not drift by platform
- `.aim` is understood as runtime state, not hidden adapter state
- only the main AIM thread advances gates or accepts increments
- sequential fallback preserves the same runtime contract

## Debugging
The single best check to verify behavior:
- inspect the docs and `.aim` artifacts together and confirm they answer:
  - what is the current Epic
  - what gate is active
  - which layer owns the decision being described

What “good” looks like:
- docs consistently separate core, runtime, repo-aware policy, and adapters
- `.aim` is described as platform-independent runtime state
- Codex adapter docs say `.aim` is auto-created by AIM runtime when missing
- parallel work is always bounded by centralized ownership

What “bad” looks like:
- platform-specific behavior is described as if it were AIM core
- `.aim` is treated as Copilot-only or Codex-only
- parallel workers appear to own gate progression or acceptance

## Related files
- AGENTS.md
- CLAUDE.md
- docs/workflow/agile-iteration-method.md
- docs/workflow/copilot-layer.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 runtime architecture contract covering core/runtime separation, `.aim` ownership, platform adapters, and controlled parallelism boundaries.
