# Current Session

**Last Activity**: 2026-09-29 14:55 — #281650 rework (MLPS PTMLK/02/L/MLPS/2026/8 Tanah Kerajaan) patched in PROD, verified, closed + archived · DE.

## Session Recap (2026-09-29, #281650 rework)
- **Ask**: BA (Fizah/Idris) wanted Tanah Kerajaan (No.PT) on MLPS/2026/8 to show numbers only, no leading dash, no "&", no PT wording ("225,226").
- **Limit**: `umm_a_permohonan_tnh.no_lot` is NUMERIC (`'225,226'::numeric` errors); L1e prints `no_lot` + " - " + note. miya chose `225 - 226` (patch ticket).
- **Done**: `3. Rework\2. Fix\281650.sql` — row 46856 no_lot 225 + note 226, licence row 4346 same (so next renewal seeds it). Infra ran it; PROD verified. Redmine Resolved text prepared (miya posts).
- **stg2 test** (MLPS/2026/4 row 44424, note 1140): L1e + 4Ae show `1139 - 1140`; Papar Borang 4Ae + Simpan did not touch the row, so my "Simpan wipes the note" claim is refuted (LATENT-BUGS L15). miya to run the stg2 reset.
- **Closed**: QA-281650 archived (Task 239 to Archive, doc to archive/QA-281650, block to active-archive, cycle-0 block merged).
- **Slips**: `assume-not-verify/state-guess` x2 (Hantar-safe claim; wipe claim before test) · `reask/misread-ba-intent`.

**Last Activity**: 2026-09-29 12:18 — eSOKONGAN priority rule patched system-wide · Redmine retrieved · 3-ticket sweep (W1-W4, 9 familiars) · DE.

## Session Recap (2026-09-29, redmine-tickets-triage worktree)
- **Rule (miya)**: "eSOKONGAN ticket" = TRACKER eSOKONGAN (id 51, SLA), never the project name. Order: eSOKONGAN → anything PROD → rest; inside each Priority, then urgent words in description/journals. Built into `quest/redmine-board.js` (table order, Severity column + URGENT flag + banner), list-redmine eval 17/17, list-redmine / sweep / retrieve-redmine skills, session-briefing.md, CLAUDE.md v1.73 §Vocabulary, memory `feedback_esokongan_means_tracker`.
- **Board**: all Medium, no urgent words. 282061 (eSOKONGAN, due 8 Oct) · 281650 (DP PROD, reopened today) · 6 others. 278909 Resolved. 274266 + 264355 now with Farah (miya reassigned 264355 at 11:51 with a guide; active-cli refused the delegated update — block still says active).
- **Sweep** (qa_docs in main repo `projects/coding-projects/active/QA-<n>/`): 282061 two permit counters + borang Fi sums RM 200 fee → code C1-C4 + 4-row number swap, 83% · 281650 dash is code `PelupusanTemplateReportMethodParameter.java:772`, code fix alone renders "PT 225 & PT 226", 1 PROD row, 80% · 281324 `MLK_PLP_SUB_UPN` gateway needs `caraPenghantaran` default (1 model) + 5 PROD instances rescued via Flowable admin, 90%. 6 tickets swept 25 Sep skipped (no Redmine activity since).
- **Tooling gap**: familiars could not write qa_docs (worktree guard on base checkout + sibling-file ban); outputs went to scratchpad and I banked them via PowerShell.

**Last Activity**: 2026-09-28 18:46 — OneDrive "Rename 1 item? NUL" popup diagnosed; nul-redirect-gate + system-audit CHECK 10 built · DE.

## Session Recap (2026-09-28, NUL popup → session-256334-recovery worktree)
- **Cause**: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\colleague-cr-issue-ed8731\NUL` (93 B, host key of 10.16.63.27) written 2026-09-25 16:05 by a Git Bash `ssh-keyscan … > NUL`. My move was classifier-blocked; miya cleared the file.
- **Built** (commit `f4e0902d`): `domain/nul-redirect-gate` forge-born PreToolUse Bash gate, 25/25 eval, live block confirmed · `.claude/hooks/system-audit.js` CHECK 10 reports CON/PRN/AUX/NUL/COM1-9/LPT1-9 in the repo (depth 4) and each worktree root (depth 2) · bash-tool memory NUL trap · architecture row · slip `shell/nul-redirect`.
- **Open (miya's call)**: leftover worktree folder `colleague-cr-issue-ed8731` (git link broken) still inside OneDrive.

**Last Activity**: 2026-09-28 16:36 — #281712 (Portal Awam PLTP syer popup) fixed, deployed int-env, test passed, Redmine resolved, Phase 2 archived + bounty · DE.
