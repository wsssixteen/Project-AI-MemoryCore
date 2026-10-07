---
name: feedback-model-tiering-session
description: Fable = judgment tier (assessments, final checks, PLANNING/design/architecture decisions); building/mechanical/recon runs on Sonnet/Opus — session-model counterpart of the Delegation Economy rule
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 13ff43e1-60bb-43da-8de4-c788ea188b50
  modified: 2026-08-17T02:14:32.026Z
---

みや 2026-07-16 (Baseline final check): *"One final check using Fable, but ONLY for assessments, please do everything else using other models that is good enough for it Haiku, Sonnet, Opus."*

**Why:** Fable is the most expensive tier; burning it on mechanical builds/file-edits wastes usage the same way the 2.1M-token fleet crash did ([[Delegation Economy]], CLAUDE.md §Cost-Efficiency — this is its SESSION-MODEL counterpart; that rule covers subagents only).

**How to apply (clarified 2026-08-17 per みや — planning question):** Fable's lane is JUDGMENT, not just verdicts: assessments, final checks, **planning/design/architecture decisions, requirements analysis, adversarial audits** — the work whose errors compound downstream. Building/mechanical/recon runs on Sonnet or Opus (Haiku no longer a general tier — v1.68 banned it from delegation; retrieval carries judgment). When みや sets the model to Fable: judge and plan freely; push mechanical bulk to Sonnet-floor subagents per the Delegation Economy table (as tonight's sweep did with W1=sonnet). If a mechanical edit surfaces mid-turn, do it only if it is a single trivial call, else list it for a cheaper-model turn. **At session start, name the live session model in the first briefing line** so the tiering is visible, never silent (added after 2026-08-16/17 all-nighter ran builds on Fable unnoticed).

**2026-10-07 (miya):** *"Use Opus 5.5 as the orchestrator and always try to use Sonnet 5.5 where possible on other matters to save time."* Opus 5.5 is the orchestrator; every delegated agent runs on Sonnet 5.5 unless a reason for opus is stated. One home: CLAUDE.md Delegation Economy v1.81, enforced by `domain/agent-spend-gate` v2.

**No agent fleets on the session model, and none without his explicit ask for that run (miya, 2026-10-06, angry).** I resumed two review workflows (20+ agents, all on Opus) on the word 'proceed'; he had not asked for agents and it burned his usage. **How to apply:** 'proceed' / 'resume' is NOT a go for a fleet. Before any Workflow or Agent fan-out: state agent count + model + rough cost in one line and get a yes. Readers and reviewers run on sonnet; do the check inline myself when it fits in a handful of tool calls.
