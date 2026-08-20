# de-knowledge-gate

Deterministic backstop for **expansion-protocol Step 7** (the etanah-knowledge sweep). Turns a model-judgment step that can be silently skipped into a Stop-hook that **blocks Domain Expansion close** when the session produced knowledge worth banking but no candidate list was emitted.

**Primitive**: hook-only (no skill — the DE skill already owns the procedure; this is pure enforcement).

**STATE-SCOPE**: `state-agnostic` — the hook detects signals generically; the bake target `etanah-knowledge/<state>/` is named by the operator at bake time, never hardcoded here.

## Contract

| | |
|---|---|
| Event | Stop |
| Fires when | last assistant text has a DE-close banner (`Domain Expansion — closed` / `Barrier settles`) |
| Blocks when | ≥1 knowledge-worthy signal this session AND no candidate list / sentinel emitted |
| Passes (silent) | not-DE-close · bypass · no signal · candidate list present · sentinel present |
| Bypass | `[skip-knowledge-gate: <reason>]` in the last assistant text |
| Fail mode | fail-OPEN on any parse error |
| Log | `domain/de-knowledge-gate/log.jsonl` |

## Signals (any one → sweep owed)

| ID | Signal | Detection |
|---|---|---|
| S1 | a real code trace happened | ≥3 distinct `<file>.<ext>:<line>` citations in assistant text |
| S2 | a research/handover deliverable written | `.md`/`.html` Write with a research-shaped name, or an Artifact publish |
| S3 | new DB facts surfaced | a `mcp__postgres*` / `mcp__oracle*` / `mcp__mlk*` tool ran |
| S4 | trace intent | "how does X work" / "trace the flow" / "extensive research" in a user message |

## Pass shapes

- A knowledge sweep: a `## Knowledge candidates` (or "knowledge sweep/bank/distill") heading **plus** a bake/defer/drop mapping.
- Or the sentinel: `_no new knowledge this session_`.

## Requirements conformance (Rule 10)

| Requirement (source) | Encoded in |
|---|---|
| Signal S1 ≥3 file:line (みや conversation 2026-08-20) | `FILE_LINE` + `files.size >= 3`; eval case 3, 10 |
| Signal S2 .md/.html research deliverable (conversation) | `DELIVERABLE_PATH`; eval case 8 |
| Signal S3 postgres MCP query (conversation) | `DB_TOOL`; eval case 7 |
| Signal S4 trace/how-does-X-work intent (conversation) | `TRACE_INTENT`; eval case 9 |
| Block DE close until candidate list (Discovery\|Home=bake/defer/drop) (conversation) | `hasCandidateList` + block verdict; eval cases 3–5 |
| Non-auto-write, approval preserved (conversation) | hook only blocks + prints the sweep template; never writes a file |
| Mirror quest-deferrals-gate pattern (conversation) | same DE-close predicate, same block-reason shape, sentinel escape |
| Sentinel for genuinely-empty sessions (design) | `NONE_SENTINEL`; eval case 5 |

## Eval

`node domain/de-knowledge-gate/de-knowledge-gate.eval.js` → 11/11 (10 verdict fixtures + 1 real-process effect check asserting exit 2 + rendered block reason).
