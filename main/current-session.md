# Current Session

**Last Activity**: 2026-09-23 (past midnight) — boot-board rewrite (3 tables + 2 real bugs) · redmine-sync v11 (rework folders) · reassigned-ticket learning · 280895 quest→Rubric · DE.

## Session Recap (2026-09-22 → 23) — 3 /goal rounds
- **Board rewrite** (`43086a54` + `88c6be68`, on main): boot listing now 3 priority tables (Patching-PROD tracker 63/64/71 · eSOKONGAN 51 severity→due · Internal-fixes+other). Fixed TWO real bugs that had been silently EMPTYING the board: (B1) `isMe` now strips the Redmine `(Dev PLP)` role suffix — exact-match `ME` had put all 14 tickets in "others"; (B2) added `MLK_03_Pelupusan` to `MELAKA_PROJECTS` (4 tickets were flagged "outside Melaka"). `Days` = days since HE received (assignment-to-me journal), Due date kept. `domain/list-redmine/eval.js` 16/16.
- **redmine-sync v11** (`88c6be68`): rework folders counted by GENUINE reopens (OneDrive-proof, replaces v10 birthtime which missed #278699's 2nd reopen); each `N. Rework` gets `0. Brief` (BA attachments route here) + `2. Fix` (his upload workspace). `redmine-sync.eval` 17/17.
- **Board maintenance**: archived 280614 (Phase 2); closed 278580 + 280176 (Redmine-resolved); retrieved #264355 + #244600 (were missing from active.txt).
- **Reassigned tickets (item 6)**: 280029 = Ammar's Surat Ulangan JT fix — traced + banked to BUG-BESTIARY (CC bare-RPr → doc-default font; `rPrOrSdtPrFallback`; commits `01c501634c`+`6a74597c85`). 278909 (New) + 280166 (cross-module flowable/uam) closed as delegated-to-Ammar.
- **280895 quest → Rubric** (eSokongan, PRIORITY next session): UPP MCL papar-kosong. Root (90%): `MlkMaklumatPermohonanPembatalanForm.xhtml:32-45` declares 9 urusan flags but NOT `isMCL` → MCL app falls through negative-list panels → render exception → whole Langkah-2 blank. The BA VIDEO corrected the earlier sempadan theory (L8 getter already present :937). Apply next session (server.log names the throwing panel). Doc: `projects/coding-projects/active/QA-280895/QA-280895.md`.
- **Full-context audit**: `system/agentic-ticket-workflow-assessment-2026-09-23.md` (what he asked/questioned, bugs B1-B5, commits, residuals) + todo Q1 rows + proposals P1-P3.

## 🎯 HANDOVER — Focus tickets (load this after compaction)

| # | Type | Focus / next action | Effort | Why |
|---|---|---|---|---|
| **280614** | Data patch (PROD) | ✅ **APPLIED** (verified: permohonan /9+/10 tempat='-', lesen rows patched) → **close it** | done | patch ran |
| **280540** | eSOKONGAN code | build `PLP_BANGUNAN_*` flat-rate guard at `PelupusanMaklumatBayaranHelper.java:276` | build+test | recon done, net-new build |
| **246923** | template config | remove 3 dup keys (PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG) from Block A in `template.config.json` | ~9 lines | rework, BA waiting |
| **274323** | Word CC | force `"RM 0.00"` in `PelupusanWordCCMethodConstant.java:4772` when royalti exempted | tiny | rework, BA waiting |
| **279711** | code (populator) | repoint `PelupusanWordCCMethodConstant.java:842-843` to gated `populateJawatanPegawaiSemak` + PPD branch in isValidUser :2043 | small | rework; ⚠️ MaklumatPemohon.docx shared-tag blast radius |
| **280176** | code (read-guard) | add `removeIf(getTarikhTamat==null)` at `PelupusanSearchService.java:2064` + `:2110` | 2 lines | rework; save-side fix shipped, read-side gap |
| **278909** | template add | add 3 docx twins + 3 config blocks (adaPemilikanTanah) mirroring Lulus family | medium | new; task folder unread — get Brief at Apply |

**280265** — patched (generateSurat 7547→YA); pending BA retest. Per DATABASE.md §24 the flip un-hides JPPH (show-goal); if BA needs re-add → Alex's DELETE pattern (BUG-BESTIARY §JT). Knowledge-first: read §24 on any JT ticket.

## Working Memory
- Melaka DB reconnected (postgres-mlkprod live, etprdmlk).
- Canonical formats only (never invent): infra-handoff + SCRIPT-CHECK + close-phase (`feedback_use_canonical_formats_never_invent`).
- close-phase now always emits Redmine Root cause + Solution.
- **Parallel session 2026-09-22 (this laptop)**: System-check run 3 (5 familiars + controller verify) for みや's "system-context-before-change" routine; MEMORY.md compaction parked.
- **みや's routine ask (2026-09-22)**: a mandatory mechanical rule = know the whole system context (why · goal · rules · structure · guardrails · monitoring · version · confidence) before any system change, plus a top-view registry of workflow groups. Appraised: real gaps = no group-level registry + no change-time context card for arbitrary targets; 70% of mechanics exist (`lib/change-checklist.js`, `system/registry.jsonl`, Rule 13 README keys, NUKE-MARKER, turn-ledger goal_met). His decisions via popup: audit first then build · group level named **System** · compaction resumes after the audit.
- **System-check run 3 fixes SHIPPED (11 commits, remote main == local)**: batch A (change-checklist pure-node, ghost scan covers domain/, windowsHide, Rule 14, step 5, 4 SKILL pointers, registry regen) · batch B (5 hooks registered after evals + smoke) · batch C (120 OneDrive conflict copies removed, both machine names; 35 jsonl merged first; CHECK 9 boot detector; **restored** DE Step 10 hard rule + Step 2b safe.directory clobbered in `25a0379c`). fsck clean after cleanup. Open items stay in the todo row.
- **System-check run 3 result**: 6 CRITICAL · 9 HIGH · 12 MEDIUM, all in `main/todo.md` Q1 row "System-check run 3"; stamps updated in `system/evolution-protocol.md` (system-check + evolution-check both 2026-09-22). Headline: 9 ghost hooks the boot audit cannot see, `change-checklist.js` referencer step dead on this laptop (bash ENOENT), 26 OneDrive conflict copies incl. `.git` internals.
- **MEMORY.md compaction (parked)**: plan drafted = 48 merges → 118 files / ~129 lines; 2 dead files should MOVE to `.claude/auto-memory/archive/` (24 retired memories already live there), not delete; 25 live citers of memory filenames found by hand grep (quest SKILL, close-phase, bankai, patch-script-gate hook) → keep those filenames as survivors.
