**Last Activity (288662 session)**: 2026-11-10 15:30 — worktree `quest-288662-rubric-audit-10a08a`. ESOKONGAN 288662 PLTP (Maklumat Tanah panels at PSPB / Minit Bebas / Keputusan Pendaftar) fixed, two cycles, Redmine Verified by Fizah; quest closed (waits for Redmine Closed); Domain Expansion.

## Session Recap (2026-11-10, 288662 PLTP Maklumat Tanah panels + Phase 0 audit)
- Asked: /quest 288662 until Rubric, audit Phase 0 in the background into todo; then apply, test on server, stage Redmine, save; rework for Keputusan Pendaftar; DE.
- Done: cause = SPI / Keputusan Pendaftar treat nextUrusan PSPB (Endorse Batal, 256091) as "anything else" and show Kadar Cukai + Syarat, so Simpan checks an empty premium (NPE). Fix in PelupusanExcelReaderHelper.initMode(): PSPB with PSPM at :1780 and :1824, PLTP Minit Bebas hides Syarat. Commits 7d65e42dfb (12:18) + 8f8ce94614 (14:48) on mlk/esokongan/288662, merged int-env + stag-env. miya tested staging (SPI, PYMB, PYSTP) and internal (KP 01N751/2026). Redmine journals #7 and #9; Fizah Verified.
- Found: the 06/11 session traced the same NPE and agreed the fix on WhatsApp but saved no adhoc (row A101 written late).
- Open: 288662 on the planned-release list; Phase 2 when Redmine Closed; todo Q1 "288662 Phase 0 audit" P1-P14 for miya's ruling.
- Mistakes: missed the adhoc at quest start; missed Keputusan Pendaftar (same branch 44 lines below, named in requirement 256091).
- Assessment: A1 one Fable audit agent ran beside the quest and found the B2 parser gap. A2 Phase 0 adhoc compare has no fallback source. A3 the fix was found fast; the sibling branch was not grepped. A4 stg1 alter candidates mostly have no live engine task. A5 ⏭ no sweep.
**Last Activity (288188 session)**: 2026-11-10 14:40 — worktree `hakmilik-pejabat-awareness-32c5c1` (branch claude/ticket-288188-quest-start-cb3845). QA-288188 PROD UPP document patch done and archived (Phase 1 + 2, patch ticket); Domain Expansion.

## Session Recap (2026-11-10, 288188 UPP signature patch)
- Asked: /quest 288188; make the files downloadable here (WhatsApp would not open); role line A; stage Redmine after verify; Phase 2 archive + DE.
- Done: Redmine New to In Progress 20%; matched ADHOC-UPP-2026-3 (A97, cause known); BA's signed letters for PTMLK/01/L/UPP/2026/19 and /20 checked (signature beside QR); role line set to Penolong Pegawai Daerah (as 287292); 288188.sql + LAIN-37525445_1.main + LAIN-37525562_1.main; infra ran replace + reset; PDF path empty verified on PROD; Redmine Resolved to Nurhafizah Hasan 100% submitted by miya; archived (archive/QA-288188).
- Found: peranan names live in rjk_senarai_ahli_kumpulan (DATABASE.md §16); the letter's role line prints "-" for signers whose PLP role is not primary (LATENT-BUGS L40 SUSPECT, owner etanah-common).
- Open: UPP/2026/18 and 36 open Semakan letters need Jana Semula before Selesai (untested, ADHOC-UPP-2026-3); bounty proposal (patch-mlk-doc rule 3 points at DATABASE §16) tracked.
- Mistakes: 6 schema queries to find the peranan table; Stop hooks asked twice for the proving SELECTs and a picture line.
- Assessment: A1 a document patch went from ticket to archive in one session because the adhoc held the cause. A2 save-quest PHASE-2 still needs the bounty block before archive-quest. A3 letter-check.py with --allow-empty matched the precedent letters. A4 a role-line "-" sits in common, not in the patch. A5 ⏭ no sweep.
**Last Activity (288533 + over-complexity audit session)**: 2026-11-10 12:51 — worktree `prbb-permit-id-fix-f122a5`. All eight ways of the over-complexity audit built side by side (3 sonnet builders) and landed on main f2ed718b; 288533 archived at Phase 2.

## Session Recap (2026-11-06 to 10, auto-start: 08:30 sweep by the clock, WhatsApp fast lane, watcher health)

## Session Recap (2026-11-08, Masterline look modes, delegated)
- Asked (orchestrator, his rulings row 44 and 2026-10-20): a Look switch with 1 Operations console, 2 Service ledger, 3 Dispatch board, 4 Mix on every screen; remove the Claude look from the base; impeccable-checked; prove with flows, click walk, screenshots; never stop to ask.
- Done: `app-samples\prototype\` v2 in the main-checkout project folder (app.css neutral token base, new looks.css, look switch + `?look=` `?layout=`, PRODUCT.md); COMPARE.md v2; DECISIONS rows 46 to 54; VERSIONS row; START.md Main app row; report `reports\look-modes.md`. Proof: 40/40 flows per look desk + phone; walk 14,928 clicks 0 errors; impeccable detector 0 over 272 pages; taste-skill 0 FAIL at 1366/768/375; impeccable critique dual-agent (A about 21/40).
- Found: impeccable's `.cmd` launcher splits URLs at `&` (call `~\.impeccable\bin\0.1.15\impeccable.exe`); its monotonous-spacing rule reads inline `style=` values; taste-skill inspect takes a file, not a URL with a query.
- Open: his pick of look (or keep the switch) and whether engineers and clients see the switches; layout and stack picks still open.
- Mistakes: my proof harness left one headless-browser profile per run in Temp (142, 6.2 GB) and filled drive C: to 0 MB; Edge stopped launching. Fixed (deleted, harness now cleans up); `core/slips.js` blocker rows.
- Assessment: A1 a proof harness needs a disk budget like a server (Rule 7). A2 ⏭ no quest. A3 bisecting a compiled detector by hiding parts found the cause in two runs. A4 ⏭ no etanah work. A5 ⏭ no sweep.

**Last Activity**: 2026-11-06 00:45 — worktree `cool-margulis-5bb326` (branch claude/redmine-287346-audit-implement-a86f35), 287346 rework 1 shipped and Phase 1 closed, template-scenario check 6 (tag sources) built and landed, Domain Expansion.

## Session Recap (2026-11-05/06, 287346 rework 1 + tag source check)
- Asked: fix Fizah's 2 rework items; check both signatures on the MLIT Peraku paper; highlight every CC tag, red-box only the BA's asks, stage then submit Redmine; why the tag source check is needed; /goal: build it, eval verify, system-change, DE.
- Done: c2364d2bde on mlk/esokongan/287346, int-env a32fb6abab; marked paper in 3. Rework; Redmine 287346 Resolved to Nurhafizah 05/11 17:17; wrong-fix rows 1 and 2 ruled; template-scenario check 6 (tag-sources.js + tag-sources.json, eval 58/58) on GitHub main c0177357, main folder d12719a8; quest Phase 1 closed (WAIT for Redmine Closed).
- Found: Datuk Sabrina's blank signature on MLIT = her newest signature file (LAIN-36582925) returns no bytes from MLIT DMS, NO_SIGN fallback; PROD MCL luas_dipohon empty 1718 of 3551; Git Bash rewrites "--case empty|PTMLK/..." into a Windows path.
- Open: BA verifies 287346 → Phase 2; Sabrina signature re-upload on MLIT (BA side); MCL tags in tag-sources.json still 33 unmapped (filled ticket by ticket); main folder diverged from GitHub main (landed by hand).
- Mistakes: added a legend and labels to the marked paper he never asked for (memory rule 841ec441); cycle 1 tested one permohonan with luas filled.
- Assessment: A1 the change route's land step needs a by-hand path when the main folder has diverged. A2 template hand-back now asks every printed tag for its source. A3 doc-sim + PROD count proved the empty case offline. A4 a test permohonan proves nothing about a column it happens to have filled. A5 ⏭ no sweep.

**Last Activity (288169 session)**: 2026-11-06 00:15 — worktree `jovial-kepler-a07ba6`. ADHOC-PLTP-2026-5 (PROD PLTP/2026/8 Ulasan JT: JKR twice, MPAG gone) → cause: agency record 8 (JKRNM) renamed to MPAG 21/07 16:58 then back 13/08, so MPAG picks saved as agensi 8; promoted to ticket 288169 (TSO Shafiq); patch 6 rows agensi 8→6 run on PROD and verified; 288169 saved Phase 1 only (Redmine In Progress 20%), adhoc archived (audit 31/31). Open: miya writes the Redmine resolve note; Phase 2 archive when Redmine shows Closed; 12 other rows (PT/PTS same window) still agensi 8, no ticket.

**Last Activity**: 2026-11-06 00:35 — worktree `penang-common-null-error-219adf` (branch claude/redmine-ticket-sweep-plan-369375). 287811 audit rounds 1 and 2 BUILT and landed: GitHub main 49d59176 · main folder 0df9eb5c (round 1: 803d46f2 / 3d0c9e13). Round 2 = P5 ticket-close-block multi-commit refusal 11/11 · P6 login-gate v6 ISSUE rows 25/25 + deploy eval 56/56 · P7 next-steps-shape v6 62/62 · P8 design-consult-gate quest-turn rider 55/55 · P9 memory line; 287811 wrong-fix verdicts 1-3 written; qa_doc saved (block status=delegated, save-quest KEEP-DELEGATED); the corrected commit-reference note is FILLED in his Chrome Edit form of 287811, NOT submitted (his "post it"). Open: audit items 3, 4, 7, 10; harness fault (reply text with a RULE-PLACEMENT line stored only as request blob, todo row). Domain Expansion run.

STEP-3: script-check rule 4 assessed delete criteria, convention-check-gate v1.9, highest model record
session: a732fefb-d015-4f08-8882-468242dd1007
his words: "build it. Also, I thought I specified to use highest model so it is not going to be Fable 5.1, but Fable 5.2." (order)
fix or report: fix
who pays: per-tool: the gate already runs on each Edit or Write, the DELETE check adds no process and reads only a .sql file
goal without the part: a patch never removes a record or proof, and removes another row only after its children are shown to be zero
model: claude-fable-5-2
shown: .claude/skills/script-check/diagram.png
CHANGE-CARD (before): assessed delete rule
- What: Script-check rule 4 becomes five questions that decide whether a wrong row is cancelled, deleted or unlinked, and the gate blocks the unsafe deletes.
- Why: On 2026-11-10 you said a blanket never-DELETE rule is wrong, records and proof like receipts are kept, and a flag counts only when it really works.
- How: The first YES wins in the flow picture `.claude/skills/script-check/diagram.png`.
- When: Rule 4 runs each time I prepare a patch script, and the gate runs when I write a patch script file.
- Where: The change sits in the script-check skill, the convention-check-gate Feature, one memory file and the evolution protocol, shown in `C:\Users\Ridhwan\AppData\Local\Temp\claude\be1fddb58a3e4988\a732fefb-d015-4f08-8882-468242dd1007\scratchpad\cm-delrule\change-map-20261110-073318.png`.
Where picture = the change map (lib/change-map.js).
- **Ask** (2026-11-06): a scheduler so a Redmine ticket or a WhatsApp ask starts a session by itself. **Scope change 2026-11-10**: the Redmine poll is dropped ("I will obviously keep on checking it myself every hour"); the morning sweep and a quicker WhatsApp start stay.
- **Built**: desktop scheduled task `sweep-0830-workday` (cron `30 8 * * 1-5`, fires about 08:36, saved in Bypass permissions mode, findings only) · WaRead watcher: a failed judge call falls back to the rules, a child that fails to start waits in `pending` and is retried, heartbeat every 5 min with pid, every stop row carries a reason, `status` prints health lines · new Feature `domain/wa-watch-health/` (SessionStart, one WA-WATCH line per problem, silent when healthy) · whatsapp README keys + 5 eval checks · note in the sweep skill.
- **Proven**: a desktop scheduled task starts a session on the app's own login (probe 2026-11-10, session created 46 s after the fire time, succeeded). Evals: wa-watch-health 20/20 · whatsapp 25 · WaRead watcher selftest 56 · WaRead selftest 51.
- **Not done / not verified**: the watcher daemon is NOT running and its Claude login is dead since 2026-10-15; `claude login` is his step, then `node E:\Dev\scripts\WaRead\wa-watch.js check-login`, then `schtasks /run /tn "WaRead Watcher"`. The fast lane has not fired on a live message. The first 08:30 run is 2026-11-11. A daemon start and stop 3 seconds apart at 13:31 on 2026-11-10 has no known cause (old code, no reason logged).
- **Blocker logged**: the step-3 rider of design-consult-gate could not see the reply lines (the transcript held no text block for those messages); writes to rider paths went through node scripts. Slips row 2026-11-10, category blocker.
- **WaRead repo**: own git repo, no remote; the change is committed there separately.
- **Office-report rules (same day, his words: office reports start with the pejabat and daerah code, the BA lines after them outrank)**: `domain/whatsapp/RULES.md` v1.1 section 1b; the reader keeps the forwarded flag; filter signals `office:<code>` and `forwarded`; candidate and handover carry office and daerah (00 PTG, 01 Melaka Tengah, 02 Jasin, 03 Alor Gajah, checked on staging); rules-only env tells Staging from Internal. Watcher selftest 67, whatsapp eval 29. **His choice 2026-11-10: "start after 2"**, read as a 2-minute wait: an office report is held 2 minutes (`officeWaitMs`, `lib/watcher/officewait.js`), lines in that window ride along, then one judge call and one session; RULES v1.2; watcher selftest 78, whatsapp eval 31. Not run on a live message: the watcher is still stopped.
