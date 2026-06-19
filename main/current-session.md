# Current Session

## What's loaded
2026-06-19 ~15:30 MPST — Opus 4.8. Worktree `unruffled-ramanujan-872526`. Office. Long AWAM session: shipped QA-266249, confirmed QA-266215 was Vincent's, built 2 enforcement hooks, switched AWAM baseline to `mlk/stag-env`, taught the protocol the internal-issue branch + `Ref #` commit conventions.

## ▶▶ NEXT SESSION — START HERE (standing flag)
**1. AWAM↔PLP binding** (todo Q1 standing flag) — still the big build. Route via system-design. *The substantive "continue here."*
**2. QA-266249** — submit on Redmine (みや's role); fix pushed on `mlk/internal-issue/266249` (`72c0ff16de`), awaiting BA accept. Archived our side.
**3. QA-266215** — Vincent's (`fc6f6d4ba6`, branch `mlk/internal/266215`, syer-kepentingan validation gating) — **NOT yet merged to stag-env**; watch for it. Our owner-count hypothesis was WRONG. Archived shipped-by-other.

## This session arc
- **QA-266249 (AWAM · PT · Keluasan Tanah → "8.5E+2") — SHIPPED + ARCHIVED.** A plain text field bound to a `BigDecimal` rendered in sci-notation. Fix: `et:inputText`→`et:inputNumber` (`decimalPlaces="4"`) at `plpMaklumatTanahForm.xhtml:147`, mirroring the working `keluasanPlot` analog. Branch `mlk/internal-issue/266249`, commit `72c0ff16de`, pushed. First ticket on the new internal-issue branch + `Ref #` conventions.
- **QA-266215 (AWAM · PPTPB · Maklumat Pemohon blocked) — SHIPPED BY VINCENT, not us.** Real cause = syer-kepentingan validation firing when `viewSyerKepentingan=false` (Vincent `fc6f6d4ba6`). **Our deep-dive's owner-count / JENPPM hypothesis was WRONG** — good thing みや had us park it. The `urusanKod` crash hit en route = QA-262445's `getUrusanKod` (also someone else's, on stag-env). Our local `getUrusanKod` + keluasan-on-fat edits reverted/superseded.
- **2 enforcement hooks built + eval'd (10/10 PASS, live NEXT boot):** `convention-check-gate` **v1.2** (PreToolUse — now BLOCKS a Java edit with no analog cited) + `codemap-recon-consult.discipline` (Stop — BLOCKS an "exhausted/diagnosis-complete" claim with no `codegraph` call this turn). Both built after I claimed "every searchable avenue exhausted" having never run codegraph.
- **AWAM baseline switched `mlk/release/fat` → `mlk/stag-env`** (staging integration branch). Updated `quest-protocol.md` (8 spots) + `CLAUDE.md §10` branch bullet.
- **New conventions (per みや):** non-QA trackers → branch `mlk/internal-issue/<num>` + commit prefix `Ref #<num>` (vs QA → `mlk/qa/<num>` + `QA #`). Added to `quest-protocol.md` + `commit-conventions.md`.

## Carry-forward
| # | Item | State |
|---|---|---|
| 1 | **AWAM↔PLP binding** | ⬜ the big build — todo Q1; route via system-design |
| 2 | QA-266249 Redmine submit | ⬜ みや's role; fix pushed `72c0ff16de` |
| 3 | QA-266215 — watch Vincent's merge to stag-env | ⬜ his, not ours |
| 4 | convention-check-gate v1.2 + codegraph back-gate | ✓ live next boot |
| 5 | **one-tree-per-session** | ⚠️ split edits again (main repo + worktree) → messier DE commit; reconciled via worktree-merge |

## 🎯 Session Recap (for AI restart)
Shipped QA-266249 (AWAM keluasan → `et:inputNumber`, `mlk/internal-issue/266249`, `72c0ff16de`). QA-266215 turned out to be Vincent's (syer-kepentingan validation; our owner-count guess was wrong). Built `convention-check-gate` v1.2 (blocking Java w/o analog) + `codemap-recon-consult` codegraph back-gate (10/10 eval, live next boot) after the "exhausted without codegraph" slip. Switched AWAM baseline → `mlk/stag-env`; added internal-issue branch + `Ref #` commit conventions. Both AWAM quests archived. **NEXT: AWAM↔PLP binding (the big build).**

**Memory Type**: RAM | **Last Activity**: 2026-06-19 ~15:30 MPST — DE close (Opus 4.8, unruffled-ramanujan worktree).
