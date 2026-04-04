# AIM 1.4 command surface and onboarding

## Purpose
Define the user-facing command surface and help-first onboarding model so AIM is easy to start, understand, and operate from the first message.

## User experience
Users should be able to answer:
- how to start AIM
- how to resume AIM
- how to inspect status and runtime configuration
- how AIM treats a valid Epic candidate
- how Epic input differs from TDO-owned Done Increment definition

## How it works
AIM should prefer one obvious way to begin in adapters that expose the AIM command surface:
- canonical command-style start:
  - `/aim start "EPIC: ..."`
- natural-language equivalent:
  - `Start working according to AIM`

Adapter note:
- Copilot may expose `/aim ...` directly
- Codex uses `/aim ...` when the AIM skill is installed and enabled
- without the skill, Codex falls back to an explicit AIM prompt against the repo contract
- Claude Code may use a repo-defined command in `.claude/commands/` or an explicit `EPIC: ...` start guided by `CLAUDE.md`
- when the repository ships a Claude starter layer, the concrete command files should be named and cross-linked in onboarding docs

Codex product rule:
- the repository is the canonical AIM contract
- the skill is a bootstrap and convenience layer
- the skill exposes `/aim` and related convenience commands
- the skill does not replace repo-aware AIM authority

Mode is explicit:
- `Mode: Strict`
- `Mode: Auto`

The command surface should cover:
- start
- resume
- status
- help
- validate
- config
- upgrade

### Epic candidate acceptance model
- if the user provides a valid Epic candidate, `PO` may accept it with light cleanup
- if the Epic candidate is almost valid, AIM should explain what is missing and propose minimal fixes
- if the user mixes Epic content with increment ideas, AIM should separate them cleanly
- user-provided planning detail may be preserved as notes, but `TDO` still owns the next single Done Increment

## Inputs and outputs
- Inputs:
  - user start intent
  - Epic candidate or problem statement
  - requested execution mode
  - current adapter surface
- Outputs:
  - one start path
  - one help-first explanation
  - one explicit Epic-versus-Increment distinction
  - one documented command surface

## Key decisions
- accept strong Epic candidates instead of forcing rewrites
- keep one obvious quick-start path
- separate product-surface commands from runtime internals
- keep `TDO` ownership of the next single Done Increment explicit

## Defaults and fallbacks
- if the user does not specify mode, default to `Strict`
- if the user starts in a vague but recognizable way, treat it as a start intent and guide them
- if exact command syntax differs by adapter, keep the same conceptual command surface and document the difference explicitly

## Edge cases
- a user can provide a strong Epic plus too much planning detail; the planning detail should be preserved but not promoted to an approved increment
- a user can start with natural language instead of slash commands; AIM should still recognize the intent
- an adapter can lack a packaged helper command; the conceptual command still exists, but the documented fallback must be explicit

## Data correctness and trust
Must remain true:
- the command surface does not redefine AIM core
- a valid Epic candidate can be accepted without a full rewrite
- user planning notes do not replace `TDO` ownership
- adapter differences remain documented as adapter differences

## Debugging
The single best check to verify behavior:
- compare the documented quick-start and command surface in `docs/workflow/quick-start-aim-1.4.md`, `docs/workflow/install-aim-1.4.md`, and `.github/agents/aim.agent.md`

What "good" looks like:
- one obvious start path
- one clear distinction between Epic and Done Increment
- a user-provided Epic candidate can be normalized without friction
- adapter bridge files make entrypoint differences explicit without changing the shared AIM semantics
- shipped Claude starter commands are visible enough that a new user does not need to infer the adapter path

What "bad" looks like:
- multiple conflicting start paths
- user planning detail silently becomes the approved increment
- command docs claim behavior the repo packaging does not expose

## Related files
- CLAUDE.md
- .claude/commands/start-aim.md
- .claude/agents/aim.md
- .github/agents/aim.agent.md
- docs/workflow/install-aim-1.4.md
- docs/workflow/quick-start-aim-1.4.md
- docs/workflow/copilot-layer.md
- docs/epics/aim-1.3x-onboarding-command-surface.md
