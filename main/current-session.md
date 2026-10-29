#**Last Activity**: 2026-10-29 22:30 — worktree `stoic-ramanujan-634076` (child of "Sweep 3 tickets + audit"), 286655 MLPS/OMLPS Jadual dates handed to Amani, Domain Expansion.

## Session Recap (2026-10-29, worktree "stoic-ramanujan-634076", 286655 MLPS/OMLPS Tarikh Jadual)
- 286655: Maklumat Jadual at Penyediaan Borang 4Ae dan L1e keeps the saved Tarikh Mula/Akhir after Simpan (MLPS + OMLPS; QA 262778 old-date reset kept). Commit 75381bb3a7 on mlk/esokongan/286655, merged int-env fa244fa194.
- miya tested MLPS on internal PTMLK/02/L/MLPS/2026/5 (27/05/2025 to 31/12/2028 kept after Simpan, Borang 4Ae line (1) matches, Pengesahan KPPD 21:30 matches). OMLPS not tested (no OMLPS app at that tugasan on internal).
- Redmine journal #6 (22:23, miya clicked Submit): Resolved, Nurul Amani, 100%, Penyelesaian Kekal, Root Cause (DEV) + Solutions + Resolved By, note to Amani. The 2 red-boxed photos in `2. Fix` did NOT attach (upload tokens lost when the form re-rendered); add them on his nod.
- System: CLAUDE.md v1.98 Disposition 7 (own steps run without asking; blockers logged and routed around) + deploy §5b photo finding (37e702ed).
- Slips: asked him to save a photo I could find myself; redmine-write-gate could not see "submit it" sent as a huge pasted block (read "(none)") and blocked the Submit twice.
- Open: attach the 2 photos to 286655; ticket onto the planned-release list; OMLPS untested.

 Current Session

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
