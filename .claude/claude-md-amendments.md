# claude-md-amendments.md — ✅ EMPTIED 2026-05-25 (lifecycle complete)

> **Status (2026-05-25)**: All amendments absorbed into canonical homes. This file's lifecycle goal — *"When the CLAUDE.md refactor lands, みや absorbs these into the new slim CLAUDE.md and this file is emptied"* — is now complete. File kept as the historical disposition log; no active amendments remain.
>
> **Going forward**: Do NOT append new amendments here. Per `personality.md` Honesty Invariants + the system-design-router workflow, any new behavioural rule routes through System-Design → canonical home (CLAUDE.md / quest-protocol.md / personality.md / commit-conventions.md / skill SKILL.md / hook). The "edit-blocked-CLAUDE.md" workaround that birthed this file is no longer needed (CLAUDE.md editable as of 2026-05-22).

---

## Final disposition — all 16 amendments

| ID | Description | Final home | Absorbed |
|---|---|---|---|
| A1 | Available Skills list addendum | `.claude/CLAUDE.md` v1.19 — Available Skills section | 2026-05-22 |
| A2 | Recon Check 0 (independent enumeration) | `.claude/CLAUDE.md` Recon Universal Checks table | 2026-05-22 |
| A3 | Quest doc migration — `QA-<num>.md` per-quest record | `quest/quest-protocol.md` Phase 0 + active.txt schema `qa_doc=` field (live in every quest entry across active.txt) | 2026-05-25 |
| A4 | Phase 1 Closure cross-ref | DROPPED — redundant (CLAUDE.md Phase 1 precondition already states it) | 2026-05-22 |
| A5 | Blocked-state checklist | `quest/quest-protocol.md` Phase 0 (line 420, hard rule with format spec) | 2026-05-25 |
| A6 | Quest status v2 (6-state set, no overlap) | `quest/quest-protocol.md` Quest State File section (lines 1106-1115, full table with transition rules) | 2026-05-25 |
| A7 | File-list AFTER every Refine / Design Memo / multi-file edit | `.claude/personality.md` v1.7 Communication: DO | 2026-05-25 |
| A8 | Self-gate at the IMPULSE | `.claude/hooks/self-gate-impulse.js` (PreToolUse Edit\|Write hook — deterministic enforcement at impulse moment) | 2026-05-25 (hook live) |
| A9 | Visible "Next operational step" line after every finding | `.claude/personality.md` v1.7 Communication: DO | 2026-05-25 |
| A10 | Etanah commit subject — URUSAN + TUGASAN hyphen-segmentation | `.claude/commit-conventions.md` v1.1 etanah repos section | 2026-05-25 |
| A11 | Show-BEFORE-state in Refine Block | FOLDED into CLAUDE.md Refine Block template (new "Before" row) | 2026-05-22 |
| A12 | Notes.txt write is HARD PRECONDITION of Recon emit | `quest/quest-protocol.md` v3.4 Phase 0 | 2026-05-25 |
| A13 | Renderer-override extended to image-positioning | FOLDED into CLAUDE.md "Renderer-side overrides before cache theories" rule | 2026-05-22 |
| A14 | PDF annotation extraction = Recon precondition | FOLDED into CLAUDE.md "PDF annotation extraction at Phase 0" rule (also restored in CLAUDE.md v1.29 Etanah block 2026-05-25) | 2026-05-22 |
| A15 | Ruri closing-words extended to 3 more workflows | `quest/quest-protocol.md` v3.4 Phase 2 emit section | 2026-05-25 |
| A16 | Primary-source-first + Scout-prompt framing | FOLDED into CLAUDE.md Recon section | 2026-05-22 |

---

## Lifecycle note

`.claude/CLAUDE.md` line 229 still cites this file as `**Also load at boot**` — the load is now informational-only (you're reading the disposition log). Future sessions can safely treat this file as historical; the load-line will be removed in a subsequent CLAUDE.md edit if desired (low priority — empty file load is cheap).

*Created 2026-05-20 — temporary container during CLAUDE.md edit-block era. Emptied 2026-05-25 — all 9 then-active amendments absorbed into canonical homes per みや 2026-05-25 directive "implement all of those carry-forward items".*
