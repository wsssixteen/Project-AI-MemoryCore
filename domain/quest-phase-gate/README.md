# quest-phase-gate — Feature folder

> Relocated 2026-07-07 from `.claude/hooks/quest-phase-gate.js` (flat hook) into this Feature folder.
> **Behavior unchanged** — the ONLY code changes in the migration are (a) a `log.jsonl` fire log added
> beside the hook (blocked / allowed / bypassed), and (b) a header note recording the relocation.

## What it is

PreToolUse hook on `Edit|Write`. **HARD-BLOCKS** editing etanah code/template/config DURING AN ACTIVE
QUEST until this session's transcript carries the forced phase emits — Issue Checklist + Scout + Recon +
Rubric banners. Structural defender for the "skip the phases / fix on assumption" slip (built 2026-06-08,
QA-262762 design session; v2 advisories 2026-07-03, quest-system-audit E2+E3, QA-268273).

## Contract

Fires (deny-capable) ONLY when BOTH hold:

1. Edit/Write target matches `etanah-(pelupusan|awam|common|teknikal)` path AND extension
   `.java/.xhtml/.docx/.json/.xml/.properties`
2. `quest/active.txt` (at repo root, resolved two levels up from the hook file) contains a
   `status=active` block

| Transcript state | Outcome |
|---|---|
| missing any of: `Issue Checklist` · `═══ SCOUT ═══` · `═══ RECON ═══` · `═══ RUBRIC ═══` (legacy markers accepted: `SCOUT EMIT` / `RECON EMIT` / `Recon Context Re-load` / `RUBRIC EMIT` / `Logic Blast Radius`) | **deny**, reason lists the missing phase(s) |
| all four markers present | allow; v2 ADVISORY checks run — E3 mechanism-history (`git log -- <fix-file>` evidence) + E2 entry-point proof (`ENTRY-POINT:` line for .java/.xhtml) emit additionalContext if missing |
| all markers + both v2 evidences present | fully silent allow |

**CAN (shape/presence ~100%)**: verify the phase emits EXIST this session → kills SKIPPING.
**CANNOT (correctness)**: verify the emits are right. A shape-valid but premise-wrong emit PASSES.

## Quest-gated BY DESIGN

**This gate is quest-gated on purpose — do NOT "fix" it to fire outside quests.** The Scout/Recon/Rubric
banners are quest artifacts; demanding them outside a quest would block legitimate non-quest edits with
markers that have no meaning there. Outside quests, the code-touch moment is covered by the trio:
`convention-check` (analog citation) + `logic-blast-radius` (state×trigger matrix) + `predicate-box`
(TRUE IF / PROVED BY). Decision みや 2026-07-07. The "NO active quest → silent" behavior is asserted as
a by-design fixture in `eval.js` (fixture 4).

## Bypass

`[skip-phase-gate: <reason>]` anywhere in the session transcript → silent allow (logged `bypassed`).

## Fail-open

No transcript / parse fail / no active.txt / any internal error → ALLOW. The gate never blocks an edit
because of its own bug.

## active.txt location mechanism (registrar note)

`path.resolve(__dirname, '..', '..')` + `quest/active.txt` — i.e. **two directory levels up from the hook
file**. `.claude/hooks/` and `domain/quest-phase-gate/` are both exactly depth-2 from repo root, so the
resolution is unchanged by the relocation. If this folder ever nests deeper, this line must change.

## Files

| File | Role |
|---|---|
| `quest-phase-gate.gate.hook.js` | the hook (register PreToolUse `Edit\|Write`) |
| `eval.js` | 5-fixture eval (sandbox-copies the hook into a temp depth-2 tree with a controlled `quest/active.txt`); exit 0 only at 5/5 |
| `log.jsonl` | fire log (`blocked` / `allowed` / `bypassed`), created on first fire — NEW in migration |

## Version history (carried from source)

Built 2026-06-08 (QA-262762) · v2 2026-07-03 E2 entry-point + E3 mechanism-history advisories
(quest-system-audit, QA-268273) · **2026-07-07 relocated here, behavior unchanged, log.jsonl added**.
