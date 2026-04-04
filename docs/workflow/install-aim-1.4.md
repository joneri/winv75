> License: CC BY 4.0 (documentation).
> Author: Jonas Eriksson.

# Install AIM 1.4

Use this guide when you want the minimum viable AIM 1.4 setup in a repository.

## One shared mental model

AIM 1.4 has four parts:
- AIM core:
  - the role loop and gate semantics
- AIM runtime:
  - `.aim`, startup, resume, validation, and state transitions
- repo-aware policy:
  - repository-specific verification, deployment, migration, reviewer, and approval rules
- platform adapter:
  - Codex, Copilot, or Claude Code entrypoints and packaging

`.aim/` is repo-local runtime state.
It is created on first valid AIM start or resume if it does not already exist.

## Minimum viable setup

Required in the repository:
- `AGENTS.md`
- `docs/workflow/agile-iteration-method.md`
- `.github/agents/aim.agent.md`
- `.github/agents/aim-planner.agent.md`
- `.github/agents/aim-builder.agent.md`
- `.github/agents/aim-reviewer.agent.md`
- `.aim/` created automatically when AIM starts if missing

Required for repo-aware AIM in Codex:
- the repository files above
- a Codex run that can read and follow the repository AIM contract

Optional Codex convenience layer:
- the `agile-iteration-method` skill installed and enabled
- or another compatible Codex AIM runtime adapter that exposes the `/aim` command surface

Optional Copilot prompt helpers:
- `.github/prompts/start-aim.prompt.md`
- `.github/prompts/install-aim.prompt.md`
- `.github/prompts/help-aim.prompt.md`
- `.github/prompts/upgrade-aim-1.2-to-1.4.prompt.md`

Recommended for Claude Code support:
- `CLAUDE.md`
- `.claude/agents/aim.md`
- `.claude/commands/start-aim.md`
- `.claude/commands/install-aim.md`
- `.claude/commands/continue-aim.md`

Claude Code rule:
- `AGENTS.md` remains the canonical AIM repo contract
- `.github/agents/aim*.agent.md` remain part of the shared AIM instruction layer
- `CLAUDE.md` and `.claude/` files are adapter helpers, not replacements for the shared runtime contract

## Codex product model

For Codex, AIM 1.4.x uses this model:
- the repository is the canonical AIM contract
- the Codex skill is a bootstrap and convenience layer
- the skill is useful for onboarding, bootstrap and the `/aim` command surface
- the skill is not the only way repo-aware AIM can work in Codex

Practical meaning:
- if the skill is installed and enabled, `/aim start "EPIC: ..."` is the normal Codex start path
- if the skill is not installed, `/aim` is not available
- if the repository already contains the shared AIM contract, Codex can still run repo-aware AIM from an explicit AIM start prompt without the skill

## What lives where

Shared runtime guidance lives in repo docs:
- `AGENTS.md`
- `docs/workflow/agile-iteration-method.md`
- AIM 1.4 runtime feature docs

Repo-local working state lives in:
- `.aim/epic.md`
- `.aim/state.json`
- `.aim/increments/`
- `.aim/decisions/`
- `.aim/reviews/`

Adapter-specific entrypoints live in:
- Codex skill packaging outside the repo when you want the `/aim` command surface
- repository `.github/agents/aim*.agent.md` as shared AIM instruction-layer files
- Copilot `.github/prompts/` files as optional Copilot entry helpers
- Claude Code `CLAUDE.md`, `.claude/agents/`, and `.claude/commands/` inside the repo

Recommended user-facing adapter choice:
- Codex:
  - use `/aim` through the AIM skill when the skill is installed
  - use an explicit AIM start prompt when the repo is AIM-aware but the skill is absent
- Copilot:
  - use the packaged `aim` agent and add prompt helpers when you want Copilot-style command entrypoints
- Claude Code:
  - use `CLAUDE.md` plus the shipped starter files under `.claude/`

## `.aim` commit and ignore guidance

Recommended default for a normal team repository:
- ignore live `.aim/` runtime state
- commit only intentionally curated examples or templates

Recommended default for the official AIM repository:
- ignore live `.aim/` runtime state
- publish the contract in docs instead of treating the live working directory as release material

## Recommended installation flow

### Codex
1. Confirm the repository AIM docs are present.
2. If you want `/aim`, confirm the AIM skill is installed and enabled.
3. Preferred start when the skill is present:
   - `/aim start "EPIC: ..."`
4. Fallback when the skill is absent but the repo is already AIM-aware:
   - start with an explicit AIM prompt such as:
     - `Start AIM in this repo`
     - `EPIC: <desired outcome>`
     - `Mode: Strict` or `Mode: Auto`
5. Use `Install AIM` when you are bootstrapping or checking setup, not as the normal production start path.
6. Confirm the active model:
   - the repo is canonical
   - the skill is a convenience layer

### Copilot
1. Run the install helper:
   - `Install AIM`
   - or `.github/prompts/install-aim.prompt.md`
2. Verify the required `.github/agents/aim*.agent.md` files exist.
3. Add `.github/prompts/` if you want packaged Copilot prompt entrypoints.
4. Start with:
   - `/aim start "EPIC: ..."`
   - or `Start working according to AIM`
5. Confirm the packaged `aim` agent exposes the AIM 1.4 runtime contract and the prompt files remain optional helpers.

### Claude Code
1. Ensure `AGENTS.md`, `docs/workflow/agile-iteration-method.md`, and `CLAUDE.md` are present.
2. Confirm the shipped Claude starter files exist:
   - `.claude/commands/start-aim.md`
   - `.claude/commands/install-aim.md`
   - `.claude/commands/continue-aim.md`
   - `.claude/agents/aim.md`
3. Start with either:
   - the shipped Claude starter command under `.claude/commands/start-aim.md`
   - or an explicit start prompt:
     - `EPIC: <desired outcome>`
     - `Mode: Strict` or `Mode: Auto`
4. Confirm the Claude-specific files point back to the shared AIM runtime contract instead of redefining gates, ownership, or acceptance.

## First-run checks

After installation, a user should be able to:
- start AIM
- resume AIM
- use `/aim start`, `/aim status`, `/aim config`, `/aim validate`, `/aim help` and `/aim upgrade 1.2-to-1.4` when the Codex skill is installed
- use the documented explicit fallback prompts when the repo is AIM-aware but the Codex skill is absent

## Runtime status and configuration

`/aim status` should answer:
- what Epic is active
- which Done Increment is active
- which role is current
- which mode is active
- which gate is current or last passed
- which adapter is active
- whether controlled parallelism is available or enabled

`/aim config` should explain:
- what AIM core requires
- which repo-aware rules are active
- what the current runtime checkpoint says
- which adapter limits apply

## If installation is imperfect

Friendly fallback rule:
- if the user starts AIM in recognizable language, treat it as a start intent
- if a helper prompt is missing, explain the equivalent manual command
- if `/aim` is missing in Codex, explain that the skill is missing or disabled and give the explicit repo-aware fallback
- if `.aim` is missing, create it before continuing
- if repo policy is contradictory, stop and escalate instead of guessing

## Next documents

- `docs/workflow/quick-start-aim-1.4.md`
- `docs/workflow/migrate-aim-1.2-to-1.4.md`
- `docs/workflow/copilot-layer.md`
- `docs/features/aim-1.4-installation-status-and-configuration.md`
