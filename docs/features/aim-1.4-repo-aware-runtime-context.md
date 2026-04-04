# AIM 1.4 repo-aware runtime context

## Purpose
Define one normalized runtime context so repository instructions are loaded once and then interpreted consistently by AIM runtime, Codex, Copilot, and Claude Code.

## User experience
Users should be able to understand:
- which repository rules AIM is using
- which layer supplied those rules
- whether verification, deployment, migration, reviewer, environment, approval, and parallel rules were restricted by repo policy
- whether any rule fell back to an AIM default because the repo did not define it

## How it works
The runtime loads repository policy in this order:
1. AIM base semantics
2. repository `AGENTS.md`
3. repository `.github/agents/aim*.agent.md`
4. active adapter helper files
   - Copilot:
     - repository `.github/prompts/*`
   - Claude Code:
     - repository `CLAUDE.md`
     - repository `.claude/agents/*`
     - repository `.claude/commands/*`

Then it normalizes the result into one repo-aware context object.

### Canonical context fields
- `verification`
  - verification style, preferred tools, and evidence expectations
- `deployment`
  - deployment allowance, restrictions, and escalation requirements
- `migration`
  - migration allowance, restrictions, and escalation requirements
- `reviewer`
  - reviewer tool preferences, focus areas, and required proof
- `environment`
  - platform limits, adapter constraints, and capability availability
- `approval`
  - execution mode, commit policy, and gate-approval constraints
- `parallel`
  - whether parallel work is allowed, restricted, or disabled and where outputs may be written

### Normalization rules
- later layers may refine earlier ones
- `.github/agents/aim*.agent.md` are shared repository instruction-layer inputs, not Copilot-only decoration
- repo policy may restrict runtime behavior but must not silently redefine AIM core role order or gate semantics
- adapter helper instructions may explain how to realize policy, but they do not replace the normalized context as source of truth

### Missing and contradictory policy
- if a context area is missing:
  - use AIM defaults and report the assumption when it materially affects behavior
- if layers contradict each other on a trust-affecting rule:
  - stop and escalate instead of guessing
- if repo policy requires a capability the platform cannot support:
  - keep the intended rule in the normalized context
  - fall back safely at execution time

## Inputs and outputs
- Inputs:
  - AIM base semantics
  - `AGENTS.md`
  - active adapter helper files
  - current platform capabilities
- Outputs:
  - one normalized repo-aware context
  - explicit precedence handling
  - explicit defaulting, escalation, and unsupported-capability behavior

## Key decisions
- normalize policy once instead of reinterpreting repo files independently in each adapter
- keep context fields broad enough to cover runtime behavior without turning the context into a second copy of the docs
- preserve unsupported policy in context rather than dropping it silently
- keep trust-affecting contradictions as escalation cases

## Defaults and fallbacks
- unspecified context areas fall back to AIM defaults
- missing repo files use the highest available lower-precedence context
- unsupported capabilities cause sequential or restricted fallback without changing the stored policy intent

## Edge cases
- a repo can define no explicit deployment or migration policy; that does not imply permission if runtime defaults are stricter
- a repo can forbid parallel work even when the platform supports it
- helper files can be more operationally specific than `AGENTS.md`, but they must still remain within the normalized context contract

## Data correctness and trust
Must remain true:
- all supported adapters consume the same normalized context areas
- precedence is explicit and stable
- contradictions on trust-affecting rules are escalated
- unsupported capability does not erase intended repo policy

## Debugging
The single best check to verify behavior:
- inspect the loaded repo files and confirm the runtime can explain one normalized context for verification, deployment, migration, reviewer, environment, approval, and parallel behavior

What “good” looks like:
- the same repo yields the same conceptual context in Codex, Copilot, and Claude Code
- layer precedence explains why a rule won
- unsupported capability produces fallback without losing the policy intent

What “bad” looks like:
- one adapter interprets reviewer or parallel policy differently from the other
- later helper files silently replace AIM core semantics
- missing policy is treated as implicit permission without a documented default

## Related files
- AGENTS.md
- CLAUDE.md
- docs/workflow/agile-iteration-method.md
- docs/workflow/copilot-layer.md
- docs/features/aim-1.4-runtime-architecture.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 repo-aware runtime context contract covering precedence, canonical context fields, normalization, and fallback behavior.
