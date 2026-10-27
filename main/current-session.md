# Current Session

**Last Activity**: 2026-10-28 01:25 — worktree `ticket-286650-quest-188daf` (eSOKONGAN 286650, PROD SPI Dokumen Verifikasi NPE), Domain Expansion, then archived.

## Session Recap (2026-10-27 → 28, worktree "ticket-286650-quest-188daf", 286650)
- 286650: Phase 0 → Rubric + independent audit. Crash is in etanah-pendaftaran (`populateInfo:1546`): after KP "Semak Semula", `nextUrusan` is empty; only crashes since the pendaftaran build of 14/10 (two earlier empty cases did not crash). Handed to Fathimah (Pendaftaran) on Redmine 2026-10-27; block now `status=delegated`. We set % to 50; miya: leave it.
- Built (landed on main via `086ac2cd` → land-on-main, eval 48/48): quest-start-claim sets % done only when the ticket Module is Pelupusan/Awam; quest SKILL hand-over % rule + automatic claim audit (`CLAIM-AUDIT:` line) + BPMN step points to the MLIT modeler as newest design; explain-diagram no Claude fonts + padding; redmine-sync journal fetch retries 3x and never writes an empty History.txt. FLOWABLE-KNOWLEDGE diagnose step 5 (latest model ≠ deployed).
- ProTime 27/10 night run: 261986 removed correctly (only one turn named it, a session report; nothing worked). Left off the plan.
- Open: "system changes run on the highest model" rule not written into CLAUDE.md · child session quest-audit-fixes waits on miya's answer about where system changes run · Phase 0 audit of all Melaka tickets not started.

**Last Activity**: 2026-10-28 01:25 — worktree `protime-weekly-plan-changes-d89526` (ProTime weekly plan, daily runs + skill), revived 2026-10-28 by the PymTime revive handover, Domain Expansion, then archived.

## Session Recap (2026-10-13 → 2026-10-28, worktree "protime-weekly-plan-changes-d89526", ProTime weekly plan)
- Built `domain/protime-plan/` to run every working day: 08:30 morning (settle the previous working day, top up today, plan the week) and 23:00 night (settle today). Windows task `\MemoryCore\ProTime Weekly Plan`, WakeToRun, logon catch-up, retry 30 min x6.
- Settle rules: add worked tickets + the day's adhocs in his wording; remove only PENDING bare-number PLAN entries this script placed and not worked; never touch his own lines; KPI 3 plan tickets a day (finished first); plan vs adhoc by whose fix is in the ticket that day (assist like 283345 = ADHOC); resolve step; an approved day left alone.
- Adhoc wording rule v2 (from his 121 ProTime adhocs, blind-tested on 37 real lines): `<n> - <action>` · `Assist BA - <what>` · `<ENV> (<STATE>) - <title>`; lives in `.claude/skills/adhoc-save/SKILL.md`, built by `protimeLine`, checked by `lintLine`.
- Skill `/protime-plan` (one door, same script as the scheduler; `--rules` prints the rules); eval 112/112; on main since `bdba227e`.
- Handed over 2026-10-20 to session "PymTime password authentication failure": move the feature into PymTime (PymTime ROADMAP Phase P).
- Open: "Staging" vs "Internal" for staging adhoc lines (his ruling); asks never saved as adhoc are only found by `--sessions` (night run cannot title them); a ticket with no commit in our repos counts as his.
**Last Activity**: 2026-10-28 01:05 — session "System Upgrade 23/9/2026" (born 2026-09-23 in worktree `session-naming-format-b88025`, revived 2026-10-27 by a PymTime handover), Domain Expansion, then archived.

## Session Recap (2026-09-23 → 2026-10-28, "System Upgrade 23/9/2026", session naming)
- Built Feature **session-name** (`domain/session-name/`): his first typed message of a new session → one line telling me to rename the session `<D/M/YYYY> - <ticket or 2-4 keywords>` via `set_session_title` self. Format ruled 2026-10-28 ("<date> - <title keyword/ticket number>"), popup "First message only". Child of the `upsm-mode` bundle (no new process), eval 26/26, live fire from main. GitHub `88839abb`, main folder `f038dc1c` via land-on-main.
- Remote Control on for this session (switched from the PymTime session 10:27, 2026-10-27).
- Relayed and NOT acted on: ProTime weekly-plan screen inside PymTime (his PymTime build rule needs his go; belongs to the PymTime project).
- Found: `lib/land-on-main.js` derives main only from an in-tree worktree path, so a build worktree outside OneDrive (the memory rule) points at itself unless `--main` is passed; forge registers a new prompt check standalone although system-rules Rule 7 wants a bundle. Both logged as proposals.

**Last Activity**: 2026-10-28 00:40 — worktree `arabic-command-b8399a` (/arabic: class-along, baris drill + class mode), Domain Expansion.

## Session Recap (2026-10-27 → 28, worktree "arabic-command-b8399a", /arabic)
- Live class 2026-10-27 walked with miya (Lesson 13 ج Exercises 2-4, page 81 ذهب table, Lesson 14 dialogue). Class closed; **next class starts at Lesson 14 · Exercise 1 (answering questions), pages 83-84**. `save-check` PASS.
- Class-word fix: فلاح = petani (not peladang); a child session checked every class-vocab row against all recordings and fixed 4 more (فتاة, زميل, درس, نافذة). Data files only (untracked), VERIFY-LOG rows written.
- Built (miya asked for it here, child session stopped and archived unused): **baris drill mode** (5 class-ayat words; he answers baris + reason number; engine judges both; only class-cited reasons, a `belum` reason never asked) + **class mode** (continue the live class from the class-log stop point, pages mapped to files) + menu of 5 modes, switch by saying a mode name. The 2026-10-27 start-menu merge had never become a commit on main (code sat uncommitted); landed together on main `49cf06b1`, eval 115/115 run in main on real data.
- DE found: main folder held 127 telemetry conflict-copy shards (6 GB) that `git add -A` staged; `.gitignore` rule only matched a one-digit suffix. Widened to `-miyazaki-NN` / `-PJNBRidhwan-NN`; nothing large committed.
- Open: teacher's 2 extra plurals of ضعيف (miya to say them) · Lesson 14 ayat not built (baris and latest-class modes have Lesson 13 only) · `lib/diagram-render.js` looks for Playwright on E: (not connected); worked with `DIAGRAM_PLAYWRIGHT` = npm-cache playwright-core.

**Last Activity**: 2026-10-28 00:15 — worktree `rustdesk-software-visibility-e047d5` (RustDesk blank apps), Domain Expansion.
