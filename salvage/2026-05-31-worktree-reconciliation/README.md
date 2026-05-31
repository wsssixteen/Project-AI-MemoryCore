# Worktree Reconciliation Salvage — 2026-05-31

Captured during the worktree cleanup みや requested 2026-05-31. These two files held **unique content that existed only in a sibling worktree's working tree** (uncommitted / untracked) and would have been lost when the worktrees were removed. Preserved here for みや's decision — they are **judgment calls**, deliberately NOT auto-integrated into the canonical files.

The unambiguous salvages from the same cleanup were already merged into the canonical files (NOT here): the 2026-05-29 diary **Session 3** block + 2 **slip-log** entries (QA-258004 cycle-1 fabrication + deploy).

---

## 1. `eloquent-active.txt_QA258004-cycle2-variant.txt`
- **Origin**: working-copy `quest/active.txt` in worktree `eloquent-noether-0c1bb4` (uncommitted edit; the branch commit itself is already merged into main).
- **What's unique**: a detailed **QA-258004 Verify cycle-2 root-cause** writeup — syarat/sekatan live in `tkl_a_laporan_tnh.mklmt_tmbhn` JSON; the cukai-panel Simpan that copies them was broken by an `onPremiumChange` MethodNotFoundException; Rubric Option A (invalidate-on-save) vs Option B (populator land-report fallback) analysis. NOT in the canonical `active.txt` (origin/main).
- **Tension**: the canonical `active.txt` + the 2026-05-31 session settled on a **different** narrative — Option B was REJECTED, and the 2026-05-31 fix was the JSF dropdown-`listener` fix (CLAUDE.md v1.36 "copy a working sibling component"). This variant may be a superseded dead-end OR still-useful investigation detail.
- **Decision needed**: fold the cycle-2 detail into `projects/coding-projects/active/QA-258004/QA-258004.md` (the qa_doc detail home) during the deferred projects pass, or discard if superseded. **QA-258004 is currently paused.**

## 2. `keen-hopper_ARCHITECTURE.md`
- **Origin**: untracked `ARCHITECTURE.md` in worktree `keen-hopper-f74a0d` (never committed anywhere; absent from origin/main).
- **What it is**: a whole-repo orientation doc ("front door for a fresh Claude Code instance") that points to `meta/system-architecture.md` for depth.
- **Status — ON HOLD** (per みや 2026-05-31): keep this file here, do **not** act on it (not adopted, not discarded). Revisit later.

## 3. `parent-2026-05-30-diary-variant.md`
- **Origin**: untracked `daily-diary/current/2026-05-30.md` in the **parent `main` checkout** (from the `confident-elgamal` 2026-05-30 session), discarded when parent main was reset to origin/main.
- **What's unique**: 3 lines not in the canonical 2026-05-30 diary (origin/main's version is 37 lines richer overall) — 2 Index entries (QA-259702 Phase-1 awaiting FAT test; the QA-262495-family doc-gen NPE on `PTMLK/02/L/PRU/2026/12`) + a **Closing reflection** ("Two corrections from みや today… a stale rule retired to main, a wrong database connection repaired and guarded against… Rest well, リドワンさん").
- **Decision needed**: fold the closing reflection into the canonical 2026-05-30 diary, or leave as-is (the 2 index entries are likely already covered there). Low priority.

---

Once みや decides, this `salvage/` folder can be deleted.
