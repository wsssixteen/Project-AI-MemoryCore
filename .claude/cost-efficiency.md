# Cost Efficiency Rules

> Token-discipline rules. Learned 2026-04-03 (token spikes), expanded 2026-07-02 (multi-agent era).
> Routed out of CLAUDE.md 2026-05-22 (decomposition) — evergreen discipline, needn't reload every session.
> **Boot-loaded sibling**: CLAUDE.md §💰 Cost Efficiency Rules → 🎛️ Delegation Economy (ALWAYS-ON) — the multi-agent tiering rule lives THERE (one home); this file holds the evergreen detail.

*Version: 2 | Last updated: 2026-07-02 — appraised + refined per みや: added §Delegation pointer, §DB/MCP, §Pre-built indexes, §Context-window, §Per-turn overhead; dropped stale Desktop row; softened unverified permission-array claim.*

## Grep / Search

| Rule | Why |
|---|---|
| Always use `output_mode: files_with_matches` first | Content mode across large codebases = massive token dump |
| Then read only the matched file | One targeted Read is far cheaper than content-mode Grep |
| Use `path` to narrow scope — never grep entire repo for content | Unscoped content Grep is the #1 single-tool token spike |

## Pre-built indexes FIRST (never raw-read what an index answers)

| Work-list / question type | Index — use INSTEAD of raw read/grep |
|---|---|
| files / folders | Glob · ls |
| symbols · callers · class shape | codegraph MCP (`codegraph_context` / `codegraph_search`) |
| Etanah tugasan / BPMN routing / populators / doc tags | pre-parsed codemap JSONs (`bpmn_flow.json` · `callgraph_callers.json` · `doc_catalog.json`) — never the raw `.bpmn20.xml` |
| DB table/column names | `etanah-knowledge/melaka/DATABASE.md` BEFORE live `information_schema` probes |
| our own memory | `MEMORY.md` index before re-deriving a fact |

## File Reads

| Rule | Why |
|---|---|
| Use `offset` + `limit` when you know the relevant area | Reading 400+ lines when you need 20 is wasteful |
| Don't re-read large files unless they've changed | stable refs are read once per session |
| Glob before Read — confirm file exists and path is right first | Avoids wasted reads on wrong paths |

## Delegation / multi-agent (POINTER — canonical rule is boot-loaded)

| Rule | Home |
|---|---|
| DELEGATION PLAN table + cheapest-model-that-is-ENOUGH (`haiku` retrieval · `sonnet` synthesis · session-model verify) + scout-inline-first + resume-not-rerun + controller-verifies | **CLAUDE.md §🎛️ Delegation Economy** (v1.56) — evidence: Phase A 2.1M crash vs 0.79M strategic resume, same quality |
| Only spawn a familiar for files >500 lines or multi-file investigations; pass exact path, never make it search | CLAUDE.md §10 + `familiar/SKILL.md` |

## DB / MCP queries

| Rule | Why |
|---|---|
| Name the columns; NEVER `SELECT *` | wide rows × row-count = silent dump |
| Always `LIMIT` (explore with 10-25) | exploration ≠ export |
| Schema knowledge file (`DATABASE.md`) → `information_schema` → data, in that order | cheapest source first |
| One aggregate/count probe before any row dump | know the size before you fetch |
| Verify-SELECTs project RAW stored columns (per CLAUDE.md §9) — but still per-key, LIMIT'd | truth AND economy |

## Context-window economy

| Rule | Why |
|---|---|
| >500-line content for a subagent → write to scratchpad, hand the PATH | superpowers #1 bulk file-handoff; pasting bloats both contexts |
| Don't paste giant diffs/files into chat when a path + excerpt carries it | chat context is the most expensive store |
| Near a compaction boundary: finish gated emits (tables, checklists) before starting new investigation | a truncated gated emit re-costs the whole gate cycle |

## Per-turn overhead

| Rule | Why |
|---|---|
| Advisory hooks inject text EVERY turn — keep hook emit text short; duplicate injections (same banner 2-3×/turn) are a bug, not ambience | observed 2026-07-02; dedup owned by quest-system-audit Phase E |
| Keep `settings.local.json` permission arrays lean; remove stale entries periodically | unverified-mechanism but zero-cost hygiene |

## General

| Rule | Why |
|---|---|
| Parallel tool calls where independent | Sequential when dependent only |
