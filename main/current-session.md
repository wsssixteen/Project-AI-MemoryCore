# Current Session

**Last Activity**: 2026-10-29 21:30 — worktree `common-version-1-10-20-mlk-c5ee8f`, 285768 hotfix branch + quest archived (Redmine Closed), Domain Expansion.

## Session Recap (2026-10-29, worktree "common-version-1-10-20-mlk-c5ee8f", 285768 hotfix)
- 285768: common 1.10.20-MLK (Haikal's note) is already on `mlk/release/1.9.0`. Per the team lead, a hotfix branch `mlk/hotfix/285768` off master: one pom line 1.10.8 -> 1.10.20-MLK, `da08e3d6cf`, pushed, compile green. Infra deployed it to etanah-hx6.melaka.gov.my/etanah-pelupusan.
- Redmine Closed 14:39; Nurul Amani Verified STAG 16:08. Quest saved: Phase 2 run, archived (save-quest = DONE), bounty written, 3 .main/zip pruned from the archived folder (copies in PROD DMS via 287292).
- System: hotfix skill gained "Hotfix deployment" H1-H4 + the infra team's template, ticket line = number only. Knowledge: pemegang permit/lesen name = `ind_pemegang_permit_lesen.nama_pemegang` (DATABASE.md).
- Open: bounty proposal (worktree guard blocks Edit on main-only untracked quest files) waits for miya's ruling. Work worktree `E:\Dev\etanah-work\etanah-pelupusan-hotfix-285768` and `wt-common-285768` kept until his yes.
**Last Activity**: 2026-10-29 21:25 — worktree `esokongan-quest-sweep-2bce09` (branch claude/qa-tickets-review-9d166c), 262027 handed to BA, quest saved, Domain Expansion.

## Session Recap (2026-10-23 → 2026-10-29, worktree "esokongan-quest-sweep-2bce09", tickets 262027 and 261986)
- **262027 (PSBS Surat Keputusan PTG kepada PDT Tolak, rework cycle 2)**: fix on mlk/qa/262027v2 (54d8ffedb3, afe270b690), merged int-env + stag-env. Staging runs release 1.9.0 (baseline, no 262027), so the test ran on internal PTMLK/01/L/PSBS/2026/8. Redmine 2026-10-29 21:02: Resolved, Nurul Amirah Nadiah, 100%, note + internal Tolak PDF. Quest status=closed (Phase 1); archive waits for Redmine Closed. KPI P-262027-B4-20261023 pending BA verify.
- **261986 (Risalat MMKN RAHSIA header)**: next. miya wants it re-looked from the start. Phase 0 done earlier; Rubric, Apply, Test not done; nothing moved this session.
- **"164"**: no open ticket ends in 164. Ask miya for the full number.
- **Slip**: the Redmine edit page froze Chrome for about 20 minutes while redmine-write-gate (STAGE-ONLY until 2026-10-30) blocked the API. I fought the page before telling him about the gate. He submitted the form himself.
- **Linked sessions**: session-name-fix (cranky-wilson, DE done, 6a478ade on main) · alter-sim (cool-hopper, waits on his "add it" and a staging permohonan for a real-vs-preview compare).

**Last Activity**: 2026-10-29 21:00 — worktree `redmine-issue-287292-1cfb39`, quest 287292 (PROD document patch, UPP Surat Makluman Pembatalan) closed through Phase 2 and archived, Domain Expansion.

## Session Recap (2026-10-29, worktree "redmine-issue-287292-1cfb39", 287292 PROD letter patch)
- Ticket: UPP Surat Makluman Pembatalan for PTMLK/02/L/UPP/2026/5, /6, /7 had no ADO signature and the top date showed the PPTPB permohonan date. Same 3 documents as 285768, so one patch.
- Done: 3 corrected .main files (generation date 19/19/21 Oktober 2026, ADO signature, peranan), one combined infra upload request for 285768 + 287292, PDF reset script `287292.sql`. Infra confirmed. Redmine Resolved (miya submitted). ProTime resolved + weekly plan.
- System changes landed on main: patch-mlk-doc "upload document" wording + re-dated letter keeps the generation date; close-phase: a patch ticket runs Phase 1 + Phase 2 in one pass (per miya).
- Phase 2: the archive failed twice on EPERM. Cause not verified: the top-folder rename failed while per-file moves worked (no process held a file). A direct Move-Item then moved 1. Brief and stopped; the rest was moved by hand (hashes checked), then archive-quest.js. Its prune step deleted the 3 .main + zip from the archived 2. Fix (copies live in PROD DMS and the OneDrive recycle bin). Bounty banked 5d766965.
- Open: the bounty proposal (one-owner marker for a Task folder) waits for miya's BUILD/DROP/DEFER.

**Last Activity**: 2026-10-29 20:05 — worktree `pembatalan-dropdown-popup-251828`, adhoc ADHOC-BPRZ-2026-1 (Penang IT AWAM BPRZ) closed ANSWERED and archived, Domain Expansion.

## Session Recap (2026-10-29, worktree "pembatalan-dropdown-popup-251828", Penang BPRZ adhoc)
- His ask: Penang AWAM BPRZ popup, "Pembatalan dropdown" shows nothing; ticket maybe under Izz. Screen confirmed: tab Maklumat Perizaban > popup Maklumat Plot.
- Finding: the plot popup lists (No. Lot/PT, No Lot Bersebelahan, Tempat) are built from the saved Maklumat Tanah rows (`etanah-awam` PelupusanService.java:4725-4782). IT record 430 has no No Lot Bersebelahan (row 201 mklmt_tmbhn blank), so that list is empty. By design per BA spec 286972. No Izz ticket matches.
- miya: "no, it is okay" → closed ANSWERED, route ANSWER. Register Penang A6 ANSWERED; Task folder 7 → Archive; block → active-archive.txt. Audit 30/30 PASS (agent's run; my own re-run is blocked by the adhoc-brief-first gate).
- Open: nothing for this adhoc. archive-quest needed `--allow-stub` (no Bounty section on an answered adhoc).
**Last Activity**: 2026-10-29 19:57 — worktree `dreamy-pike-08af0b` ("28/10/2026 - one system-change workflow"), /system-change built and landed, Domain Expansion.
