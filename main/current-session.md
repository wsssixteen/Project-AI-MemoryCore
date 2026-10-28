# Current Session

**Last Activity**: 2026-10-28 13:40 — PymTime phase 2 (self-check engine) DONE: Fable audit, its 3 majors fixed, committed locally as a68c18c (not pushed); next phase 3

## Session Recap (2026-10-28, session folder "pymtime-password-auth-failure-4a584e" revived, PymTime phase 2)
- **READ FIRST (PymTime)**: the MAIN checkout's `projects\coding-projects\active\PymTime\PROJECT.md` (## Work in progress), then `ROADMAP.md` Phase 2 "Build (2026-10-28)".
- **He picked this session** to continue phase 2 (popup, 2026-10-28); the other PymTime sessions were told to build nothing.
- **Phase 2**: design run (5 readers, designer, 2 reviewers, revision: 31 findings resolved; `E:\Dev\scripts\PymTime\dev\design\phase2-design.json`), then build run (builder, 3 reviewers: 28 findings, fixer: 26 fixed 2 rejected, independent prover).
- **Proof**: self-test 656 of 656 (584 before), breakage table 20 of 20, install sim 30 of 31 (the zip-only row), his 4 real tasks fingerprint-identical, real config.json not written, a real self-check 0.1 s with 0 PowerShell and 0 logins.
- **Fable audit (his popup pick)**: 1 read-only Fable 5.1 auditor: 3 majors (READY despite failed days; a launcher switch re-registering a waiting run; a scheduled check closing an open page) + 12 minors. Fixed by an Opus fixer, proven; later-phase items filed under ROADMAP phases 3 and P.
- **State**: committed `a68c18c` on main in `E:\Dev\scripts\PymTime` (local, not pushed; 5 unpushed commits now). Final proof: self-test 661 of 661, install sim 30 of 31 (the zip row), real tasks unchanged.
- **Found**: his real tasks run FROM this repo (live install): the uncommitted build ran for real at 08:00 (reminder self-check filled the empty Drive link, wrote config.last-good.json, re-created shortcuts) and 09:24 (clock-in OK). PROJECT.md hard rule 10 added. Slips logged: model-tiering/fable-skipped, delegation/kill-rule-too-broad, resource-blindness/live-install-edited.
- **Next**: phase 3 (page rebuild, with the weekly plan card and the Redmine key). Push only on his word. Release gates for phase 5: the zip-only sim row, PROOFS 7 and 8, bundle-smoke step 5b.

**Last Activity**: 2026-10-28 01:25 — worktree `protime-weekly-plan-changes-d89526` (ProTime weekly plan, daily runs + skill), revived 2026-10-28 by the PymTime revive handover, Domain Expansion, then archived.

## Session Recap (2026-10-13 → 2026-10-28, worktree "protime-weekly-plan-changes-d89526", ProTime weekly plan)
- Built `domain/protime-plan/` to run every working day: 08:30 morning (settle the previous working day, top up today, plan the week) and 23:00 night (settle today). Windows task `\MemoryCore\ProTime Weekly Plan`, WakeToRun, logon catch-up, retry 30 min x6.
- Settle rules: add worked tickets + the day's adhocs in his wording; remove only PENDING bare-number PLAN entries this script placed and not worked; never touch his own lines; KPI 3 plan tickets a day (finished first); plan vs adhoc by whose fix is in the ticket that day (assist like 283345 = ADHOC); resolve step; an approved day left alone.
- Adhoc wording rule v2 (from his 121 ProTime adhocs, blind-tested on 37 real lines): `<n> - <action>` · `Assist BA - <what>` · `<ENV> (<STATE>) - <title>`; lives in `.claude/skills/adhoc-save/SKILL.md`, built by `protimeLine`, checked by `lintLine`.
- Skill `/protime-plan` (one door, same script as the scheduler; `--rules` prints the rules); eval 112/112; on main since `bdba227e`.
- Handed over 2026-10-20 to session "PymTime password authentication failure": move the feature into PymTime (PymTime ROADMAP Phase P).
- Open: "Staging" vs "Internal" for staging adhoc lines (his ruling); asks never saved as adhoc are only found by `--sessions` (night run cannot title them); a ticket with no commit in our repos counts as his.

**Last Activity**: 2026-10-28 01:24 — session "PymTime attendance scheduler planning" (main checkout, born 2026-08-26, the September PymTime session; reopened 2026-10-27 by mistake), Domain Expansion, then archive.

## Session Recap (2026-10-27 → 28, "PymTime attendance scheduler planning", session revival)
- Reopened by mistake: he took this for the session-naming session. Found the real one ("System Upgrade 23/9/2026"), unarchived it, sent "/remote-control", then on his correction the full handover of the two messages misrouted here (2026-10-27 08:57 "/remote-control" from the 286650 session; 08:58 the weekly-plan relay from the "Protime weekly plan" bridge). Rule written: `.claude/auto-memory/feedback_session_revive_handover.md` + index line; slip `handover` logged.
- 2026-10-28: found the 5 other PymTime / ProTime sessions; handover + "/remote-control" sent to each: 4 delivered ("PymTime password authentication failure", "Protime weekly plan changes", "Protime scheduler automation", "Routines scheduler and Weekly Planning priorities"); "Protime weekly plan" unarchived but blocked by a workspace trust prompt (his click). He picked "PymTime password authentication failure" for phase 2 (its reply: the weekly plan is ROADMAP Phase P, D11 decided 2026-10-23 = inside v18).
- Archive verdict given: weekly-plan-changes, scheduler-automation, weekly-plan = clean (0 commits off main), can run DE; routines-scheduler has 2 commits of 2026-10-05 (plan order by tracker) not on main, superseded by main's `563ee4e2` tracker-tier order; he rules keep or drop.
- PymTime state unchanged: v17, HEAD `a66843b`, 4 commits after v16 unpushed; no build here (his 2026-09-23 rule). v16 zip stays unsent.
- DE found the shared main index holding 377 staged OneDrive conflict copies (127 telemetry shards = 6 GB); unstaged before the commit, nothing large committed.
- Nothing pending in this session; archive after DE.

**Last Activity**: 2026-10-28 01:50 — session "27/10/2026 - Requirement Documentation" (worktree `melaka-requirements-index-123431`), Domain Expansion, then archive.

## Session Recap (2026-10-27 → 28, "Requirement Documentation", requirement-index)
- Tool `quest/requirement-index.js` (2,083 Melaka Requirement tickets): 11 blind rounds, 196 tickets, each keyed by a Sonnet reader that never saw the tool. All rounds: top-1 135/174, top-3 151/174, "none" kept quiet 55/56. Eval 50/50.
- Kinks fixed: alter/patch/cancel = not needed · ticket that is itself a requirement · Semua Urusan rows earn the urusan bonus · screen hint from "Tugasan Semasa:" and the "Tugasan involved" list · STAGING-style tags never the urusan · a ticket with no module takes its urusan's module (×1.1; a read module stays ×1.3, 265109's fee spec lives in Sokongan).
- miya corrected the goal (2026-10-28): it is an INDEX: narrow to the likely requirement, then open it and check the ask; also answers "what is the requirement for X" at once; a Semua Urusan hit is a right pointer. Written into the tool header; slip `build-missed-requirement` logged in detail.
- Built **system-design Rule 17 diagram at birth**: Tool `lib/diagram-census.js` (`--check <part>`, `--missing`; eval 26/26), `component-birth-gate` needs `diagram:` in a new Feature README (eval 11/11), `explain-diagram` step 4 exception. First diagrams in git: `quest/requirement-index.diagram.png`, `lib/diagram-census.diagram.png`. Census: Features 0/97 · Skills 0/81 · Tools 2/13.
- Open (miya: later): tugasan codes not expanded (257569 "KKMMKN" misses 221967/220410) · NUKE-MARKER for requirement-index (miya: log only) · no unused Task-folder tickets left for another blind round.

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
