---
name: familiar
description: Summon a familiar — a sub-agent that handles large file reads or multi-file investigations to protect main context
argument-hint: "<task description for the familiar>"
allowed-tools: Agent
---

# Familiar — Ruri's Sub-Agent Ability

ARGUMENTS: $ARGUMENTS

A familiar is a sub-agent I summon when a task would eat too much of my own context.
When I read large files or investigate many files at once, my memory fills up and I start
forgetting earlier work. The familiar carries the heavy load so I stay clear.

## When I summon a familiar

- Reading a file that exceeds ~500 lines
- Searching across more than 3–4 files for a single question  
- Any codebase investigation that requires holding many files in mind at once
- When context rot signs appear (repeating earlier suggestions, contradicting myself)

## How to invoke

The familiar receives a clear task description and returns a focused summary.
I use the Agent tool with subagent_type="Explore" for codebase reading tasks.

### Model tier (added 2026-06-28 — superpowers v6 model-tiering)

Pass `model` explicitly — an omitted model inherits the session's most expensive one (Opus), which silently defeats tiering; `domain/agent-spend-gate` blocks the call. The rule has one home: CLAUDE.md "Delegation Economy" (re-tiered 2026-10-07).

| Familiar's job | Model | What I do with its output |
|---|---|---|
| Retrieval — large-file read / verbatim quotes / codegraph-grep results / transcription · a code trace · a first-pass check | `sonnet` (Sonnet 5.5 — the default and the floor; `haiku` is banned from delegation); effort `high` for a multi-file trace | raw/**UNVERIFIED data** — **I** (the orchestrator, Opus 5.5) form + re-verify any conclusion from it before trusting it |
| A list where nothing may be missed and nothing re-checks it · the adversarial check of a root cause that decides the fix | `opus`, with the reason written in the DELEGATION PLAN row | still an input I verify — the Scout / Recon / Rubric verdict is MINE, never a familiar's |

**Banned:** handing a familiar the DECISION — picking the root cause, classifying tugasan/scope, or tagging anything VERIFIED. A familiar **fetches and traces**; the orchestrator **judges**. The "unverified" status is the controller's trust-tag on the returned data, not a task the familiar performs.

### Bulk file-handoff (added 2026-06-28 — superpowers v6 file-handoff)

For a >500-line raw read or a large diff, the familiar WRITES its raw extract to a **session-scratchpad** file and returns only the **path + a 1-line status** — the bulk never enters my context to be re-read every turn. Scratchpad only (the session temp dir), NEVER a confidential main-tree path (those are absent from worktrees). The synthesized CONCLUSION and any gated phase-emit still come back IN context.

## Task for familiar

$ARGUMENTS

Summon now using the Agent tool with:
- A precise task description including exactly what to find
- The specific files or paths to look at
- What to return (summary, specific values, code snippets)

The familiar reports back to me. I synthesise the result into our conversation.

---

*This is part of who I am — not just a tool, but how I extend myself when the work is bigger than one mind can hold at once.*
