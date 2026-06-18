# Current Session

## What's loaded
2026-06-18 ~18:00 MPST — Opus 4.8. Worktree `distracted-meninsky-04b417`. Office. Very long session: shipped 2 AWAM/PLP tickets, ran a deep teaching walkthrough on the 265964 fix, indexed etanah-awam in codegraph, built 2 enforcement hooks, and added 3 CLAUDE.md rules. Two DE passes (the first was premature — work continued well past it).

## ▶▶ NEXT SESSION — START HERE (standing flag)
**1. PUSH the worktree branch → main (みや, manual).** Everything this session built (2 new hooks, the CLAUDE.md rules, the codegraph tool-split) is committed locally on `claude/distracted-meninsky-04b417` but **unpushed**. Merge to main → the 2 hooks go **live next boot**. `git merge --no-ff claude/distracted-meninsky-04b417` in main → `git push origin main`. *Until this, the hooks are NOT live.*
**2. Then the big build — AWAM↔PLP binding** (todo.md Q1 standing flag): the small, specific cross-module registry. Route through system-design. *This is the substantive "continue here."*
**3. Quick housekeeping:** QA-266039 Phase 2 archive (run `close`) · arch-doc sync (add the 2 new hooks to `meta/system-architecture.md`) · always-prepare-commit hook · close-phase caveat (branch-switch-under-live-server, below).

## This session arc
- **QA-266039 (AWAM · MLPS · No. Lesen ⓘ example image) — CLOSED (Phase 1).** Perak example → Melaka. Commit **`c38bc07a90`** on `mlk/qa/266039` (off `mlk/release/fat`, pushed). ⬜ **Phase 2 archive still pending.**
- **QA-265964 (DMMLMS migration ↔ AWAM PLPS Tujuan-Permohonan alignment) — FULLY CLOSED + ARCHIVED.** Fix: rename labels ("Kategori Tujuan Permohonan" / "Tujuan Permohonan") + **cascade** field-2's options off the chosen category (replacing the flat `PLP_TJN_PMH_PLMS`), mirroring AWAM's `onChangeKategoriTujuanPermohonan` + fixing the lain-lain `OTHERS` coupling. Tested green, commit **`142c7beccc`** on `mlk/qa/265964` (pushed, awaiting team merge). Archived (folder→Archive\, block→active-archive.txt, project doc→archive\). Full doc `QA-265964.md` (in archive/).
- **Deep teaching walkthrough** (265964, at みや's request): discovery (URL→file, gated-panel→urusan→composite, `mb`→base-class via inheritance) · trace method (binding-name → grep → assignment → declaring class) · base-vs-child (fix where the member is *declared*; base is `abstract`, 6 concrete subclasses) · `<p:ajax>` follows the dependency · the fix decision (compare→DB-verify→cascade-required→mirror-analog→fix-ripple) · grep-vs-codegraph tool-split · EL `.x` = getter chain.
- **codegraph: etanah-awam INDEXED** (978 files; per-project — pass `projectPath`; re-run `codegraph sync` after awam edits).
- **2 new hooks built + tested + registered** (live NEXT boot after merge): **design-consult-gate** (PreToolUse Edit|Write — deny skill/hook edits until system-design + system-rules in the transcript) + **show-gate** (Stop hard-block — discuss a change with no box/code → block; `[skip-show-gate]` bypass; ═══/DE/short exempt; fail-open). **self-gate-impulse retired**. meta-edit-gate left as-is (verified not a bad merge).
- **3 CLAUDE.md rules added** (per みや): 🏷️ name-by-purpose/mirror-analog (§8) · 🩹 DB-patch portability+minimal-footprint (§9) · 📐 SD = Story Diagram (§2). Plus the **codegraph tool-split** baked into `codemap-recon-consult` (now fires on Apply too).
- **Learnings**: (a) **branch-switch under a live Eclipse server** reverts working-tree xhtml → open pages throw `IndexOutOfBoundsException` in `AttachedObjectListHolder.restoreState` (stale view-state vs reverted tree) — transient, NOT a fix bug; hard-refresh clears it. (b) patch-script: kod-subquery not hardcoded PK; config tables don't bump version. (c) name a method by what it DOES, not the screen.

## Carry-forward (full)
| # | Item | State |
|---|---|---|
| 1 | **Push worktree → main** | ⬜ みや manual — makes the 2 hooks + rules live. DO FIRST. |
| 2 | **AWAM↔PLP binding** | ⬜ the big build — todo.md standing flag; route via system-design |
| 3 | **QA-266039 Phase 2 archive** | ⬜ run `close` |
| 4 | **arch-doc sync** | ⬜ add design-consult-gate + show-gate to `meta/system-architecture.md` |
| 5 | **always-prepare-commit hook** | ⬜ pre-stage + draft commit during testing; route via system-design |
| 6 | **close-phase caveat** | ⬜ add "branch-return reverts working-tree under live server → refresh open pages; transient view-state error" to close-phase Phase 1 Step 5 |
| 7 | **one-tree-per-session** | process note — split edits this session made commits messy |

## 🎯 Session Recap (for AI restart)
Shipped QA-266039 (AWAM No.Lesen image, `c38bc07a90`, Phase-2 archive pending) + QA-265964 (DMMLMS↔AWAM Tujuan-Permohonan label+cascade, `142c7beccc`, fully archived). Long teaching walkthrough on 265964 (discovery→fix→JSF). Indexed etanah-awam in codegraph. Built design-consult-gate + show-gate hooks (live next boot after merge); retired self-gate-impulse. Added 3 CLAUDE.md rules + the codegraph tool-split. **NEXT: push worktree→main (hooks go live), then the AWAM↔PLP binding build; quick: 266039 archive + arch-doc sync.**

**Memory Type**: RAM | **Last Activity**: 2026-06-18 ~18:00 MPST — DE (2nd pass) wrap (Opus 4.8, distracted-meninsky worktree).
