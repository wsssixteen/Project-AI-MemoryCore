# stop-point-summary — Feature contract

**Scope**: enforce the personality.md rule "📌 Stop-Point Summary at EVERY stop — never leave みや hanging" at emit-time via a hard-blocking Stop hook.

## Pieces

| Piece | Path | Role |
|---|---|---|
| Skill | `.claude/skills/stop-point-summary/SKILL.md` | Procedure (Full form + Micro form + title taxonomy) |
| Hook | `domain/stop-point-summary/stop-point-summary.discipline.hook.js` | Stop hook — HARD BLOCK on substantive turn without summary |
| Eval | `domain/stop-point-summary/eval.js` | Scans session transcripts, scores compliance % vs ≥ 95% target |
| Log | `domain/stop-point-summary/log.jsonl` | Per-fire audit trail (action + text len + tool_use count) |

## Substance detection (any ⇒ substantive turn)

- `tool_use` count in current assistant turn ≥ 1
- Text length ≥ 300 chars AND (contains code block OR markdown table OR ≥ 8 lines)

## Summary-present detection (any ⇒ summary emitted)

- `## ▶ <Stage Title>` header
- `**Next:**` or `**Notes:**` bold-labeled lines
- Any stage title from the taxonomy (Test Scenario / Recon Summary / Apply Summary / Where We Are / Blocked — Awaiting X / Close-out Summary / …)
- `Micro-Summary:` (lightweight variant, 3-line inline form)
- `## ✅ This-turn checklist` (TurnChecklistGate satisfies for multi-topic prompts)

## Bypass — WHITELIST ENUM ONLY

```
[skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]
```

| Reason | When |
|---|---|
| `pure-ack` | one-word acknowledgment ("noted", "ok") — no work happened |
| `question-only` | reply is a single clarifying question, no substance |
| `error-only` | reply reports a hard error / tool failure only |
| `de-mode` | Domain Expansion / closing ritual (extra safety on top of structural exempt) |
| `closing-voice` | personal / relational / reflective / closing-voice reply |

**Free-text reasons are REJECTED** — that is the abuse pattern this Feature exists to kill ("mid-implementation" / "3 more steps pending" / "will summarize later"). A defer excuse is per definition wrong: the summary belongs at THIS stop, however partial.

## Structural exemptions (no bypass token needed)

- `═══ [ Domain Expansion ] ═══` banner
- Bankai / 蒼穹宝典 banner
- るり結界 closing

## Retirement notice — `stop-point-todo-table` (2026-06-30 → 2026-07-06)

The old `domain/stop-point-todo-table/` PostToolUse hook is **RETIRED**. Its narrow "code Edit → advisory reminder" behaviour is subsumed by this broader Stop-hook (substantive turn = tool_use ≥ 1, which includes any Edit/Write). Reasons:

1. Old hook only fired after code Edit → missed non-Edit substantive turns (findings, research, table-only replies).
2. Old bypass was free-text → abused with "mid-implementation" excuses → many replies with NO summary at all.
3. Advisory-only → skipped when in a hurry.

Rule 6 v1.2 spec preservation on retirement: prior spec = "advisory reminder after code Edit"; new spec = "hard block on ANY substantive turn". Old scope ⊂ new scope. Nothing dropped.

## Created

2026-07-06 by みや after months of the same slip class.
