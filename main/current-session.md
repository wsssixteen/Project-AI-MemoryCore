**Last Activity (Arabic class session)**: 2026-11-11 00:08 — worktree `arabic-1b6669`. Arabic class 2026-11-10, Lesson 15: dialogue + Exercises 1 to 6 worked, class closed (stopped at Exercise 6; next class starts Exercise 7, page 90). "Kalian" habit saved to class-vocab. New class-along breakdown format (one table per sentence, read right to left, roles from the class) in the arabic skill rule 3, landed main 78628d62. Weekly Arabic plan (Mon 5 words · Tue class · Wed baris · Thu rest · Fri fi'il + one exercise) and a 9-verb fi'il list written to the arabic journal Notes; the fi'il list is not confirmed as the teacher's list. Open: he triggers `/arabic` himself, no reminder exists; he is thinking of his own app for reminders; the Friday fi'il drill is not in the engine yet.

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

STEP-3: patch tickets: note generated, every SET column reasoned (288974)
- session: jovial-kepler-a07ba6 (subagent of the 288974 session)
- his words: "straight away built this so that in the future, the types of patching will always include these datas, the things we've patched. It should cover all of the patching tickets." (order)
- fix or report: fix
- who pays: on-demand: 1 node call per patch note, under 1 s; per-turn: CHECK 8 runs inside the existing patch-script-gate Stop hook, no new registration
- goal without the part: the note is typed from memory and a column copied from a precedent ships with no reason, as on 288974
- cause step: (A) quest 6c handover, the patch-done note had no generator; (B) script-check / Stage-Match step 3, no reason asked per SET column
- change lines: ticket-close-block.js +189 (`--patch`) · patch-script-gate hook +38 (CHECK 8) · script-check rule 9 · quest 6c + step 3 · prefill Step 4
- new parts: 0 (3 eval fixture files)
- model: claude-fable-5-2
- shown: domain/ticket-close-block/diagram.png

CHANGE-CARD (after): patch note generated
- What: The patch-done note for Redmine is now printed by `ticket-close-block --patch` from the patch script and the replaced files, and script-check rule 9 asks one reason for every column a script sets and every row it deletes.
- Why: On 2026-11-11 the 288974 script set Batal and removed a link that the BA never asked for, and the typed note then said the linked permohonan was not changed.
- How: The generator reads each UPDATE, DELETE and INSERT into one line per thing changed under its ID Permohonan as in `domain/ticket-close-block/diagram.png`, and the patch-script-gate blocks a reply whose script has a column with no reason line.
- When: The note is generated at the handover step of a patch ticket, and the reason check runs when a reply hands over a patch script.
- Where: The change sits in `domain/ticket-close-block/`, `domain/patch-script-gate/`, the script-check, quest and redmine-phase1-prefill skills and one memory file, shown in `C:\Users\Ridhwan\AppData\Local\Temp\claude\75ad8d85f2656ad6\c845be62-69e0-4694-8a3c-0eb7b43eb78f\scratchpad\change-map-20261111-064555.png`.

## system-change step 3 (2026-11-11, 242553 next-tugasan rule) — waiting for miya's nod

STEP-3:
session: adhoc-session-standby-c1d1d0 (242553 correction)
his words: "Please audit yourself on why this happens and how in a single sentence to explain to me for the why & how you're going to fix this in accordance to our system's law." (order)
fix or report: fix
who pays: on-demand: no process; about 110 more words each time bpmn-check loads, 50 each time explain-diagram loads, 20 on every ticket (the quest skill loads on every ticket)
goal without the part: Without J12 a correct next-tugasan answer depends on my remembering to open the called sub-flow, which failed on 242553, and without the explain-diagram row the drawing step never reads the not-verified law.
model: claude-fable-5-2
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\1c6170c08830080a\275d3684-1025-4c82-ab86-333702e98345\scratchpad\242553\change-flow.png

CHANGE-CARD (before): 242553 next tugasan after a step
- What: The bpmn-check skill gains one row (J12) that makes me open every called sub-flow and list its tugasan and parallel branches before I name what comes after a step, the quest BPMN row gains one sentence that sends a flow question there, and the explain-diagram skill gains one row that puts the words "not verified" on any box or arrow I did not check.
- Why: On 2026-11-11 (ticket 242553) I told the BA that one tugasan follows 29.1 when the called sub-flow MLK_PLP_SUB_UPN holds 9 tugasan and 3 parallel gateways, I read the flows with my own pattern that dropped every flow carrying a condition, and I drew a never-run step as fact.
- How: A flow question goes from the quest BPMN row to the bpmn-check skill, whose validator parser reads every flow, then the changed step lists each called sub-flow before the picture is drawn, as shown in change-flow.png .
- When: On ask only, each time a reply names the tugasan that follow a step or draws a picture that states facts, with no process and no hook.
- Where: Three skill folders (.claude/skills/bpmn-check/, .claude/skills/explain-diagram/, .claude/skills/quest/) and one new test in domain/bpmn-check/, as shown in change-map-20261111-061832.png .
Where picture = the change map (lib/change-map.js).


## 242553 note (2026-11-11 ~14:40, per miya "take note on this first")
- miya sent Mira the FIRST diagram at 13:58-14:01 (it says "satu tugasan sahaja selepas 29.1" and "Tiada tugasan serentak", both wrong). The corrected picture (delivery tugasan serentak, back-to-8.0 not tested) has NOT been sent to Mira.
- Mira 14:35: "skrg Mira tgh keliru dgn requirement BA, sbb ayat dia nanti id B tu kena buat Laporan Tanah balik kalau id A tolak" — she is confirming with the BA.
- Verified on MLIT PT v8 (flow read, not run): at B's 8.0 Perakuan JTLTPM the first gateway is "Pindaan?". Ya -> Jenis Pindaan: Siasatan Tanah -> 5.0 Penyediaan Laporan Tanah PJTPLT (MLK_TKL_ST, teknikal) -> back to 8.0; Pelan Mesyuarat -> 6.0; Jabatan Teknikal -> Jabatan Teknikal 3. Tidak -> Keputusan awal: Teruskan -> JKKL? -> 23.0 Rencana JKKL or 14.0 Risalat MMKN (NO Laporan Tanah); Tolak Ringkas -> Penyediaan Minit Bebas; Tangguh -> 28.1.
- So "A Tolak -> B buat Laporan Tanah balik" = officer picks Pindaan Ya + Siasatan Tanah at B's 8.0, not Teruskan. The diagram box "Teruskan Permohonan: Laporan Tanah dan seterusnya" is wrong and must change.
- Open: send Mira the corrected picture once the BA answers.

system-change step 4 (242553 rule change): eval.js E4 + explain-diagram.eval.md F7 written; the 3 SKILL.md edits (bpmn-check J12, explain-diagram row, quest line 741) are blocked by the design-consult-gate step-3 rider (reply text never reaches the transcript); waiting for miya's [skip-step3:] token. Then step 5 onward.


## system-change step 3 (2026-11-11) — gate fix, his nod: "both"

STEP-3: build-turn rider reads the STEP-3 block
session: 275d3684-1025-4c82-ab86-333702e98345
his words: "I've asked before why do we need this token in the first place?" (question)
fix or report: fix
who pays: per-tool: the rider runs on every Edit or Write of a hook, skill, Feature, rule or memory file; one more read of current-session.md
goal without the part: Without it an edit he ordered is denied every time my reply text is not in the transcript, and only his skip token gets it through.
model: claude-fable-5-2
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\1c6170c08830080a\275d3684-1025-4c82-ab86-333702e98345\scratchpad\242553\gate-flow.png
cause step: domain/design-consult-gate/step3-check.js:riderCheck · change: 5 lines
new parts: 0

CHANGE-CARD (before): build-turn rider reads the STEP-3 block
- What: The build-turn rider of design-consult-gate also accepts its three lines (his words, cause step, new parts) from this session's STEP-3 block in `main/current-session.md`, not only from my reply text.
- Why: On 2026-11-11 the rider denied one build he had ordered six times because my reply text written before an Edit was not in the session transcript, and only his skip token could pass it.
- How: An edit he ordered reaches the rider, which reads my reply of this turn plus this session's STEP-3 block and then allows or denies as before, as shown in gate-flow.png .
- When: On every Edit or Write of a hook, skill, Feature, rule or memory file, inside the existing hook call, with one more file read and no new process.
- Where: One function in `domain/design-consult-gate/` (step3-check.js riderCheck) and eight new fixtures in its eval, as shown in change-map-20261111-072932.png .
Where picture = the change map (lib/change-map.js).


## system-change step 4 (2026-11-11, session 275d3684) — 242553 rule change build

STEP-3: 242553 next-tugasan rule (bpmn-check J12, explain-diagram row, quest pointer)
session: 275d3684-1025-4c82-ab86-333702e98345
his words: "I want to build but please take note on this first" (order)
fix or report: fix
who pays: on-demand: no process; about 110 more words when bpmn-check loads, 50 for explain-diagram, 20 per ticket for quest
goal without the part: Without J12 a next-tugasan answer depends on remembering to open the called sub-flow, which failed on 242553.
model: claude-fable-5-2
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\1c6170c08830080a\275d3684-1025-4c82-ab86-333702e98345\scratchpad\242553\change-flow.png
cause step: .claude/skills/bpmn-check/SKILL.md:Step 1 judgment table (no row for naming the next tugasan) · change: 9 lines
new parts: 0

CHANGE-CARD (before): 242553 next tugasan after a step
- What: The bpmn-check skill gains one row (J12) that makes me open every called sub-flow and list its tugasan and parallel branches before I name what comes after a step, the quest BPMN row gains one sentence that sends a flow question there, and the explain-diagram skill gains one row that puts the words "not verified" on any box or arrow I did not check.
- Why: On 2026-11-11 (ticket 242553) I told the BA that one tugasan follows 29.1 when the called sub-flow MLK_PLP_SUB_UPN holds 9 tugasan and 3 parallel gateways, I read the flows with my own pattern that dropped every flow carrying a condition, and I drew a never-run step as fact.
- How: A flow question goes from the quest BPMN row to the bpmn-check skill, whose validator parser reads every flow, then the changed step lists each called sub-flow before the picture is drawn, as shown in change-flow.png .
- When: On ask only, each time a reply names the tugasan that follow a step or draws a picture that states facts, with no process and no hook.
- Where: Three skill folders (.claude/skills/bpmn-check/, .claude/skills/explain-diagram/, .claude/skills/quest/) and one new test in domain/bpmn-check/, as shown in change-map-20261111-061832.png .
Where picture = the change map (lib/change-map.js).

CHANGE-CARD (after): 242553 rule change + step-3 gate fix
- What: The bpmn-check skill now has row J12, the quest BPMN row points a next-tugasan answer to it, the explain-diagram skill marks any unchecked fact on a picture, and the step-3 gate also reads this session's STEP-3 block.
- Why: On 2026-11-11 (ticket 242553) I named one tugasan after 29.1 when the called sub-flow holds 9, drew a never-run step as fact, and the step-3 gate then blocked his ordered build six times.
- How: A flow question goes from the quest row to bpmn-check J12, which opens every called sub-flow before the picture is drawn, as shown in change-flow.png .
- When: On ask for the skills, and inside the existing gate call on every edit of a hook, skill, Feature, rule or memory file.
- Where: Three skill folders and two Feature folders, landed on main as f669e735, as shown in change-map-20261111-073840.png .
Where picture = the change map (lib/change-map.js).
