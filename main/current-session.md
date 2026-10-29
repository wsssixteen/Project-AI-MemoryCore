# Current Session

**Last Activity**: 2026-10-29 22:20 — worktree `suspicious-nash-ce350d` (child of "Sweep 3 tickets + audit"), 286610 MCL Notis 5A + tempoh pajakan handed to BA, quest Phase 1 closed, Domain Expansion.

## Session Recap (2026-10-29, worktree "suspicious-nash-ce350d", 286610 Notis 5A + Tempoh Pajakan)
- 286610: report.config.json Notis 5A PSKN5A list += STATUS_PENYEDIAAN_BARU (Jana Semula rebuilds unsigned) · TemplateSuratKeputusanLulusMCL.docx row b) Tempoh Pajakan = static "Selama-lamanya". Commit e76c26d9ab on mlk/esokongan/286610, merged int-env 12b6d2306c, miya deployed mlit.
- miya tested Isu 1 on internal (PTMLK/02/L/PLTP/2026/7, nazli): Peraku signed -> Jana Semula -> Baru unsigned -> Selesai -> signed. PASSED. Isu 2 checked at template level only (Word render); not run on internal.
- Redmine journal 4 (22:11): Resolved, Nurul Amani, 100%, Penyelesaian Kekal, Root Cause (DEV) + Solutions + Resolved By, note to Amani + 3 screenshots. Quest status=closed; archive waits for Redmine Closed.
- Internal-only path: on int-env Notis 5A goes through the Report API (285171, 03f5c01e0a); the test passed through it.
- Slips: git fetch in miya's repo; test scenario without starting state; doc-sim cannot boot (Spring "Only one AsyncAnnotationBeanPostProcessor"). redmine-write-gate read "do not stop until you've submitted" as a refusal (SUBMIT_DENIAL :68) and blocked his /goal approval twice.
- Open: ticket onto the planned-release list; 4 BA questions (cop+QR side effect, PT/PSBS/PLTP scope, row a) Jenis Hakmilik, label wording) unanswered.

**Last Activity**: 2026-10-29 21:52 — worktree `jovial-kepler-a07ba6` (child of "Sweep 3 tickets + audit"), 286646 MCL strata check handed to BA, quest Phase 1 closed, Domain Expansion.

## Session Recap (2026-10-29, worktree "jovial-kepler-a07ba6", 286646 MCL strata)
- 286646: AWAM `CarianRasmiHakmilikForm` refuses a strata hakmilik (`strataInduk != null`) for MCL on Cari, tick and Teruskan, Melaka only. Commit 1ac43f7b0d on mlk/esokongan/286646, merged into AWAM mlk/int-env e363158157.
- miya tested on internal: strata receipt 260810BSAT00038 shows the Ralat on Cari and tick, Teruskan off. Land receipt 261016BSAT00003 not tested (accepted risk). The row still loads into Senarai Hakmilik; expected, same as the PLTP/PSBS jenis check.
- Redmine journal 5 (21:43): Resolved, Anis Nabilah J Daud, 100%, Root Cause (DEV) + Solutions + Resolved By, BA note + 2 photos from `2. Fix`. Quest status=closed; archive waits for Redmine Closed.
- Slips: told him to test on staging when the BA env is internal ("are you broken?"). Gates read a mid-turn or app message as his last message (falsifier ledger, redmine-write-gate submit), so his approvals were missed twice.
- Open: ticket onto the planned-release list; kaunter (SPOC) route and draft p_aplikasi 68769 not covered by this fix (BA told).

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
**Last Activity**: 2026-10-29 21:30 — worktree `common-version-1-10-20-mlk-c5ee8f`, 285768 hotfix branch + quest archived (Redmine Closed), Domain Expansion.
