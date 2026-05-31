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
- **Decision needed**: adopt as the repo's top-level `ARCHITECTURE.md` (additive, nothing conflicts) or discard. A quick read then adopt looks reasonable.

---

Once みや decides, this `salvage/` folder can be deleted.
