# Current Session

## What's loaded
2026-06-23 — Opus 4.8. Worktree `eloquent-euler-65ed1b`. QA-266503 follow-on: the issue-2 root was FOUND (via みや's save-trace + the git-history/lineage probes), a recurring-regression lineage uncovered, and a git-history stop-gate built.

## ▶▶ NEXT SESSION — START HERE
**🎯 QA-266503 issue 2 — ROOT FOUND (code-level), fix ready, NOT shipped/verified.**
- **Page = `MlkBorang4AeForm`** (year-walk panel), NOT the Penyediaan/FromLite form I chased for 2 days. Confirmed by みや's trace: Simpan → `performCustomSave` → `IPelupusanService.saveVersiPermitLesenMLPS` → impl `PelupusanService.java:15462` (callers `MlkBorang4AeForm:757` + `TrgBorang4AeForm:591`).
- **Root (one cause, both halves):** the year-walk panel `populateJadualRekodPembaharuanMLPS` floor = `vplFirst(2024-orig).year+1 = 2025` → the 2024 renewal is excluded from the panel → on Simpan `saveVersiPermitLesenMLPS` matches panel rows to renewals BY YEAR (`:15497`) and DELETES the unmatched 2024 renewal (`:15645→deleteVersiPermitLesenDataMLPS:15653`).
- **Fix C is the right fix** (vindicated): `tahunCounter = min renewal year` (committed `3512e0df8a` on `mlk/internal-issue/266503`) → panel includes 2024 → save matches it → not deleted.
- **Stages:** 1 diagnosed ✅ · 2 written+committed ✅ (`3512e0df8a`) · 3 shipped ❌ (not merged/deployed) · 4 runtime-verified ❌ (never run).
- **DO NEXT:** rebuild branch → open `MlkBorang4AeForm` → confirm 2024 renewal appears + survives Simpan (read-back). THEN reconcile with **faiz** before shipping (see below).

**🚩 KEY FINDING — recurring regression, prior fixes missed the sibling save.**
- Lineage: **#256093 (Azim, Apr-2026) → #261626 (faiz, Jun-2026) → QA-266503 (now)** = SAME Rekod Pembaharuan panel+save fixed 3×.
- 261626 fixed `PelupusanLiteService.populateVersiPermitLesen` (Penyediaan-Lite save: removed `||currentYear`, added guards) + the Penyediaan/Utiliti forms. **NEITHER 256093 nor 261626 touched `PelupusanService.saveVersiPermitLesenMLPS:15462`** — the PARALLEL save on `MlkBorang4AeForm`, with the identical year-match-delete bug. That's why 266503 recurs. Proper fix = patch BOTH save paths once (coordinate with faiz). Optional harden: match-by-id / no-blanket-delete in `:15462`.

**🚩 Issue 2 likely NOT reproducible on current code** — BA's data (2025-10/11) predates faiz's fix (2026-06-19); the `populateVersiPermitLesen` deletion is already prevented there, but `saveVersiPermitLesenMLPS:15462` (MlkBorang4AeForm) is unfixed → still deletes. Residual corrupted data → see MIGRATOR-DUP-V0.

**Other open:** `MIGRATOR-DUP-V0` (hold) — dup `versi_dok=0` cleanup, own ticket. `active-cli update` non-QA-id bug — flagged as chip `task_5231b019` (an active-cli.js fix merged in from another machine this session — verify it landed).

## This session arc (2026-06-23)
- **Existing-fix probe (the breakthrough):** `git log --grep` found #261626 (faiz) + #256093 (Azim) fixing the SAME bug. Read their diffs → the lineage + the unfixed-sibling-save root. I should have run this at 266503's Scout step 0 (the QA-266215 lesson) — みや caught it.
- **issue-2 root RESOLVED** after 2 days on the wrong form — みや's save-trace (`performCustomSave → saveVersiPermitLesenMLPS`) pointed at `MlkBorang4AeForm`, ending my FromLite/year-walk flip-flopping. Fix C vindicated.
- **Built `codemap-recon-consult` v1.3** — MANDATORY git-history stop-gate (existing-fix/regression/related-ticket probe before any Scout/Recon conclusion). Eval'd 3/3. Committed (`79876be`→`edd09f2`).
- Records committed: lineage + issue2_root on QA-266503 (`bd575f3`).
- **Honesty:** clarified "diagnosed ≠ shipped ≠ runtime-verified"; every "it works" was code-inference, never a run.

## Carry-forward
| # | Item | State |
|---|---|---|
| 1 | QA-266503 issue 2 | ROOT FOUND; fix C ready; ⬜ rebuild+Simpan verify (MlkBorang4AeForm) + reconcile w/ faiz |
| 2 | `saveVersiPermitLesenMLPS:15462` = unfixed sibling save | ⬜ patch it (+ faiz's populateVersiPermitLesen) once, properly |
| 3 | MIGRATOR-DUP-V0 | ⬜ hold — own ticket + data cleanup |
| 4 | git-history gate v1.3 + codemap v1.2 + Check C | ⬜ live after CC restart + main sync |
| 5 | New gate candidate | "trace the real save path from the page before analysing any method" (the front-gate that would've saved 2 days) |
| 6 | etanah-knowledge entry owed | the Rekod-Pembaharuan recurring-regression + parallel-save + year-match-delete pattern → BUG-BESTIARY (next session, on main) |

## 🎯 Session Recap (for AI restart)
QA-266503 issue-2 root FOUND (code-level): page=MlkBorang4AeForm, save=`saveVersiPermitLesenMLPS:15462` deletes year-unmatched renewals; year-walk floor (2025) drops the 2024 renewal from the panel → save deletes it. Fix C (`3512e0df8a`) is the right fix, NOT yet shipped/runtime-verified. Lineage 256093→261626→266503 = recurring regression; prior fixes patched the parallel `populateVersiPermitLesen` but missed `saveVersiPermitLesenMLPS:15462`. Built git-history stop-gate (codemap-recon-consult v1.3). NEXT: rebuild+Simpan verify + reconcile with faiz before shipping.

**Memory Type**: RAM | **Last Activity**: 2026-06-23 — DE close (Opus 4.8, eloquent-euler worktree).
