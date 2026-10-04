# Boot batch 2 — design record (2026-10-05)

> Mechanical copy of Workflow run `wf_923b9eaf-18e` (18 agents, read-only, 2026-10-05 01:33–02:14): 8 fact readers (sonnet), 9 designers and 1 cross-cutting critic (session model).
> Companion to `main/handoff-2026-10-05-boot-structure-audit.md`. NOTHING here is built. NOTHING here is ruled by みや yet: section 1.5 lists the four decisions that are his.
> Controller spot-checks done on disk before saving: the forge install blocker (`core/forge.js:399-412` + `domain/hook-syntax-check/cache.json` names all six loose boot hooks) ✓ · `lib/watch.js` `tick` steps the countdown once per boot ✓ · `.claude/hooks/ticket-gate.js:212-214` exits silently for a quest past Phase 0 ✓. Every other file:line below is the agents' claim; re-check before building (the critic itself says line numbers may have moved).

## 1. The critic (read this first)

### 1.1 Ticket board: which design

Choose Design A (SIGNAL-FIRST, live fetch at the first ticket/board signal) as the base, with five amendments, three taken from Design B. Paths below are relative to C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore.

WHY A, AGAINST THE OWNER'S TWO REQUIREMENTS
- Requirement 1 (must not load on other-project days): A runs nothing at boot. B still prints a ticket line and starts a silent Redmine sweep at every boot, in every session. That is "loading", and the agreed plan in main/handoff-2026-10-05-boot-structure-audit.md section 5 says "Off boot".
- Requirement 2 (a briefing never omits an open ticket): A reads Redmine at the moment ticket work starts, so the list is live. B injects a saved copy; its own scenario "first prompt IS a ticket number, cache from yesterday" builds the first ticket reply from yesterday's board. A labelled old board can still omit a ticket.
- Simplicity: B needs three modes in one file, a detached process started from a bundle child, a log used as lock and as "already shown" memory, and an env kill switch. A is one predicate, one guard, one fallback.
- B's one real advantage (a new Critical ticket shows at the next boot) is offered to the owner as decision 1 option B.

AMENDMENTS (required, not optional)
1. Signals: copy ticket-gate's three tests exactly (.claude/hooks/ticket-gate.js:186 prefixed number, :188 retrieval phrase, :194-203 bare number matching a qa= block), plus '#NNNNN', the board asks, and the three briefing triggers in Feature/Session-Briefing-System/session-briefing.md:11 ("briefing", "where were we", "what's our status"). A's narrow list leaves the briefing triggers out; a briefing ask IS the moment of need. Do not add the bare words "ticket" or "quest". If lib/turn-context.js attribute() is reused (B's idea, adds ADHOC/ALTER ids), accept only qa_source 'named' or 'named-no-block': lines 68-69 return the top active quest for ANY prompt.
2. Two signal classes. An ASK (board or briefing words, or --now) always fetches live and prints. A TICKET mention prints once per session-day. This closes A's "compaction" hole for the case requirement 2 cares about: a briefing composed after the block left context.
3. The parity fixture (A's F21, B's T6) must be pinned to ticket-gate's SIGNAL tests, not to its output. ticket-gate exits silently for a quest past Phase 0 (ticket-gate.js:213-214), which is the everyday case (continuing a ticket in flight). Fixture: an active.txt block at phase=1 status=active, prompt names it, surfacer must print.
4. .claude/CLAUDE.md boot step 5 (lines 16 and 18: "read quest/active.txt", quest reconciliation autoscan) and session-briefing.md lines 74 and 119 change in the SAME commit that removes the boot entry. A treats this as an owner option; it is load-bearing. If the hook leaves boot and that prose stays, the model composes ticket status from a Read of active.txt, which is the founding slip (open-quest-surfacer.js:8-14: Read cut the file at line 309 of 640).
5. Two-step cutover. Add the bundle child while the SessionStart entry stays. Prove in one real session that the last row of the last table reaches context through the merged bundle output. Only then remove the boot entry. Take from B: the goal measure (every session with a ticket signal has a printed or fallback row in the Feature log) and the board fetch when active.txt has zero open blocks (today lines 136-139 return before the board).

Verified while checking: the three current upsm-mode children only print advisory text (mode-detector.js:97, quest-active-grounding.js:112, handoff-load.check.hook.js:61), so no sibling block can drop the board in lib/dispatch-hooks.js:124-141. The dispatcher waits for all children (line 108) and kills a child at 30 s (line 82); today's board call has a 30 s timeout (open-quest-surfacer.js:65), so A's 20 s cap is needed, and quest/redmine-board.js:121-131 has no HTTP timeout of its own.

### 1.2 Conflicts between the designs

1. lib/audit-briefing.js is edited by two designs on the same lines. system-audit adds a --full spawn and 'structure:' rows in the CLI block (lines 107-112). system-check-trigger adds rows after lines 56 and 92, a header suffix at line 99, a field in the log row at line 111, and a new lib/audit-briefing.eval.js. system-audit puts its screen fixture (G14) in a different eval file. Fix: one edit pass, one eval file (lib/audit-briefing.eval.js), pinned before either change.
2. Session close gets new lines from several designs at once: 'structure:' rows (system-audit), a header suffix plus two rows (system-check-trigger), the overdue-watch rows that claude-md-watch now relies on as the only full reminder (audit-briefing.js:62 and :92), a new --check command at Domain Expansion step 12.5 (boot-required-read-gate), and the adhoc re-audit. Nobody wrote the combined screen. Added wait at close: the system-audit spawn (4-5 s warm, 22.7 s worst telemetry row per that design) plus the CLAUDE.md tree walk (0.7-9 s per that design).
3. Name clash on 'system-audit'. system/registry.jsonl:67 already holds a part named system-audit, kind skill (the audit screen), and its own row records the clash with the hook. Installing the hook with the default name creates domain/system-audit/ for the HOOK, while structure ruling 2 (system/INDEX.md:53) gives every skill a Feature folder of its own name. system-check-trigger's 'forge refine system-audit' resolves both the skill folder and the loose hook (core/forge.js:284-287). Decide before install: one Feature folder holding hook + skill + lib/audit-briefing.js (coherent, since the design runs the structural audit inside the screen), or install with --name (forge.js:367).
4. Feature/Domain-Expansion/expansion-protocol.md is re-pointed by three designs: line 67 and step 7.4 (system-audit), step 7.4 lines 170-174 (system-check-trigger), line 326 (boot-required-read-gate). Two of them add a sentence to the same paragraph.
5. .claude/CLAUDE.md 'v1.79' is claimed by three designs: system-audit (lines 119 and 121), evolution-check-trigger (line 131), open-quest-surfacer (lines 16 and 18). One version stream: either one combined entry or 1.79 / 1.80 / 1.81 in build order, each through the domain/claude-md-watch pipeline.
6. system/evolution-protocol.md is re-pointed in opposite directions. boot-load-verification rewrites lines 15 and 73 to name evolution-check-trigger.js. evolution-check-trigger deletes that hook and turns lines 15-19 and 73 into a tombstone. system-check-trigger also edits line 54. The tombstone wins; drop boot-load-verification's edit.
7. system/enforcement-INDEX.md line 29 is reworded by two designs (boot-load-verification, evolution-check-trigger) and line 15 by two (boot-load-verification, boot-required-read-gate). One pass.
8. .claude/skills/system-check/SKILL.md lines 20, 35, 45 and 113-114 are edited by both evolution-check-trigger and system-check-trigger, each with its own 'forge refine system-check'. Build them as one change.
9. .claude/settings.json SessionStart array: seven designs remove or re-point entries using today's line numbers, and forge install rewrites the whole file (core/forge.js:444). Each design's count is relative to today ('10 to 9', '139 to 138'). Combined result: 10 scripts become 4 (5 if boot-load-verification stays). Build serially on one branch.
10. Watch rows. system-check-trigger says one watch for the whole batch. The session-close gate requires one watch row per edited file under domain/, lib/, core/, .claude/hooks/ (domain/de-close-gate/de-close-gate.check.hook.js:149-168, fix text at :244 says 'one per file'). Batch 2 therefore adds ten or more watches. Until claude-md-watch's short form exists, each adds about 500 characters to every boot (lib/watch.js:55-60 prints 4 to 5 lines per watch).
11. The same question is asked three different ways: evolution-check-trigger and system-check-trigger delete their script without installing it; boot-load-verification installs, deregisters and keeps a dormant folder. One owner decision, one treatment.
12. boot-load-verification's fixtures F2, F3 and F5 pin CLAUDE.md's boot paths from inside a folder that the same design plans to delete later. F3 (each boot path exists) is boot-required-read-gate's job already. Put the boot-order pin in boot-required-read-gate's eval.
13. Install blocker stated differently. boot-required-read-gate's design says nothing blocks its install. Verified false: domain/hook-syntax-check/cache.json line 1 names .claude/hooks/boot-required-read-gate.js and the five other loose hooks (grep on the main checkout and on the worktree copy), and core/forge.js:399-412 refuses when a .json under domain/ names the old path. Four other designs propose the same one-line fix at forge.js:403. Build it once, first.
14. lib/observatory.js is edited by three designs (member lists at lines 944, 948, 950; an export at 1264). If boot-load-verification is deleted instead of parked, its name at line 944 must go too, or line 959 reports a stale member.
15. The two surfacer designs attach to the same bundle the same way (4th child of domain/bundles/upsm-mode.json) but disagree on the SessionStart entry (A removes it, B keeps it as a launcher) and on what CLAUDE.md step 5 says. They are alternatives; only one may be built.
16. system-audit and boot-required-read-gate leave a gap between them. Once boot-required-read-gate is off boot, system-audit's INV-6 (system-audit.js:317-342) is the only boot-time CLAUDE.md pointer check, but the new fingerprint does not include .claude/CLAUDE.md or system/system-architecture.md, although CHECK 5 reads both (lines 186 and 216-226). A CLAUDE.md change made by script is then seen by neither until session close. Add both files to the fingerprint (two more stat calls).
17. Stale facts in the designs. Three designs report this worktree lost its git registration. Verified now: 'git worktree list' on main shows .claude/worktrees/new-session-77cffa at 0fed42c6, locked, status clean; main is also at 0fed42c6, two commits past 6beed4ba. Line numbers quoted in the designs should be re-checked before building.

### 1.3 Rule violations per design

1. open-quest-surfacer Design B: keeps boot work (a line plus a background Redmine sweep in every session). Against system-design Rule 8 and the agreed 'off boot'. Its log doubles as lock and as 'already shown' memory, so the log's retention rule would change behaviour. It adds an env kill switch nobody asked for.
2. open-quest-surfacer Design A: no goal measure (monitoring). It logs fires but nothing says whether 'no briefing omits a ticket' was met; take B's measure. The narrow signal list omits the briefing triggers of session-briefing.md:11. The parity fixture is pinned to ticket-gate's output, which is silent past Phase 0 (ticket-gate.js:213-214). The CLAUDE.md step-5 change is treated as optional.
3. Both surfacer designs and boot-required-read-gate: system-rules Rule 7 asks to multiply per-prompt and per-tool costs by the real count. None does. By the designs' own figures: +1 node process on each prompt (about 60 a day) and +1 on each Edit/Write (163 bundle fires since 2026-10-04) replace work done at about 17 boots a day. Process count is roughly unchanged; only the wait moves.
4. system-audit: the 'install unchanged' step is not behaviour-neutral. After the move the registered name becomes 'system-audit.hook' (system-audit.js:101) while SELF_NAME stays 'system-audit' (line 50), so CHECK 1 (line 192) prints a false ghost, and CLAUDE.md:119/121 produce a false doc-drift line (lines 162-165, 217). The design knows and lands install + change together; that is the only safe order. The fingerprint omits two files the audit reads (see conflicts).
5. boot-required-read-gate: (1) its install would be refused today (blocker missed). (2) system-rules Rule 1, inventory first: .claude/hooks/claude-md-edit-guard.js already fires exactly when CLAUDE.md is edited (settings.json:262; path test at claude-md-edit-guard.js:21-25 and :45-46). The design adds a child that starts on every Edit/Write instead and does not weigh that sibling. (3) The 'linked file moves' half of the agreed plan is a prose step at Domain Expansion 12.5. The main mover for the next 53 installs is forge itself, and forge.js:394 only reports full-path mentions; bare names such as `system-audit.js` in CLAUDE.md are what boot-required-read-gate.js:62 extracts.
6. evolution-check-trigger: retired without being installed first (letter of 'install first, then change'; system-rules Rule 3 allows delete plus a one-line tombstone, so this is the owner's call). Only 18 adversarial scenarios; system-design Rule 12 sets a floor of 20. Skill wording changes with no eval home (Rule 6 v1.2 needs a fire and effect check or a skip token). Forge has no retire verb (core/forge.js:497-501), so system/registry.jsonl gets no row for the retirement.
7. system-check-trigger: retired without install (same point). 'One watch for the whole batch' breaks de-close-gate C5. Its goal measure is written into another Feature's log (domain/de-close-gate/log.jsonl via audit-briefing.js:111); existing practice, but name it in the README.
8. adhoc-lifecycle: no rule broken on install or registration. Scope goes beyond 'off boot': it edits quest/archive-quest.js, which is on the ticket Phase-2 path (video prune at lines 242-252), and it moves folders in the owner's Tasks folder without asking. Five owner questions, two of them outside batch 2 (61 ticket folders; the parked todo 9g).
9. boot-load-verification: goes past the agreed plan (handoff section 5: 'Decide together with the two boot modes'). Leaves a dormant Feature folder where Rule 3 says delete and tombstone. Its main evidence (28 percent of fires were mid-session repeats, so 'wrong moment') is not proven harmful: after a compaction CLAUDE.md is reloaded by the harness but the other three boot files are not, and this banner is the only thing that asks for them again. The script itself only prints (boot-load-verification.js:14-27); it checks nothing, as the design says.
10. claude-md-watch: compliant. One spec change to name in its README: the per-watch revert line leaves boot and stays only in 'node lib/watch.js check'.
11. All designs: none adds a standalone UserPromptSubmit or Stop registration. All state a rollback. All hook-file changes are live only after main is fast-forwarded, because hooks run from the main checkout.

### 1.4 Build order

| # | Script | Why here | Needs his decision |
|---|---|---|---|
| 1 | core/forge.js (shared pre-step, not a boot script) | Every remaining 'forge install hook' is refused today: domain/hook-syntax-check/cache.json names all six loose boot hooks and forge.js:399-412 counts a .json under domain/ as code. One condition at forge.js:403 plus one fixture in core/forge.eval.js. Run forge with --root on the branch being built: its ROOT falls back to CLAUDE_PROJECT_DIR (forge.js:33-35). Nothing the owner sees. | no |
| 2 | claude-md-watch, commit 1 (real eval, README footprint and retention keys) | Finishes its install. No behaviour change. Its eval today has a stub fixture, so the change in the next step would have nothing to be judged against. | no |
| 3 | claude-md-watch, commit 2 (boot prints a count and the 3 oldest; countdown steps once a day) | First real change because every later step must add watch rows (one per edited file, de-close-gate C5) and each row costs about 500 boot characters until this cap exists. Also the largest single cut: about 15,400 characters. It changes the boot text format, so decision 4. | YES |
| 4 | lib/audit-briefing.eval.js (pin today's session-close screen) | Two later steps change lib/audit-briefing.js and the session-close gate depends on its log row (de-close-gate.check.hook.js:147). Pin the five blocks and the log row first. No behaviour change. | no |
| 5 | system-check-trigger + evolution-check-trigger (one commit) | Same skill file, same protocol file, adjacent settings.json entries, same observatory member lists. Both are silent at boot until 2026-10-22, so boot looks the same; the session-close screen gains 'last system check N d ago'. Fix evolution's scenario count to 20. Delete or park is decision 2. | YES |
| 6 | boot-required-read-gate (install, then bundle child + --check) | Before any CLAUDE.md edit in this batch, so the next CLAUDE.md change is its live test. Needs the forge pre-step. Note-only, as today; removes two boot lines; nothing else he sees. Move the boot-order pin (F2) into its eval. | no |
| 7 | system-audit (install + change in one fast-forward; structure rows in the session-close screen) | After the two steps above because it edits lib/audit-briefing.js and CLAUDE.md lines 119 and 121 again. Add CLAUDE.md and system-architecture.md to the fingerprint; settle the Feature name clash. Matches his verdict ('when a hook file or settings.json changed, and at Domain Expansion'). Defaults taken: one boot line only while a hook-wiring problem is open; the six non-hook checks run at session close. | no |
| 8 | adhoc-lifecycle, part 1 (off boot: remove the entry, delete the hook and its tracked guard file) | Silent on normal boots already; the guard file dirties main every week (git status on main shows it modified). No dependency on other steps. | no |
| 9 | adhoc-lifecycle, part 2 (archive at close: skill section, audit check, video guard in quest/archive-quest.js) | Moves folders in his Tasks folder and touches a script on the ticket close path. Keep videos by default (an adhoc has no Redmine copy). Decision 3. | YES |
| 10 | open-quest-surfacer, step 1 (install unchanged) | Gives it a home, a goal and a log before anything changes. Needs the forge pre-step. | no |
| 11 | open-quest-surfacer, step 2 (signal path added to the upsm-mode bundle while the boot entry stays) | Overlap on purpose: one real session must show the last board row reaching context through the merged bundle output, and the first-prompt wait measured, before boot is switched off. Cost during overlap: the board prints a second time once per session-day. | no |
| 12 | open-quest-surfacer, step 3 (remove the boot entry + CLAUDE.md step 5 + session-briefing.md, one commit) | Last active build: it carries the biggest risk to ticket work, and it wants the watch cap, the forge fix and the CLAUDE.md edit check already in place. Changes what the briefing shows. Decision 1. | YES |
| 13 | boot-load-verification | Not built in batch 2 unless he says so. The handoff ties it to the two-boot-modes ruling; the gain is 0.39 s and 349 characters. If he chooses retirement: fix domain/observatory/observatory.eval.js:158 first (it names the old path, verified), delete with a tombstone, drop the name at lib/observatory.js:944. Decision 2. | YES |

### 1.5 Decisions that are みや's

**Decision 1. When you open a session and your first message is not about tickets, what should Ruri know and say about your tickets?**

- A. Nothing loads. The briefing shows one row: 'Quest status: not loaded. Name a ticket or say board.' The live board loads the moment you name a ticket, say 'board' or ask for a briefing (one wait of 5 to 13 seconds). When it loads in the middle of a session you see one line (open count, urgent tickets); the tables come when you say 'board'.
- B. One line at every boot from a saved copy, with its age ('Tickets as of 09:12: 14 open, 1 urgent'). No wait. Redmine is called silently in the background at every boot, also on other-project days, and the line can be old.
- C. Keep today's full board at every boot (5 to 13 seconds and about 7,400 characters, every session).

Recommended: A. It is what you asked for: nothing about tickets on other-project days. The board is read from Redmine at the moment ticket work starts, so it is never an old copy. The price: a ticket assigned to you while you are in a non-ticket session shows only when you next name a ticket or say 'board'. Your SLA is in hours (Critical 1, High 6), so this is yours to weigh; B closes that gap at the cost of loading at every boot.

**Decision 2. Three small boot scripts have no job left at boot: the evolution-check reminder, the system-check reminder, and the 'required reads' banner (a second copy of the boot list in CLAUDE.md). What happens to them?**

- A. Delete the two reminders now (their job moves into the session-close audit screen and the monthly system check; git keeps the files). Leave the 'required reads' banner as it is until the two boot modes are decided.
- B. Delete all three now.
- C. Install each as its own Feature folder first, then switch it off and keep the folder (your 'install first' rule to the letter).

Recommended: A. The two reminders printed at 141 and 175 boots (per the designs' telemetry counts) before anyone acted; the audit screen you already read at session close is where they get acted on. The banner saves only 0.39 s and 349 characters, and after a context compaction it is the only thing that asks for the other three boot files again. There is no data showing one channel is as reliable as two, and the handover already tied it to the boot-modes decision. C keeps your rule literally but leaves three switched-off folders.

**Decision 3. When an adhoc is finished, should its Task folder move to Archive by itself?**

- A. Yes. The moment Ruri writes a closing status (answered, resolved, owned elsewhere, ticketed), the folder moves. Videos inside are kept. Ruri shows you the 9 old leftover adhoc folders and moves the ones you tick.
- B. Only when you say 'close adhoc X'. Ruri lists leftovers but never moves a folder on its own.

Recommended: A. You asked why there are still many task folders: the old script only listed, it never moved. An adhoc still waiting on someone stays open, so its folder stays. The move is a rename and can be undone. Videos are kept because an adhoc has no copy on Redmine.

**Decision 4. The change-watch list is about 160 lines at every boot (32 open watches). What should boot show?**

- A. A count, the 3 oldest, and where the full list is: 5 lines, whatever the count. 'Overdue' is counted in days, not in boots.
- B. The count only: 1 line.
- C. One short line per watch: 33 lines today, and it grows on busy days.

Recommended: A. 31 of 32 watches read 'overdue' after two days only because the counter steps at every boot (the design counted about 21 boots in 15 hours on 2026-10-04; lib/watch.js:64-67 steps once per boot). The full list stays one command away and the overdue count is already listed at session close. Batch 2 itself adds ten or more watches, so without a cap the boot text grows again.


### 1.6 What boot looks like after batch 2

WHAT ENTERS THE SESSION AT BOOT (hook text; he sees it in the transcript view)
1. Change watches, 5 lines (today's ledger, from the claude-md-watch design's read-only replay):
   CHANGE-WATCH: 32 open · 31 overdue · oldest 2026-10-04
   [wmut6wfn5] .claude/skills/quest/SKILL.md — <first 100 characters of what to observe>
   [wmut6wfy4] .claude/skills/close-phase/SKILL.md — <...>
   [wmutlcn57] lib/adhoc-titles.js — <...>
   +29 more · all: node lib/watch.js check · resolve at session close (DE 7.4): node lib/watch.js resolve <id> ok|anomaly --note "<evidence>"
2. The 'SESSION BOOT — required reads before any work' block, 11 lines, unchanged (if decision 2 = A).
3. The worktree-cleanup headlines and the hook-syntax-check line, unchanged from batch 1 (their text was not captured in this review).
4. system-audit: nothing on a normal boot. One line only while a hook-wiring problem is open: 'system-audit: 2 hook-wiring problem(s) still open since <date> (1 ghost, 1 dangling). List: node domain/system-audit/system-audit.hook.js --full'. The full findings block on the first boot after a hook file or settings.json changed.
5. Gone: the OPEN QUESTS list, the board-shape rule text, the three tables, 'boot-required-read-gate: 60 refs ...', the evolution, system-check and weekly adhoc blocks.

WHAT HE READS (the Session Briefing, first reply)
   Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓
   SESSION BRIEFING — <date time>
   | Quest status | not loaded. Name a ticket or say "board". |
   | Mode | ... |   | Priority today | ... |   | Where we left off | ... |
If his first message names a ticket, says 'board' or asks for a briefing: the full live board as today, with its fetch time, in that first reply.
Unchanged and still per prompt: the one-line 'Mode: ...' and 'Active quest: ...' lines from the existing bundle (mode-detector.js:97, quest-active-grounding.js:112).

BOOT TIME (handover figures, one run each, scripts one after another)
Now: 5.0 + 4.0 + 1.0 + 0.35 + 0.33 + 0.2 + 0.39 + 0.49 = 11.76 s for the eight batch-2 scripts, + 0.35 (worktree-cleanup) + 0.52 (syntax check) = 12.63 s, reported as 12.7 s.
After: system-audit 0.45 (estimate, not measured) + required-reads banner 0.39 + worktree-cleanup 0.35 + syntax check 0.52 + change watches 0.49 = 2.2 s. Without the banner: 1.8 s.
First boot after a hook file or settings.json changed: + about 3.5 s (full audit) = about 5.7 s, plus the existing one-time syntax re-check of changed files.
Moved, not removed: the first ticket, board or briefing prompt of a session-day waits 5 to 13 s (20 s cap when Redmine cannot be reached). Session close gains about 5 to 20 s.
Not verified: whether Claude Code runs startup scripts side by side; real boots under load were slower than the single runs.

BOOT TEXT
Now: 24,884 characters = 14,596 (watches) + 7,421 (board) + 349 (banner) + 123 (pointer check) + 2,395 (system-audit findings, cleanup headlines, syntax line together; the split was not measured).
After: 640 (watches, capped near 850) + 349 (banner) + the part of the 2,395 that is not the system-audit block = between 989 and 3,384 characters. A cut of 86 to 96 percent. Without the banner: 640 to 3,035.
In a ticket session the 7,400-character board enters context once, at the first ticket signal, not at boot.

### 1.7 Biggest risk to ticket work

The ticket board leaves boot, and then ticket work starts without it. A briefing or a 'what next' answer is built with no board in context, or from a Read of quest/active.txt, and an open ticket is left out or a ticket Redmine already closed is worked on. That is the exact slip the script was written for (open-quest-surfacer.js:8-14: the Read tool cut active.txt at line 309 of 640 and two held quests were missed).

Four ways it can happen, and how the designs stand:
1. The boot prose stays. CLAUDE.md lines 16 and 18 and session-briefing.md lines 74 and 119 still tell the model to read active.txt and compose quest status at boot. Design A makes changing them an owner option; Design B keeps them. Required fix: change them in the same commit that removes the boot entry, so 'no board in context' always reads 'not loaded'.
2. The trigger misses the everyday case. Both designs test their trigger against what ticket-gate prints, but ticket-gate is silent once a quest is past Phase 0 (ticket-gate.js:213-214). Continuing a ticket in flight is the daily case. Required fix: pin the fixture to ticket-gate's signal tests (lines 186, 188, 194-203) with a phase-1 active block.
3. A briefing asked later gets nothing. Design A's word list has no 'briefing' or 'where were we', and its once-a-day guard stays silent after a context compaction. It relies on the model remembering to run --now, which the hook's own comment calls a wish (lines 59-60). Required fix: board and briefing asks always fetch live.
4. The board is cut on the way in. The board (about 7,400 characters) is merged with three other outputs into one block (lib/dispatch-hooks.js:144-150). No file in the repo states the harness limit for that block. Both designs list this as 'to measure'. Required fix: keep the boot entry until one real session shows the last table row in context.

What already protects him and is not touched: ticket-gate's Phase-0 checklist, the Redmine check at every quest state change (quest/redmine-status-check.js:9-11), the session-close reconcile gate, and /list-redmine on request. Rollback is one revert that puts the board back at boot.

Second risk, smaller: boot-required-read-gate adds a child to the bundle that runs on every Edit/Write, including every etanah code edit, and adhoc-lifecycle changes quest/archive-quest.js on the ticket close path. Both are held by fixtures (no tree walk and no output for any file other than .claude/CLAUDE.md; the ticket video-prune fixture stays green).

## 2. One design per script

### 2.1 claude-md-watch — domain/claude-md-watch/claude-md-watch.check.hook.js (22 lines) + its core lib/watch.js (77 

**Angle**: The simplest design that honours the agreed direction: keep the hook at boot, print a count plus the 3 oldest, keep the full list on demand, resolve at session close where the step already exists. No new file, no new registration, no cache, no new gate.

**Trigger moment**

Two moments, both already in the system.

1. REMIND = every session start (owner ruled it stays). What boot actually needs is one fact: "N changes still wait to be checked, and here is the list". That is a count line, not 160 lines.

2. RULE (resolve ok / anomaly) = the moment the evidence is seen, and at the latest at session close (Domain Expansion step 7.4). Proof that a change behaves (a log row, a real fire, an eval run) only exists after work was done. Boot is the worst moment to demand a ruling: nothing has been observed yet.

Why this is the leanest: nothing new fires. Step 7.4 already says "an overdue watch -> resolve it now" (.claude/skills/domain-expansion/SKILL.md:42, Feature/Domain-Expansion/expansion-protocol.md:172-173), and session close is already blocked until the audit screen ran (de-close-gate C6, de-close-gate.check.hook.js:147), and that screen already prints the overdue count and the command (lib/audit-briefing.js:62 and :92).

Root cause found in the ledger (main checkout, verified): the countdown steps once per BOOT (lib/watch.js:64-67 called at hook line 18). On 2026-10-04 a watch added at 02:16Z with 5 sessions stood at -16 by 17:30Z, so about 21 boots in 15 hours. All 32 open watches were added on 2026-10-04; 31 are already "overdue". The ProTime watch wmutm5ont, which can only be checked after Mon 2026-10-05 08:30, was at -8 the night before. "Overdue" therefore means "3 boots, about 2 hours", and every watch reaches the 5-line overdue form almost at once.

**Mechanism**

Install first: nothing to install. The Feature is already in (system/feature-census.md:239 = PROPER; born via forge 2026-08-16, hook line 2). "forge install hook" would refuse it anyway (core/forge.js:365 source must sit under .claude/hooks; :379 folder exists). What is missing from the install is paperwork, done BEFORE the change in its own commit: a real eval (today F2 is a stub that always passes, eval.js:16), a footprint line and corrected keys in the README.

Then three small changes:

(1) lib/watch.js gets one new command "brief" (about 10 lines). It prints: 1 header line (open count, overdue count, date of the oldest), the 3 oldest open watches as one line each (id, target, first 100 characters of OBSERVE with line breaks flattened), 1 pointer line. Never more than 5 lines, whatever the count. Silent when nothing is open, as today (watch.js:53).

(2) The boot hook calls "brief" instead of "check" (hook line 17, one word). "check" is NOT touched: it stays the full list on demand (OBSERVE in full, revert line, close line). Every document that says "node lib/watch.js check" stays true (audit-briefing.js:62, handoff section 8, todo.md:42).

(3) "tick" steps the countdown once per day instead of once per boot: it returns early when the newest tick row already carries today's UTC date, and skips a watch added today. The ledger rows keep the same shape, so the three other readers need no change (audit-briefing.js:61, turn-report.js:82, observatory.js:741). "3 sessions" then means 3 days that had a boot, which is 3 session closes to rule it. (Owner decision 2; the design also works if he keeps per-boot.)

Resolve: same command as today, node lib/watch.js resolve <id> ok|anomaly --note "<evidence>", typed when the evidence is seen or at DE step 7.4. No new check in any gate.

Observability and monitoring, no new log file: hook-runtime already writes one telemetry row per boot whose "reason" is the first output line (lib/hook-runtime.js:138-144; confirmed in the real rows, e.g. "CHANGE-WATCH: 32 active observation(s)"). The new header puts the open and overdue counts into that row at every boot. Goal signal: the header reads "0 overdue" at the first boot after a session close.

Cache: none. The ledger (1,180 lines) is replayed at each boot. State scope: none, the ledger is not per-state.

Not chosen, on purpose: firing a watch when its target file is next used (needs a new per-tool check, more parts); a hard block at session close (decision 3).

**Joins existing**

Boot: the existing registration .claude/settings.json:43 -> domain/claude-md-watch/claude-md-watch.check.hook.js:17 (the "check" call becomes "brief"); line 18 (tick) stays.
Full list on demand: lib/watch.js:51-63 ("check"), unchanged. Also already rendered by lib/turn-report.js:101-103 (system/monitoring-dashboard.md) and lib/observatory.js:1174-1175.
Resolve moment: DE step 7.4 as written today — .claude/skills/domain-expansion/SKILL.md:42 and Feature/Domain-Expansion/expansion-protocol.md:172-173 — forced by domain/de-close-gate/de-close-gate.check.hook.js:147 (C6) through lib/audit-briefing.js:62 (overdue count + command) and :92 (ruling row).
Per-run log: lib/hook-runtime.js:138-145 (telemetry row, reason = header line).

**Boot after**

With today's ledger (rendered read-only from the main checkout; 5 lines, about 640 characters, against 160 lines / 16,104 characters now):

CHANGE-WATCH: 32 open · 31 overdue · oldest 2026-10-04
  [wmut6wfn5] .claude/skills/quest/SKILL.md — falsifier ledger: every new Rubric writes a '## Falsifier ledger' with rows + Fix files; an etanah c…
  [wmut6wfy4] .claude/skills/close-phase/SKILL.md — Phase 1 step 1 runs check.js --show and pastes the ledger before any git step; a close with an OPEN …
  [wmutlcn57] lib/adhoc-titles.js — on 'adhoc titles' / 'protime titles' the script lists the day's adhocs with their titles and exits 0…
  +29 more · all: node lib/watch.js check · resolve at session close (DE 7.4): node lib/watch.js resolve <id> ok|anomaly --note "<evidence>"

(The leading telescope symbol of today's header, watch.js:54, can stay or go; nothing parses the header.)
Once the 32 are ruled: 2 to 5 lines on a normal day. Nothing at all when no watch is open.

**Briefing impact**

Nothing is lost. The Session Briefing never used this text: the only "watch" hit in Feature/Session-Briefing-System/session-briefing.md is line 126, which says watch-and-confirm items do NOT belong in the Standing Flags. CLAUDE.md boot step 5 does not name it either. The briefing gains room: about 15,400 characters of boot text go away.

**Daily-work risk**

Worst case: a change to a gate that ticket work depends on misbehaves, and its watch is not among the 3 shown at boot, so nobody rules it. Open examples today: ticket-gate (wmutn01t5), test-scenario-login-gate (wmutlut9a), quest-context-load-gate (wmutmzw0g).

How the design prevents it:
- The watch was never the detector. Each gate's own eval and telemetry catch a break; the watch is the reminder to rule.
- The count is on screen at every boot and is never silent while one watch is open.
- Session close cannot finish without the audit screen (de-close-gate C6), which lists the overdue count and the command.
- The full list is unchanged and one command away.
- The change touches no ticket-path hook. Only "brief" and "tick" in lib/watch.js and one word in the boot hook. The "add" and "resolve" code is untouched and pinned by the eval (de-close-gate C5 depends on "add" rows).

One doc promise changes: domain/protime-plan/README.md:39 says the boot line shows the ProTime watch. It is the 15th oldest, so it will not be named at boot; the README is re-pointed and ProTime keeps its own toast and log.

**Eval plan**

Sandbox for every fixture: a temp folder with system/claude-md-watchlist.jsonl plus copies of lib/watch.js and lib/hook-runtime.js, run with CLAUDE_PROJECT_DIR set to it (hook line 8 and watch.js:20 read that variable first). Nothing reaches the real ledger or the real telemetry.

Commit 1 pins today's behaviour; commit 2 adds the new fixtures.

Fires when it should:
E1 one open watch, not overdue -> 3 lines: header "1 open · 0 overdue", the watch line, the pointer line.
E2 40 open (35 overdue), OBSERVE 300 characters -> exactly 5 lines, at most 850 characters, header "40 open · 35 overdue", the 3 ids shown are the 3 oldest, each OBSERVE cut at 100, last line says "+37 more".
E3 hook end to end on E2's ledger -> stdout equals brief; telemetry row fired:true, reason = the header.

Does not fire otherwise:
E4 ledger missing, E5 ledger empty, E6 every watch resolved -> no output, exit 0, telemetry fired:false.
E7 watch.js replaced by a file that throws -> hook exit 0, no output.

Nothing lost:
E8 "check" on E2's ledger prints all 40 with OBSERVE, revert and close lines, byte-equal to the output captured before the change.
E9 resolve one id -> brief shows 39 and the id is gone; resolve an unknown id -> exit 1.
E10 "add" still appends a watch row with a rollback sha (de-close-gate C5 depends on it).

Countdown:
E11 tick twice on the same day -> rows appended once. E12 newest tick dated yesterday -> appends. E13 a watch added today is not stepped today. E14 no tick rows at all -> appends.

Out of spec:
E15 bad JSON line, blank line, CRLF -> counted from valid rows. E16 OBSERVE with a line break and the text "CHANGE-WATCH: 0 open" -> still one line, header unchanged. E17 a second file claude-md-watchlist-other.jsonl present -> brief count equals check count. E18 CLAUDE_PROJECT_DIR unset, script run from the sandbox copy -> reads and writes the sandbox ledger (pins the worktree case).

Before/after measure, on main, same ledger:
- characters: (node lib/watch.js check | Out-String).Length against (node lib/watch.js brief | Out-String).Length. Expected about 16,100 -> about 640.
- time: median dur_ms of the claude-md-watch rows in system/telemetry/hook-fires.jsonl, 5 boots before and 5 after. Expected unchanged, about 300 ms.
- ledger growth: tick rows per day. 361 on 2026-10-04 -> at most one per open watch per day.
- goal: the telemetry reason line reads "0 overdue" at the first boot after a session close.

**Rollback**

git revert <the commit-2 sha>   (takes back lib/watch.js, the hook word, the eval fixtures and the README wording together)
or, code only: git checkout 454ed37a -- lib/watch.js domain/claude-md-watch/claude-md-watch.check.hook.js   (both files are unchanged since that birth commit; checked with git log on main)
No settings.json change and no data to migrate back: tick rows have the same shape in both modes.

**Seconds saved**

0 s. The script stays at boot. Its last 5 real runs took 292 to 794 ms (main hook-fires.jsonl, 2026-10-04 17:00-17:30Z). The slow rows (4 to 11 s at 09:28Z) were three sessions booting together.

**Characters saved**

About 15,400 today. My read-only replay of the main ledger gives 160 lines / 16,104 characters now (32 open, 31 overdue) against 5 lines / about 640 after. Against the handoff's earlier figure of 14,596 the saving is about 13,950. The text also stops growing with the number of watches (ceiling about 850 characters).

**Confidence**: 86%

**Files to change**

- COMMIT 1 (finish the install, no behaviour change) — domain/claude-md-watch/claude-md-watch.eval.js: replace the stub F2 (line 16) with real fixtures that pin TODAY's behaviour (check output, tick, add, resolve, silence on empty ledger), run in a temp sandbox
- COMMIT 1 — domain/claude-md-watch/README.md: add footprint line (per-session: 1 node hook + 2 short node children, about 0.3-0.8 s, no daemon); retention 'rotate monthly' -> 'keep' (lib/housekeeping.js:32 already says keep, and watch.js:21 reads one file so it cannot rotate); add 'state-scoped: no'; promote goal_status from draft
- COMMIT 2 — lib/watch.js: new 'brief' command (about 10 lines); 'tick' steps once per UTC day and skips watches added today (2-3 lines); usage comment lines 6-14
- COMMIT 2 — domain/claude-md-watch/claude-md-watch.check.hook.js: line 17 'check' -> 'brief'; header comment lines 3-4
- COMMIT 2 — domain/claude-md-watch/claude-md-watch.eval.js: add the brief and once-a-day fixtures
- COMMIT 2 — domain/claude-md-watch/README.md: goal / goal_signal / goal_signal_regex reworded (boot = count + 3 oldest; full list = check; ruled at session close); pipeline row 8 and line 31 wording; named dropped spec: 'every watch with its revert line printed at every boot' moves to 'check' on demand, by the owner's ruling
- COMMIT 2 — domain/claude-md-watch/NUKE-MARKER.md: add the rollback line for this change
- COMMIT 2 — domain/protime-plan/README.md:39: 'the boot CHANGE-WATCH line' -> 'the watch list (node lib/watch.js check); boot shows the count'
- COMMIT 2 — main/handoff-2026-10-05-boot-structure-audit.md (section 4 item 2 and section 5 row), main/todo.md:42, main/current-session.md: status rows (INDEX 'Change record')
- BEFORE commit 2 — two rows added to the ledger with 'node lib/watch.js add' for lib/watch.js and the hook (de-close-gate C5 requires them; INDEX.md:83 says before the commit)
- Boot artifact page republished with the new numbers (not a repo file)
- NOT changed, checked: .claude/settings.json:43 (same path, still registered) · .claude/CLAUDE.md (only lines 298 and 300 name the Feature: version history and the pointer to its README; no boot step reads the watch text) · Feature/Session-Briefing-System/session-briefing.md (no reference) · expansion-protocol.md:172 and domain-expansion SKILL.md:42 (already say resolve at 7.4) · lib/audit-briefing.js, lib/turn-report.js, lib/observatory.js, de-close-gate (read the ledger; row shape unchanged) · system/system-architecture.md:63 (row still true)

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network | handled — boot makes no network or git call; git runs only in 'add' (watch.js:44) |
| 2 | Two sessions boot in the same second | accepted risk — both can pass the once-a-day guard, so a watch turns overdue one day early. Rows are append-only, no watch is lost. Today every boot steps the countdown anyway |
| 3 | Worktree session | handled for boot — hooks run from the main checkout and both files read CLAUDE_PROJECT_DIR first (hook line 8, watch.js:20), so the main ledger is read. Fixture needed for 'add' typed inside a worktree shell with the variable unset: it would write to the worktree's own git-ignored ledger (watch.js:20 fallback). Side note seen during this read: 'git -C <this worktree> log' fails with 'not a git repository: .git/worktrees/new-session-77cffa' while main is at ac7b29b6 — the folder exists but its git registration is gone. Not caused by this script; worth a look by whoever owns worktree-cleanup-boot |
| 4 | First prompt is not about tickets, or the session is for a non-etanah project | handled — the hook does not read the prompt; the 5 lines are about system changes, the same in every session; nothing state-specific |
| 5 | First prompt IS a ticket number | handled — ticket-gate runs on its own event; the watch text no longer takes 16,000 characters ahead of the ticket context |
| 6 | Ledger from yesterday, or no session for 3 days | handled — no cache; the ledger is replayed at each boot. Days without a boot do not step the countdown, so a weekend does not make watches overdue |
| 7 | The hook file is renamed or moved | handled by existing audits — settings.json:43 would point at nothing; audit-briefing lists a registered hook that never fired (audit-briefing.js:49). Watches are not lost: the ledger, 'check' and the DE count do not depend on the hook |
| 8 | Trigger or approval text inside quoted output: a watch's OBSERVE contains 'CHANGE-WATCH: 0 open', a resolve command or an approval phrase (real: wmutm50k3 quotes 'I approve / submit it / post it', printed in full at every boot today) | fixture needed — brief prints at most the first 100 characters of 3 watches, flattened to one line; fixture asserts the header count is unchanged and the line count stays at 5. Exposure is lower than today |
| 9 | Malformed ledger line, blank lines, CRLF, a half-written row from another session | handled — unparsable lines are dropped (watch.js:24); fixture pins it |
| 10 | Ledger missing or empty (fresh clone, second laptop; the file is git-ignored, .gitignore:86) | handled — silent, exit 0 (watch.js:25 and :53); fixture |
| 11 | A second ledger copy from the other laptop (exists today: system/claude-md-watchlist-miyazaki.jsonl, 65,559 bytes, last written 2026-09-30) | accepted risk — watch.js reads only the main file (line 21); the four other readers read both. Today the copy is an older prefix of the main file (25 watch rows, same ids), so counts agree. If a watch ever lived only in a copy, boot would show fewer than the audit screen at session close: that mismatch is the visible signal. Fixture pins 'brief count = check count' |
| 12 | 200 open watches after a heavy change week | handled — output is capped at 5 lines (about 850 characters at most); fixture with 40 watches |
| 13 | A time-critical watch hidden behind older ones (real: ProTime wmutm5ont, due after Mon 2026-10-05 08:30, is 15th oldest) | accepted risk — it is counted but not named at boot; ProTime has its own toast and log (README:39), README re-pointed. Decision 1 option C removes this risk at the cost of about 2,200 characters |
| 14 | Rubber-stamp 'ok' at session close to make the number fall (real precedent: wmsvzl99k resolved ok on 2026-09-14 with the note 'no etanah code edit by Ruri this session to exercise it') | accepted risk — this is why the design adds no hard block at close (decision 3). The note stays in the ledger for audit |
| 15 | A watch added AFTER the commit prints the wrong revert line (real: wmuu2uoib, handover section 7) | accepted risk, unchanged — INDEX.md:83 already says add before commit; 'check' still shows the revert line so the mistake stays visible |
| 16 | lib/watch.js breaks after an edit (syntax error) | fixture needed — the hook swallows the error and prints nothing (hook line 19), which looks like 'no watches'. hook-syntax-check does not cover lib files. Fixture: hook with a throwing watch.js exits 0, telemetry fired:false. Still noticed at session close: audit-briefing counts overdue watches from the ledger, not from the hook |
| 17 | Day boundary | handled — the guard compares UTC dates on both sides, so the day turns at 08:00 local, consistently (not the UTC-versus-local mix noted for arabic-nudge in handover section 7) |
| 18 | Owner says 'show me all the watches' (the instruction the change could invert) | handled — 'node lib/watch.js check' prints exactly what boot prints today; fixture compares it byte for byte with the output captured before the change |
| 19 | Three sessions boot together and the machine is slow (real rows: 4.1 s, 7.0 s, 11.0 s at 2026-10-04 09:28-09:29Z; each child has a 15 s limit) | handled — on timeout the hook prints nothing and boot continues (fail-open). brief does the same read as check; with one step per day the ledger grows by about 30 rows a day instead of 361 (2026-10-04), so the replay stays short |
| 20 | A resolve is appended by another session while brief is reading | handled — append-only file; at worst the count is one too high for one boot |

**Decisions the designer raised**

- What should boot show about open watches?
  - A. Count only: 1 line, about 60 characters
  - B. Count + the 3 oldest + where the full list is: 5 lines, about 640 characters today
  - C. One short line per open watch (id + file, no detail): 33 lines, about 2,200 characters today, grows on busy days
  - Recommended: B. It is your own example and it is capped at 5 lines whatever the count. A hides which changes wait. C hides nothing but grows again: 32 watches were added on 2026-10-04 alone. With B a time-critical watch can sit below the top 3 (the ProTime one does today); the count and the session-close step still cover it.
- What should 'overdue' mean?
  - A. N days that had a session (the countdown steps once per day)
  - B. Keep N boots, as today
  - C. No countdown: overdue = older than 7 days (needs three more scripts changed)
  - Recommended: A. Today the countdown steps at every boot. On 2026-10-04 there were about 21 boots in 15 hours, so a 5-session watch was overdue the same morning and 31 of 32 are 'overdue' though none is older than 2 days. With A, '3 sessions' gives three session closes to rule a watch, the overdue number at boot means something, and the ledger stops growing by 32 rows per boot (361 rows on 2026-10-04). No other script changes.
- Should session close refuse to finish while a watch is overdue?
  - A. No. Keep it as today: the audit screen at close lists the overdue count and I resolve what I have evidence for
  - B. Yes. Add a check to the session-close gate that blocks until every overdue watch is resolved
  - Recommended: A. A block pushes toward writing 'ok' without evidence (it happened once: wmsvzl99k, 2026-09-14). With A the overdue count is logged at every boot, so if it does not fall within two weeks that is the evidence to add the block then.


### 2.2 boot-required-read-gate (C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\workt

**Angle**: The simplest design that honours the agreed direction: no cache, no new registration, no new file kind. The script leaves boot completely. The same resolver runs (1) as one more child of the existing Edit/Write bundle, only when the edited file is .claude/CLAUDE.md, and (2) on demand as a --check command named in two existing procedure steps (Domain Expansion Step 12.5 and the CLAUDE.md update pipeline step 6).

**Trigger moment**

A CLAUDE.md pointer can break in only two ways.

1. EDIT: an Edit or Write tool call on a file whose path ends in /.claude/CLAUDE.md. This is the deterministic trigger. The check runs on the file AS IT WILL BE after the edit (Write: the new content; Edit: the disk text with old_string replaced by new_string, plus the refs in new_string itself in case the replace does not match). Because the whole post-edit file is checked, an edit also surfaces any pointer broken earlier by a move.

2. MOVE: a linked file is moved, renamed or deleted. There is no single tool event for this (moves happen through core/forge.js install, PowerShell, Explorer, OneDrive sync, git pull). A per-command hook on Bash/PowerShell would be a new per-tool registration with no bundle to join, which system-rules Rule 7 and the INDEX constraint "NO new shared step gate" rule out. The leanest existing moment that sees every move of a session is the session-end sweep: Domain Expansion Step 12.5, row "Cross-reference validity" (Feature/Domain-Expansion/expansion-protocol.md:326), which already checks INDEX links by hand. It gains one command for CLAUDE.md.

Why this is the leanest that still catches the need: main telemetry on 2026-10-04 has 17 boot rows for this script, every displayed row reads "60 refs - 54 resolve - 0 placeholder - 6 external-absent" (60-54-0-6 = 0 broken), at 681 to 9,062 ms each. The check found nothing at every boot because nothing had changed since the last boot. Rule 8 test: firing only when CLAUDE.md is edited (roughly every 2 days by its version history, v1.29 to v1.78) is just as effective for the edit case. For the move case a broken pointer also fails loudly on its own when followed (Read returns file-not-found).

**Mechanism**

Order: install first, change after (two commits).

A. INSTALL (unchanged behaviour): node core/forge.js install hook .claude/hooks/boot-required-read-gate.js --symptom ... --goal ... --signal ... --retention "rotate monthly" --footprint "per-session: ..." --nod "...". Result: domain/boot-required-read-gate/boot-required-read-gate.hook.js + the moved eval + README + NUKE-MARKER; settings.json line 19 re-pointed with the telemetry name kept. I read forgeInstall (core/forge.js:360-495) against the script: line 20 uses path.resolve(__dirname,'..','..'), which is the one allowed form (forge.js:385); there is no require('./x'); no .js/.json file names the old path on a code line (settings.json is rewritten by forge; the only full-path mention is a .md, domain/claude-md-watch/README.md:19, reported as a doc ref, not a refusal). The eval's require('./boot-required-read-gate.js') is rewritten by forge.js:429. Not executed by me (read-only).

B. CHANGE (node core/forge.js refine boot-required-read-gate first, so the pins run):
1. Hook file gets two modes. The resolver functions (buildFileIndex, extractRefs, resolveRefs, IGNORE_REFS, PLACEHOLDER_RE) stay byte-identical.
   - Hook mode (stdin = PreToolUse JSON): if tool_input.file_path does not match /[\\/]\.claude[\\/]CLAUDE\.md$/i, exit 0 with no output and no tree walk. Otherwise build the post-edit text, take the root from the edited file's own tree (two levels above the file), resolve; anything unresolved is retried against the main checkout root (so a worktree edit does not flag files that exist only on main). Clean = print nothing. Broken = print a short plain-text note listing each broken pointer and "Fix or remove these in CLAUDE.md". Always exit 0. It never blocks.
   - CLI mode (--check): today's full report on the tree's own CLAUDE.md (header line + all-resolve line, or the broken list); exit 1 when something is broken, so a procedure step can read the result.
   - One row appended to domain/boot-required-read-gate/log.jsonl only when a CLAUDE.md check actually ran (ts, mode edit|check, file, refs, broken list, dur_ms). Fail-open. This is the only way to prove "the check ran on that edit", because a clean run is silent.
2. Registration: delete the SessionStart entry from .claude/settings.json; add "domain/boot-required-read-gate/boot-required-read-gate.hook.js" as the fourth child in domain/bundles/pretool-editwrite-gates.json. lib/dispatch-hooks.js then runs it in parallel with the three existing children on every Edit/Write, writes its telemetry row, and wraps its plain text into the one additionalContext envelope (dispatch-hooks.js:143-151). If another child denies the edit, the deny wins and the note is dropped (dispatch-hooks.js:133-141); the edit did not land and is re-checked on retry.
3. Move moment: one command added to the existing DE Step 12.5 row, and the path corrected in the existing pipeline step 6: node domain/boot-required-read-gate/boot-required-read-gate.hook.js --check.

No cache anywhere. Nothing is stored between runs, so there is no staleness to show and no empty-cache case.

Footprint after the change (system-rules Rule 7, counted honestly): per-tool: one extra short node child inside the existing bundle on each Edit/Write, in parallel with three siblings that already take 0.7 to 2.2 s (main telemetry, 2026-10-04), so no added wait; it exits after one path test. The repo tree walk (0.7 to 3 s quiet, up to 9 s under load) runs only on a CLAUDE.md edit or a --check. Main telemetry since 2026-10-04: 163 Edit/Write bundle fires against 17 boots.

Telemetry name: bundle rows are named by file basename (dispatch-hooks.js:98), so the series becomes "boot-required-read-gate.hook" on PreToolUse; the old "boot-required-read-gate" SessionStart series simply ends. The README records both names.

state-scoped: no, state-agnostic.

**Joins existing**

1. domain/bundles/pretool-editwrite-gates.json lines 1-5 (children array), registered at .claude/settings.json:278 inside the PreToolUse "Edit|Write" group that starts at line 246. Dispatcher: lib/dispatch-hooks.js.
2. Feature/Domain-Expansion/expansion-protocol.md:326 (Step 12.5, row "Cross-reference validity").
3. domain/claude-md-watch/README.md:19 (CLAUDE.md update pipeline, step 6 "Gates re-run"), which already runs this script by command.
Overlap left alone: .claude/hooks/system-audit.js:317-342 (INV-6) keeps its narrower "see X" pointer check wherever system-audit ends up running; its comment at 333-337 names this script and becomes stale text only.

**Boot after**

Nothing from this script. These two lines disappear (icons omitted here):
"boot-required-read-gate: 60 refs - 54 resolve - 0 placeholder - 6 external-absent"
"all resolvable references resolve"

One temporary addition, from the standing change-watch rule (system/INDEX.md, Change record): the existing change-watch block at boot carries one more entry of four lines (target, OBSERVE, revert, close) until I resolve it, expected at the first real CLAUDE.md edit after the change.

Outside boot: when a CLAUDE.md edit leaves a pointer that does not resolve, I get a short note in context naming each broken pointer. He sees it only through my reply (I fix the pointer or tell him).

**Briefing impact**

The Session Briefing loses nothing. Verified by search: the script's name and its printed text ("refs", "all resolvable references resolve", "genuinely-broken pointer") appear in no line of Feature/Session-Briefing-System/session-briefing.md, .claude/CLAUDE.md, Feature/Domain-Expansion/expansion-protocol.md, any SKILL.md, or any domain/lib/core/quest code. Nothing reads its output. The briefing's first line ("Boot files loaded: ...") comes from the model's own reads and boot-load-verification.js, which is a separate script and stays as it is. A broken pointer is now reported when it is created (the edit) or at session end (Domain Expansion Step 12.5), not as a boot flag.

**Daily-work risk**

Worst case for ticket work: the new child now starts on every Edit/Write, including every etanah code edit in a quest. If it crashed, hung or printed on a non-CLAUDE.md edit, it would slow or disturb each edit.
How the design prevents it:
- The path test is the first thing it does; for any file other than .claude/CLAUDE.md it exits with no output and never walks the tree. Fixture pins this.
- It can never block: it always exits 0 and prints plain text only, so the dispatcher can only treat it as an advisory (dispatch-hooks.js:110-151).
- The dispatcher fails open on a missing or crashing child and kills a child at 30 s (dispatch-hooks.js:76-85).
- It runs in parallel with three siblings that already take 0.7 to 2.2 s, so the bundle's wait is unchanged.
- A syntax break is named at the next boot by hook-syntax-check, which covers bundle children (domain/hook-syntax-check/README.md, v2 item 3).
Second risk: a pointer goes stale after a file move and is only reported at session end. In between, following that pointer gives a loud file-not-found, not a silent wrong answer. Not verified: whether ticket-gate loads the quest rules by its own path or through a CLAUDE.md pointer (my two searches of ticket-gate.js found no path to the quest skill).
Note: hooks run from the MAIN checkout, so the change is live only after main is fast-forwarded (handover section 7).

**Eval plan**

File: domain/boot-required-read-gate/boot-required-read-gate.eval.js (the five existing checks stay: sub-folder refs resolve, a missing ref is flagged, placeholder skipped, external skipped, real CLAUDE.md broken <= 3). New fixtures use a temp tree with its own .claude/CLAUDE.md, and set CLAUDE_PROJECT_DIR to that temp tree so no fixture row lands in real telemetry (the known hook-runtime.eval.js problem).

Fires at the right moment:
- E1 Edit on <tmp>/.claude/CLAUDE.md whose new_string adds a pointer to a missing file: stdout names that file, exit 0.
- E2 Write with content holding a missing pointer: flagged.
- E3 Windows backslash path ending \.claude\CLAUDE.md: fires.
- E4 worktree-shaped path <tmp>/.claude/worktrees/w1/.claude/CLAUDE.md: fires, root = that worktree tree.
- E5 effect check through the real dispatcher: lib/dispatch-hooks.js with a one-child manifest and the E1 input returns ONE JSON object whose hookSpecificOutput.additionalContext contains the missing file name.
- E6 --check on the temp tree: prints the header and the broken list, exit 1; on a clean tree exit 0.
- E7 a CLAUDE.md check appends exactly one row to log.jsonl with refs, broken and dur_ms.

Does not fire otherwise:
- N1 Edit on any other file (a .java file, system/INDEX.md): empty stdout, exit 0, no log row.
- N2 look-alikes (CLAUDE.md.bak, docs/CLAUDE.md, .claude/skills/x/CLAUDE.md): empty.
- N3 '{}' , empty and non-JSON stdin: empty, exit 0.
- N4 Edit adds a pointer to a file that exists: empty.
- N5 Edit removes the only broken pointer: empty.
- N6 old_string not found on disk and new_string holds a bad pointer: still flagged.
- N7 a pointer that exists only in the fallback (main) root: not flagged.
- N8 never a block: no exit 2, no "decision" and no "permissionDecision" in any output.

Registration pins: R1 no SessionStart command in .claude/settings.json names boot-required-read-gate; R2 domain/bundles/pretool-editwrite-gates.json lists the child; R3 the old loose file is gone.

Timing, before and after, from the telemetry that already exists (system-rules Rule 5):
- Before: SessionStart rows with "hook":"boot-required-read-gate" in system/telemetry/hook-fires.jsonl on main. 17 rows on 2026-10-04, dur_ms 681 to 9,062.
- After: (a) zero new SessionStart rows with that name; (b) PreToolUse rows with "hook":"boot-required-read-gate.hook": dur_ms on ordinary edits, fired:false; (c) dur_ms of the three sibling children unchanged; (d) the batch-1 boot measure repeated on main (scripts one after another): 12.7 s expected to drop by about 1.0 s.
- One live smoke after main is fast-forwarded: a CLAUDE.md edit in a worktree that adds a fake pointer shows the note in context; then the edit is reverted. This closes the watch.

**Rollback**

git revert <change-SHA>   (puts the SessionStart entry back and removes the bundle child; the Feature stays installed)
git revert <install-SHA>  (only if the install itself must go: the hook and eval return to .claude/hooks/)

**Seconds saved**

1.0 s on a quiet machine (the handover's single measured run). In real boots on the main checkout on 2026-10-04 this script took 0.68 to 9.06 s (17 telemetry rows, most between 2.4 and 6.8 s while several sessions started together). Whether Claude Code runs startup hooks side by side is not verified, so the wall-clock saving per boot may be smaller than the script's own time.

**Characters saved**

123 characters (the header line and the all-resolve line, with their blank lines), out of 24,884. Offset for a few sessions by the one change-watch entry (four lines) if decision 3 is Yes.

**Confidence**: 80%

**Files to change**

- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\.claude\hooks\boot-required-read-gate.js -> moved by forge install to domain\boot-required-read-gate\boot-required-read-gate.hook.js, then edited (hook mode + --check mode + own log row; resolver functions untouched)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\.claude\hooks\boot-required-read-gate.eval.js -> moved by forge install to domain\boot-required-read-gate\boot-required-read-gate.eval.js, then extended with the new fixtures; its stale 'Run:' comment path corrected (this also brings the eval into lib\eval-battery.js, which lists domain, quest, core and lib but not .claude\hooks: eval-battery.js:15-27)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\domain\boot-required-read-gate\README.md (created by forge; after the change: footprint per-tool, registration = bundle child, both telemetry names, trigger moment, state-scoped: no)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\domain\boot-required-read-gate\NUKE-MARKER.md (created by forge; Files and Rollback rows updated after the change)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\.claude\settings.json (line 19: re-pointed by forge at install, then the SessionStart entry is removed)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\domain\bundles\pretool-editwrite-gates.json (+1 child)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\domain\claude-md-watch\README.md (line 19: command path -> node domain/boot-required-read-gate/boot-required-read-gate.hook.js --check)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\Feature\Domain-Expansion\expansion-protocol.md (line 326: Cross-reference validity row gains the CLAUDE.md --check command; footer update stamp. This file already has uncommitted edits in the working tree, so merge, do not overwrite)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\system\system-architecture.md (section 3.0 regenerated by node system/sync-hook-catalog.js, the row at line 62 moves from SessionStart to a PreToolUse bundle child; hand rows at lines 207 and 561 re-worded; one section 9 sync row)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\system\enforcement-INDEX.md (lines 15 and 49: event and home of hook 1)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\REGISTRY.md (regenerated by node core/registry.js)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\system\feature-census.md (regenerated by node lib/feature-census.js)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\system\registry.jsonl and system\slips.jsonl (rows written by forge itself)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\system\claude-md-watchlist.jsonl (one watch row via node lib/watch.js add, BEFORE the change commit so the rollback anchor is the pre-change SHA)
- C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\new-session-77cffa\main\handoff-2026-10-05-boot-structure-audit.md (section 3 built row, section 5 row), main\current-session.md, main\todo.md line 42, daily-diary\current\2026-10-05.md, and the Boot sequence artifact republished to its same URL
- NOT changed, verified by reading: .claude\CLAUDE.md and Feature\Session-Briefing-System\session-briefing.md (neither names this script or its output; boot order steps 1-5 untouched) - lib\change-checklist.js:80 (a printed label) - lib\observatory.js:944 (org-chart member by Feature name, which does not change) - .claude\hooks\system-edit-gate.js:46 (its old-name pattern stops matching the moved file, but line 56 already protects every domain\*\*.hook.js) - .claude\hooks\system-audit.js comments at 20 and 333-337 (stale text only; re-word inside system-audit's own batch-2 change, since that hook is not installed yet)

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network | handled - the script uses only fs and path; no network, no git, no child process |
| 2 | Two sessions edit CLAUDE.md at the same time | handled - no cache and no shared state; each edit is checked against the disk at that instant; log and telemetry are append-only rows |
| 3 | Worktree session: the hook runs from the main checkout but the edit targets the worktree's .claude/CLAUDE.md | fixture needed - root is taken from the edited file's own tree, and unresolved pointers are retried against the main checkout, so a file that exists only on main (untracked or git-ignored) is not flagged and a file created in the worktree this session is found |
| 4 | First prompt is not about tickets, or the session is for a non-etanah project | handled - nothing runs at boot; the check fires only on an Edit/Write whose path ends in /.claude/CLAUDE.md. A root-level CLAUDE.md of another project does not match |
| 5 | First prompt IS a ticket number | handled - the ticket flow never touches this script and no code reads its output (search found zero consumers) |
| 6 | Cache from yesterday | handled - the design has no cache |
| 7 | The hook file is renamed, moved again or deleted | handled - the dispatcher writes a 'child-missing' telemetry row and fails open (dispatch-hooks.js:76-78); hook-syntax-check names a missing registered hook at boot; the eval's registration pin goes red in the eval battery |
| 8 | The trigger text appears inside quoted output: a pasted log or the hook's own note contains a backticked file name | handled - the hook reads only tool_input of a CLAUDE.md edit (file_path, content, old_string, new_string), never the transcript, and has no bypass token that could self-disarm |
| 9 | CLAUDE.md deliberately names a file that does not exist (an example name, a deleted file kept as history) | accepted risk - placeholder names (NNN) and the ignore list are skipped as today; anything else gets a note that never blocks, so the edit still lands |
| 10 | CLAUDE.md is edited by a script (PowerShell, node, sed), not the Edit/Write tool | accepted risk - no tool event to hook without a per-command registration; caught at Domain Expansion Step 12.5, at pipeline step 6, and at the next tool edit, which re-checks the whole file |
| 11 | A linked file is moved by forge install, Move-Item, Explorer, OneDrive sync or a git pull from the other laptop | accepted risk, with a known exposure - caught at session end (DE 12.5) or the next CLAUDE.md edit, and loudly when the pointer is followed. Verified exposure: 12 loose hooks named by CLAUDE.md pointers (ticket-gate.js, ask-back-gate.js, system-audit.js and nine more) will be renamed to <name>.hook.js when worklist item 3 installs them; forge's own 'DOCS still naming the old path' line matches full paths only (forge.js:394), not bare names |
| 12 | Malformed, empty or '{}' stdin (forge's smoke-fire sends '{}') | fixture needed - exit 0, no output, no tree walk |
| 13 | The edit REMOVES the only broken pointer | fixture needed - the post-edit text is checked, so no false note |
| 14 | Edit's old_string does not match the disk text (CRLF against LF, or a stale read) | fixture needed - the refs in new_string are checked in addition to the computed text, so a new bad pointer is still seen |
| 15 | design-consult-gate or system-edit-gate denies the same CLAUDE.md edit | handled - the dispatcher returns the deny and drops advisories (dispatch-hooks.js:133-141); the edit did not land and is checked again on the retry |
| 16 | Slow disk or loaded laptop: the tree walk took up to 9 s in main telemetry | accepted risk - the wait now lands on one CLAUDE.md edit instead of every boot; the dispatcher kills the child at 30 s and fails open |
| 17 | Look-alike paths: CLAUDE.md.bak, docs/CLAUDE.md, .claude/skills/x/CLAUDE.md | fixture needed - only a path ending in /.claude/CLAUDE.md fires; a worktree copy under .claude/worktrees/<name>/.claude/CLAUDE.md fires on purpose |
| 18 | The harness does not show a PreToolUse advisory to the model | accepted risk until smoke-tested - the repo already relies on this channel (system-edit-gate.js:157-163, claude-md-edit-guard.js:79-81) but I verified the code, not the harness; the eval pins the envelope and the change-watch asks for one live confirmation at the first real CLAUDE.md edit |
| 19 | The child is silently dropped from the bundle manifest later | fixture needed - the eval pins 'child present in pretool-editwrite-gates.json and absent from SessionStart'; the eval battery runs it |
| 20 | Instruction reversal: he simply asks 'are there broken pointers in CLAUDE.md?' | handled - the --check command answers on demand with the same report boot printed |

**Decisions the designer raised**

- When a CLAUDE.md edit leaves a pointer that does not resolve, should the edit be stopped or only noted?
  - Note only: the edit lands and Ruri is told which pointers are broken, then fixes them
  - Block: the edit is refused until every pointer resolves
  - Recommended: Note only. It matches today's behaviour (the boot check never blocked) and the standing constraint that a blocking check ships as an advisory first. A block would also stop edits that mention a deleted file on purpose.
- How fast must you be told when a file that CLAUDE.md points to is moved or deleted?
  - At session end (Domain Expansion Step 12.5) and at the next CLAUDE.md edit: no new hook
  - At once, on every PowerShell/Bash command: a new check that starts a process on every shell command in every session
  - Recommended: At session end and at the next CLAUDE.md edit. A moved file's pointer fails loudly when followed, so the gap is small. The instant option adds a process to every shell command on the laptop and needs a new standalone registration, which your Rule 7 bans.
- Do you want the usual change-watch for this change? It adds one 4-line entry to the boot text until Ruri closes it.
  - Yes: follow the Change record rule; Ruri closes it at the first real CLAUDE.md edit that shows the note working
  - No: rely on the eval and the telemetry rows only, no extra boot text
  - Recommended: Yes. It is your own rule (observe what was touched), and the one thing the eval cannot prove is that the note really reaches Ruri during a live edit. It is short-lived, but it is boot text, so it is your call.


### 2.3 .claude/hooks/boot-load-verification.js

**Angle**: The simplest design that honours the agreed direction: retire the duplicate, keep one home for the boot list, build nothing new.

**Trigger moment**

The job is: the session knows which files to read before work, and a skipped read is visible. Both moments are already served without this script.
(1) The instruction is needed at session start. The harness itself loads .claude/CLAUDE.md then (and again after a compaction). Its first section, lines 8-15, is the same four-file list plus the rule for the "Boot files loaded" line. Zero processes.
(2) The visibility is needed at the first reply: CLAUDE.md line 15 makes "Boot files loaded: ..." the first line of the Session Briefing. The script never produced that line and never checked it.
Rule 8 test: the script adds nothing at the moment of need, and it is wrong-moment for part of its fires. It reads no input (lines 14-27: one fixed print, exit 0), so it also prints on resume and after compaction. Telemetry on main, after removing duplicate rows: 648 unique fires; of the 198 that carry a session id, 55 (28%) were repeat fires inside a session that had already booted (30 of 143 sessions; one session 18 times). Each of those tells a mid-work session to re-read about 418 KB and deliver a briefing.
So the leanest trigger that still catches the need is the one that already runs: the CLAUDE.md load. No new trigger.

**Mechanism**

Nothing new fires. No cache. No new registration on any event.
Order of work (install first, change after):
Step 0, two verified install blockers. core/forge.js lines 393-412 refuse an install when a non-comment line in a .js or .json file under domain, .claude, lib, core, quest or system names the old path. On main two files do: (a) domain/observatory/observatory.eval.js line 158 (code); (b) domain/hook-syntax-check/cache.json (git-ignored cache, .gitignore line 104; it holds one key per registered hook file, so it will block every remaining loose-hook install, not only this one). Fix (a) by testing disabledReason on two inline strings instead of naming a hook file. Fix (b) once for batch 2: one skip for domain/*/cache.json at forge.js line 403 plus one forge eval fixture; zero-code fallback is deleting the cache (retention: regenerate; the next boot re-checks about 138 files once, about 18 s per its README).
Step 1, install unchanged: node core/forge.js install hook .claude/hooks/boot-load-verification.js with --symptom (2026-05-17: step 4 expansion-protocol.md silently skipped, Domain Expansion done wrong), --goal "no session starts work with a boot file unread, and a skipped read is visible", --signal "the first reply opens with the Boot files loaded line", --retention "rotate monthly", --footprint "per-session: 2 node, 349 chars, 0.39 s", --nod. Forge moves it to domain/boot-load-verification/, re-points settings.json line 15, keeps the telemetry name, writes README, NUKE-MARKER and the install-pin eval. Commit.
Step 2, deregister: add the change watch BEFORE the commit (node lib/watch.js add --target .claude/settings.json --observe "first reply of a new session still opens with the Boot files loaded line" --sessions 3). Remove the SessionStart entry from settings.json. Add the header lines "Lifecycle: DEREGISTERED" and "// system-audit: skip-ghost-check" to the hook (same shape as domain/arabic-nudge/arabic-nudge.check.hook.js lines 6-7; system-audit.js lines 139 and 197 honour the marker). README: DEREGISTERED first line and "registration: none" (keeps install pin I2 green, forge.js line 351; lib/observatory.js lines 473-475 then show it as retired, not broken). Add the behaviour fixtures. Regenerate the hook catalog. Commit.
Step 3, later: the folder stays dormant (one-line re-register) until the two boot modes are ruled; then delete it at a system audit.
Reader corrections: "1106 rows" double-counts copied telemetry files (648 unique). observatory.eval.js line 158 is a confirmed blocker for forge, but the eval itself would stay green if the file vanished (the negative half goes vacuous). The cache.json blocker was missed. system-architecture.md line 206 says "reminder if any not Read"; the code prints unconditionally.
If a task-first mode is added later: a SessionStart script runs before the first prompt exists, so it can never know the mode; this script could not serve that mode in any form. With it retired the boot list changes in ONE place (CLAUDE.md lines 8-15, plus the line format quoted at expansion-protocol.md line 39 and eval fixture F2). expansion-protocol.md (52.7 KB) already has a moment-of-need loader: the domain-expansion skill (SKILL.md line 8). main-memory.md (247 KB) needs its own design. If the mode must be picked mechanically, the existing home is the upsm-mode bundle (domain/bundles/upsm-mode.json), on the first prompt; no new registration. None of that is built now.

**Joins existing**

C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/CLAUDE.md lines 8-15 (section "Session Boot Order": steps 1-4 name the four files, step 5 line 15 is the "Boot files loaded" rule). Already loaded by the harness at every session start; this subagent session received it and received no SESSION BOOT block. Nothing is attached or added; the script's text is a second copy of these lines. Proof the copy drifts: the script header lines 9-12 record that a dead entry (claude-md-amendments) stayed in its list from 2026-06-02 until the 2026-07-12 edit (git: commit 994f9cf3).

**Boot after**

From this script: nothing. Its 11-line "SESSION BOOT - required reads before any work" block no longer enters the session.
Unchanged, because it comes from CLAUDE.md line 15 and not from the script: the Session Briefing still opens with
Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓
For the next 3 sessions the change-watch block (printed by claude-md-watch) carries one extra entry of about 4 lines for this change, until it is resolved.

**Briefing impact**

The briefing loses nothing. No file reads or parses this script's output: a search for the script name and for its three printed strings finds no consumer in session-briefing.md, any skill, quest/ or core/. The briefing's first line, the four reads and the briefing steps are all defined in CLAUDE.md lines 10-21, which stay as they are. One thing gets better: the script printed the finished success line, ticks included, into context before any file was read; that copy-ready line is gone.

**Daily-work risk**

Worst case: with the second reminder gone, a session skips personality.md, main-memory.md or expansion-protocol.md and works a ticket without them; at session end Domain Expansion is done wrong (the 2026-05-17 founding slip).
Why the design holds:
1. The instruction does not depend on any script. The harness loads CLAUDE.md lines 8-15 at every start and after every compaction.
2. A skip stays visible: the "Boot files loaded" line is the owner's check, unchanged.
3. Ticket rules do not live in those three files. They are in CLAUDE.md (auto-loaded) and in the Phase 0 text that ticket-gate injects on a ticket mention (settings.json line 57; ticket-gate.js lines 253, 262).
4. The Domain Expansion steps are loaded at Domain Expansion time by the domain-expansion skill (SKILL.md line 8).
5. The script was never a guard. The one boot-skip in the slips ledger (2026-09-28, slips.jsonl line 814) happened with the script on and its block printed.
6. Eval fixture F2 turns red if a later CLAUDE.md trim removes the boot order while the script is off.
7. A 3-session change watch; one missed "Boot files loaded" line = anomaly = one-line re-register.
Honest limit: there is no A/B data. Whether one channel is as reliable as two is not proven; the watch and the boot-skipped slip category are the measure.

**Eval plan**

Before (read-only, already measured): 0.39 s one-run (handover section 5). Wrapper telemetry on main, last 7 days: 88 unique fires, median 959 ms, mean 1136 ms. Printed block: 349 chars (counted from lines 14-26).
Fixtures in domain/boot-load-verification/boot-load-verification.eval.js, next to forge's install pins I1-I3:
F1 does not fire: no settings.json command and no bundle manifest child names boot-load-verification.
F2 the one home is intact: CLAUDE.md "Session Boot Order" holds the four Load lines and the exact "Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓" line.
F3 each of those four paths exists on disk.
F4 the hook header has the skip-ghost-check marker; README has "registration: none" and DEREGISTERED.
F5 the four paths the dormant hook prints equal the four in CLAUDE.md.
Regression runs before the merge: domain/observatory/observatory.eval.js, core/forge.eval.js, node system/sync-hook-catalog.js --check, node lib/folder-structure.js map, node lib/eval-battery.js.
At real boots, after main is fast-forwarded: (a) the next 3 boots add 0 rows with hook "boot-load-verification" to system/telemetry/hook-fires.jsonl and the boot text has no SESSION BOOT block; (b) in those same sessions the first reply opens with "Boot files loaded:"; the watch is resolved ok with the three session ids as the note, or anomaly on the first miss.
Timing after: sum of SessionStart dur_ms per boot from telemetry for 3 boots, against the 3 boots before (the method of handover section 9).
Longer signal: count of boot-skipped rows in system/slips.jsonl. Baseline is 1 (2026-09-28), with the script on.

**Rollback**

git revert <deregister-SHA>   (puts the SessionStart entry back; the installed Feature stays)
Full undo including the install: git revert <deregister-SHA> <install-SHA>
Either must reach main, because hooks run from the main checkout.

**Seconds saved**

0.39 s by the handover's one-run measure (two node processes: the wrapper and the script). Wrapper telemetry over the last 7 days shows a median of 0.96 s per fire. If Claude Code runs startup hooks side by side (not verified, handover section 7), the wall-clock gain is smaller.

**Characters saved**

349 chars (the fixed 11-line block), about 1.4% of the 24,884 boot chars. About zero net for the first 3 sessions while the change watch for this edit is open.

**Confidence**: 80%

**Files to change**

- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/domain/observatory/observatory.eval.js - line 158: stop naming .claude/hooks/boot-load-verification.js (forge refuses the install while it does); keep the commit-gate half, test disabledReason on two inline bodies for the 'print then exit is not disabled' half
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/lib/observatory.js - line 1264: export disabledReason (for the line above); line 107: comment example; line 944 needs no change (the Feature keeps the name boot-load-verification)
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/core/forge.js - line 403: skip git-ignored domain/*/cache.json in the referrer scan (shared batch-2 prerequisite; fallback = delete domain/hook-syntax-check/cache.json once)
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/core/forge.eval.js - one fixture for that skip
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/hooks/boot-load-verification.js - moved by forge install to domain/boot-load-verification/boot-load-verification.hook.js (unchanged)
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/settings.json - line 15 re-pointed by forge at install; then the whole SessionStart entry (lines 13-16 today) removed
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/domain/boot-load-verification/boot-load-verification.hook.js - header only: Lifecycle DEREGISTERED line + '// system-audit: skip-ghost-check'
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/domain/boot-load-verification/README.md - written by forge; then DEREGISTERED first line, 'registration: none', pointer to CLAUDE.md lines 8-15 as the one home
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/domain/boot-load-verification/boot-load-verification.eval.js - install pins from forge + fixtures F1-F5 (see eval plan)
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/domain/boot-load-verification/NUKE-MARKER.md - written by forge; rollback line = the one settings.json entry to put back
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/system/claude-md-watchlist.jsonl - one watch row via lib/watch.js add, before the deregister commit
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/system/system-architecture.md - section 3.0 regenerated by node system/sync-hook-catalog.js (row at line 61 goes); section 3.1 line 206 corrected (it never checked 'if any not Read') and marked deregistered; section 9 sync row
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/system/enforcement-INDEX.md - lines 15, 29, 48: stale plan text (says the hook will be extended; never done) re-pointed to CLAUDE.md Session Boot Order
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/system/evolution-protocol.md - lines 15 and 73: name evolution-check-trigger.js (what was actually built), not this hook
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/REGISTRY.md - line 20, regenerated by node core/registry.js (never hand-edited)
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/system/feature-census.md - line 11, regenerated by node lib/feature-census.js; monitoring-dashboard.md and liveness-dashboard.md regenerate the same way
- C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/main/handoff-2026-10-05-boot-structure-audit.md - section 3 status row + section 5 row; also main/current-session.md and main/todo.md line 42 (same turn, per the INDEX change record)
- NOT changed: .claude/CLAUDE.md (lines 8-21 are already the complete one home; no rule text changes, so no version bump), Feature/Session-Briefing-System/session-briefing.md (never named the hook or its strings), Feature/Domain-Expansion/expansion-protocol.md line 39 (quotes the line format from the rule, not the hook)
- Left for their own batch-2 installs (comment-only mentions): .claude/hooks/system-audit.js line 19, .claude/hooks/open-quest-surfacer.js line 20

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network | handled - nothing in the design uses the network; CLAUDE.md is a local file the harness loads |
| 2 | Two sessions at once | handled - no state, no cache, no lock; each session loads CLAUDE.md itself |
| 3 | Worktree session, main not yet fast-forwarded | handled - hooks run from MAIN, so the old script simply keeps printing until main has the change (harmless). A stale settings.json that still names the old path after the install fails open: hook-runtime.js lines 72-75 log target-missing and exit 0 |
| 4 | First prompt is not about tickets (another project with Ruri) | handled - same CLAUDE.md boot order as today; the script never told the cases apart |
| 5 | First prompt IS a ticket number | accepted risk, unchanged from today - whether the briefing may be skipped is the unruled two-modes question. The script printed before the prompt existed, so it never handled this either (the 2026-09-28 slip happened with it on) |
| 6 | Cache from yesterday | handled - the design has no cache. Install time only: the syntax-check cache.json names the old path and makes forge refuse; fixed in step 0 |
| 7 | The hook file is renamed or moved | handled - forge install moves it, re-points settings.json and keeps the telemetry name (hook-runtime.js line 66); it refuses while a code file still names the old path |
| 8 | Session for a non-etanah project or another folder | handled - project hooks and CLAUDE.md are both project-scoped; neither loads, same as today |
| 9 | Trigger text appears inside quoted output | handled - there is no trigger predicate left to fire. Before, the script itself put the finished tick line into context at every boot; that self-referential copy is removed |
| 10 | Compaction or resume in the middle of a ticket | handled better - 55 of 198 session-tagged fires (28%) were repeat prints of 'SESSION BOOT ... deliver Session Briefing' in an already-booted session; after the change there is no re-print, and CLAUDE.md still reloads |
| 11 | A later CLAUDE.md trim removes or rewords the boot order | fixture needed - F2 pins the four Load lines and the exact tick line in CLAUDE.md; red in the eval battery if they go |
| 12 | Legacy Feature/ moves into domain/ (ruling 3) and expansion-protocol.md changes path | handled better - one place to re-point (CLAUDE.md line 13). The script's hard-coded line 21 would have gone stale with nothing checking it. Fixture F3: every boot path in CLAUDE.md exists on disk |
| 13 | system-audit sees an unregistered *.hook.js under domain/ and calls it a ghost | fixture needed - F4 pins the skip-ghost-check marker (system-audit.js lines 139, 197) and 'registration: none' |
| 14 | Months later someone re-registers the dormant hook with a stale list | fixture needed - F5 compares the four paths the hook prints with the four in CLAUDE.md |
| 15 | Liveness dashboard shows the hook going dark | handled - README 'DEREGISTERED' gives the observatory verdict 'retired' (lib/observatory.js lines 473-475), not 'broken' |
| 16 | Fire history splits at the install | handled - forge passes the old name as the wrapper's third argument, so before and after are one series |
| 17 | Subagent and Workflow-tool sessions | handled - unchanged; this read-only subagent session received CLAUDE.md and no SESSION BOOT block |
| 18 | The observatory eval loses its 'print then exit is not disabled' example | fixture needed - the inline disabledReason check in step 0 keeps that pin without naming any hook file, so it will not block the next installs either |
| 19 | CLAUDE.md is long (58.6 KB) and the model under-weights it | accepted risk - the boot order is its first section (lines 8-15); one channel instead of two; 3-session watch; rollback is one line |
| 20 | The watch itself adds boot text | accepted risk - about 4 lines for 3 sessions, then resolved; net boot text is about zero until then |

**Decisions the designer raised**

- The boot list lives in CLAUDE.md lines 8-15, which the harness loads by itself. This script prints a second copy at every start, resume and compaction, and checks nothing. Keep the second copy?
  - Retire it: install as a Feature, deregister, CLAUDE.md is the one home (dormant folder, one-line re-register)
  - Keep it at boot but shrink it: one line that points to CLAUDE.md, printed on a fresh start only (still 0.39 s, about 250 chars saved)
  - Leave it exactly as it is until the two boot modes are ruled (install only)
  - Recommended: Retire it: install as a Feature, deregister, CLAUDE.md is the one home (dormant folder, one-line re-register). The copy already drifted once (a dead file stayed in its list from 2026-06-02 to 2026-07-12). It never verified a read. 28% of its session-tagged prints came mid-session. The one boot-skip in the ledger happened with it on. The coming Feature/ to domain/ move would break its hard-coded path silently. And a startup script cannot know the boot mode, so it has to change or go under either future ruling; retiring it now leaves one place to edit then. The gain is small (0.39 s, 349 chars); the reason is one home, not speed.


### 2.4 .claude/hooks/evolution-check-trigger.js (56 lines, SessionStart, registered at .claude/settings.json:25-28)

**Angle**: The simplest design that honours the agreed direction: retire the boot script and give its one job to the system check, which already does that job. No new hook, no cache, no new file, no new folder.

**Trigger moment**

The moment /system-check is run (manual, about monthly). That is the only moment the question "is it time to re-read what Anthropic shipped?" has ever been acted on.

Why this is the leanest trigger that still catches the need (all verified):
- The last evolution check was done BY the system check: system/evolution-protocol.md:48 says "run via system-check run 3 Familiar 5" (commit ebb6b6d4, 2026-09-22).
- The boot warning did not cause it. The stamp was overdue from 2026-07-30 to 2026-09-22 (54 days). Telemetry on main shows the warning printed on at least 141 boots between 2026-09-07 and 2026-09-21 (175 fired rows across 3 files, one of them an overlapping machine copy).
- The stamp it reads was wrong for part of that time: an evolution-check digest was produced on 2026-08-16 (system/claude-md-changelog.md:226) but the stamp stayed 2026-06-30, so the hook printed "76 days" on 2026-09-14 when the real gap was 29.
- The message points at a skill that does not exist (.claude/skills/evolution-check/ is absent on main; evolution-protocol.md:17 says "to be built").
- The model-change half was never built (hook header lines 4-6). The state field still says claude-fable-5-1 while this session runs claude-opus-5-5.
- Rule 8 test: firing only when the system check runs is just as effective, because both stamps have moved together since 2026-09-22.

**Mechanism**

1. Remove the SessionStart entry and delete the hook file in the same commit. Nothing replaces it on any event.

2. Three sentences in the /system-check skill, which already reads and writes the same file:
- Step 1 (cadence check) shows both ages on one line: last system check and last evolution check.
- Familiar 5 is named as the evolution check. Its scope starts with the Claude Code / Anthropic changelog since `last-evolution-check`.
- Step 7 always stamps `last-system-check`. It stamps `last-evolution-check` and `next-elapsed-check-due` only when Familiar 5 actually returned changelog findings (offline or skipped = no evolution stamp, and the report says so).

3. The standalone path is unchanged: "check Anthropic updates" makes Ruri follow system/evolution-protocol.md section "Process", whose step 7 (line 43) already stamps the date.

4. No cache. No reader is left behind: a grep of every .js and .json shows the hook is the only code that reads `last-evolution-check`, `next-elapsed-check-due` or `last-model-id-seen`, and no code parses its printed text.

5. No install first, because nothing of the hook survives to be changed (owner decision 3). Its fire history is already judgeable: 1,091 rows in central telemetry on main.

Side finding for the other batch-2 scripts (read from code, not run): `forge install hook` would REFUSE any registered loose hook today. core/forge.js:399-412 treats a .json file under domain/ that names the old path as a code referencer, and the gitignored domain/hook-syntax-check/cache.json holds the key ".claude/hooks/evolution-check-trigger.js" (present on main). Workaround: delete that cache first (its retention is `regenerate`; cost is one cold syntax check of about 13-18 s at the next boot), or teach forge to skip cache.json.

**Joins existing**

.claude/skills/system-check/SKILL.md — step 1 (line 35), step 7 (line 45, already "Update last-system-check date in system/evolution-protocol.md"), Familiar 5 (lines 62-63), cross-reference (line 113).

**Boot after**

Nothing from this script.

Today it is already silent (13 days since the 2026-09-22 check). The visible change starts 2026-10-22: this block no longer appears at every boot:
"⚙️  evolution-check-trigger: ⚠️ N days since last evolution check / Last check: … · Next due: … / Anthropic may have shipped new features … / Invoke evolution-check skill manually … / See system/evolution-protocol.md"

Where he sees it instead: the first line of a /system-check run, e.g. "Last system check 2026-09-22 (13 d) · last evolution check 2026-09-22 (13 d)".

**Briefing impact**

The Session Briefing loses nothing it reads. session-briefing.md has no row for this flag (grep for "evolution": no match); the warning only ever arrived as raw hook text that Ruri could lift into Standing Flags.

After the change no evolution flag reaches the briefing. The boot-load line, quest status, slip surface and Domain Expansion autoscan are untouched.

The evolution check still gets done: inside /system-check (Familiar 5), or when he says "check Anthropic updates". A second existing nudge stays live: best-practices-consult-gate.js:51 tells Ruri at design prompts to check the research file's age (over 60 days = run the evolution check first).

**Daily-work risk**

Direct risk to ticket work: none. The hook never blocks (every path exits 0), writes nothing, and no code reads its output.

Worst realistic case 1: a hand edit of .claude/settings.json leaves invalid JSON, and then every hook stops, ticket-gate included. Prevention: remove the entry with a JSON-aware edit, parse-check it, and run `node system/sync-hook-catalog.js --check` plus the hook-syntax-check eval before the commit.

Worst realistic case 2: a half-applied state (file deleted, registration still present in a stale checkout). The wrapper fails open: lib/hook-runtime.js:72-76 logs `target-missing` and exits 0. hook-syntax-check prints MISSING FILE and system-audit prints DANGLING until that checkout is synced. Prevention: file and registration go in one commit; hooks run from main, so it is live only after main is fast-forwarded.

Observed during this run, not caused by this design, cause not established: at about 01:50 local the admin folder .git/worktrees/new-session-77cffa lost HEAD, gitdir and commondir (only logs, COMMIT_EDITMSG and index remain). `git worktree list` on main no longer lists this worktree and every git command inside it fails with "not a git repository". Git worked in it minutes earlier. The branch claude/new-session-77cffa sits at ac7b29b6, same as main. The cleanup log has no row naming this worktree. Worth a look before anyone commits from this worktree.

**Eval plan**

No new code, so the fixtures are checks on the existing estate. Run on main after the commit.

Does not fire at boot:
- F1: no command in .claude/settings.json contains "evolution-check-trigger"; the file parses as JSON.
- F2: after the next 3 real boots, system/telemetry/hook-fires.jsonl has zero new rows with hook "evolution-check-trigger" and zero `target-missing` rows.
- F3: `node .claude/hooks/system-audit.js` prints no GHOST, DANGLING or DOC DRIFT line naming it.
- F4: `node system/sync-hook-catalog.js --check` exits 0; `node domain/hook-syntax-check/hook-syntax-check.eval.js` stays 17/17.
- F5: `node lib/feature-census.js` no longer lists the legacy-hook row; ghost count unchanged. `node lib/folder-structure.js map` stays 0 missing, 0 duplicate, 0 unmapped.
- F6: `node domain/observatory/observatory.eval.js` green and no stale org member with that name.

Fires at the right moment:
- F7: text pins on .claude/skills/system-check/SKILL.md: step 7 names both `last-system-check` and `last-evolution-check` with the "only if Familiar 5 returned" condition; Familiar 5 names the changelog-since-stamp scope; step 1 names both ages.
- F8: a watch (`node lib/watch.js add`, before the commit): at the next /system-check run, the diff of system/evolution-protocol.md shows both stamps equal to the run date, or only the system stamp when Familiar 5 was offline.

Timing, before and after, from telemetry:
- Before: 30 rows on main from 2026-09-30 to 2026-10-02, inside the wrapper: min 359 ms, median 883 ms, mean 846 ms, max 1,314 ms. The handoff's single warm run measured 0.35 s.
- After: zero rows. Compare summed SessionStart time per session for 3 boots before and 3 after, the same method as handoff section 9.

**Rollback**

`git revert <commit>` restores the hook file, the settings.json entry and every document in one step. Then `node system/sync-hook-catalog.js` to regenerate the hook catalog.

**Seconds saved**

0.35 s by the handoff's single warm run. Real boots log more: median 0.88 s inside the wrapper (30 rows, 2026-09-30 to 2026-10-02), plus the wrapper's own node start. Two node processes fewer per boot. Whether startup hooks run side by side is not verified, so the wall-clock gain may be smaller than the sum.

**Characters saved**

0 today (the script is silent until 2026-10-22). From 2026-10-22: about 308 characters at every boot until the stamp is reset.

**Confidence**: 85%

**Files to change**

- .claude/settings.json — remove the evolution-check-trigger command (lines 25-28); parse-check the JSON before commit
- .claude/hooks/evolution-check-trigger.js — delete (git history keeps it); no forge install, this is a retirement
- .claude/skills/system-check/SKILL.md — step 1 (line 35) shows both stamp ages; step 7 (line 45) stamps both, evolution only if Familiar 5 returned; Familiar 5 (lines 62-63) named as the evolution check; line 113; footer line with the spec-preservation note
- system/evolution-protocol.md — lines 5 and 15-19 (boot rows become a one-line tombstone 'retired 2026-10-05'; model-ID row marked never built), 63-67 (skill 'to be built' becomes 'not built; runs as /system-check Familiar 5 or by the Process section'), 73, 78; line 50 `last-model-id-seen` marked not maintained
- .claude/CLAUDE.md:131 — the 'Evolution:' line re-pointed to 'manual, inside /system-check'; version stamp v1.79
- system/claude-md-changelog.md — v1.79 entry naming the two dropped specs (boot reminder retired on the owner's verdict; model-ID detection was never built)
- system/INDEX.md:110 and :162-165 — 'Evolution mechanism' re-pointed
- system/enforcement-INDEX.md:29 — drop 'will be extended (Phase 7) with model-change + 30-day evolution check'
- system/system-architecture.md — section 3.0 regenerated with `node system/sync-hook-catalog.js` (line 64 drops, 139 to 138 registrations); section 3.1 row 209 becomes a one-line tombstone; section 9 sync row added
- lib/observatory.js:948 — remove 'evolution-check-trigger' from the Self-improvement member list (line 959 would otherwise report it as a stale org member); run domain/observatory/observatory.eval.js
- Regenerated, never hand-edited: REGISTRY.md (`node core/registry.js`), system/feature-census.md (`node lib/feature-census.js`), system/phrase-registry.md:77 (`node system/phrase-registry.js`; that file is stale since 2026-07-02, the row drops whenever it is next regenerated)
- Change record: `node lib/watch.js add` BEFORE the commit; main/handoff-2026-10-05-boot-structure-audit.md section 5 row; main/todo.md:42; main/current-session.md; today's diary; the boot artifact republished
- No change, verified by grep (no mention of this script): Feature/Session-Briefing-System/session-briefing.md, Feature/Domain-Expansion/expansion-protocol.md, the CLAUDE.md boot order, .claude/hooks/best-practices-consult-gate.js:51 (names the process, not the hook)
- Left for the sibling design: .claude/hooks/system-check-trigger.js:4 keeps a comment naming the retired file

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network when /system-check runs, so Familiar 5 cannot read the changelog | handled: step 7 stamps the evolution date only when Familiar 5 returned changelog findings; otherwise only last-system-check moves and the report says 'evolution check not done' |
| 2 | Familiars 1-4 return, Familiar 5 times out or is skipped on the owner's word | handled: same conditional stamp rule |
| 3 | Two sessions run /system-check at the same time | accepted risk: both write the same date into the same two lines; worst case a merge conflict on the comment text, on a manual monthly task |
| 4 | Worktree session | handled with a known lag: hooks run from main, so the removal is live only after main is fast-forwarded (handoff section 7); stamps written in a worktree reach main at the Domain Expansion merge |
| 5 | First prompt is a ticket number | handled: nothing is registered on SessionStart or UserPromptSubmit by this design; ticket-gate is untouched |
| 6 | First prompt is not about tickets, or the session is for a non-etanah project | handled: nothing runs at boot, which is the owner's stated wish |
| 7 | Cache from yesterday | handled: the design has no cache. The stale key in domain/hook-syntax-check/cache.json is dropped at the next boot (hook-syntax-check.hook.js:93 rewrites the cache from registered hooks only) |
| 8 | Hook file deleted but an old settings.json still registers it (other laptop not yet synced, or a session started before the pull) | handled, noisy until synced: wrapper logs target-missing and exits 0; hook-syntax-check and system-audit both name it |
| 9 | The words 'evolution check' appear inside pasted logs or quoted output | handled: no hook listens for the phrase; it is only a manual phrase, so the worst case is Ruri offering to run it |
| 10 | The owner does not run /system-check for three months | accepted risk: no evolution reminder exists on its own (his words: 'do this manually for now'). Covered if the system-check reminder from the sibling design ships; best-practices-consult-gate.js:51 still nudges at design prompts |
| 11 | The evolution check is run standalone and the stamp is forgotten, as on 2026-08-16 | accepted risk, now cheaper: nothing mechanical reads the stamp, so a missed stamp no longer raises a false boot alarm; the next Familiar 5 just reads a longer changelog window |
| 12 | The model changes (today claude-opus-5-5 against a stored claude-fable-5-1) | accepted risk: nothing detects it, same as today because it was never built; owner decision 2 |
| 13 | A later reader or hook expects next-elapsed-check-due | handled: grep of all .js and .json shows the retired hook was the only reader |
| 14 | system-audit at the next boot after the deletion | fixture needed: expect no GHOST (file gone), no DANGLING (registration gone), no DOC DRIFT line naming it (CLAUDE.md's 'Triggered enforcement' text does not name it) |
| 15 | Observatory org chart still lists the retired name | fixture needed: remove the token at lib/observatory.js:948, then confirm no stale member and observatory eval green |
| 16 | A OneDrive conflict copy of the deleted hook reappears in .claude/hooks/ | handled by existing checks: system-audit CHECK 9 lists conflict copies; an unregistered copy shows as a GHOST at boot |
| 17 | Someone follows 'install first' and runs forge install on this hook | handled by refusal: forge exits 2 because cache.json names the old path (core/forge.js:412); nothing half-lands |
| 18 | A later edit of the /system-check skill drops the 'stamp both' sentence | accepted risk: no eval pins skill text yet (forge install skill does not exist); mitigated by the spec-preservation note in the skill footer and a watch |

**Decisions the designer raised**

- Once it leaves boot, where do you want to see that the evolution check is overdue?
  - Only inside /system-check: the evolution check becomes part of that run, so one date and one reminder cover both
  - Also one row in the /system-audit screen when it is 30+ days old (that screen is printed at every Domain Expansion too)
  - Keep it at boot
  - Recommended: Only inside /system-check. The two stamps have moved together since 2026-09-22, so a separate row would always repeat the system-check one. The boot warning printed on at least 141 boots over 54 overdue days and the check was still done inside the system check.
- The model-change reminder has been documented since May but was never built. Drop it from the documents, or put it on the build list?
  - Drop it from the documents
  - Keep it as a separate item to build later
  - Recommended: Drop it from the documents. CLAUDE.md:131, system/INDEX.md:162 and system-architecture.md:209 claim it exists; the script's own header says it does not. You have never seen it, and a new model is something you already know about when you switch.
- Your rule is install first, then change. This script would be deleted, not changed. Retire it outright, or install it as a Feature and keep it parked?
  - Delete it; git history keeps it and one revert brings it back
  - Install it into domain/evolution-check-trigger/, then deregister it and keep it for on-demand use
  - Recommended: Delete it. Install-first exists so a change can be judged from a log and a goal; 1,091 telemetry rows already give that. Installing would create a folder, README, eval and NUKE-MARKER for a part whose only remaining job the /system-check skill already does. forge would also refuse the install today because of the syntax-check cache file.


### 2.5 .claude/hooks/system-check-trigger.js (runs from C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-

**Angle**: the simplest design that honours the agreed direction

**Trigger moment**

The job is one thing: tell the owner when the monthly deep audit (/system-check, 5 sub-agents) is overdue. The moment of need is when he is already looking at system health: the audit screen. That screen runs at Domain Expansion step 7.4 (every session close) and on /system-audit.

Why this is the leanest trigger that still catches the need:
- Step 7.4 is deterministic. `de-close-gate` C6 blocks the close banner unless `lib/audit-briefing.js` ran in the last 12 h (domain/de-close-gate/de-close-gate.check.hook.js:143-147, 245-246).
- A 30-day cadence does not need a check at every boot. Main-checkout telemetry, last 7 days: 88 runs, 0 printed anything.
- Boot was also the wrong moment to act. Overdue since 2026-08-18 (previous run 2026-07-19 + 30 d). The warning printed at 175 boots between 2026-09-07 and 2026-09-22 (the `fired` field only exists from 09-07, so the real count is higher) before the check was run on 2026-09-22.
- Rule 8 test: it is just as effective firing only when the audit screen is shown. Yes, so it fires there.

Answer to "why did we want this": the deep audit is expensive, so it runs monthly, and nothing else reminds anyone it is due (.claude/skills/system-check/SKILL.md:25-31, 101-108). That is the script's whole job.

**Mechanism**

No hook, no registration, no cache, no new process. The reminder becomes a few lines inside `gather()` of `lib/audit-briefing.js`, which already runs at the two moments above.

What the lines do:
1. Read `system/evolution-protocol.md` from the current checkout and from the main checkout (the script already computes MAIN_ROOT at line 41). Take the newest `last-system-check:` date. Regex is line-anchored: `/^last-system-check:\s*(\d{4}-\d{2}-\d{2})/m`.
2. Read the cadence from the same file: `/^system-check-cadence-days:\s*(\d+)/m`, default 30. That key already exists (system/evolution-protocol.md:57); the old hook hardcoded 30 (line 16) and ignored it.
3. Always: add ` · last system check N d ago (YYYY-MM-DD)` to the header line (render(), line 99).
4. When N >= cadence, or no valid date: push one row into NOT WORKING and one into NEEDS RULING. This is the in-file convention: the eval-battery staleness row (line 56) and the overdue-watch rows (lines 62 and 92).
5. Add `systemCheckDays: N` to the log row the script already appends (line 111, `domain/de-close-gate/log.jsonl`). That gives one row per session close: the before/after data for "does a session-close reminder get the audit run sooner".
6. Row wording must not contain "run /x", "use /x" or "invoke /x" (those trip skill-invocation-discipline-gate.js:31-36 if the screen is pasted into a prompt).

Order of work (install first, then change):
- The part that CHANGES is the audit screen. It is already forge-born (system/registry.jsonl row `audit-briefing`, 2026-09-06; census `lib/audit-briefing.js | script | PROPER`, system/feature-census.md:294). Its one missing "installed" piece is an eval. So: `node core/forge.js refine system-audit --nod ...`, add `lib/audit-briefing.eval.js` pinning today's behaviour, run it green, commit. Then make the change and add the new fixtures.
- The loose hook is RETIRED, not installed (system-rules Rule 3). Reasons: its job folds into an installed part; forge has no retire verb (core/forge.js:497-501 = new | refine | install), so install-then-delete would leave an `installed` row with nothing recording the retirement; and a `domain/system-check-trigger/` folder would be a second home for a trigger that belongs to the system-check Feature. This deviation from the letter of "install the loose hook first" is put to the owner as decision 1.

Footprint after: none (two small file reads inside a process that already runs). Before: 2 node processes per boot (wrapper + child, lib/hook-runtime.js:80). State-scope: state-agnostic.

**Joins existing**

lib/audit-briefing.js:56 (the "eval battery last ran N d ago" row, same shape), with the paired rows at :62 and :92, the header at :99 and the log row at :111. That script is run by Feature/Domain-Expansion/expansion-protocol.md:170 (Step 7.4 "What runs"), .claude/skills/domain-expansion/SKILL.md:42 and .claude/skills/system-audit/SKILL.md:18, and enforced by domain/de-close-gate/de-close-gate.check.hook.js:147 (C6). lib/observatory.js:355 reuses the same gather(), so the Observatory app shows the overdue row with no extra work.

**Boot after**

Nothing from this script, in every case.

Today it is also silent (last check 2026-09-22, 13 days ago). What the change removes is the roughly 300-character warning block that would start printing at every boot from 2026-10-22.

At session close instead (Domain Expansion step 7.4, and on /system-audit), the existing SYSTEM AUDIT header line gains a suffix:
... · 131 hooks seen · last system check 13 d ago (2026-09-22)

When overdue, two rows appear inside the blocks:
NOT WORKING: system check last ran 34 d ago (cadence 30 d) - deep audit: /system-check
NEEDS RULING: deep audit due: 34 d since 2026-09-22 - /system-check, or change system-check-cadence-days

When no valid date is recorded: last system check: not recorded, plus the same two rows.

**Briefing impact**

The Session Briefing loses nothing it reads. Feature/Session-Briefing-System/session-briefing.md has no reference to this hook, its text or the system check (grep: only the generic "Standing flags" lines 32, 122, 126-127, 153). Its inputs are `date`, quest/active.txt, main/current-session.md, main/todo.md and the Redmine board.

One indirect loss: when the check was overdue, the hook's warning sat in boot context and could be picked up as a standing flag. That flag no longer appears at boot; the same fact now appears at session close. The system-check skill's own step 6 (carry CRITICAL findings to the next boot through current-session.md) is separate and unchanged.

**Daily-work risk**

This script has no role in ticket work, so the risk comes from the edit, not the design.

Worst case 1: a bad hand-edit of .claude/settings.json leaves it unparseable, and every gate (ticket-gate, quest-phase-gate, compile-gate, push gate) stops firing. Prevention: remove exactly one array element, JSON.parse the file in the same step, eval fixture B1 parses it, `node system/sync-hook-catalog.js --check` must exit 0, and hook-syntax-check runs at the next boot.

Worst case 2: an error in lib/audit-briefing.js breaks Domain Expansion step 7.4, and C6 then blocks the session close. Prevention: the new read sits in try/catch, `node --check`, the eval pins the five blocks and the log row before and after the change, and domain/de-close-gate/de-close-gate.eval.js is re-run. The gate also has its bypass token.

Worst case 3: the deep audit silently never runs again. Prevention: the row lives in a step that cannot be skipped, and each session close logs `systemCheckDays`, so a growing number is visible in the log.

**Eval plan**

One eval file, lib/audit-briefing.eval.js. Each fixture builds a temp root, writes a small system/evolution-protocol.md with dates relative to today, and spawns `node lib/audit-briefing.js --days 1` with CLAUDE_PROJECT_DIR set to that root. No real log is written.

Pins, committed and green BEFORE the change:
- P1 the five block headers print, exit 0
- P2 the run appends an `audit-briefing-ran` row to the fixture's domain/de-close-gate/log.jsonl (C6 contract)
- P3 gather() returns notWorking / slow / heavyTurns / mistakes / opt / rulings / n

Fires at the right moment:
- S1 stamp 13 d old: header says "last system check 13 d ago", no row
- S3 stamp 30 d old: row in NOT WORKING and in NEEDS RULING
- S4 no stamp line, S5 file missing: "not recorded" plus the rows
- S13 the log row carries systemCheckDays

Does not fire otherwise:
- S2 stamp 29 d old: no row
- S6 quoted stamp in prose ignored, S7 findings-count line ignored
- S8 malformed date, S9 future date
- S10 cadence 60 with a 45-day stamp: no row; missing cadence key falls back to 30
- S11 worktree-shaped root: newest of the two copies wins, both directions
- S12 the row text matches none of the three skill-invocation patterns
- B1 .claude/settings.json parses and no command contains "system-check-trigger"
- B2 .claude/hooks/system-check-trigger.js does not exist

Neighbours to re-run: domain/de-close-gate/de-close-gate.eval.js, lib/folder-structure.eval.js, `node --check` on lib/audit-briefing.js and lib/observatory.js, `node system/sync-hook-catalog.js --check`.

Timing, before (main-checkout telemetry, hook "system-check-trigger", read this session): 88 runs in 7 days, average 1074 ms, median 801 ms, 0 printed; the 3 boots since batch 1: 122, 132, 462 ms.
Timing, after: zero new rows with that hook name over 3 real boots; SessionStart hooks per boot 10 -> 9; sum of SessionStart dur_ms per session, 3 boots before against 3 after; `Measure-Command { node lib/audit-briefing.js --days 7 }` before and after (expect no measurable change).
Goal measure: the `systemCheckDays` series in de-close-gate/log.jsonl. Last time the audit ran 65 days after the previous one; the next run shows whether a session-close reminder does better.

**Rollback**

`git revert <change-SHA>` restores the hook file, the settings.json entry, the catalog block and the documents in one step. Then `node system/sync-hook-catalog.js --check` to confirm the catalog matches. The eval pin commit can stay.

**Seconds saved**

About 0.2 to 0.5 s per boot. Wrapper-measured on the main checkout: 122, 132 and 462 ms in the three boots since batch 1; the handoff's single run was 0.33 s. Before batch 1 the 7-day average was 1.07 s (median 0.80 s, 88 runs). Two node processes fewer per boot. Whether startup hooks run side by side is not verified, so the wall-clock gain may be smaller.

**Characters saved**

0 today: it prints nothing inside the 30-day window. About 300 characters per boot whenever the check is overdue (the 8-line warning block), next from 2026-10-22. In September that block printed at 175 or more boots.

**Confidence**: 85%

**Files to change**

- Root for all paths: C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\ (build in a worktree, live after main is fast-forwarded)
- COMMIT 1 (pin first) - lib\audit-briefing.eval.js: NEW file of an existing kind (12 lib\*.eval.js exist). Pins today's behaviour: five block headers, the audit-briefing-ran log row, the gather() return shape. Opened with `node core/forge.js refine system-audit --nod "..."`
- COMMIT 2 - lib\audit-briefing.js: header comment 'Reads' list gains system/evolution-protocol.md; gather() gains the stamp + cadence read, the NOT WORKING row (after line 56), the NEEDS RULING row (after line 92) and a `sc` field in the return (line 93); render() header suffix (line 99); `systemCheckDays` in the log row (line 111)
- COMMIT 2 - lib\audit-briefing.eval.js: add the new fixtures (see eval plan)
- COMMIT 2 - .claude\settings.json: delete the SessionStart entry at lines 29-32 (do it in the same commit as the sibling evolution-check-trigger entry at lines 25-28 if that one goes too, to avoid a conflict); JSON.parse it after the edit
- COMMIT 2 - .claude\hooks\system-check-trigger.js: git rm (recoverable from git)
- COMMIT 2 - .claude\skills\system-check\SKILL.md: line 20 trigger row (boot hook -> the audit screen at Domain Expansion step 7.4 and /system-audit); line 35 '30 days' -> the cadence key; line 45 step 7 note 'keep the key at the start of its line'; line 114 cross-ref -> lib/audit-briefing.js; version note naming the dropped spec ('flag at boot') and why. Open with `node core/forge.js refine system-check --nod "..."`
- COMMIT 2 - .claude\skills\system-audit\SKILL.md: line 27 'Where the numbers come from' gains system/evolution-protocol.md (last-system-check)
- COMMIT 2 - Feature\Domain-Expansion\expansion-protocol.md: Step 7.4 'What runs' (lines 170-174) one sentence: the header carries the system-check age and an overdue check is listed under NOT WORKING and NEEDS RULING; plus an 'Updated' footer line. Note: this file already has uncommitted edits in the session worktree
- COMMIT 2 - system\system-architecture.md: section 3.0 regenerated by `node system/sync-hook-catalog.js` (139 -> 138 registrations, the row at line 68 goes); section 3.1 row at line 210 becomes a one-line tombstone ('retired <date>: reminder moved to lib/audit-briefing.js'); section 9 sync row
- COMMIT 2 - system\evolution-protocol.md: line 54 comment only ('read by lib/audit-briefing.js at Domain Expansion step 7.4; was the boot hook until <date>'). The stamp and cadence lines stay as they are
- COMMIT 2 - lib\observatory.js: line 950, remove 'system-check-trigger' from the members array (otherwise it lands in the org chart's `stale` list, line 959)
- COMMIT 2 - main\handoff-2026-10-05-boot-structure-audit.md (section 3 built row, section 5 row), main\todo.md line 42, main\current-session.md, daily-diary\current\<date>.md: change record, same turn
- Regenerated, never hand-edited: REGISTRY.md (`node core/registry.js`), system\feature-census.md (`node lib/feature-census.js`), system\phrase-registry.md (`node system/phrase-registry.js`; row 107 disappears; the file was last generated 2026-07-02), system\liveness-dashboard.md, system\monitoring-dashboard.md
- Before the commit: one `node lib/watch.js add` for the whole batch-2 change set, not one per script (32 open watches print 14,596 chars at every boot)
- Republish the Boot sequence artifact (https://claude.ai/artifact/WnyAt8Jdg9LEkZjdytmWzB) to the same URL
- NOT changed, verified by grep: .claude\CLAUDE.md (never names this hook; boot order steps 1-5 untouched), Feature\Session-Briefing-System\session-briefing.md (no reference), .claude\skills\domain-expansion\SKILL.md (row 7.4 already mandates the blocks), domain\de-close-gate\* (C6 contract unchanged)

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | The stamp text is quoted in prose or a comment earlier in evolution-protocol.md (for example `last-system-check: 2020-01-01` inside a sentence) | fixture needed (S6): the regex is line-anchored, so only a line that starts with the key counts. The old hook took the first match anywhere. |
| 2 | Only `last-system-check-findings-count: 27` is present, no date line | fixture needed (S7): reads as not recorded, no crash. |
| 3 | The audit screen is pasted back into a prompt; the row says 'run /system-check' and skill-invocation-discipline-gate (patterns at lines 31-36) forces a 5-sub-agent audit | fixture needed (S12): row wording avoids 'run /', 'use /', 'invoke /'; the fixture tests the row against those three patterns. |
| 4 | A pasted audit screen description-matches the system-check skill ('system audit' is already in its trigger list) | accepted risk: true today for every pasted screen; the skill's step 1 asks before running early. |
| 5 | Worktree session whose copy of evolution-protocol.md is older than main's (another session ran the check) | fixture needed (S11): read both copies, newest date wins; also the reverse case. Domain Expansion step 0b syncs with origin/main before 7.4 anyway. |
| 6 | Two sessions close at the same time | handled: this job only reads; the one write is the existing append to de-close-gate/log.jsonl. |
| 7 | No network | handled: no network, git or child process is used. |
| 8 | The first prompt is a ticket number, or is not about tickets at all | handled: nothing fires at boot or on any prompt; the line exists only in the audit screen. |
| 9 | The session is for a non-etanah project, or ends without Domain Expansion | accepted risk: the line is not shown that session. Cadence is 30 days; it appears at the next close, on /system-audit, and in the Observatory app. |
| 10 | Cache from yesterday | handled: there is no cache; the file is read on every run. |
| 11 | The hook file is renamed or missing | handled: there is no hook. If lib/audit-briefing.js itself is renamed or broken, C6 blocks the session close, which is loud. |
| 12 | system/evolution-protocol.md is missing or moved (the meta/ to system/ rename made this hook read a missing file and exit silently, main/todo.md:73) | fixture needed (S5): prints 'not recorded' plus the NOT WORKING row. The old hook was silent here (lines 19-21). |
| 13 | Malformed date (2026-13-45) or a future date | fixture needed (S8, S9): malformed reads as not recorded, never 'NaN d ago'; a future date shows 0 d and no row. |
| 14 | /system-check is run but its step 7 (update the stamp) is skipped | handled: the row keeps showing at the next session close, which is the check that step 7 ran. |
| 15 | The model pastes only the blocks and drops the header line | handled by placement: inside the cadence only an informational suffix is lost; the overdue rows sit inside NOT WORKING and NEEDS RULING, which step 7.4 mandates. |
| 16 | The owner wants a longer cadence, or wants it quiet this month | fixture needed (S10): cadence is read from `system-check-cadence-days` in the same file, so it is a one-line data edit, no code change. |
| 17 | Time zone: the stamp is a date, 'now' is local time | accepted risk: at most 1 day off on a 30-day cadence. |
| 18 | The eval run pollutes real logs (lib/hook-runtime.eval.js does this today) | handled: every fixture spawns the script with CLAUDE_PROJECT_DIR set to a temp root, so the log row lands in the fixture; fixture P2 asserts that. |
| 19 | The Observatory app calls gather() and gets a new field and extra rows (lib/observatory.js:355-356) | fixture needed (P3): the arrays it reads keep their shape; the new `sc` key is ignored. |
| 20 | An OneDrive conflict copy of evolution-protocol.md holds the newer stamp | accepted risk: only the exact file name is read, so the line errs toward reminding. system-audit CHECK 9 already lists conflict copies. |
| 21 | An old worktree's settings.json still lists the hook after the file is deleted on main | accepted risk: the wrapper logs a `target-missing` row and exits 0 with no output (lib/hook-runtime.js:72-75). Three such rows in the window would show as an 'errored' line in the audit screen until that worktree is gone. Which settings.json a worktree session loads is not verified. |
| 22 | User-instruction reversal: 'put it back at boot' | handled: one `git revert` restores the hook file, the settings entry and the documents. |

**Decisions the designer raised**

- The boot reminder becomes one line in the audit screen you already read at session close. What happens to the old boot script?
  - Delete it. The line lives in the audit screen; that screen gets its missing tests first.
  - Install it as its own Feature folder first (forge install), then switch it off and keep it, the way arabic-nudge was handled.
  - Recommended: Delete it.. Your rule is install first, then change. The part that changes here is the audit screen, which is already forge-born and only lacks tests, so it gets them first. The boot script is not changed, it is retired. Keeping it would leave a switched-off folder holding a second copy of the date check, the kind of part that later prompts 'is this even running?'. Option 2 follows the rule to the letter and costs one extra folder of four files.
- The deep audit is set to every 30 days, but the three runs so far were 56 and 65 days apart (2026-05-24, 07-19, 09-22). Keep 30 days?
  - Keep 30 days for one more cycle
  - 45 days
  - 60 days
  - Recommended: Keep 30 days for one more cycle. Only the moment of the reminder changes now. If the cadence changes at the same time, the next run cannot tell us which change helped. After this build the cadence is one line in system/evolution-protocol.md, so you can change it any time without code.


### 2.6 system-audit (.claude/hooks/system-audit.js, 489 lines, SessionStart, advisory, always exit 0)

**Angle**: The simplest design that honours the agreed direction: keep its one existing SessionStart entry but make it a change detector (same cache pattern as hook-syntax-check v2), and run the full audit inside the audit screen that Domain Expansion already runs. No new registration, no new gate, no new folder kind.

**Trigger moment**

Two moments, no clock.

1. The first session start after the hook set or its wiring changed. "Changed" = the list of hook files (.claude/hooks/*.js and domain/**/*.hook.js, name + mtime + size), .claude/settings.json, .claude/settings.local.json or a domain/bundles/*.json manifest differs from what the last audit saw. This is the earliest moment a change made by ANY route can be seen: Edit/Write, core/forge.js (moves files with fs, no tool event), a git merge or pull, OneDrive sync from the other laptop, a hand edit. A ghost or dangling hook can only appear through such a change, so detection latency for them stays "next boot", as today.

2. Session close: Domain Expansion step 7.4, which sits before step 10's `git add -A`. That is the moment the non-hook checks matter (the OneDrive conflict copy that deleted the Step-10 rule was committed by a `git add -A`, commit 25a0379c, expansion-protocol.md:67).

Why this is the leanest trigger: an Edit/Write-time trigger was rejected. PreToolUse sees the tree before the edit; it fires between "file written" and "file registered" (a false ghost); it is blind to forge, git and OneDrive; and it would add cost to every edit during ticket work. Folding the detector into hook-syntax-check was also rejected: its cache only knows REGISTERED files (hook-syntax-check.hook.js:35-54), so a new unregistered file, which is the ghost case, is invisible to it, and an unregistered audit hook would be reported as a GHOST by lib/feature-census.js:83-88.

**Mechanism**

Nothing was run for this design (read-only); every timing for the new behaviour is an estimate until the eval measures it.

STEP 0 - install blocker to clear first (verified by reading, the reader missed it). core/forge.js:399-412 refuses an install when a .js/.json file names the old path. MAIN's domain/hook-syntax-check/cache.json contains the key ".claude/hooks/system-audit.js" (grep: 1 hit), so `forge install` will be REFUSED. Fix: one condition at core/forge.js:403 to skip domain/*/cache.json (a regenerate-class cache, already git-ignored at .gitignore:104; it self-heals because a moved file is a new key) plus one fixture in core/forge.eval.js. This will hit every remaining loose-hook install, not only this one. Fallback with no code: delete that cache file first (costs one cold syntax check, 13-18 s, at the next boot).

STEP 1 - install, unchanged: `node core/forge.js install hook .claude/hooks/system-audit.js --symptom ... --goal ... --signal ... --retention "rotate monthly" --footprint ... --nod ...`. Result: domain/system-audit/system-audit.hook.js + README + NUKE-MARKER + install-pin eval; settings.json line 11 re-pointed; telemetry name "system-audit" kept (forge.js:441). Safety 1 passes: __dirname is used only at lines 44 and 75, both the allowed two-levels-up form.

STEP 2 - change the installed hook (about 40 lines):
a) Fingerprint gate at the top. Build one string from: settings.json, settings.local.json and each domain/bundles/*.json (mtime:size), plus every .claude/hooks/*.js and every domain/**/*.hook.js (path:mtime:size, same walk as collectHookFiles, lines 109-143, but stat only, no file reads). Hash it.
b) Cache: domain/system-audit/cache.json = { fp, audited_at, trigger, counts: {ghost, dangling, scope, docLie, other} }. Retention verb: regenerate (the README `retention: rotate monthly` line governs log.jsonl). Written only after a full run, never on a skip, so two laptops do not fight over it through OneDrive.
c) No flag (the boot call): fp equals cache.fp -> skip the audit, print nothing (or the one line of decision 1), exit 0. fp differs, or the cache is missing, empty or unparseable -> run the full audit exactly as today, print it with one new first line saying why it ran and the date of the previous audit, write the cache.
d) `--full`: always run, print, refresh the cache. Used at session close and by hand.
e) Staleness: there is no age limit on purpose (no clock). The cache can only be stale for the six non-hook checks, and those are re-run at every session close. The owner sees the audit date in the change-run line, in the optional one-liner, and in cache.json.
f) One log row per call in domain/system-audit/log.jsonl: { ts, trigger: boot|full, ran, findings, dur_ms }. "ran:false on most boots" is the proof the gate works (same idea as hook-syntax-check's `checked: 0`). The wrapper keeps writing the central telemetry row, so a dead hook still shows in the audit screen as "never fired".
g) Two fixes the move forces: SELF_NAME (line 50) becomes the file's own basename, otherwise CHECK 1 reports a false "SELF ... ghost" because the registered name becomes `system-audit.hook` (lines 79, 101, 192); and the footer path at line 485.
All 15 checks and their output text stay as they are (spec preserved; only WHEN changes).

STEP 3 - session close: in lib/audit-briefing.js, in the CLI block only (lines 107-112, NOT inside gather(), because lib/observatory.js:355 calls gather() for every dashboard snapshot), spawn the hook with `--full` (60 s timeout, resolved from the briefing script's own checkout, CLAUDE_PROJECT_DIR set to that checkout so the dangling check at line 75 resolves against the same tree) and add each finding line to the NOT WORKING block as `structure: <line>`; if the spawn fails or times out, add `structure audit did not run`. This rides on what already exists: DE step 7.4 runs `node lib/audit-briefing.js --days 7`, de-close-gate C6 blocks the close banner without it, and the /system-audit skill runs the same script on demand.

Found while reading, not part of this change: CHECK 6 (line 443) takes the FIRST quoted .js of a command, which is hook-runtime.js for every wrapped entry, so wrapped block-capable hooks are never examined for a missing eval.

**Joins existing**

1. .claude/settings.json:11 - its own existing SessionStart entry is kept (forge re-points the path); no registration is added anywhere.
2. lib/audit-briefing.js:107-112 (CLI block) feeding the NOT WORKING block built at lines 48-62 - already run at Domain Expansion step 7.4 (.claude/skills/domain-expansion/SKILL.md:42; Feature/Domain-Expansion/expansion-protocol.md:162-177), already enforced by domain/de-close-gate/de-close-gate.check.hook.js:147 (C6), and already run on demand by .claude/skills/system-audit/SKILL.md:18.
3. Pattern copied from the working sibling: domain/hook-syntax-check/hook-syntax-check.hook.js:58-94 (cache keyed on mtime + size, one log row per run), with its cache already git-ignored by .gitignore:104 `domain/*/cache.json` and logs by .gitignore:37.

**Boot after**

Normal boot (no hook file or settings.json changed): nothing.

Nothing changed but a hook-wiring problem from the last run is still open (only if decision 1 goes the recommended way), one line:
system-audit: 2 hook-wiring problem(s) still open since 2026-10-06 (1 ghost, 1 dangling). List: node domain/system-audit/system-audit.hook.js --full

First boot after a hook file, settings.json or a bundle manifest changed: one new first line, then the same block as today (PASS line with counts, or the findings list), shield prefix kept, footer path updated:
system-audit ran: hook files or settings.json changed since the last audit (2026-10-06 09:12).
system-audit findings (Layer 0 structural integrity):
  GHOST HOOKS (1) - file exists but NOT registered in settings.json: <name>
  ...
Snapshot: N hook files, N registered, N documented, N opted-out
(advisory - does not block boot. See domain/system-audit/system-audit.hook.js for the audit rules.)

At session close the findings appear inside the audit screen as `structure:` rows under NOT WORKING.

**Briefing impact**

The Session Briefing does not read this script. Grep of Feature/Session-Briefing-System for "system-audit" returns nothing (positive control: "Standing flags" matches at session-briefing.md:32 and :153), and CLAUDE.md boot step 5 does not name it. What the briefing loses: the findings block as raw material on every boot (telemetry: all 38 rows I read in the two 2026-10 files carry the findings heading, so it prints at every boot today). What it keeps: the full block on the boot after a hook change, and the one-line reminder while a hook-wiring problem is open. The standing structure findings move to the session-close audit screen, where rulings are made. The boot-load verification line is untouched.

**Daily-work risk**

Worst case for ticket work: a gate that tickets rely on (ticket-gate, quest-phase-gate, compile-gate, the push gate) becomes a ghost or a dangling registration and nobody is told, because the audit no longer runs at every boot.

Why the design prevents it: a gate can only become a ghost or dangling through a change to settings.json, a bundle manifest or the hook file list. All three are in the fingerprint, so the very next boot runs the full audit and names it, exactly as today. hook-syntax-check still runs at every boot and names any registered file that is missing or broken. With decision 1 as recommended, the problem stays on screen as one line until fixed.

What can still be missed: a content edit that keeps the same size and mtime. That cannot create a ghost or a dangling registration. The six non-hook checks are no longer seen at boot; they run before every session-close commit instead.

Other cost: the 4-5 s full run returns once on the boot after each hook change. During batch 2 and the 53 remaining installs that will be often; it is one boot per change, shared by all sessions because the cache lives in MAIN.

**Eval plan**

Eval file: domain/system-audit/system-audit.eval.js (the forge install pin I1-I3 stays; lib/eval-battery.js:15-21 picks it up). It builds a sandbox repo in the temp folder and copies the hook into <sandbox>/domain/system-audit/, because the script takes its root from its own location; cache and log therefore land in the sandbox, never in the real log.

Fires at the right moment:
G1 empty cache -> full run, heading printed, cache written, log row ran:true.
G3 add an unregistered x.hook.js under domain/ -> output names it under GHOST HOOKS.
G4 remove a registration from settings.json -> GHOST HOOKS names the hook.
G5 register a path with no file -> DANGLING (1).
G6 edit a bundle manifest -> full run.
G7 add a hooks block to settings.local.json -> SCOPE finding.
G9 `--full` on an unchanged tree -> runs, prints, refreshes the cache, log trigger:full.
G10 corrupt cache.json -> full run, cache rewritten valid.
G11 unreadable settings.json -> full run, cache not written.

Does not fire otherwise:
G2 second run, nothing changed -> stdout empty (or the one line), log row ran:false, cache file untouched.
G8 change only quest/active.txt or a SKILL.md -> stays silent, ran:false.
G15 malformed stdin, empty stdin, large stdin -> exit 0, no crash.

Spec preservation and effect:
G12 with the installed registration (`--wrap ...system-audit.hook.js SessionStart system-audit`) there is no SELF finding; remove the registration and the SELF finding appears.
G13 parity: full-run stdout on a fixture tree equals the stdout of the installed-but-unchanged script on the same tree, apart from the new first line and the footer path (golden captured between install and change).
G14 audit-briefing CLI on a sandbox with one ghost prints a `structure:` row under NOT WORKING; on spawn failure prints `structure audit did not run`; gather() alone spawns nothing.
G16 unchanged tree with a cached open ghost -> exactly one line (if decision 1 = recommended).
Plus: NUKE-MARKER present, README keys present, core/forge.eval.js fixture for the cache.json skip, de-close-gate eval still green.

Timing, before and after, same telemetry series (name kept by forge): system/telemetry/hook-fires*.jsonl rows with "hook":"system-audit". Before: 6.4-22.7 s in the rows of 2026-09-30 to 2026-10-04 that I read; 4.0-5.0 s warm per the brief. After: median dur_ms of the first 10 real boots on main; target at or below 600 ms on unchanged boots, and the share of ran:false rows in domain/system-audit/log.jsonl. Chars: stdout length 0 on unchanged boots, measured from the same 10 boots.

**Rollback**

1. git revert --no-edit <change-SHA> <install-SHA>   (puts .claude/hooks/system-audit.js, settings.json line 11, lib/audit-briefing.js and the documents back)
2. node system/sync-hook-catalog.js   (regenerates the hook catalog; commit the result)
The NUKE-MARKER in domain/system-audit/ carries the same recipe. Add the watch row before the commit so its printed rollback SHA is the pre-change one.

**Seconds saved**

About 3.5 to 4.5 s on every boot where nothing changed (4.0-5.0 s today, about 0.4-0.5 s after). Estimate, not measured: the floor for a wrapped boot hook is 0.33-0.39 s (handoff table: evolution-check-trigger, system-check-trigger, boot-load-verification) and a stat-only pass over about 190 files is comparable to hook-syntax-check's warm 0.13-0.22 s in-process. 0 s saved on the one boot after each hook change. The same saving applies each time SessionStart fires mid-session (resume, compaction).

**Characters saved**

The whole findings block on every unchanged boot (or all but about 120 chars if the one-line option is chosen). Size not measured (read-only). Upper bound about 2,870 chars: 24,884 total boot chars minus 14,596 (claude-md-watch) minus 7,421 (open-quest-surfacer), shared with seven other scripts. It prints at every boot today: all 38 telemetry rows read from the 2026-10 files carry the findings heading.

**Confidence**: 79%

**Files to change**

- ROOT = C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore (paths below are relative to it; build in the session worktree, live only after main is fast-forwarded because hooks run from MAIN)
- core/forge.js:403 - skip domain/*/cache.json in install safety 2 (prerequisite; otherwise the install is refused because domain/hook-syntax-check/cache.json names the old path)
- core/forge.eval.js - one fixture for that skip
- .claude/hooks/system-audit.js -> domain/system-audit/system-audit.hook.js (moved by forge install, then changed: fingerprint gate, cache, log row, --full, SELF_NAME from the filename, footer path at line 485, header)
- domain/system-audit/README.md (created by forge; then footprint, trigger moment, goal_signal, v2 note, state-scoped: no, pointer to .claude/skills/system-audit/SKILL.md)
- domain/system-audit/NUKE-MARKER.md (created by forge)
- domain/system-audit/system-audit.eval.js (install pin from forge, then the behaviour fixtures)
- domain/system-audit/cache.json and log.jsonl (new at runtime, both already git-ignored)
- .claude/settings.json:11 (rewritten by forge: new path + telemetry name; still one SessionStart entry)
- lib/audit-briefing.js:107-112 - spawn the audit with --full, add `structure:` rows to NOT WORKING; header comment lines 11-14
- .claude/skills/system-audit/SKILL.md - one line: the screen now carries the structure rows
- Feature/Domain-Expansion/expansion-protocol.md - line 67 ("Boot check system-audit CHECK 9" -> the session-close audit in step 7.4, before step 10) and the step 7.4 body (lines 170-174, one sentence)
- .claude/skills/domain-expansion/SKILL.md:42 - row 7.4, one clause
- .claude/CLAUDE.md:119 and :121 - both name `system-audit.js` inside the "Triggered enforcement" window; after the move CHECK 5 would report it as claimed-but-unregistered and INV-6 would report the dead path, so re-point to domain/system-audit/system-audit.hook.js and reword "fires at every SessionStart"; version bump to v1.79
- system/claude-md-changelog.md - the v1.79 entry, naming the dropped spec ("every SessionStart") and why
- system/system-architecture.md - section 3.0 regenerated with `node system/sync-hook-catalog.js`; row at line 205; lines 552 and 563 ("sees this at every SessionStart; absence = broke" is retired, liveness is now the log row); lines 585 and 622; section 9 sync row
- system/FOLDER-STRUCTURE.md:3 - "flags it at every boot" -> at session close and after a hook change
- domain/nul-redirect-gate/README.md:5 and :16 - goal_signal and detect side: new path, "at session close" instead of "at SessionStart"
- domain/claude-md-watch/README.md:19 - gate command becomes `node domain/system-audit/system-audit.hook.js --full`
- lib/folder-structure.js:7 - comment names the old path
- .claude/auto-memory/feedback_bash_tool.md:18 - "CHECK 10 (boot detect)" -> session-close detect
- REGISTRY.md and system/feature-census.md - regenerated (`node core/registry.js`, `node lib/feature-census.js`; expected census verdict PROPER)
- main/handoff-2026-10-05-boot-structure-audit.md section 5 row + main/current-session.md + a `node lib/watch.js add` row BEFORE the commit (change record)
- NOT changed (checked): Feature/Session-Briefing-System/session-briefing.md (no reference), CLAUDE.md boot order step 5 (does not name the audit), lib/change-checklist.js:80 (label only), lib/observatory.js:950 (its key normalises `system-audit.hook` back to `system-audit`, line 48), the `system-audit: skip-ghost-check` marker text in other hooks (name kept)

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network | handled - the script has no network call and no child process; lib/states.js check() and lib/folder-structure.js check() only read files |
| 2 | Two sessions boot at the same time right after a hook change | handled - both see a changed fingerprint, both run the full audit, both write the same cache; a torn read fails to parse and is treated as an empty cache (full run). Fixture: corrupt cache |
| 3 | A worktree session | handled - hooks execute from MAIN (handoff section 7; MAIN's hook-syntax-check log has the real boot rows, the worktree's has two manual rows only), so the boot gate reads MAIN's cache. A hook changed only in the worktree is audited at session close, because audit-briefing spawns the copy in its own checkout; it is audited again on the first boot after the merge reaches main. Fixture: CLAUDE_PROJECT_DIR pointing at another root |
| 4 | First prompt is not about tickets, or the session is for a non-etanah project | handled - the audit is about the system, not tickets; an unchanged boot prints nothing and costs about 0.4 s (estimate) |
| 5 | First prompt IS a ticket number | handled - nothing here runs on UserPromptSubmit; ticket-gate is untouched. On a change boot the full audit finishes during SessionStart, before the prompt |
| 6 | Cache from yesterday or from three weeks ago | accepted risk - no age expiry by design (owner rejected a clock). An old cache with an equal fingerprint is still correct for the hook checks. The six non-hook checks are only as fresh as the last session close; they run before every close commit |
| 7 | A hook file is renamed or moved (including the audit itself, or a forge install of another hook) | fixture needed - a rename changes the file list, so the fingerprint changes and the full audit runs; SELF_NAME is taken from the file's own name so CHECK 1 follows a rename |
| 8 | The trigger text appears inside quoted output or a pasted log | handled - the trigger is a file fingerprint and a CLI flag; no text is matched. Pre-existing and unchanged: the skip-marker regex matches the marker anywhere in a hook body (the audit's own header at line 27 already matches itself) |
| 9 | A new unregistered .hook.js arrives through a git merge; settings.json is untouched | fixture needed - the file list is in the fingerprint, so the next boot reports GHOST HOOKS. This is the case a registered-files-only cache would miss |
| 10 | miya removes a registration from settings.json by hand | fixture needed - settings.json is in the fingerprint; next boot names the ghost |
| 11 | A bundle manifest gains or loses a child, or settings.local.json gains a hooks block | fixture needed - both files are in the fingerprint; full run reports DANGLING or SCOPE |
| 12 | Cache file missing, empty, deleted by housekeeping, or a fresh checkout | fixture needed - treated as changed: full run, printed as today, cache written. Never a silent skip |
| 13 | settings.json unreadable or half-written at boot | fixture needed - fingerprint cannot be trusted, so the full audit runs and the cache is not written; next boot runs again |
| 14 | OneDrive re-syncs and touches the mtime of many hook files without changing content | accepted risk - one extra full run (4-5 s), then the cache settles. Same signal hook-syntax-check v2 relies on, and its log shows 0 re-checks on real boots |
| 15 | A hook body changes but size and mtime stay the same | accepted risk - missed at boot, caught at session close. Cannot create a ghost or dangling registration |
| 16 | SessionStart fires again mid-session (resume or compaction; telemetry rows carry a turn_id) | handled - unchanged fingerprint, so about 0.4 s and no text instead of 6-18 s and the findings block each time |
| 17 | The session is abandoned and Domain Expansion never runs | accepted risk - the non-hook checks wait for the next close or the next hook change. No commit happens without Domain Expansion step 10, and step 7.4 runs before it |
| 18 | /system-audit was run in the morning, so close gate C6 (12 h window) is already satisfied in the evening | accepted risk - C6 proves the screen ran within 12 h, not at close; step 7.4 still orders the run |
| 19 | The audit spawn inside audit-briefing times out on a cold OneDrive (telemetry shows runs up to 22.7 s) | fixture needed - 60 s timeout; on failure the screen prints `structure audit did not run` under NOT WORKING, never a silent `none` |
| 20 | The observatory app builds a snapshot (lib/observatory.js:355 calls gather()) | handled - the spawn sits in audit-briefing's CLI block, not in gather(), so dashboards do not pay 4-5 s per snapshot. Fixture: gather() spawns nothing |
| 21 | The simplest instruction it could invert: "boot no longer shows system-audit, is it broken?" | handled - one log row per boot (ran:false) plus the wrapper telemetry row; a hook that stops firing is listed by the audit screen as never fired. The old doc line "absence = broke" (system-architecture.md:563) is re-pointed |
| 22 | The install step alone lands on main before the change step | handled by order - without the SELF_NAME and CLAUDE.md fixes the installed script would print a false SELF ghost and a false doc drift, so install and change go to main in one fast-forward |

**Decisions the designer raised**

- On a boot where no hook file and no settings.json changed, what should the audit print?
  - Nothing, ever
  - One line, only while a hook-wiring problem from the last run is still open (ghost, dangling, hooks in settings.local.json, CLAUDE.md naming an unregistered hook)
  - The last findings block again, read from the cache (same text as today, without the wait)
  - Recommended: One line, only while a hook-wiring problem from the last run is still open. A ghost or dangling gate means a check that ticket work relies on is not running. One line (about 120 chars) keeps it visible until fixed; a clean system prints nothing. It costs no time because the counts are in the cache.
- Six of the checks are not about hooks: OneDrive conflict copies, Windows-reserved file names, root orphans, active.txt status and type values, state literals, skill tokens. With the agreed trigger they run at session close and on the boot after a hook change, no longer at every boot. Accept?
  - Yes: session close (before the commit) plus the boot after a hook change
  - No: keep the OneDrive conflict-copy and reserved-name scan at every boot
  - Recommended: Yes: session close (before the commit) plus the boot after a hook change. The close run sits at Domain Expansion step 7.4, before step 10's git add -A, which is the exact moment the conflict copy was committed on 2026-08-03. Keeping the tree scan at every boot keeps the seconds this change is meant to remove (the per-check split is not measured).
- At session close, where should the structure findings appear?
  - Inside the audit screen you already read, as `structure:` rows under NOT WORKING
  - As a separate block under the audit screen
  - Recommended: Inside the audit screen you already read, as `structure:` rows under NOT WORKING. One screen, one command, and the close gate (C6) already refuses to close without it. A separate block would be a second thing to run and paste.


### 2.7 domain/adhoc-lifecycle/adhoc-lifecycle.check.hook.js

**Angle**: The simplest design that honours the agreed direction: take the weekly list off boot and delete it; make "archive at close" a step of the adhoc-save skill, proven by the audit that already ends every adhoc save round. No new hook, no new file kind, no cache.

**Trigger moment**

The adhoc-save round in which an adhoc stops being open: its register Status cell is written ANSWERED / RESOLVED / OWNED-ELSEWHERE / LATENT (or TICKETED after promote), so its block status leaves active/hold/blocked/delegated (the audit's own predicate, lib/adhoc-save-audit.js:36 and :69).

Why this is the leanest trigger: it happens once per adhoc, inside a skill that is already loaded, at the only moment a folder becomes movable. Boot learns nothing new about adhocs.

Why boot was the wrong moment (verified on the main checkout today, read-only):
- The hook counts Status WORDS in the registers (hook :34, :44). Today that is 25 rows (24 Melaka, 1 Perak). 24 of the 25 have no open block left; only A26 (ADHOC-FLOWABLE-2026-1, row RESOLVED, block still active) is a real open case. Two of the three "open" matches were row-id collisions with Terengganu rows A1/A2.
- An archived row keeps its closing word forever, and `adhoc-lifecycle.js archive` itself writes OWNED-ELSEWHERE (CLI :177), so the count can never reach zero.
- The folders that really pile up are a different set the hook cannot see: Melaka has 19 live "AH" Task folders = 11 with an open block, 1 whose block is archived as answered (#237), 7 with no block at all (#111, 138, 142, 146, 149, 194, 244).
- Its stated harm ("clutter active surfacing", hook :58) is not true in code: the ticket-time reader only surfaces OPEN/LATENT rows (domain/adhoc-register/adhoc-register.check.hook.js:69).
- It ran (519 telemetry rows, 5 with fired:true), and its output was already recorded as ignored (system/agentic-ticket-workflow-assessment-2026-08-24.md:10).

**Mechanism**

1. OFF BOOT. Remove the SessionStart entry (.claude/settings.json:45-48; main has 10 SessionStart commands, this makes 9). Delete the hook file and its guard file `.last-sweep-week`. The guard is tracked in git (git ls-files lists it; main shows ` M`; committed value 2026-W40, disk 2026-W41) although README.md:48 says "not committed", so the hook dirties a tracked file every new week. No cache is introduced, so there is no staleness to show and no empty-cache case.

2. AT CLOSE (the real fix). The mover already exists: `node quest/archive-quest.js <ADHOC-ID>` accepts ADHOC ids (archive-quest.js:142-144) and moves the Task folder to Archive\ (:212-240), the project folder to archive\ (:254-283) and the block to active-archive.txt (:285-312), state-aware (:114-129). It was used for 10 adhocs since 2026-09-25 (domain/quest-bounty/log.jsonl) but the adhoc-save skill never names it. Add one short section to .claude/skills/adhoc-save/SKILL.md next to "Ticket arrives" (:54-55):
"Adhoc closed — the round that writes ANSWERED / RESOLVED / OWNED-ELSEWHERE / LATENT (or TICKETED, after promote) also archives in the same turn: node quest/archive-quest.js <ADHOC-ID> --allow-stub "<why nothing to harvest>" (leave the flag out when the qa_doc has a ## Bounty section). Then re-run the audit. Still waiting on someone: the Status stays OPEN and nothing moves."

3. ENFORCED by the audit that already ends every round (SKILL.md:50-51 "fix every FAIL"). lib/adhoc-save-audit.js gets ONE new check: when the block is not open, FAIL if task_folder exists, is not under \Archive\, and no open block claims the same folder. Fix text = the mover command (block still in active.txt) or a plain Move-Item plus the task_folder= edit (block already archived). Also correct the existing fix text at :70-71 ("move to active-archive.txt") to name the mover: the block-only move (`active-cli archive`, which moves block + project folder, quest/active-cli.js:100-113, never the Task folder) is how ADHOC-PT-2026-10 kept a live Task folder and still passes the audit today.

4. ONE SAFETY GUARD in quest/archive-quest.js: skip the video prune (Step 1.5, :242-252, a real delete) for ADHOC ids. Its justification (:43-47, "videos always remain on Redmine") is false for an adhoc, which has no Redmine ticket. Behaviour for QA ids is untouched. (Owner decision 2.)

5. LOGS (nothing new). Observability: the audit writes one row per run with the names of failing checks (system/telemetry/adhoc-save-audit.jsonl, audit :140-144; 110 rows today); the mover writes a receipt to domain/quest-bounty/log.jsonl (:354). Monitoring: goal_signal = the closing round's audit row has no "closed adhoc" fail; plus a watch (lib/watch.js) on the leftover count.

6. WHAT "ARCHIVE THE ROW" MEANS HERE: the adhoc's block moves from quest/active.txt to quest/active-archive.txt. The register row stays in ADHOC-REGISTER.md with its final Status (the register's own rule, melaka/ADHOC-REGISTER.md:38 "the row is not deleted"), so "did we check this already?" and Door A `match` keep working.

7. INSTALL-FIRST: nothing to install. adhoc-lifecycle is already a Feature (forge-born 2026-08-19; system/feature-census.md:228 PROPER); `forge install` would refuse it (core/forge.js:365). The change opens with `node core/forge.js refine adhoc-lifecycle --nod "<owner's words>"` (forge.js:280-299). The CLI (match / promote / archive / unarchive / sweep) stays; `sweep` remains an on-demand list by Status word.

8. ONE-TIME BACKLOG PASS in the same build (owner decision 3): the 9 leftover Melaka adhoc folders.

Not verified by running: no hook, eval or script was executed (read-only brief). Note for the controller: during this task `git worktree list` on main stopped listing this worktree (git -C <worktree> now fails) and main HEAD is ac7b29b6, newer than 6beed4ba; the files are still on disk.

**Joins existing**

.claude/skills/adhoc-save/SKILL.md:48-55 (the "Each round" steps and the "Ticket arrives" section) + lib/adhoc-save-audit.js:69-71 (isOpen and the "block: open ↔ file location" check; the new check goes after :131). The mover it names is quest/archive-quest.js:142 (ADHOC ids accepted). Nothing joins a UserPromptSubmit or Stop bundle.

**Boot after**

Nothing from this script. The block that used to appear on the first boot of each ISO week is gone:
"🧹 adhoc-lifecycle (weekly): 25 terminal-status adhoc row(s) ripe for archive — melaka:A2, melaka:A4, melaka:A6, melaka:A8 …" plus four help lines.
What he sees instead, at the moment an adhoc is closed, is the mover's existing line in the reply: "📦 Archive hygiene — ADHOC-…: folder→Archive\ ✓ · active.txt block→active-archive.txt ✓ · project subfolder ✓ …" followed by "adhoc saved → ADHOC-…: audit N/N PASS".

**Briefing impact**

None. The Session Briefing never used this output: Feature/Session-Briefing-System/session-briefing.md has no reference (grep for adhoc|ripe|sweep finds only an unrelated worktree line at :58), .claude/CLAUDE.md boot order has none, and no file reads the hook's text or the guard file (only the hook itself, its eval, its README/NUKE-MARKER and generated dashboards name it). Open adhocs still reach the briefing the way they do today, as blocks in quest/active.txt.

**Daily-work risk**

Worst case: a Task folder he is still using leaves the live list, or a video with no other copy is deleted.
- Folder moved too early: the move happens only when the block status is no longer open. An adhoc that is answered but waiting on someone stays "OPEN — …" (as A41 and A42 do today), so its folder stays. The move is a rename into Archive\, reversible by moving it back; `adhoc-lifecycle.js unarchive --row` restores the Status.
- Ticketed adhoc whose folder the new ticket's quest uses: the audit check exempts a folder claimed by an open block.
- Video loss: the mover deletes videos from an archived folder (archive-quest.js:242-252). For an adhoc there is no Redmine copy, so the design adds a guard that skips the prune for ADHOC ids (decision 2). This prune already ran on the adhocs archived since 2026-09-25.
- Ticket work itself is untouched: the audit only accepts ADHOC ids (adhoc-save-audit.js:25); the mover's behaviour for QA ids does not change; the ticket-time register reader (adhoc-register) is not modified and register rows are not removed.
- Mover fails half-way: Task folder move is the first write (:225); if it throws nothing else has moved, the block stays in active.txt and the audit keeps failing until it is re-run.

**Eval plan**

Fires at the right moment / not otherwise (lib/adhoc-save-audit.eval.js, existing temp-root harness):
- E25 closed adhoc, block in active-archive.txt, Task folder under tasks\Archive\ → exit 0, PASS line for the new check.
- E26 same but Task folder still at the live path → exit 1, 'FAIL  closed adhoc' with the Move-Item fix text.
- E27 closed adhoc, live folder claimed by another OPEN block → PASS (taken over by the ticket's quest).
- E28 closed status, block still in active.txt, folder live → exit 1 and the fix text names quest/archive-quest.js (this is E6 with the new text).
- E29 OPEN adhoc (status=hold, cell "OPEN — answered; awaiting BA") with a live folder → new check not evaluated, exit 0.
- Spec preservation: E7, E22, E23, E24 get the folder under Archive\ in setup; their assertions do not change. Named in the skill's history line.

Mover (quest/archive-quest.eval.js, existing --tasks sandbox): an ADHOC id with --allow-stub moves Task folder, project folder and block and exits 0; run twice = no-op; a video inside an adhoc folder survives while the existing QA prune fixture stays green.

Off boot (domain/adhoc-lifecycle/adhoc-lifecycle.eval.js): hook file absent, settings.json has no 'adhoc-lifecycle.check.hook', README has registration: none; F1-F9 (CLI) unchanged.

Fire + effect on real data: `node quest/archive-quest.js ADHOC-FLOWABLE-2026-1 --dry-run` prints the three moves; the audit on that id shows the FAIL before the real run and PASS after.

Regression: node system/sync-hook-catalog.js --check exits 0; node lib/feature-census.js still shows domain/adhoc-lifecycle PROPER; the four touched evals green in node lib/eval-battery.js.

Timing before/after:
- Before: hook-fires telemetry for 'adhoc-lifecycle' — 519 rows; last 7 days n=89, average 68 ms, median 7 ms, max 2,084 ms inside the hook; 0.2 s wall-clock per the handoff.
- After: zero new 'adhoc-lifecycle' rows after the cut; SessionStart commands 10 → 9; one measured boot with the batch-1 method.
- Audit cost: 61-152 ms per run in the last rows of adhoc-save-audit.jsonl; re-measure (the new check adds one existsSync and one scan of blocks already parsed).

Goal measure (was the goal met): leftover adhoc folders. Before, Melaka, 2026-10-05: 19 live AH folders = 11 open (one of them, #175, has a RESOLVED row) + 1 archived-as-answered (#237) + 7 with no block. After the backlog pass: live AH folders = open adhoc blocks. The watch re-counts after 14 days and checks that 'closed adhoc' appears in adhoc-save-audit.jsonl fails only inside a closing round.

**Rollback**

git revert <commit of this change>
node system/sync-hook-catalog.js
(The revert restores the hook file, its guard file, the SessionStart entry, the audit, the skill and the video-prune behaviour. Folders already moved to Archive\ stay there.)

**Seconds saved**

About 0.2 s per boot (one node process fewer). The hook's own work is small: median 7 ms, average 68 ms over the last 7 days (n=89, max 2,084 ms).

**Characters saved**

0 on a normal boot (the hook is silent, guard already stamped). About 450 characters on the first boot of each ISO week (the 5-line weekly block).

**Confidence**: 85%

**Files to change**

- core/forge.js refine adhoc-lifecycle --nod "..." (run first; appends a refine-opened row to system/registry.jsonl; no forge install needed, already PROPER)
- .claude/settings.json:45-48 — remove the adhoc-lifecycle SessionStart command
- domain/adhoc-lifecycle/adhoc-lifecycle.check.hook.js — delete (git rm)
- domain/adhoc-lifecycle/.last-sweep-week — delete (git rm; it is tracked)
- domain/adhoc-lifecycle/adhoc-lifecycle.eval.js — drop HOOK const (:13) and F10 (:73-75); add a fixture: hook file absent + no 'adhoc-lifecycle.check.hook' in settings.json
- domain/adhoc-lifecycle/README.md — Door B row marked retired with the one-line reason; Events = none (CLI only); replace 'Why boot, not Domain Expansion' (:46-48); new goal / goal_signal; add the missing footprint: line (on-demand) and registration: none; note that sweep lists by Status word
- domain/adhoc-lifecycle/NUKE-MARKER.md — Files and Rollback rows (:7-8) no longer name the SessionStart entry or the guard file
- lib/adhoc-save-audit.js — new check 'closed adhoc: Task folder moved to Archive' after :131; fix text at :70-71 names quest/archive-quest.js
- lib/adhoc-save-audit.eval.js — new fixtures E25-E29; fixtures E7, E22, E23, E24 place the Task folder under Archive\ in setup (assertions unchanged); E6 expects the new fix text
- .claude/skills/adhoc-save/SKILL.md — new 'Adhoc closed' section beside :54-55, the same mover named in the 'Ticket arrives' line, and a dated history line with the spec-preservation note
- .claude/skills/adhoc-save/adhoc-save.eval.md — add row 6 (close -> mover -> audit green) and correct the fixture count line
- quest/archive-quest.js — one guard: no video prune (Step 1.5, :242-252) when the id starts with ADHOC- (only if decision 2 = keep)
- quest/archive-quest.eval.js — +2 fixtures: an ADHOC id archives all three parts with --allow-stub; a video in an adhoc folder survives
- system/system-architecture.md — regenerate section 3.0 with node system/sync-hook-catalog.js (row at :60 disappears) and add a dated section 9 row
- main/handoff-2026-10-05-boot-structure-audit.md:69 — status of the adhoc-lifecycle row
- main/todo.md:42 (batch 2 worklist) and :185 (9g, per decision 5)
- main/current-session.md + the day's diary + the Boot sequence artifact (system/INDEX.md 'Change record' rows)
- node lib/watch.js add --target lib/adhoc-save-audit.js --observe "..." BEFORE the commit
- Regenerated, never hand-edited: system/feature-census.md, system/liveness-dashboard.md, system/monitoring-dashboard.md
- No change needed (checked, zero references): .claude/CLAUDE.md, Feature/Session-Briefing-System/session-briefing.md, Feature/Domain-Expansion/expansion-protocol.md, lib/observatory.js:930 (group member name stays; the Feature still exists)

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network or VPN at the moment of close | handled — the mover and the audit are local file operations; the Redmine check inside active-cli skips an id with no ticket number (quest/redmine-status-check.js:81-82) and otherwise times out at 6 s and resolves null (:39-51) |
| 2 | Two sessions close two different adhocs at the same time | accepted risk — active-cli writes are atomic (tmp + rename, active-cli.js:115-119) but read-modify-write is not locked, so one block move can be lost; the other adhoc's audit then FAILs ('exactly one block' or 'open ↔ file location') and names the fix. Same exposure exists today for every quest command |
| 3 | Two sessions close the SAME adhoc | fixture needed — second run finds the block already archived and is a no-op (Step 3 skips, :287-289); pin it in archive-quest.eval.js with the ADHOC fixture run twice |
| 4 | Session runs in a worktree | handled — archive-quest (:35), active-cli (:21-22) and the audit (states.mainRoot, audit :29) all resolve the main checkout; no hook is involved any more, so the 'hooks run from main' caveat does not apply |
| 5 | First prompt is not about tickets, or the session is for a non-etanah project | handled — nothing runs at boot or on prompts; the check exists only inside an adhoc-save round |
| 6 | First prompt IS a ticket number | handled — unchanged path: adhoc-register (UserPromptSubmit) still injects OPEN/LATENT rows; this design removes nothing it reads and deletes no register row |
| 7 | Cache from yesterday / stale weekly guard | handled — no cache exists in the design; the only state file (.last-sweep-week) is deleted |
| 8 | Hook file deleted but the settings.json entry left behind (or renamed file) | fixture needed — every boot would print a module-not-found error; same commit removes both, and the adhoc-lifecycle eval asserts file absent + no registration string; sync-hook-catalog --check must exit 0 |
| 9 | Trigger text inside quoted output: a BA paste containing RESOLVED, or an OPEN cell that says 'answered' or 'owned elsewhere' | handled — the check keys on the block's status= field (audit :69), never on free text; A41 and A45 carry those lowercase words in OPEN cells today and stay open. Fixture E29 pins it |
| 10 | Status written as closed too early; he still needs the folder | accepted risk — reversible rename; decision 1 lets him choose 'move only when I say close' |
| 11 | TICKETED adhoc whose Task folder was renamed or taken over by the new ticket's quest | fixture needed (E27) — a folder claimed by an open block is exempt; a renamed folder no longer exists at the adhoc path so nothing is demanded by the new check |
| 12 | Adhoc Task folder contains a BA video | fixture needed — without the guard the mover deletes it (archive-quest.js:61, :248) and an adhoc has no Redmine copy; guard + fixture 'video survives for ADHOC id' |
| 13 | Mover refuses: no ## Bounty and no --allow-stub | handled — exit 3 before any move (:173-180); the skill line shows the flag; the audit keeps failing until it is done |
| 14 | Folder name with square brackets such as [FAT] | handled — Node fs.existsSync / renameSync take paths literally (the wildcard problem is PowerShell-only) |
| 15 | Task folder open in Explorer or mid OneDrive sync, rename fails | handled — renameSync at :225 throws before anything else moved; block stays in active.txt; audit FAIL remains; re-run |
| 16 | Terengganu or Perak adhoc | fixture needed — the mover takes the Tasks root from the block's own task_folder (:114-129) so it lands in that state's Archive; the audit needs --state <key> for the register check (default is the reference state, echoed at :32) |
| 17 | Same row id in two states (Terengganu A1/A2 vs Perak A1 / Melaka A2) | handled — the new check never uses row ids to decide about folders; the old hook mixed them (2 of its 3 'open' matches today were such collisions) |
| 18 | Legacy adhoc whose project folder is slug-named (e.g. ADHOC-pptpb-alorgajah-jt-delete) | accepted risk — the mover only moves active/<ADHOC-ID>/ (:255); legacy slugs are handled by `adhoc-lifecycle.js archive\|promote --slug`, which stays. New adhocs use <ADHOC-ID>/ (SKILL.md:21). The new check looks at the Task folder only |
| 19 | Block already archived by the block-only command, Task folder left live (ADHOC-PT-2026-10 today) | fixture needed (E26) — the new check FAILs; the mover cannot repair it because it reads task_folder from the active block only (:84-92, :210), so the fix text gives Move-Item + the task_folder= edit. Prevented going forward by the corrected fix text at audit :70-71 |
| 20 | An adhoc is closed without the adhoc-save skill running at all | accepted risk — no boot net remains. Existing backstops: adhoc-paste-detector injects 'every save round → audit' (adhoc-paste-detector.check.hook.js:136-137); Domain Expansion re-audits the day's adhocs (SKILL.md:44); the watch counts leftovers |
| 21 | Someone runs `adhoc-lifecycle.js sweep` expecting a to-do list | handled — the CLI is kept and unchanged; README states it lists by Status word and includes rows already archived |
| 22 | The Feature's own eval touches live state | handled — today F10 spawns the real hook with the real environment (eval :74), which stamps the real guard and writes a telemetry row; F10 goes away with the hook |
| 23 | Rollback after some adhocs were archived under the new flow | accepted risk — git revert restores the boot hook and the old audit; folders already moved stay in Archive\ (data, moved back by hand if wanted) |

**Decisions the designer raised**

- When should an adhoc's Task folder move to Archive?
  - A. The moment I write a closing Status (ANSWERED / RESOLVED / OWNED-ELSEWHERE / LATENT / TICKETED), without asking
  - B. Only when you say 'close adhoc X' or 'archive X'
  - Recommended: A. It is the agreed direction (move the folder when an adhoc is closed). An adhoc that is answered but still waiting on someone already stays 'OPEN — …', so its folder stays. The move is a rename and can be undone.
- Videos inside an adhoc Task folder when it is archived: keep or delete?
  - A. Keep them (skip the video prune for adhocs)
  - B. Delete them, same as ticket folders
  - Recommended: A. The mover deletes videos because a ticket's videos stay on Redmine. An adhoc has no Redmine ticket, so its video has no other copy. This prune already ran on the adhocs archived since 2026-09-25.
- One-time cleanup of the 9 leftover adhoc folders in Melaka (7 with no block: #111, 138, 142, 146, 149, 194, 244 · #237 block archived as answered · #175 row RESOLVED but block still active)?
  - A. I match each folder to its register row, show you the list, and move the ones you tick
  - B. Leave them where they are
  - Recommended: A. They were closed before this fix, so nothing will ever move them. They are your folders and 7 have no block to prove their status, so you tick.
- Most of the 'many task folders' are ticket folders, not adhocs: 61 of the 80 live Melaka folders (36 whose block is already in the archive file as closed, 9 closed in active.txt, 10 with no block, 6 open). This script never touched them. Clean them too?
  - A. Yes, as a separate task: run the existing 'close reconcile' pass, where the Redmine status decides
  - B. Leave them; they wait for Redmine Closed
  - Recommended: A, as a separate task after batch 2. It changes what you see in the Tasks folder far more than the adhoc fix does, and the 2026-10-04 rule (archive only when Redmine is Closed) already governs it.
- Your 2026-09-06 ask, still parked in todo (9g): 'adhoc that goes unknown will be archived automatically after a week and a half'. It was going to ride on this weekly boot list. Where does it go now?
  - A. Keep it parked; when built, it is a short list at Domain Expansion (never at boot)
  - B. Build it now at Domain Expansion
  - C. Drop it
  - Recommended: A. It is a separate behaviour (stale OPEN adhocs, not closed ones). Keeping this change small means only re-pointing the todo row so the idea is not lost with the hook.


### 2.8 .claude/hooks/open-quest-surfacer.js (SessionStart, 7th of 10; .claude/settings.json:33-36)

**Angle**: SIGNAL-FIRST: no boot work at all. The board is fetched live at the first ticket, quest or board signal of a session, and on request. The only stored copy is a last-good snapshot, shown only when a live fetch fails, with its date, time and age.

**Trigger moment**

The first prompt of a session-day that carries a ticket, quest or board signal (UserPromptSubmit, before the model reads that prompt).

Why this is the leanest trigger that still catches the need:
- The reply that needs the board (the briefing, or the first ticket reply) is the reply to that same prompt, so the block lands just before it is needed.
- Boot is what the owner rejected: it loads in every session, including other-project ones.
- A later trigger (a skill step telling the model to run the board) depends on the model remembering. The hook's own comment records that lesson (open-quest-surfacer.js:59-60, 2026-07-22).
- Once per session-day, not per prompt: the Days column changes at midnight, so the day is the natural refresh boundary.

Signals (all taken from lists that already exist, none invented):
- a ticket number in any form ticket-gate already recognises (ticket-gate.js:186 prefixed number, :195-203 bare number that matches a qa= block) plus the '#NNNNN' form (etanah-intake-gate.check.hook.js:24)
- a Redmine retrieval phrase (ticket-gate.js:188)
- a board ask from the list-redmine skill's own trigger list (list-redmine/SKILL.md:3)
- /quest, /sweep, /retrieve-redmine, /list-redmine, /brief
On request: /list-redmine (unchanged, runs node quest/redmine-board.js) or the hook with --now (full block).

**Mechanism**

Order: install first, change after.

PRE-STEP (blocker the reader missed, verified by reading, forge not run): forge install will REFUSE today. MAIN's domain/hook-syntax-check/cache.json line 1 holds the key ".claude/hooks/open-quest-surfacer.js". forge.js:399-412 scans .json files under domain/ and treats a non-comment line naming the old path as a code referencer. Fix: delete that cache file before the install (retention: regenerate; next boot re-checks cold, 13-18 s once per the handoff), or add a one-line skip of domain/*/cache.json at forge.js:403. Every remaining loose-hook install in batch 2 hits the same wall.

STEP 1, install unchanged: node core/forge.js install hook .claude/hooks/open-quest-surfacer.js with --symptom (2026-05-25 briefing missed QA-262783 and QA-262869 because the Read tool cut active.txt at line 309 of 640; 2026-08-04 boot showed 3 open when 8 were assigned), --goal (a briefing never omits one of his open tickets and never shows one Redmine has closed or reassigned), --signal, --retention "rotate monthly", --footprint "per-session: 1 node + 1 child node + Redmine GETs, 5-13 s at every boot", --nod. Result: domain/open-quest-surfacer/open-quest-surfacer.hook.js + README + NUKE-MARKER + install eval; the SessionStart entry is re-pointed. Lines 28 and 153 use the two-levels-up form forge allows (forge.js:385-388).

STEP 2, change (forge refine open-quest-surfacer):
1. Registration: remove the SessionStart entry; add the hook as 4th child of domain/bundles/upsm-mode.json. No new registration (system-rules Rule 7).
2. Predicate: read stdin JSON; no signal = exit silent, no network, no log row. Ignored: prompt over 20,000 chars, prompt containing the hook's own headings, a Workflow-harness computed prompt, a live system/orchestration-mode.flag (same guards as handoff-load.check.hook.js:32-33).
3. Guard: once per session per calendar day. Marker = session id + date inside domain/open-quest-surfacer/cache.json, pruned to today on each write.
4. On signal: print today's block unchanged (OPEN QUESTS list, RANK_RULE, live board, checkAll, checkMissing) with one added header line giving the fetch time.
5. Failed fetch (child throws, takes over 20 s, or output lacks the three table headings; redmine-board.js:552-555 exits 0 with a warning): print "LIVE BOARD UNAVAILABLE (reason). Last good board saved <date time>, <N> h old, may be wrong" plus the saved text. No saved copy = today's line "live board unavailable, fall back to quest/active.txt". The session is marked so later prompts do not wait again.
6. Cache: domain/open-quest-surfacer/cache.json (already git-ignored by .gitignore:104, same shape as hook-syntax-check). Retention: regenerate. Written temp-then-rename after every good fetch. Never shown when the live fetch works. Empty or corrupt = treated as no copy.
7. --now flag: prints the block regardless of predicate and marker (briefing on request, after compaction, eval entry).
8. Log: one row per signal hit in domain/open-quest-surfacer/log.jsonl (ts, session, signal class, outcome printed / already-today / fallback / no-fallback, dur_ms, chars, open count). Retention: rotate monthly.
9. Small fixes in the same pass: resolve MAIN root with the ticket-gate.js:32 idiom (active.txt, cache, log live only in main); windowsHide on the board spawn (analog protime-plan.js:130); remove the early return at lines 136-139, which today skips the board and the missing-ticket check when active.txt has zero open blocks.

Footprint after: per-prompt: 1 short node process inside the existing upsm-mode bundle (regex only; siblings there measure 0.9-1.7 s wall under load, run in parallel); on the first signal of a session-day: +1 child node + Redmine GETs, 5-13 s once. redmine-board.js, redmine-status-check.js, ticket-gate.js and the dispatcher are not touched.

**Joins existing**

domain/bundles/upsm-mode.json lines 2-4 (children array: mode-detector, quest-active-grounding, handoff-load) gets a 4th child. That bundle is already dispatched on every prompt by .claude/settings.json:143-146 (lib/dispatch-hooks.js --manifest domain/bundles/upsm-mode.json --event UserPromptSubmit). system-audit already counts bundle children as registered (system-audit.js:80-95). On-request path joins .claude/skills/list-redmine/SKILL.md:14-18 (command unchanged).

**Boot after**

From this script: nothing. No OPEN QUESTS list, no board, no Redmine call.

In the Session Briefing, when his first message has no ticket signal, one fixed row replaces the ticket content (if he picks decision 1 = A):
| Quest status | not loaded. Name a ticket or say "board". |

When his first message already names a ticket or asks for the board, the first reply carries the full board exactly as today (the block is injected on that prompt, before the reply).

**Briefing impact**

Keeps:
- Every ticket session still gets the same block, same text, same three tables, same drift and missing-ticket checks. It arrives on the first ticket/quest/board prompt instead of at boot.
- If that prompt is the first one of the session, the briefing is identical to today's.
- The rule "a briefing that omits one of his open tickets is a verify failure" still binds, because it is printed inside the block (hook line 145, RANK_RULE line 54, redmine-status-check.js:192).
- A briefing asked later ("briefing", "where were we") gets the block from context, or from the hook with --now if it is not there.

Loses:
- A boot briefing in a session with no ticket signal has no ticket content. It shows the pointer row.
- CLAUDE.md step 5 still tells the model to Read quest/active.txt and run the quest reconciliation scan at boot (lines 16 and 18). That is prose, separate from this script, and it also loads ticket state in other-project sessions. It moves behind the same signal only if the owner picks decision 1 = A.
- After a context compaction the block is not re-printed (today SessionStart re-prints it: telemetry shows mid-session SessionStart rows). /list-redmine or --now brings it back.

Second nets that do not depend on this hook: active-cli start/update/archive check Redmine at the moment quest state changes (redmine-status-check.js:9-11); Domain Expansion close is blocked unless quest/redmine-reconcile.js ran within 12 h (de-close-gate C4).

**Daily-work risk**

Worst case: he starts ticket work and the board never loads, so a briefing or a "what next" answer is built without it: an open ticket is omitted, or he works a ticket Redmine already closed or reassigned.

How the design prevents it:
- The predicate is a superset of ticket-gate's signals, pinned by a fixture: every prompt that makes the quest gate fire must make the board fire.
- The briefing always says "not loaded" when it is not, so absence is visible, never silent.
- quest SKILL resume step gets one line: block not in context, run --now.
- Drift is still caught at quest state changes and at Domain Expansion close, independent of this hook.
- A failed fetch never prints nothing: last good board with its age, or the local list.

Second risk: a ticket assigned while he is in a non-ticket session is not shown until a signal. SLA is in hours (Critical 1, High 6 per reference_redmine_sla_hours). This design accepts it; it is decision 4.

Third risk: the first ticket prompt of a session waits 5-13 s (up to about 20 s offline, not measured) before the model starts. Once per session-day.

**Eval plan**

Harness: run the hook directly with stdin JSON. Env overrides for the active.txt path, cache path, log path and the board script (a stub that prints a canned board, prints the unreachable warning, or sleeps), and a stub for the status check. No fixture touches Redmine or the real telemetry.

Fires when it should:
- F3 'QA-282442' prints OPEN QUESTS + rule + board; log row printed; cache has last_good with a time stamp
- F7 bare number that matches a block prints; one that does not stays silent
- F8 board asks ('my tickets', 'the board', '/list-redmine') print
- F9 '/quest resume 282442' prints; F10 'check new tickets' prints
- F18 --now prints regardless of marker
- F21 superset pin: for a list of prompts, whenever ticket-gate emits context, the surfacer fires

Does not fire otherwise:
- F1 '{}' and empty stdin silent; F17 malformed stdin silent
- F2 other-project prompt: silent, stub board never spawned (sentinel file absent), no log row
- F4 second ticket prompt, same session, same day: silent
- F15 pasted block headings silent; F16 prompt over 20,000 chars silent
- F24 Workflow-harness prompt silent; F25 orchestration flag live silent

Guard and fallback:
- F5 marker dated yesterday prints again; F6 other session prints
- F11 board fails with a saved copy: prints 'last good' with date and age
- F12 board fails with no copy: today's unavailable line + local list
- F13 active.txt unreadable: warning, exit 0; F14 zero open blocks: board and missing check still run
- F19 two processes at once: both print, cache parses; F20 corrupt cache: treated as empty, rewritten

Wiring:
- I1-I3 install pins; F22 child present in upsm-mode.json; F23 no SessionStart command names the hook
- F26 dispatcher run on a temp root: merged additionalContext contains the board heading and the mode line; total chars recorded
- then: node system/sync-hook-catalog.js, node lib/feature-census.js (verdict PROPER), node lib/folder-structure.js map

Timing, before and after (from logs, per system-rules Rule 5):
- Before: telemetry rows hook=open-quest-surfacer event=SessionStart (30 rows 2026-09-30 to 10-02 range 5.1-13.2 s; reader's 7-day average 8.7 s over 88 fires; handoff single run 5.0 s)
- After: zero SessionStart rows for it; bundle rows open-quest-surfacer.hook on non-signal prompts (expect sibling range 0.9-1.7 s wall, own logic under 20 ms); Feature log dur_ms on printed rows (expect 5-13 s, once per session-day); boot total re-measured the batch-1 way (12.7 s now)
- One real-session smoke: first ticket prompt, confirm the reply can cite the last row of table 3 and the coverage line.

**Rollback**

git revert <change-SHA>   (back to the installed hook running at boot: SessionStart entry restored, bundle child removed)
git revert <install-SHA>   (back to the loose hook in .claude/hooks/)
Add the watch (node lib/watch.js add) before each commit so the printed rollback line is right. log.jsonl and cache.json are git-ignored and can stay.

**Seconds saved**

5.0 s by the handoff's single measured run. Telemetry says more: 30 SessionStart rows from 2026-09-30 to 10-02 range 5.1-13.2 s, and the reader's 7-day average is 8.7 s over 88 fires. Cost moved, not removed: 5-13 s once per session-day on the first ticket prompt, plus one short process per prompt inside the existing bundle.

**Characters saved**

7,421 characters at boot (handoff figure) go to 0. The same block appears once per session-day in ticket sessions only.

**Confidence**: 70%

**Files to change**

- PRE: domain/hook-syntax-check/cache.json (delete before install; it names the old path and makes forge refuse) OR core/forge.js:403 + core/forge.eval.js (skip domain/*/cache.json; helps every batch-2 install)
- INSTALL (forge moves/writes): .claude/hooks/open-quest-surfacer.js -> domain/open-quest-surfacer/open-quest-surfacer.hook.js; domain/open-quest-surfacer/README.md; NUKE-MARKER.md; open-quest-surfacer.eval.js; .claude/settings.json SessionStart entry re-pointed; system/registry.jsonl + system/slips.jsonl rows
- CHANGE: domain/open-quest-surfacer/open-quest-surfacer.hook.js (predicate, day guard, --now, last-good fallback, log row, MAIN-root, windowsHide, zero-open early return removed)
- CHANGE: domain/bundles/upsm-mode.json (add 4th child)
- CHANGE: .claude/settings.json (remove the SessionStart entry, lines 33-36 today)
- CHANGE: domain/open-quest-surfacer/README.md (v2 section, footprint, trigger moment, registration: 1 bundle manifest, state-scoped line: board home project is Melaka per redmine-board.js:30, other states via lib/states.js), NUKE-MARKER.md (rollback), open-quest-surfacer.eval.js (behaviour fixtures)
- NEW at first run, git-ignored: domain/open-quest-surfacer/log.jsonl, domain/open-quest-surfacer/cache.json
- DOC: Feature/Session-Briefing-System/session-briefing.md (line 74 mechanics step 1; line 27 Quest status row wording; line 119 'Read quest/active.txt'; version stamp)
- DOC: .claude/CLAUDE.md boot step 5 (line 16 'read quest/active.txt', line 18 quest autoscan, per owner decision 1) + version bump + system/claude-md-changelog.md entry, through domain/claude-md-watch/README.md pipeline
- DOC: .claude/skills/list-redmine/SKILL.md (line 3 description 'fires automatically at session boot', line 24 'boot shape', lines 89-91)
- DOC: .claude/skills/quest/SKILL.md line 154 ('open-quest-surfacer already gives boot awareness') + one line: if the OPEN QUESTS block is not in context, run the hook with --now
- DOC: .claude/skills/close-phase/SKILL.md lines 147 and 153 ('boot surfacer')
- DOC: quest/quest-protocol.md lines 969, 971, 1365 (briefing reads active.txt at boot)
- DOC: system/system-architecture.md lines 66, 211, 242, 514, 581, 604, 676 + section 9 sync row; then node system/sync-hook-catalog.js
- DOC: domain/checklist-reactivate/README.md lines 10 and 33
- COMMENT-ONLY (do not execute; re-point in the same commit): domain/checklist-reactivate/checklist-show.js:9, .claude/hooks/quest-resume-preflight.js:22, quest-active-grounding.js:24-27, quest-objective-anchor.js:43, quest/redmine-status-check.js:12, quest/routine-wrap.js:8, quest/redmine-sync.js:600 and 930, quest/redmine-board.js:1-4, .gitignore:83
- REGENERATED VIEWS: REGISTRY.md:55, system/feature-census.md (node lib/feature-census.js), system/liveness-dashboard.md, system/monitoring-dashboard.md
- CHANGE RECORD: node lib/watch.js add BEFORE the commit; main/handoff-2026-10-05-boot-structure-audit.md section 5 row; main/current-session.md; the day's diary; Boot sequence artifact republished
- NOT changed: Feature/Domain-Expansion/expansion-protocol.md has no reference to this hook (grep); signal #1 'Boot-time Quest reconciliation' (line 113) is re-worded only if owner decision 1 = A

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network or VPN off at the first ticket signal | handled + fixture: board child capped at 20 s; prints last good board with saved date, time and age, or today's 'live board unavailable' line plus the local list; session marked so later prompts do not wait again. Residual: one wait of up to about 20 s (connect timeout not measured). |
| 2 | Two sessions at once | handled + fixture: each prints at its own first signal; cache.json written temp-then-rename; a lost marker only causes one extra live fetch. |
| 3 | Worktree session | handled + fixture: hooks run from MAIN (handoff section 7); hook resolves MAIN root for active.txt, cache and log with the ticket-gate.js:32 idiom. The change is live only after main is fast-forwarded. |
| 4 | First prompt is not about tickets | handled + fixture: silent, zero Redmine calls, zero log rows; briefing shows the pointer row. |
| 5 | First prompt IS a ticket number | handled + fixture: fires on that prompt, block in context before the first reply; briefing same as today; ticket-gate checklist unchanged. |
| 6 | Cache from yesterday | handled + fixture: last-good is never shown when the live fetch works; when shown it carries date, time, age and 'may be wrong'; the day stamp makes a session that lives past midnight fetch again. |
| 7 | Hook file renamed or deleted | handled by existing checks: dispatch-hooks.js:76-79 logs child-missing and stays silent; hook-syntax-check at boot names a missing bundle child; install pin I2 goes red. Residual: silent until the next boot. |
| 8 | Session is for a non-etanah project | handled: no signal, nothing printed, no network. Cost: one short node process per prompt inside the existing bundle. |
| 9 | Trigger text inside quoted output (he pastes the hook's own block, a log, a doc) | fixture: prompts containing the block headings or longer than 20,000 chars are ignored. A short pasted log with a real ticket number fires once: accepted, cost is one board. |
| 10 | Context compaction after the board was printed | accepted risk: day marker stops a re-print. Why: no briefing is composed at that point; 'board' runs /list-redmine fresh; --now reprints the block. If it bites: a SessionStart matcher 'compact' that clears the marker (not built now). |
| 11 | Workflow-tool or SDK subagent whose task text names a ticket | fixture needed: silent when the prompt carries the harness frame or the orchestration flag is live. Whether subagents share the parent session id is not verified. Residual: one board per unguarded subagent. |
| 12 | Merged bundle output too large for the harness | accepted risk, to measure: the block (about 7,400 chars) shares one additionalContext with 3 siblings (dispatch-hooks.js:144-150); handoff-load adds several thousand when it co-fires. Claude Code's cap on hook context is not verified here. Log row carries chars; a real-session smoke confirms the last table row reached context. |
| 13 | active.txt has zero open blocks | fixture + fix: today the hook returns before the board and the missing-ticket check (lines 136-139), hiding newly assigned tickets. v2 falls through to both. |
| 14 | Redmine key rotated or HTTP 401/500 | handled + fixture: output without the three table headings counts as a failed fetch; fallback with age; the reason is printed. |
| 15 | He never names a ticket but works a quest ('continue', 'go on') | accepted risk: no board this session. Why: pointer row in the briefing, quest SKILL line to run --now, drift still caught at active-cli writes and at Domain Expansion close. |
| 16 | He asks for the board twice in one session | handled: first by the hook, second by /list-redmine (live run). The second relies on the skill match. |
| 17 | Corrupt cache.json or a OneDrive conflict copy | handled + fixture: parse error = no copy, file rewritten valid; conflict-copy names are already git-ignored (.gitignore:56-65). |
| 18 | Session resumed the next day with the same session id | handled + fixture: marker carries the date, so the first signal of the new day fetches again. |
| 19 | Empty or malformed stdin (forge smoke-fire sends {}) | handled + fixture: silent exit 0. Side effect: forge's smoke no longer calls Redmine. |
| 20 | lib/apply-bundles.js is re-run | handled: it removes any direct registration that names a bundle child (line 36), which matches the intent that no SessionStart entry exists. |
| 21 | A ticket assigned while he is in a non-ticket session | accepted risk, owner decision 4: nothing at boot means it shows only at the next ticket or board signal. |
| 22 | forge install refuses because a cache file names the old path | handled by the pre-step: delete domain/hook-syntax-check/cache.json or teach forge to skip cache.json. Verified by reading forge.js:399-412 and the cache content; forge not run. |

**Decisions the designer raised**

- When your first message has no ticket in it, what should the briefing say about tickets?
  - A. One row: 'Quest status: not loaded. Name a ticket or say board.' Boot reads nothing about quests (the CLAUDE.md step-5 read of quest/active.txt and the quest reconciliation scan also move behind the signal).
  - B. A local count line from active.txt only. No Redmine. Needs a small boot read and can be stale.
  - C. Keep today's full board at every boot.
  - Recommended: A. Your words: you do not want this loading when you do other projects. B puts boot work back and shows the list that rots (2026-07-27: 6 of 10 'open' quests were dead).
- Which words should load the board?
  - A. Narrow: a ticket number, a Redmine retrieval phrase, a board ask (my tickets, the board, open tickets, what's on my plate, ticket list, redmine list, refresh the board), or /quest /sweep /retrieve-redmine /list-redmine /brief.
  - B. Broad: also the bare words ticket, quest, Redmine, eSOKONGAN, briefing, 'where were we'.
  - Recommended: A. A miss costs you one word ('board'). A false load costs 5-13 s and about 7,400 characters in a session you wanted clean, and system-design sessions say 'quest' and 'ticket' all the time.
- When the board loads in the middle of a session (not in the first reply), what do you want to see?
  - A. One line: 'Board loaded: N open (x eSOKONGAN, y PROD, z other). Flags: ...', then the answer to what you asked. Tables when you say 'board'.
  - B. The three tables every time it loads.
  - Recommended: A. Disposition rule 0: answer the ask, nothing unrequested. The urgent, missing and divergence flags still appear in that one line.
- A ticket assigned to you while you are in a non-ticket session will not show until you name a ticket or say 'board'. Accept?
  - A. Accept. Redmine mail and the BA tell you about new tickets.
  - B. One-line boot alert only when Redmine has a ticket with no local block or an urgent word. Costs one Redmine call at every boot (time not measured).
  - C. Use the cached-board design instead: boot shows a count from the last fetch, free but possibly old.
  - Recommended: A. It is the direct cost of 'no boot work'. It is yours to weigh because the SLA is in hours (Critical 1, High 6). If you want boot awareness, C fits better than B.
- When Redmine cannot be reached at the first ticket signal, what should you see?
  - A. The last good board, labelled with its date, time and age and 'may be wrong'.
  - B. Only the local list from active.txt and an 'unavailable' line (today's behaviour).
  - Recommended: A. An old ranked board with its age shown is more useful than no board. It is the only moment a stored copy is ever shown.


### 2.9 open-quest-surfacer

**Angle**: CACHE-FIRST: boot prints one short line from a cached board with its age; the full list and board load at the first ticket, quest or board signal; Redmine is only ever called by a detached background refresh.

**Trigger moment**

Three moments, each the narrowest that still catches the need (system-design Rule 8).

1. FULL LIST + BOARD: the first prompt of a session that carries a ticket, quest or board signal. That is the same turn in which ticket-gate fires. Rule 8 test: "is it as effective firing only when ticket work starts?" Yes, provided the cache is fresh by then (moment 2). Boot is the wrong moment: on 2026-10-04 the hook ran 16 times in main's system/telemetry/hook-fires.jsonl at 4.7 to 11.5 s each, whether or not tickets were touched.

2. REFRESH: at boot and at a ticket signal, but only when the cache is older than 30 min, and always as a detached background process. Nobody waits for it. Twelve of those sixteen boots fell inside 18 minutes (09:11 to 09:29Z); with the cache that is one Redmine sweep instead of twelve.

3. ONE LINE AT BOOT: the Session Briefing needs a truthful Quest-status row before any prompt. One line built from the cache (with its age) plus a live count of quest/active.txt gives that without loading 7.4 KB.

/list-redmine, /sweep and /retrieve-redmine keep calling quest/redmine-board.js live. He asked for the board there, so that wait is his choice. Unchanged.

**Mechanism**

STEP 0 - INSTALL BLOCKER (found by reading, not by running forge). `forge install` will REFUSE today. core/forge.js:399-412 (safety 2) walks domain/ for .js/.json/.md files that name the old path. main's domain/hook-syntax-check/cache.json (git-ignored, .gitignore:104) holds the key ".claude/hooks/open-quest-surfacer.js" (grep hit, line 1). It is .json, not a comment line, so it lands in codeRefs and forge exits 2. This hits every remaining loose-hook install, not only this one. Fix once: skip domain/*/cache.json in that walk (1 line + 1 fixture in core/forge.eval.js). Zero-code alternative: delete that cache file before the install; the next boot re-checks 138 files once (13 to 18 s per the handoff).

STEP 1 - INSTALL, unchanged (own commit).
node core/forge.js install hook .claude/hooks/open-quest-surfacer.js --symptom ... --goal ... --signal ... --retention regenerate --footprint "per-session: ..." --nod ...
Result: domain/open-quest-surfacer/open-quest-surfacer.hook.js + eval pin + README + NUKE-MARKER; settings.json:35 re-pointed, telemetry name kept. Safety 1 passes by my reading: lines 28 and 153 use the two-levels-up form, and there is no './' require. `node --check` on the hook passes.

STEP 2 - CHANGE (forge refine, second commit). Same shape as the working analog domain/worktree-cleanup-boot v2.0 (launcher + detached run + last report, hook.js:553-611). ONE file, three modes. Mode is chosen from argv and stdin (analog for one file serving two events: domain/knowledge-schema-audit/knowledge-schema-audit.check.hook.js:74).

(a) `--run` = REFRESH, background only. The v1 body: run quest/redmine-board.js (30 s limit kept, as today's line 65), then redmine-status-check checkAll + checkMissing, capturing what they print. If the output carries the three table headings (pinned by domain/list-redmine/eval.js:53-56), write cache.json {ts, dur_ms, text, counts} through a temp file + rename. If Redmine is unreachable or the run errors, the old cache is kept and the error line is logged. One log row at start, one at end.

(b) stdin without `prompt` = BOOT LAUNCHER (the existing SessionStart registration). Reads active.txt live and the cache. Prints ONE line. Starts (a) detached when the cache is older than 30 min and no refresh started in the last 10 min. Writes a `boot` log row. Exits. Expected 0.3 to 0.4 s (the analog's launcher measured 0.34 to 0.40 s); not measured for this hook yet.

(c) stdin with `prompt` = FIRST-SIGNAL INJECT (UserPromptSubmit, as a 4th child of an existing bundle). Silent unless the prompt has a signal AND this session has not been given this exact board (hash) since its last boot row. Then it prints: the full OPEN QUESTS list read live from active.txt (same lines as today), the RANK_RULE text, and the cached board + drift lines byte for byte, under a header with the board's time and age. Starts (a) when stale. It never calls Redmine itself.

SIGNAL = (1) lib/turn-context.js attribute(prompt) names a ticket (exported at line 135, already used by hook-runtime and dispatch-hooks), or (2) a small word list owned by this Feature: redmine, ticket, quest, board, briefing, "where were we", /quest /list-redmine /retrieve-redmine /sweep /brief, #NNNNN, PT<STATE>/. It must be a superset of ticket-gate's signals; a parity fixture pins that. ticket-gate.js is NOT touched (it is loose, load-bearing, and exits silently past Phase 0 at line 214, so it is the wrong place to attach). False-positive cost: one board inject (about 7 KB) once per session.

CACHE. domain/open-quest-surfacer/cache.json in the MAIN checkout (path through the strip-worktree idiom, as quest/redmine-board.js:26). The kind already exists: .gitignore:103-104 "Feature caches (retention: regenerate)". retention: regenerate.
- Staleness shown: every display says "as of <time> (<age> ago)". Older than 30 min adds "refreshing in the background". A failed refresh adds "last refresh failed <time>: <the actual error line>".
- Empty cache: boot line says "no cached board yet (first refresh running)". At a ticket signal the live OPEN QUESTS list is still injected, plus one instruction: run `node quest/redmine-board.js` before ranking or listing tickets. This is the only case where a live call happens inside a turn.

LOG. domain/open-quest-surfacer/log.jsonl (already ignored, .gitignore:37). Rows: boot, refresh-start, refresh (ok, dur_ms, counts, error), inject (session, cache_ts, age_min, stale, hash, chars). The log is also the lock and the "already shown" memory, so there is no lock file and no new state file.

KILL SWITCH. OPEN_QUEST_SURFACER_FOREGROUND=1 gives the old wait-for-it full print at boot (same idea as WORKTREE_CLEANUP_FOREGROUND=1). The eval uses it to pin the v1 body.

NAMED SPEC CHANGES (system-design Rule 6 v1.2). Dropped: none.
1. The full list and board move from every boot to the first ticket signal.
2. The board shown can be up to 30 min old and says so. Today it is as old as the session and unlabelled.
3. The refresh runs the board even when active.txt has zero open blocks. Today lines 136-139 return before the board and before checkMissing, so a ticket assigned on Redmine with no local block at all is not surfaced.
4. active.txt is read from the main checkout.
5. "If briefing omits any, that is a verify failure" (line 145) becomes "any reply that lists his tickets must include every row".

FOOTPRINT after the change: per-session 1 node launcher that may start ONE detached node (the Redmine sweep, about 5 s, at most one per 30 min across all sessions); per-prompt +1 node child inside the existing parallel bundle, which exits at once unless a signal matches. state-scoped: no (the cached text is whatever redmine-board.js renders for all active states).

**Joins existing**

1. domain/bundles/upsm-mode.json:2-4 - the children list (mode-detector, quest-active-grounding, handoff-load). One line is added. The bundle is already dispatched by .claude/settings.json:145 through lib/dispatch-hooks.js, so there is no new UserPromptSubmit registration (system-rules Rule 7).
2. .claude/settings.json:35 - the existing SessionStart registration stays (forge re-points it); it becomes the launcher.
3. Reused as is: lib/turn-context.js:51 attribute() for the ticket-named signal; quest/redmine-board.js and quest/redmine-status-check.js for the refresh.
4. Pattern copied from domain/worktree-cleanup-boot/worktree-cleanup-boot.hook.js:578-606 (launch) and :599 (the detached spawn line).

**Boot after**

One line (numbers are examples):

📌 Tickets (board as of 09:12, 18 min ago): 14 open · 1 urgent #282901 · 1 with no local block · 22 quest blocks, 3 active (QA-282555, QA-279411, ADHOC-PT-2026-6). Full board loads at the first ticket mention, or /list-redmine.

Variants of the bracket:
- stale: (board as of 4 Oct 18:02, 15 h ago; refreshing in the background)
- refresh failing: (board as of 4 Oct 18:02, 15 h ago; last refresh failed 09:14: <the actual error line>)
- no cache yet: 📌 Tickets: no cached board yet (first refresh running) · 22 quest blocks, 3 active (...). Full board loads at the first ticket mention, or /list-redmine.

The OPEN QUESTS list, the board-shape rule text, the three tables and the drift lines are no longer printed at boot.

**Briefing impact**

LOSES AT BOOT: the per-quest OPEN QUESTS list (22 lines on 2026-10-04), the RANK_RULE block, the three ranked tables and the Redmine drift lines. About 7.4 KB.

KEEPS AT BOOT: one deterministic line that fills the briefing's Quest-status row and, when needed, one standing flag (urgent ticket, ticket with no local block, stale or failing cache). The counts come from the hook's own full read of active.txt, so the 2026-05-25 slip (briefing built from a truncated Read of active.txt) stays closed: the count is in context even if the model never reads the file.

WHEN TICKET WORK STARTS: the first prompt with a ticket, quest or board signal gets the complete OPEN QUESTS list (read live) and the cached board with its age, in the same turn as ticket-gate's Phase-0 checklist. "briefing", "where were we" and "what's our status" (the briefing triggers in session-briefing.md:11) are signals too, so asking for a briefing loads the board. If the first prompt of the session is already a ticket number, the boot briefing in that first reply has the board.

RULE RE-ANCHORED: "a briefing that omits one of his open tickets is a verify failure" becomes "any reply that lists his tickets must include every row of the injected board". A boot briefing that shows only the count line is not a failure. This needs his nod (decision 3).

session-briefing.md:111 (reconcile against Redmine before showing the list) is still met: the divergence and missing-block lines are part of the cached text.

**Daily-work risk**

WORST CASE: he starts ticket work and the board is stale or absent, so a newly assigned or urgent ticket is missed. The memory index gives Critical = 1 SLA hour.

HOW THE DESIGN PREVENTS IT:
1. Age on every display; a board older than 30 min is labelled stale with the reason.
2. Boot starts the refresh, so the cache is normally seconds old by the time he types (the sweep takes about 5 s).
3. The inject is a hook, not a skill step, and its signal set is pinned as a superset of ticket-gate's.
4. A board that changed since it was shown is injected again on the next ticket prompt.
5. A failed refresh never overwrites a good cache and is named with its actual error text.
6. Empty cache at a ticket signal gives an explicit instruction to run the board live before any ranking.
7. ticket-gate.js, redmine-board.js and redmine-status-check.js are not edited, so the Phase-0 gate and /list-redmine behave exactly as today.
8. OPEN_QUEST_SURFACER_FOREGROUND=1 restores the old boot behaviour without a code change.

RESIDUAL, stated plainly: in a session that never mentions tickets, a ticket assigned after the last refresh is not shown until the next boot line or the next ticket signal. Today it would be shown at that boot. Decision 4 narrows this; it does not remove it, because nothing refreshes mid-session without a boot or a ticket signal.

SECOND RISK: +1 node process per prompt inside the parallel upsm-mode bundle. It adds no serial wait; the cost is visible in the bundle's telemetry rows.

**Eval plan**

All fixtures run offline in a temp folder: env overrides for the root (active.txt, cache, log), a STUB board script (prints a canned board, or sleeps, or prints the 'Redmine unreachable' line), and a fake clock for ages. No Redmine call and no write to real logs.

INSTALL PINS (from forge): I1 parses, I2 registered at its new home, I3 old copy gone.

BOOT LAUNCHER
L1 fresh cache: exactly ONE line with age and counts, exit 0, no refresh started.
L2 stale cache: one line saying 'refreshing'; launcher returns while a 3 s stub is still running; cache time stamp updated afterwards.
L3 empty cache: 'no cached board yet' + refresh started.
L4 stub prints 'Redmine unreachable': cache NOT overwritten; next line shows 'last refresh failed' with the error text.
L5 a refresh-start row 2 min old: no second refresh.
L6 active.txt unreadable: the old warning text, exit 0.
L7 zero open blocks + 3 tickets in the cache: the line shows both numbers.
L8 FOREGROUND=1: prints the full v1 output (header, per-quest lines, RANK_RULE, board). This pins the unchanged body.
L9 corrupt cache.json: treated as empty, no throw.
L10 output is never more than 1 line or 400 chars.

FIRST-SIGNAL INJECT
T1 'let's start 282555' with a 40-block active.txt: every open block listed, board text byte-equal to the cache, age header present, inject row logged.
T2 second ticket prompt, same session, same cache: silent.
T3 cache text replaced: injected once more, labelled as replacing the earlier board.
T4 'refactor the css of my site': silent, no inject row.
T5 a prompt that quotes the hook's own output, three times: at most one inject.
T6 PARITY: about 25 ticket phrases (from ticket-gate's header and phrase-registry row 11) run through the real ticket-gate with TICKET_GATE_ACTIVE_TXT; wherever ticket-gate fires, this hook must fire.
T7 'show my tickets', '/list-redmine', 'briefing', 'where were we': inject.
T8 stale cache at a signal: STALE header + refresh started.
T9 empty cache at a signal: live list + the 'run the board before ranking' instruction.
T10 bad stdin (not JSON, empty, 30 KB prompt): exit 0, silent.
T11 a boot row for the same session, then a ticket prompt: injected again.
T12 two sessions interleaved: one inject each.
T13 through the real lib/dispatch-hooks.js with a temp manifest: one JSON envelope containing the block, returned in under 2 s while a 3 s stub refresh is still running.
T14 hook copy under a fake .claude/worktrees/x/: cache and active.txt resolve at the main root.

REFRESH
R1 stub killed mid-run: old cache intact, no partial JSON.
R2 heading contract: counts parsed from a board rendered by the real quest/redmine-board.js with stubbed http equal the known numbers.
R3 board runs with zero local blocks.
R4 the missing-block and divergence lines are in the cached text.

TIMING, before and after, from the existing logs (system-rules Rule 5):
- Before: rows hook=open-quest-surfacer, event=SessionStart in system/telemetry/hook-fires.jsonl on 2026-10-04: 4,736 to 5,887 ms for single boots, 5,943 to 11,518 ms when sessions started together.
- After: the same series (telemetry name kept) must stay under 1,000 ms; a row of 3 s or more is a regression. Refresh time is in the Feature's own log rows.
- Chars: boot stdout length, 7,421 before, at most 400 after.
- Goal check (monitoring): for every session with a fired ticket-gate telemetry row there is an inject row in this Feature's log in the same turn. A session without one is a goal miss. Register it as a watch with lib/watch.js before the commit.

**Rollback**

Behaviour only (keeps the install; the full board prints at every boot again and the bundle line is gone):
git revert <change-commit>

Everything, including the install:
git revert <change-commit> <install-commit>

Then fast-forward main, because hooks run from the main checkout. domain/open-quest-surfacer/cache.json is git-ignored and can simply be deleted.

**Seconds saved**

About 4.6 s per boot when one session starts (5.0 s now; 0.3 to 0.4 s expected for the launcher, taken from the worktree-cleanup-boot launcher's measured 0.34 to 0.40 s). 5.5 to 11 s per boot when several sessions start together (2026-10-04 rows: 5.9 to 11.5 s). The after-figure is an expectation, not yet measured for this hook.

**Characters saved**

About 7,150 to 7,250 of 7,421 chars: one line of roughly 170 to 270 chars stays. In a ticket session the same ~7.4 KB arrives once, at the first ticket prompt; in a non-ticket session it never loads.

**Confidence**: 78%

**Files to change**

- core/forge.js + core/forge.eval.js - PRE-STEP shared by every batch-2 install: safety 2 (lines 399-412) must skip domain/*/cache.json, else install is refused because domain/hook-syntax-check/cache.json names the old path. Alternative with no code: delete that cache file on main before the install.
- .claude/hooks/open-quest-surfacer.js -> domain/open-quest-surfacer/open-quest-surfacer.hook.js - moved UNCHANGED by forge install (commit 1), then edited to the three modes (commit 2)
- domain/open-quest-surfacer/open-quest-surfacer.eval.js - install pin written by forge, then the behaviour fixtures
- domain/open-quest-surfacer/README.md + NUKE-MARKER.md - written by forge; v2 section added (footprint per-session + per-prompt, retention regenerate for cache.json, log rows, state-scoped line, rollback recipe)
- .claude/settings.json line 35 - rewritten by forge only (new path + telemetry name argument); no hand edit
- domain/bundles/upsm-mode.json - add the hook as the 4th child
- system/registry.jsonl + system/slips.jsonl - rows appended by forge
- Feature/Session-Briefing-System/session-briefing.md - line 74 (board is no longer printed at boot: one cached line at boot, full board at the first ticket signal or /list-redmine, always say its age), line 119 (Quest-status row comes from the boot line), version stamp
- .claude/skills/list-redmine/SKILL.md - line 3 (description tail 'Also fires automatically at session boot') and lines 87-91 ('When this fires')
- .claude/CLAUDE.md boot step 5 - one pointer clause (ticket board = one cached line at boot; never rank tickets from it) + version bump, with the entry in system/claude-md-changelog.md, through the domain/claude-md-watch pipeline
- system/system-architecture.md - rows at lines 211, 242, 514, 581, 604 and the section 9 sync row; the hook catalog (line 66) is regenerated with node system/sync-hook-catalog.js
- quest/redmine-status-check.js line 12 - header comment names the old hook path (comment only)
- Regenerated, never hand-edited: REGISTRY.md (node core/registry.js) and system/feature-census.md (node lib/feature-census.js)
- Change record: node lib/watch.js add BEFORE the commit; main/handoff-2026-10-05-boot-structure-audit.md sections 3 and 5; main/current-session.md; the boot-sequence artifact republished
- NO change, checked by grep: Feature/Domain-Expansion/expansion-protocol.md (names neither the hook nor redmine-board.js) - .claude/hooks/ticket-gate.js - quest/redmine-board.js - lib/observatory.js:944 (telemetry name is kept) - .gitignore (domain/*/cache.json and domain/*/log.jsonl already ignored). Comments that say 'at boot' stay true enough and are left alone: quest-active-grounding.js:24-27, quest-resume-preflight.js:22, quest-objective-anchor.js:43, domain/checklist-reactivate README:10,33 and checklist-show.js:9, quest SKILL.md:154, quest/routine-wrap.js:8

**Adversarial scenarios**

| # | Scenario | Verdict |
|---|---|---|
| 1 | No network, or Redmine unreachable (home, no VPN) | handled + fixture: the refresh fails in the background, the old cache is kept, the line shows the age and 'last refresh failed' with the actual error text, and there is at most one attempt per 10 min |
| 2 | Two or more sessions boot at once (12 boots in 18 min on 2026-10-04) | handled + fixture: a refresh-start log row allows one refresh per 10 min; if two slip through, both write the same text by rename, so the cache is never half-written |
| 3 | A worktree session | handled + fixture: hooks run from main (handoff section 7) and paths use the strip-worktree idiom anyway. The design uses no git; this very worktree lost its git admin entry during my run |
| 4 | The first prompt is not about tickets | handled + fixture: the bundle child is silent; only the boot line exists |
| 5 | The first prompt IS a ticket number, seconds after boot, cache from yesterday | fixture needed: yesterday's board is injected under a STALE label with its age while the refresh runs; the next ticket prompt injects the new board if it differs. Accepted residue: one turn works from a labelled stale board |
| 6 | Cache from yesterday in a non-ticket session | handled: the line says '15 h ago; refreshing in the background'; nothing else loads |
| 7 | The hook file is renamed or moved by hand | handled by existing parts: hook-runtime logs target-missing (hook-runtime.js:72-75), dispatch-hooks logs child-missing (dispatch-hooks.js:76-78), and hook-syntax-check names a missing registered hook at the next boot. Accepted risk: the board is silently absent for up to one boot |
| 8 | The session is for a non-etanah project | handled: one line at boot, no wait, no board. Decision 1 lets him choose zero lines when nothing needs him |
| 9 | Trigger text inside quoted output (he pastes a log, a board, or the hook's own injected text) | handled + fixture: bounded to one inject per board version per session; prompts over 20,000 chars are skipped (same guard as handoff-load.check.hook.js:32) |
| 10 | cache.json is corrupt, half-written, or locked by OneDrive during the rename | handled + fixture: a parse failure counts as an empty cache; the write is temp file + rename inside try/catch; a failed write is logged and retried at the next refresh |
| 11 | OneDrive syncs cache.json from the other laptop | accepted: the time stamp is absolute, so the age shown stays true |
| 12 | Context compaction or resume in the middle of a ticket session | fixture needed: every SessionStart writes a boot row that resets 'already shown', so the next ticket prompt injects again. NOT verified: that this Claude Code build fires SessionStart on compaction; if it does not, the result is the same as today |
| 13 | The board's heading text changes in redmine-board.js | fixture needed: counts are parsed from a board rendered by the real script with stubbed http (the method of quest/redmine-board.eval.js). At run time a failed parse prints the line without counts instead of wrong counts |
| 14 | The refresh hangs (fetchOne in redmine-board.js:122 has no HTTP timeout) | handled: the 30 s limit of today's line 65 is kept, and a refresh-start row older than 10 min no longer blocks a new attempt |
| 15 | active.txt is unreadable or very long (640+ lines, the 2026-05-25 truncation) | handled + fixture: the hook reads the whole file itself; unreadable prints the old warning. The fixture uses a 40-block file and asserts every open block is listed |
| 16 | Zero open local blocks but tickets assigned on Redmine | handled better than today + fixture: the refresh always runs the board and checkMissing; today lines 136-139 return before both |
| 17 | A new Critical ticket arrives while he works on another project | accepted risk, narrowed by decision 4: without a boot or a ticket signal nothing refreshes, so it shows at the next boot line or the next ticket signal |
| 18 | A Workflow or sweep fleet where every agent boots a session | handled: each prints one line, the fleet shares one refresh, and a ticket-working agent gets the board once at its first ticket prompt. Today each agent pays the full sweep and 7.4 KB at boot |
| 19 | The detached refresh flashes a console window or holds the hook's pipes on Windows | fixture needed: run the hook through the real lib/dispatch-hooks.js with a 3 s stub board and assert the dispatcher returns in under 2 s. The spawn line is copied from worktree-cleanup-boot.hook.js:599, which runs at real boots. A window flash cannot be asserted by a script: one manual smoke on main |
| 20 | He says 'do not show me the board' (instruction reversal) | handled: the inject is context, not reply text; with decision 3 option A the reply carries one line at most |
| 21 | The bundle child crashes or times out | handled: dispatch-hooks fails open (lines 82-85), writes a telemetry row, and the other three children are unaffected |
| 22 | forge install is refused | fixture needed: verified by reading that domain/hook-syntax-check/cache.json trips safety 2; fix forge (1 line + 1 fixture) or delete the cache first |

**Decisions the designer raised**

- What should boot show on a day you are not doing tickets?
  - A. One line always: board age, your open count, urgent ticket numbers, quest-block count
  - B. Nothing, unless something needs you (urgent ticket, ticket with no local block, refresh failing)
  - Recommended: A. The one line is what lets the boot briefing fill its Quest-status row without reading active.txt, which is how two held quests were missed on 2026-05-25. B is closer to your words but puts that row back on the model's own read of a long file.
- May the board refresh silently in the background at boot, even when you opened Ruri for another project?
  - A. Yes: background only, nothing enters the chat, at most one Redmine sweep per 30 min across all sessions
  - B. No: refresh only when a ticket signal appears
  - Recommended: A. With A the board is seconds old when you do start a ticket, the same freshness as today with no wait. With B the first ticket turn of the day works from yesterday's board (labelled stale) and the fresh one arrives a turn later.
- On the first ticket turn of a session, what should the reply show from the board?
  - A. One line (board time, open count, urgent tickets); the three tables only when you ask for the board or a briefing
  - B. The three ranked tables automatically on that first ticket reply, as boot does today
  - Recommended: A. It follows your overview-first and answer-the-ask rules. It also changes the verify rule from 'a briefing that omits a ticket fails' to 'any reply that lists tickets must list every one', so it needs your nod.
- If a refresh finds an URGENT-worded or Critical ticket you have not been shown in this session, should Ruri tell you even when you are on another project?
  - A. Yes: one line at your next prompt, once per ticket
  - B. No: it waits for the next boot line or your next ticket mention
  - Recommended: A. Critical carries a 1-hour SLA in your own notes. Today boot would show it. After this change a non-ticket session would not, unless A is chosen. Limit, stated honestly: the alert can only come from a refresh started at a boot or a ticket signal; nothing polls Redmine on a clock.

## 3. Facts per script (the readers' output)

### 3.1 .claude/hooks/evolution-check-trigger.js (56 lines, SessionStart)

**What it does**: Reads system/evolution-protocol.md (line 18 exits silently if missing). Regex-extracts `last-evolution-check: YYYY-MM-DD` (line 25) and `next-elapsed-check-due: YYYY-MM-DD` (line 26). No date found: silent exit 0 (line 28-30). Computes elapsedDays = floor((now - lastCheck)/86400000) (lines 32-34). If elapsedDays >= 30 it prints a warning block; otherwise prints nothing. Every path exits 0, and a catch-all (line 53) swallows errors. The header (lines 4-5) says v1 only; v2 model-ID-change detection is NOT implemented. The current protocol file has last-evolution-check: 2026-09-22 and next due 2026-10-22 (evolution-protocol.md lines 48-49), so today (2026-10-05, 13 days elapsed) it prints nothing. First possible print is 2026-10-22.

**Prints**: Only when elapsedDays >= 30 (lines 36-47): a blank line, then `⚙️  evolution-check-trigger: ⚠️ <N> days since last evolution check`, then `   Last check: <date> · Next due: <due or 'overdue'>`, then `Anthropic may have shipped new features (hooks / skills / tools) since.`, then `Invoke evolution-check skill manually: "check Anthropic updates" / "evolution check"`, then `See system/evolution-protocol.md`, then a blank line. Written with process.stdout.write. Silent otherwise (the else branch at line 48-50 is empty).

**Registration**: .claude/settings.json line 27, event SessionStart (group of 10 commands, lines 6-50), wrapped, no explicit telemetry-name argument: node "${CLAUDE_PROJECT_DIR}\lib\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\.claude\hooks\evolution-check-trigger.js" SessionStart. It is not in a domain/bundles manifest (not verified by a bundles-directory grep; the settings.json grep shows only line 27). REGISTRY.md line 40 lists it as "pre-forge" (wrapped, not a Feature).

**Eval**: No eval file. There is no .claude/hooks/evolution-check-trigger.eval.js, and no domain/evolution* folder exists (Glob domain/*evolution* returned nothing). The skill the message points to, .claude/skills/evolution-check/, does NOT exist in the main checkout (Test-Path False). evolution-protocol.md line 17 says the skill is 'to be built Phase 7', and line 65 names its path.

**Log**: No own log.jsonl (no Feature folder). The only per-run record is the wrapper's row in system/telemetry/hook-fires.jsonl. Telemetry in the main checkout (read-only, hook-fires.jsonl only; rotated hook-fires-*.jsonl files not summed): 16 fires in the last 7 days, average dur_ms about 1220 (computed over those 16 rows). That is far above the 0.35 s figure in the task, so the 0.35 s is probably a warm-run or different measurement. The skew is not analysed (no median computed).

**Telemetry**: 16 fires in the last 7 days; mean dur_ms 1220 (hook-fires.jsonl only, main checkout).

**Has a Feature folder**: false

**Reads**

- system/evolution-protocol.md (line 15 path, read at line 22; resolved via path.resolve(__dirname,'..','..') at line 14)

**Writes**

- Nothing of its own. Only the hook-runtime wrapper (lib/hook-runtime.js --wrap) writes a telemetry row to system/telemetry/hook-fires.jsonl per run (hook name evolution-check-trigger).

**External calls**

- None. Requires only fs and path. No network, no git, no child processes.

**Install blockers**

- Probably none, not run. forgeInstall (core/forge.js:360-495). Check 1, sibling-relative references (lines 385-391): ROOT_UP at line 385 strips `__dirname, '..', '..'`. The hook's only __dirname use is line 14 `path.resolve(__dirname, '..', '..')`, which matches that form, and it has no require('./..') line. Its only require calls are 'fs' and 'path'. So check 1 is not triggered.
- Check 2, code files naming the old path (lines 399-412), scanning domain/.claude/lib/core/quest/system for `.claude/hooks/evolution-check-trigger.js` or the join form. Lines starting with //, * or /* are ignored, and .md files only count as docRefs (no refusal). Greps for the file name found only comment lines in code (system-check-trigger.js:4, feature-creation.check.hook.js:27 mentions the feature name only) and .md docs (REGISTRY.md, system-architecture.md, system/INDEX.md, phrase-registry.md). The long-line match at lib/observatory.js:948 was not read, so a code ref there is unverified. A direct grep of `evolution-check-trigger\.js` across lib/ is the remaining check.
- Install requires --symptom --goal --signal --retention --footprint --nod. Lines 316-321: goal must not start with fires/triggers/runs, and no TODO. A smoke eval is auto-created because the hook has no eval (line 433). The install also smoke-runs the hook with '{}' input (line 478), which is harmless here (read-only, exit 0).

**Consumers**

- system/evolution-protocol.md:16 — DOCUMENTS the hook: the 30-day elapsed row says the SessionStart hook reads the last-evolution-check timestamp (line 16). The hook is the only reader of the `last-evolution-check` and `next-elapsed-check-due` fields, which sit at lines 48-49. The file is also the hook's data source. Line 78 is a footer.
- system/system-architecture.md:64 — Only documents it (SessionStart table row, line 64; trigger detail at line 209 saying 'model-ID change + 30-day evolution elapsed'). Line 209 over-claims model-ID detection that the code does not do.
- system/INDEX.md:135 — Only documents it ('SessionStart hook double-check (Phase 7): model-ID-change detection + >30 days since last evolution-check'). Same over-claim.
- system/phrase-registry.md:77 — Lists the hook's two regexes (`last-evolution-check:` and `next-elapsed-check-due:`) as a hook-regex entry, i.e. a registry of phrases the hook depends on.
- REGISTRY.md:40 — Only documents it (row: SessionStart, wrapped, pre-forge).
- main/handoff-2026-10-05-boot-structure-audit.md:67 — Only documents it (cost 0.35 s, proposes off-boot / manual inside the system check). This is an untracked handoff file.
- .claude/hooks/system-check-trigger.js:4 — Comment only ('Mirrors evolution-check-trigger.js pattern'). It does not require it. It reads the same file, system/evolution-protocol.md (line 15), for `last-system-check`, so the two hooks share a data file but not code.
- domain/feature-creation/feature-creation.check.hook.js:27 — Comment only, mentions 'evolution-check first if >60d stale'.
- .claude/hooks/best-practices-consult-gate.js:51 — Prints text telling the model to trigger evolution-check when the best-practices research is >60 days old. This relies on the evolution-check PROCESS, not on this hook's output or file.
- lib/observatory.js:947 — Names system/evolution-protocol.md as the 'Self-improvement' head file. It does not name this hook. Line 948 was an omitted long line and was not read in full.
- .claude/skills/system-check/SKILL.md:45 — Writes `last-system-check` into the same evolution-protocol.md (lines 45 and 113). It does not reference this hook.
- Feature/Session-Briefing-System/session-briefing.md and Feature/Domain-Expansion/expansion-protocol.md — No match for 'evolution' (checked via Select-String): no dependency. CLAUDE.md, quest/*.js and the SKILL.md files have no consumer of this hook's printed text. The heading string 'evolution-check-trigger:' appears in no consumer, and no code parses its stdout.

**Existing trigger candidates**

- .claude/skills/system-check/SKILL.md (step 7 already updates evolution-protocol.md, line 45) and the /system-audit skill — The task is 'is a 30-day Anthropic-update check due', and system-check already edits the same evolution-protocol.md date field. A step there could compare last-evolution-check against today. This is a manual moment, which matches the handoff's proposal (manual inside the system check). The evolution-check skill referenced by the hook output does not exist, so nothing else is wired.
- .claude/hooks/system-check-trigger.js (SessionStart, line 31 of settings.json) — Sibling that reads the same file, runs the same 30-day elapsed check for last-system-check, and also fires at boot. The two checks could be one script reading both dates (one node start instead of two), or both could move off boot together. This is a merge candidate, not a new trigger.
- .claude/hooks/system-audit.js (SessionStart, line 11 of settings.json) and the system-audit skill (SKILL.md, 'audit briefing') — Existing boot/audit surface for system health, which could print the 'evolution check overdue' line as one row of its report. Not read in this pass, so whether it already has such a section is unverified.
- .claude/hooks/best-practices-consult-gate.js:51 — Already runs at the moment evolution freshness matters (when best-practices research is consulted) and already tells the model to trigger evolution-check when >60 days stale. The date check could attach there. Domain bundles under domain/bundles/ were not inspected, so no bundle candidate is claimed.


### 3.2 domain/adhoc-lifecycle/adhoc-lifecycle.check.hook.js

**What it does**: Once per ISO week, counts terminal-status rows in every registered state's ADHOC-REGISTER.md and prints a propose-only archive nudge. Steps: (1) line 27-28 compute the ISO week (silent if the clock throws). (2) line 30-31 read the guard file domain/adhoc-lifecycle/.last-sweep-week and return {fired:false} if it equals this week. (3) lines 33-46 loop over states.all() (lib/states.js), take states.knowledgeDir(key)/ADHOC-REGISTER.md, skip states with no register (line 38), and for each markdown table row matching /^\|\s*[A-Z]?\d+\s*\|/ with >=7 cells count it when cell[6] matches /\b(ANSWERED|OWNED-ELSEWHERE|TICKETED|RESOLVED)\b/ (line 34, 44); keep up to 4 samples as 'state:id'. (4) line 47: if no register was readable at all, return fired:false WITHOUT stamping the guard. (5) line 49 stamps the guard with the week (even if there are zero terminal rows). (6) line 51: zero terminal rows returns fired:false. (7) lines 53-62 otherwise returns fired:true with contextOut. It never moves files itself. runHook (lib/hook-runtime.js, line 14, 26) supplies the telemetry row.

**Prints**: Printed only when: this ISO week not yet stamped AND at least one register readable AND terminalRows > 0. Text (lines 56-61): '🧹 adhoc-lifecycle (weekly): N terminal-status adhoc row(s) ripe for archive — <state:id, up to 4>[ …]' then '   ANSWERED / TICKETED / OWNED-ELSEWHERE / RESOLVED — they owe nothing and clutter active surfacing.' then '   Review:  node domain/adhoc-lifecycle/adhoc-lifecycle.js sweep' then '   Archive: node domain/adhoc-lifecycle/adhoc-lifecycle.js archive --row <id> [--slug <dir>]' then '   Reversible: unarchive --row <id>. (Surfaced once per ISO week.)'. Otherwise prints nothing. Current main guard file content is '2026-W41'; today 2026-10-05 is ISO W41, so it is silent now until W42.

**Registration**: .claude/settings.json lines 41-48: SessionStart, direct command (NOT wrapped with hook-runtime.js --wrap): node "${CLAUDE_PROJECT_DIR}\\domain\\adhoc-lifecycle\\adhoc-lifecycle.check.hook.js" (line 47). It is the 10th and last entry in the single SessionStart group; it calls runHook itself with name 'adhoc-lifecycle', event 'SessionStart'. Also registered in system/registry.jsonl per NUKE-MARKER.md line 8.

**Eval**: Yes: domain/adhoc-lifecycle/adhoc-lifecycle.eval.js (README line 36 says 14 fixtures, CLI + hook smoke, temp-dir, never touches the real register). Not run by me (read-only rule).

**Log**: Feature folder has log.jsonl (9942 bytes in main, last row 2026-10-04T17:30:07Z, rows are cmd/outcome/dur_ms) BUT it is written by the adhoc-lifecycle.js CLI (cmds match/promote/archive/unarchive/sweep; last tail rows are eval fixtures run in temp dirs), NOT by the boot hook. The hook writes no log.jsonl row per run; its per-run record is only the central telemetry row from runHook. README line 37 declares log.jsonl as CLI instrumentation. Other Feature files: README.md (has symptom/goal/goal_signal/retention keys; footprint key absent; goal_status: draft), NUKE-MARKER.md present.

**Telemetry**: Main system/telemetry/hook-fires*.jsonl (8 files), rows with hook 'adhoc-lifecycle': 524 total. Last 7 days (cutoff computed from now): 91 rows, average dur_ms about 111 ms (the rows I sampled from 2026-09-14 show fired:false, dur_ms 8, so the average is pulled up by a few slow runs, e.g. cold first-run/OneDrive). Boot-cost note in the handoff says 0.2 s. I did not compute the max or the fired:true count.

**Has a Feature folder**: true

**Reads**

- lib/hook-runtime.js (line 14, require)
- lib/states.js (line 15; states.all(), states.knowledgeDir(key))
- domain/adhoc-lifecycle/.last-sweep-week (line 30)
- <state knowledge dir>/ADHOC-REGISTER.md for every registered state, e.g. projects/coding-projects/active/etanah-knowledge/<state>/ADHOC-REGISTER.md (line 38; gitignored, main checkout only)
- env CLAUDE_PROJECT_DIR (line 13)

**Writes**

- domain/adhoc-lifecycle/.last-sweep-week (line 49, writeFileSync of the ISO week string; written when any register was read, even if nothing to report)
- central hook telemetry system/telemetry/hook-fires*.jsonl via runHook (not written by this script's own code)

**External calls**

- None. No network, no git, no child processes in the hook (only fs, path, lib/hook-runtime.js, lib/states.js).

**Install blockers**

- forgeInstall() would REFUSE this script as written. core/forge.js:365: 'source must be an existing .js file directly under .claude/hooks/' — this file is already at domain/adhoc-lifecycle/, so die(2) 'install hook: source must be an existing .js file directly under .claude/hooks/ — got ...'. It is already a Feature (installed/forge-born 2026-08-19) so install does not apply; also line 379 would return COLLISION: 'domain/adhoc-lifecycle already exists'.
- Even if it were under .claude/hooks, core/forge.js:385-391 refuses sibling-relative references: ROOT_UP only permits path.join(__dirname,'..','..') with two parent hops. The hook has line 13 path.resolve(__dirname,'..','..') (fine, ROOT_UP regex matches comma/quote form), but line 15 uses path.join(__dirname,'..','..','lib','states.js') (two-level, ok) and line 17 GUARD = path.join(__dirname,'.last-sweep-week') (a sibling-relative __dirname use, would be flagged unless --allow-relative).
- Code-reference check (forge.js:393-412) would only fire on files naming .claude/hooks/adhoc-lifecycle.check.hook.js; grep found none, so not a blocker.
- The guard file .last-sweep-week lives inside the Feature folder (hook line 17), so a move off boot into another trigger must keep that path or re-point it.

**Consumers**

- domain/adhoc-lifecycle/adhoc-lifecycle.eval.js:13 — requires/spawns the hook as HOOK for a smoke fixture (own eval); runs against temp dirs
- domain/adhoc-lifecycle/README.md:21 — documents it as Door B weekly sweep (lines 21, 35, 46-48)
- domain/adhoc-lifecycle/NUKE-MARKER.md:8 — documents rollback incl. removing the settings.json SessionStart entry
- system/system-architecture.md:60 — only documents it in the SessionStart hook table
- system/liveness-dashboard.md:12 — generated listing only (also feature-census.md:228, monitoring-dashboard.md:144, feature-audit-2026-09-06.md:127)
- lib/observatory.js:930 — lists 'adhoc-lifecycle' as a member name of a feature group (documentation/grouping only)
- main/handoff-2026-10-05-boot-structure-audit.md:69 — documents the boot-cost finding (0.2 s, 'Off boot')
- NONE found — No file reads this hook's output text ('terminal-status adhoc' / 'ripe for archive' matched only inside the hook itself), and nothing reads .last-sweep-week except the hook. Not referenced in .claude/CLAUDE.md, Feature/Session-Briefing-System/session-briefing.md, Feature/Domain-Expansion/expansion-protocol.md (grep 'adhoc-lifecycle|ripe for archive|weekly sweep' = 0 hits), quest/*.js, or .claude/hooks/*.js. The adhoc-lifecycle.js CLI (same Feature) is referenced by .claude/skills/adhoc-save/SKILL.md:55 and lib/adhoc-save-audit.js:68 (promote path), but those depend on the CLI, not on this boot hook. Sibling register readers (domain/adhoc-register, adhoc-paste-detector, etanah-intake-gate, de-knowledge-gate) read ADHOC-REGISTER.md independently; they do not consume this hook.

**Existing trigger candidates**

- Feature/Domain-Expansion/expansion-protocol.md (DE step) — README line 46 says DE was rejected for the sweep because it skips when not invoked; as a fallback only, grep found no current adhoc-lifecycle reference there.
- .claude/skills/adhoc-save/SKILL.md (step at line 55) and lib/adhoc-save-audit.js — the moment an adhoc is saved/closed is exactly when a row becomes terminal; adhoc-save already invokes adhoc-lifecycle.js promote, so an archive/sweep step could run there (the handoff says the real fix is to move the folder when an adhoc is closed).
- domain/adhoc-register/adhoc-register.check.hook.js (UserPromptSubmit-side register reader) and domain/adhoc-paste-detector/adhoc-paste-detector.check.hook.js — they already read ADHOC-REGISTER.md at ticket/adhoc time; the sweep count could be emitted there (Door A match is already ticket-time). Their registration/bundle membership under domain/bundles/ was not checked by me.
- quest/redmine-reconcile.js (referenced in system/agentic-ticket-workflow-assessment-2026-08-24.md:10,15 proposal #4) — the assessment proposes folding adhoc-lifecycle sweep verdicts into redmine-reconcile output; that script already runs when ticket status is checked. File itself not read by me.
- Feature/Session-Briefing-System briefing / list-redmine at boot (open-quest-surfacer.js already runs at SessionStart) — an already-booting surfacer could include the count; not verified that it reads the register.


### 3.3 .claude/hooks/boot-load-verification.js

**What it does**: 27-line static script. Writes one fixed text block to stdout (lines 14-26) and exits 0 (line 27). No condition, no branching, no input read: it prints the same block on every SessionStart.

**Prints**: Always the same block: blank line; "SESSION BOOT — required reads before any work:" (line 16, prefixed with a gear emoji); numbered list 1 .claude/CLAUDE.md, 2 .claude/personality.md, 3 main/main-memory.md, 4 Feature/Domain-Expansion/expansion-protocol.md (lines 18-21); then 'Emit "Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓"' and "AFTER actually Reading each file. Then deliver Session Briefing." (lines 23-24). Header comment (lines 9-12) records that master-memory was replaced by main-memory on 2026-07-12 and claude-md-amendments dropped.

**Registration**: .claude/settings.json line 13-16, event SessionStart, second entry (after system-audit.js): `node "${CLAUDE_PROJECT_DIR}\lib\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\.claude\hooks\boot-load-verification.js" SessionStart` (wrapper form, no explicit telemetry-name arg, so telemetry name = file base name). Also listed in REGISTRY.md:20 as "SessionStart | wrapped | pre-forge". Not in any domain/bundles manifest.

**Eval**: No. Glob domain/*boot*/** returns only domain/worktree-cleanup-boot/. No .claude/hooks/boot-load-verification.eval.js exists (system/feature-census.md:11 says GAPS: no eval; sibling boot-required-read-gate.eval.js exists, this one has none).

**Log**: No own log.jsonl and no Feature folder. The only per-run record is the generic wrapper telemetry from lib/hook-runtime.js (system/telemetry/hook-fires*.jsonl in the main checkout), a row per fire (ts, hook, dur_ms, reason = first printed line).

**Telemetry**: Main checkout system/telemetry/hook-fires*.jsonl contains 1106 total rows named boot-load-verification across all files (last two rows 2026-10-04T17:09Z dur 183 ms and 17:26Z dur 331 ms). Last 7 days: 89 fires, average dur_ms 1135.6 (includes slow outliers; wrapper dur_ms, not the 0.39 s figure). Computed read-only by a PowerShell scan of all hook-fires*.jsonl files filtering ts >= now-7d.

**Has a Feature folder**: false

**Reads**

- none reported

**Writes**

- none reported

**External calls**

- none reported

**Install blockers**

- No __dirname use and no require() in the script (grep of the 27 lines: none), so core/forge.js:385-390 safety 1 (sibling-relative refs; only path.join(__dirname,'..','..') is allowed) would NOT refuse it.
- forge.js:393-412 safety 2 refuses if code files under domain, .claude, lib, core, quest, system name the path `.claude/hooks/boot-load-verification.js` outside comments. Grep for 'boot-load-verification' in those trees found: lib/observatory.js:107 (comment) and :944 (bare name string 'boot-load-verification', not the .claude/hooks path, not matched by PATH_RX/JOIN_RX), domain/observatory/observatory.eval.js:158 (code line; text is `'.claude/hooks/boot-load-verification.js'` inside a check message and `!disabled.includes('.claude/hooks/commit-gate.js') && !disabled.includes(...)` on that same line, the string contains the old path so PATH_RX would match and this line is not a comment -> install likely REFUSED with codeRefs = domain/observatory/observatory.eval.js; verify by reading line 158 exactly: `disabled.includes('.claude/hooks/commit-gate.js') && !disabled.includes... ` as quoted in grep output: check('disabled detection: commit-gate.js is disabled, boot-load-verification.js is not', ...) ). The grep output for that line shows only 'boot-load-verification.js is not' (bare file name inside the message), which does not contain `.claude/hooks/` so it may not match PATH_RX; I did not read the full line to confirm, treat as unverified.
- forge.js:379: refuses (exit 3) if domain/boot-load-verification already exists; it does not (Glob found none).
- forge.js:365: source must sit directly under .claude/hooks/ — satisfied.
- Install also moves a .eval.js if present; none exists, so a Feature would need a new eval written (README/NUKE-MARKER/eval are required Feature parts).

**Consumers**

- .claude/CLAUDE.md:15 — Documents the same boot-load verification rule (briefing's first line 'Boot files loaded: ...'); the CLAUDE.md boot order itself is the primary source of the same 4-file list. Line 298 only names the hook in a version-history entry (documentation only). Does not read the hook output.
- Feature/Domain-Expansion/expansion-protocol.md:39 — Documents the 'Boot files loaded' line (text mention only, no dependency on hook output).
- lib/observatory.js:107 — Comment only: cites it as an example of a plain exit-after-print being normal completion. Line 944: lists 'boot-load-verification' as a member name in a boot group config (reads telemetry by hook name, not its output).
- domain/observatory/observatory.eval.js:158 — Eval asserts the disabled-hook detector does NOT flag boot-load-verification.js (it requires the file path to exist as a negative case; this is a hard path dependency on .claude/hooks/boot-load-verification.js).
- system/system-architecture.md:61 — Docs only (hook table line 61 and dependency row line 206 says it is a 'reminder if any not Read' for the Quest skill; this description does not match the code, which prints unconditionally).
- system/enforcement-INDEX.md:29 — Docs only; lines 15 and 48 also. Says it will be extended with model-change check, never done (also system/evolution-protocol.md:15,73 describes a planned extension that is not in the file).
- REGISTRY.md:20 — Docs/registry row only.
- .claude/hooks/boot-required-read-gate.js:2 — No code dependency found; only sibling hook. Its output is a different 'boot-required-read-gate: N refs' line (line 97). .claude/hooks/open-quest-surfacer.js:20 and system-audit.js:19 mention it in comments (Pairs with) only.
- system/monitoring-dashboard.md, system/liveness-dashboard.md, system/feature-audit-2026-09-06.md, system/feature-census.md:114 — Generated ledgers listing it by name (monitoring-dashboard.md:114: 286 fires, REVIEW; liveness-dashboard.md:41; feature-audit:55 KEEP, no README; feature-census.md:11: legacy-hook, GAPS: no eval). No dependency on output.
- Feature/Session-Briefing-System/session-briefing.md, .claude/skills/**/SKILL.md, quest/*.js, core/*.js — Grep for the hook file name and for the printed strings 'SESSION BOOT', 'required reads before any work', 'Boot files loaded' found no match in these (only CLAUDE.md:15 and expansion-protocol.md:39 carry 'Boot files loaded'). No one reads or parses the hook's output text.

**Existing trigger candidates**

- .claude/hooks/boot-required-read-gate.js (SessionStart, settings.json line 17-20) and the other SessionStart scripts — They run at the same boot moment; text could be merged into any already-registered SessionStart output, or into the system-audit.js first entry. Not verified as design, only as same event.
- .claude/CLAUDE.md lines ~12-20 (Session Boot Order + step 5 boot-load verification) — The same 4-file list and the same 'Boot files loaded' emit instruction already live in CLAUDE.md, which is itself loaded at boot, so the hook output duplicates CLAUDE.md content (verified by comparing CLAUDE.md boot order text with the hook text).
- Feature/Session-Briefing-System/session-briefing.md (briefing step) — The briefing is where the 'Boot files loaded' line is delivered per CLAUDE.md step 5; no match for the hook strings was found in that file, so no existing coupling, only same moment of need.


### 3.4 .claude/hooks/system-check-trigger.js

**What it does**: Lines 19-65. Exits silently if system/evolution-protocol.md is missing (line 19-21). Reads that file (line 23) and regex-extracts `last-system-check: YYYY-MM-DD` (line 26). If no match, prints a "never run" warning (lines 30-39). If a date is found, it computes whole elapsed days from now (lines 43-45), and if elapsed >= CADENCE_DAYS (30, line 16) it prints an overdue warning (lines 48-58). Otherwise it prints nothing (line 60). Any exception exits 0 silently (lines 63-65). Current value in the file is `last-system-check: 2026-09-22` (system/evolution-protocol.md:55), so today (2026-10-05, 13 days) it is silent.

**Prints**: Two cases, stdout. (a) No date: heading line `⚙️  system-check-trigger: ⚠️ no `last-system-check` recorded in system/evolution-protocol.md` plus "system-check has never been run..." and an Invoke/Skill line (lines 30-38). (b) Elapsed >= 30 days: `⚙️  system-check-trigger: ⚠️ N days since last system-check (cadence: 30 days)`, `   Last check: <date>`, "Architectural drift may have accumulated...", `Invoke: "/system-check" or "audit the system" or "deep audit"`, `Skill: .claude/skills/system-check/SKILL.md` (lines 50-55). Otherwise nothing. Telemetry shows it printed 57-64 days overdue warnings in mid-Sept; fired=false since the 2026-09-22 stamp.

**Registration**: .claude/settings.json:31, SessionStart, wrapped: `node "${CLAUDE_PROJECT_DIR}\lib\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\.claude\hooks\system-check-trigger.js" SessionStart`. REGISTRY.md:87 lists it "SessionStart | wrapped | pre-forge".

**Eval**: No eval. system/feature-census.md:54 says "GAPS: no eval"; Glob for .claude/hooks/system-check-trigger* returns only the .js file.

**Log**: No domain/system-check-trigger/ folder and no log.jsonl. Only the generic wrapper telemetry (system/telemetry/hook-fires*.jsonl, row per run with hook, dur_ms, fired, reason when fired) written by lib/hook-runtime.js --wrap; no Feature-level log.jsonl.

**Telemetry**: Main checkout system/telemetry/hook-fires*.jsonl, last 7 days (read-only): 88 fires of hook "system-check-trigger", fired=false on all 88 (silent, within the 30-day window since 2026-09-22), average dur_ms = 1074 (wrapper-measured, includes node start and hook-runtime overhead; the handoff's 0.33 s differs, and visible rows range 305-2249 ms). Earlier: fired=true on 2026-09-14 to 09-21 with 57-64 days overdue, then stamp refreshed 2026-09-22.

**Has a Feature folder**: false

**Reads**

- system/evolution-protocol.md (line 15, 23): only the `last-system-check:` line is used

**Writes**

- none (only stdout)

**External calls**

- none: no network, no git, no child processes. Requires only fs and path (lines 11-12). PROJECT_ROOT = path.resolve(__dirname,'..','..') (line 14).

**Install blockers**

- NO BLOCKER found for `node core/forge.js install hook .claude/hooks/system-check-trigger.js`.
- Safety 1 (core/forge.js:381-391): refuses on non-comment lines with require('./x') or __dirname other than __dirname,'..','..'. The script's only __dirname use is line 14 `path.resolve(__dirname, '..', '..')`, which matches ROOT_UP (forge.js:385) and is stripped. It has no relative require. Passes.
- Safety 2 (forge.js:392-412): refuses if non-comment code in domain, .claude, lib, core, quest, system names `.claude/hooks/system-check-trigger.js` (settings.json and domain/bundles/ are excluded and get rewritten; .md files are only doc refs). Grep: the only path references are .claude/settings.json:31 (excluded), SKILL.md:114 (md, doc ref), REGISTRY.md:87 and system/*.md (docs). lib/observatory.js:950 uses the bare name 'system-check-trigger' in a members array, not the path, so PATH_RX and JOIN_RX do not match. No code refs, so not refused. The skill SKILL.md:114 path would go stale unless re-pointed (doc only).
- Note: install requires --symptom --goal --signal --retention --footprint --nod (forge.js:362), and it keeps telemetry name 'system-check-trigger' (forge.js:375).

**Consumers**

- .claude/skills/system-check/SKILL.md:20 — documents it: trigger table says the hook flags overdue at boot (also listed as a related file at line 114). Does not read its output.
- .claude/skills/system-check/SKILL.md:45 — the skill's step 7 writes `last-system-check` in system/evolution-protocol.md, the only data this hook reads (data coupling; also documented at line 113).
- system/evolution-protocol.md:55 — holds the `last-system-check:` value the hook parses (line 58 holds findings-count, not read by the hook).
- system/phrase-registry.md:107 — documents the hook's regex /last-system-check:\s*(\d{4}-\d{2}-\d{2})/ as a phrase dependency; changing the stamp format would break the hook.
- lib/observatory.js:950 — lists 'system-check-trigger' by name as a member of an observatory group; documentation/grouping only, no output dependency.
- system/system-architecture.md:68 — only documents it (SessionStart table row; line 210 catalog row: 30-day elapsed reminder).
- REGISTRY.md:87 — only documents it (hook inventory row).
- system/feature-census.md:54 — only documents it: legacy-hook, registered, GAPS: no eval. Also system/feature-audit-2026-09-06.md:57, liveness-dashboard.md:205, monitoring-dashboard.md:118 (REVIEW: 0 blocks).
- main/handoff-2026-10-05-boot-structure-audit.md:68 — documents the batch-2 plan row for it: move off boot, show 'last system check N days ago' at Domain Expansion.
- NONE: Feature/Session-Briefing-System/session-briefing.md, Feature/Domain-Expansion/expansion-protocol.md, .claude/CLAUDE.md, domain/**/*.js, quest/*.js, other .claude/hooks/*.js — grep found NO reference to the file name or its printed strings (CLAUDE.md:119 mentions /system-check only in the system-audit.js paragraph). No code requires it as a module. Its stdout is not parsed by any script found.

**Existing trigger candidates**

- .claude/skills/system-check/SKILL.md (step 7 already updates last-system-check; and the skill itself is the job) — The hook only reminds the user to run this skill. Moment of need = when the user asks for system health or runs /system-audit; that skill already prints an audit briefing.
- Feature/Domain-Expansion/expansion-protocol.md (and skill domain-expansion) session-end ritual — Matches the handoff's plan (main/handoff-2026-10-05-boot-structure-audit.md:68): a Domain Expansion step already runs a meta-audit (CLAUDE.md names Step 12.5); it could print 'last system check N days ago' there instead of at boot. A reminder at session end suits a 30-day cadence better than every boot. Not verified: exact step text in the protocol, since grep found no system-check reference there.
- .claude/hooks/system-audit.js (SessionStart, CLAUDE.md:119 'Layer 0') — Also a boot-time check; the same elapsed-days line could be one more check inside it, so it costs no extra process. This keeps it at boot, though, so it does not satisfy the 'off boot' goal.
- .claude/hooks/evolution-check-trigger.js (SessionStart sibling, same pattern, same file system/evolution-protocol.md) — Identical job on the same file with a different key (last-evolution-check), so both elapsed checks could be one script. Both are boot-time. Not verified whether evolution-check-trigger is also a batch-2 target.
- system/system-architecture.md / lib/observatory.js briefing (`node lib/observatory.js --brief`) and the system-audit skill output (/system-audit) — On-demand health surfaces where 'N days since last system-check' is a natural row. Not verified: whether they already show it.


### 3.5 .claude/hooks/boot-required-read-gate.js

**What it does**: SessionStart hook, never blocks (always exit 0, line 112). Steps: (1) PROJECT_ROOT = path.resolve(__dirname,'..','..') (line 20); CLAUDE_MD = <root>/.claude/CLAUDE.md (line 21). (2) main(): if CLAUDE.md missing, exit 0 silently (line 89). (3) Reads CLAUDE.md (line 90), extracts every backtick-wrapped ref matching [a-zA-Z0-9./_-]+.(md|js|json|txt) (extractRefs, lines 61-67). (4) resolveRefs (70-85) builds a recursive index of the WHOLE repo root (buildFileIndex 39-58; walks all dirs except .git, node_modules, .m2, target, database-archive, worktrees; indexes by relative path and basename) - this full-tree walk is the cost. Each ref: placeholder (/N{3,}/, line 34/77) skipped; basename in IGNORE_REFS (settings.local.json, tindakan/tugasan/template.config.json, Etanah-Codebase-Read.md, et_main_uat.sql; lines 27-31) counted external-absent; resolves if byRel or byBase hit or fs.existsSync(root/ref) or existsSync(ref) (79-81); else broken. (5) Prints (95-108). Any exception swallowed silently (109-111). main() runs only if require.main===module (115); module.exports exposes buildFileIndex, extractRefs, resolveRefs, IGNORE_REFS, PLACEHOLDER_RE (117).

**Prints**: Always: blank line + header '⚙️  boot-required-read-gate: N refs — X resolve · Y placeholder · Z external-absent' (line 97). If zero broken: '✓ all resolvable references resolve' (line 100). If broken: '⚠️  N genuinely-broken pointer(s) in CLAUDE.md:' then one '   🔴 <ref>' per broken ref, blank, 'Fix or remove these in CLAUDE.md.' (102-105). Trailing blank line. Telemetry reason field shows typical output is the header, e.g. '59 refs — 53 resolve · 0 placeholder · 6 external-absent' (system/telemetry/hook-fires-2026-10.jsonl:1228); rows in the 7-day sample show 56-60 refs and 6 external-absent.

**Registration**: .claude/settings.json line 19, event SessionStart, third entry in the single SessionStart group, via the wrapper: node \"${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js\" --wrap \"${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\boot-required-read-gate.js\" SessionStart. REGISTRY.md:21 lists it as 'SessionStart | wrapped | pre-forge'. system/feature-census.md:151 lists it as legacy-hook, registered, PROPER.

**Eval**: Yes, loose: .claude/hooks/boot-required-read-gate.eval.js (fixtures plus a real CLAUDE.md run). Not in a Feature folder; moves with the hook on install (forge.js lines 419-433).

**Log**: No Feature log.jsonl (no domain/ folder; a Glob for domain/*boot* only matched worktree-cleanup-boot). It does get one row per run in the central system/telemetry/hook-fires*.jsonl (hook:boot-required-read-gate, with dur_ms, blocked:false, and the printed header in reason). 1091 rows in all telemetry files found; the reason field records only the header line, not the broken-pointer list.

**Telemetry**: Read-only, from hook-fires*.jsonl files present in this worktree, rows with ts >= 2026-09-28 (latest row 2026-10-04 17:01): 74 fires, average dur_ms 2561 (about 2.6 s). All-time across files: 1091 rows, average 936 ms (the old rows are shorter). Individual rows seen 1376-3823 ms. Note the 1.0 s figure given in the task differs from this 7-day average; the worktree telemetry may not equal the main checkout. system/monitoring-dashboard.md:104 says 286 fires, 0 blocks. No row in the 7-day sample reported broken pointers (all matching 'N refs' header rows; the visible reason field carries only the header).

**Has a Feature folder**: false

**Reads**

- CLAUDE.md at <root>/.claude/CLAUDE.md (line 90)
- readdirSync of every directory under repo root except .git/node_modules/.m2/target/database-archive/worktrees (lines 39-58); existence checks fs.existsSync (line 81)

**Writes**

- stdout only. No file writes by the script itself. (The wrapper lib/hook-runtime.js --wrap writes a row to system/telemetry/hook-fires*.jsonl with the hook name boot-required-read-gate; not verified in the wrapper source this pass, but rows exist.)

**External calls**

- none: no network, no git, no child_process (requires only fs and path, lines 16-17)

**Install blockers**

- forgeInstall() is core/forge.js:360. Source must be a .js directly under .claude/hooks/ (line 365): OK.
- Sibling-relative check (lines 385-391): refuses if a non-comment line has require('./x') / require('../x') or uses __dirname other than the form (__dirname, '..', '..'). Script line 20 is path.resolve(__dirname, '..', '..') which matches ROOT_UP and is allowed. Script has no require('./...') (only fs, path). Line 21 CLAUDE_MD uses PROJECT_ROOT, not __dirname. => NOT refused on this check. Caveat: the eval file's require('./boot-required-read-gate.js') (eval line 14) is rewritten by the installer (lines 427-432), so it moves cleanly.
- Other-code-references check (lines 393-412): refuses if a .js/.json file in domain, .claude, lib, core, quest, system names the path '.claude/hooks/boot-required-read-gate.js' (regex PATH_SRC) or path.join('hooks','boot-required-read-gate.js') on a non-comment line. Grep found the full path '.claude/hooks/boot-required-read-gate.js' as text in domain/claude-md-watch/README.md:19 (a .md = docRefs only, not blocking; will go stale after the move, so update it), and the file names only in system-audit.js comments (lines 20, 333-334, 430: comments, skipped by the comment filter), system-edit-gate.js:46 (a regex of bare names without the hooks/ path - does not match PATH_SRC), lib/change-checklist.js:80 and lib/observatory.js:944 (name only, no path). The eval's own file is skipped (line 405). => Not refused as far as the grep shows; not executed. system/system-architecture.md and other docs are doc refs only.
- settings.json entry has the hook-runtime --wrap form (line 19), so install re-points it and appends the telemetry name (line 441). The telemetry name will stay boot-required-read-gate.
- Soft issue: system-edit-gate.js:46 matches the file name boot-required-read-gate.js in a path-protection regex, so a moved file under domain/ still matches by name (not verified beyond reading the regex). Also the hook reads CLAUDE.md from the repo root via __dirname/../.. : after the move the file is at domain/<name>/ which is also two levels up, so the root stays the same.
- Result: no install blocker found by reading; the one concrete follow-up is the stale path text in domain/claude-md-watch/README.md:19.

**Consumers**

- .claude/hooks/system-audit.js:333 — Only documents/duplicates: INV-6 (lines 317-337) independently checks CLAUDE.md refs resolve and comments it is 'defense-in-depth' with this hook. Does not read this hook's output or require it.
- .claude/hooks/boot-required-read-gate.eval.js:14 — Requires it as a module (extractRefs, resolveRefs) and runs fixtures plus a real CLAUDE.md check (lines 24-46). This eval lives next to the hook in .claude/hooks/ (not in a Feature folder).
- domain/claude-md-watch/README.md:19 — Documents it as step 6 'Gates re-run' of the CLAUDE.md update pipeline: runs node .claude/hooks/boot-required-read-gate.js by path (a run by command, not a require).
- lib/change-checklist.js:80 — Names it as a gate string in gateHits ('boot-required-read-gate (refs resolve)') - a label printed in a checklist, no dependency on its output.
- lib/observatory.js:944 — Lists it by name in a 'members' array of a boot-group definition (display grouping).
- .claude/hooks/system-edit-gate.js:46 — Regex of enforcement-hook filenames protected from edit; matches the file name only.
- system/system-architecture.md:207 — Documents only (also lines 62, 561, 671, 676).
- system/enforcement-INDEX.md:15 — Documents only (also line 49).
- system/INDEX.md:81 — Documents only.
- REGISTRY.md:21 — Documents only.
- system/feature-census.md:151 — Documents only.
- main/handoff-2026-10-05-boot-structure-audit.md:66 — Documents only; cost 1.0 s, question 'How to prevent us from needing this?', proposal: check when CLAUDE.md is edited or a linked file moves.
- system/monitoring-dashboard.md:104 — Generated dashboard row (286 fires, 0 blocks).
- system/liveness-dashboard.md:42 — Generated dashboard row.
- system/feature-audit-2026-09-06.md:53 — Audit row: KEEP, 'no README'.
- NONE found — Grep of the whole repo for the file name, for the printed heading text, 'all resolvable references resolve' and 'genuinely-broken pointer' found NO hit in .claude/CLAUDE.md, Feature/Session-Briefing-System/session-briefing.md, Feature/Domain-Expansion/expansion-protocol.md, any SKILL.md, or domain/**/*.js. No code reads its output text. Nothing requires it in production code. Its stdout side effect is only the boot banner.

**Existing trigger candidates**

- domain/claude-md-watch/ (README step 6 'Gates re-run' + claude-md-watch.check.hook.js) — README.md:19 already runs this script by command as part of the CLAUDE.md change ceremony (pipeline run when CLAUDE.md is edited). That is the precise moment the gate is needed (a CLAUDE.md edit or a linked file move). The check hook itself (claude-md-watch.check.hook.js) is a SessionStart hook that only reads the watchlist ledger; it does not run the ref check.
- .claude/hooks/system-audit.js INV-6 (lines 317-337) — Already performs the same check (every CLAUDE.md ref resolves) at SessionStart and states it duplicates this hook; the comment at 333-337 calls it defense-in-depth. The two checks overlap.
- lib/change-checklist.js:80 (gateHits list) — Already names this gate as a step of the change checklist; this is the existing edit-time hook point for a CLAUDE.md change.
- lib/eval-battery.js (referenced by claude-md-watch/README.md:19) — The same README step runs the eval battery, which would exercise boot-required-read-gate.eval.js. Not read this pass; named only because the README references it.


### 3.6 domain/claude-md-watch/claude-md-watch.check.hook.js (22 lines; core logic in lib/watch.js)

**What it does**: The hook (lines 11-22) uses runHook({name:'claude-md-watch', event:'SessionStart'}). Step 1: execFileSync('node', lib/watch.js check) with a 15 s timeout (line 17). Step 2: if that output is non-empty, execFileSync('node', lib/watch.js tick) (line 18), also with a 15 s timeout. Any exception is caught and sets out='' (line 19, fail-open). Step 3: empty output returns {fired:false} (line 20). Otherwise it returns {fired:true, blocked:false, contextOut:out} (line 21). runHook then appends one telemetry row and writes contextOut to stdout (hook-runtime.js 139-145). The row carries ts, hook, event, mode:'native', fired, dur_ms, and reason = the first line of the output, cut to 160 characters.

lib/watch.js 'check' (lines 51-63): active() replays the ledger. A 'watch' row adds an entry by id, a 'resolve' row deletes it, and a 'tick' row overwrites sessions_left (lines 28-36). If nothing is active it exits silently. Otherwise it prints one header line and, per watch, 4 lines (5 if overdue): `  [id] target (changed YYYY-MM-DD, N session(s) left)`, `     OBSERVE: <observe text, full>`, `     revert : git checkout <sha10> -- "<target>"`, `     close  : node lib/watch.js resolve <id> ok|anomaly --note "<evidence>"`, plus `     ⚠ OVERDUE — resolve NOW or the alert repeats every boot` when sessions_left <= 0.

'tick' (lines 64-67): for EVERY active watch it appends a new row {kind:'tick', id, ts, sessions_left: left-1}. So every boot with at least one active watch appends N rows (32 now), and sessions_left goes ever more negative (monitoring-dashboard.md:233-247 shows -11).

Print condition: any watch that is active (watched, not resolved). Overdue is not a filter. Measured size of the output: the handoff states 14,596 characters (not re-measured by me). The per-watch OBSERVE text is the free-text 'observe' field given at 'watch.js add' time, printed in full.

Other lib/watch.js commands (not run at boot): 'add' (lines 40-50; runs `git log -1 --format=%H -- <target>` to get the rollback SHA and appends a 'watch' row) and 'resolve' (lines 68-76; appends a 'resolve' row).

**Prints**: stdout of 'lib/watch.js check' verbatim, via contextOut (hook-runtime.js:145). Heading line: '🔭 CHANGE-WATCH: N active observation(s) — VERIFY each this session:'. Then per active watch, 4 lines ('[id] target (changed date, N session(s) left)' / 'OBSERVE: ...' / 'revert : git checkout <sha10> -- "<target>"' / 'close  : node lib/watch.js resolve <id> ok|anomaly --note "<evidence>"'), plus a 5th OVERDUE line when sessions_left <= 0. Condition: at least one active watch; silent otherwise (lib/watch.js:53). Latest telemetry reasons show N=31 then 32 on 2026-10-04.

**Registration**: .claude/settings.json line 43, SessionStart: `node "${CLAUDE_PROJECT_DIR}\\domain\\claude-md-watch\\claude-md-watch.check.hook.js"`. It is a DIRECT registration with no `hook-runtime.js --wrap`. The runtime is used natively inside the script (runHook). The adjacent entry at line 47 (adhoc-lifecycle) uses the same direct form. It is the 9th of 10 SessionStart commands. The registry says it was born via core/forge.js on 2026-08-16.

**Eval**: domain/claude-md-watch/claude-md-watch.eval.js exists but is a forge stub. F1 runs the hook with '{}' and checks exit 0. F2 is literally `check('F2 ... stub passes until implemented', true, 'stub')`, which always passes (line 16). It does not test the printed output, the tick, or the empty-ledger silence.

**Log**: No. domain/claude-md-watch/ holds only NUKE-MARKER.md, README.md, the hook and the eval (verified by Glob and Test-Path on the main checkout: log.jsonl False). The only per-run record is the central system/telemetry/hook-fires*.jsonl row. The README has goal, goal_signal, retention ('rotate monthly'), symptom, but goal_status is 'draft' and there is no footprint key.

**Telemetry**: Main checkout system/telemetry/hook-fires*.jsonl, last 7 days: 89 rows for hook 'claude-md-watch', all fired=true, mode native. Mean dur_ms 1885.7 (my own PowerShell calculation, not cross-checked; max not captured). The 3 latest rows show 302, 794 and 327 ms, so the mean is pulled up by slower earlier rows. Cumulative per system/monitoring-dashboard.md:107: 289 fires, 396 total seconds.

**Has a Feature folder**: true

**Reads**

- system/claude-md-watchlist.jsonl, read by lib/watch.js (LEDGER, lib/watch.js:21 and :24). Main checkout copy is git-ignored (.gitignore:86). Measured on main: 1180 lines, 125,210 characters, append-only.
- CLAUDE_PROJECT_DIR env var (hook line 8; watch.js line 20)
- stdin JSON, read by runHook (readStdin, hook-runtime.js:127)
- lib/hook-runtime.js (hook line 9)

**Writes**

- system/claude-md-watchlist.jsonl: one 'tick' row per active watch on every boot where the output was non-empty (lib/watch.js:65, appendFileSync at :27). 32 rows per boot at present.
- system/telemetry/hook-fires.jsonl: one row per run via appendTelemetry (hook-runtime.js:139-144), named 'claude-md-watch'. Also openTurn(input, event) is called at hook-runtime.js:128; I did not read what it writes.
- No domain/claude-md-watch/log.jsonl is written by the script.

**External calls**

- hook line 17: execFileSync('node', [lib/watch.js, 'check']), a child node process, timeout 15000 ms
- hook line 18: execFileSync('node', [lib/watch.js, 'tick']), a second child node process, timeout 15000 ms. This one only runs when check printed something.
- So each boot spawns up to 2 extra node processes on top of the hook's own. No network. No git call at boot: the git call is only in 'watch.js add' (lib/watch.js:44) and does not run at boot.

**Install blockers**

- The script is ALREADY installed: it lives at domain/claude-md-watch/ with README, eval, NUKE-MARKER and a registry line. `forge install hook` would be refused by its first check, core/forge.js:365: `path.dirname(path.resolve(src)) !== path.resolve(hooksDir)` -> die(2, 'install hook: source must be an existing .js file directly under .claude/hooks/'). Its home is domain/claude-md-watch/, not .claude/hooks/.
- Even if it were under .claude/hooks/, the relative-reference check (forge.js:385-391) would NOT refuse it. The only __dirname use is line 8 `path.resolve(__dirname, '..', '..')`, which matches ROOT_UP (the allowed two-levels-up form). It has no `require('./..')` sibling-relative line. Line 9 is a require(path.join(ROOT,...)), which is not a relative require.
- The code-reference check (forge.js:392-412) matches the old path `.claude/hooks/claude-md-watch.js` in domain, .claude, lib, core, quest and system. I did not run it, so I cannot say whether it finds anything. Not applicable anyway given the first blocker.
- Collision check forge.js:379: domain/claude-md-watch already exists, so install would exit 3 ('COLLISION').

**Consumers**

- domain/de-close-gate/de-close-gate.check.hook.js:149 — Reads the same ledger system/claude-md-watchlist*.jsonl (line 223) for check C5 (lines 149-167, message at :244). It does not use the boot output and does not require the hook. It needs 'watch' rows added during the session (lib/watch.js add). It does not read 'tick' rows.
- lib/audit-briefing.js:60 — Reads the ledger (glob claude-md-watchlist*.jsonl) and counts overdue watches (left <= 0) as a NOT WORKING line at :62. It does not use the hook's output.
- lib/turn-report.js:80 — Reads the ledger; the report section '## Overdue watches (lib/watch.js)' is at :101-103. It does not use the hook's output.
- lib/observatory.js:740 — Reads the ledger to build the overdue-watches list; the finding text is at :1175. It does not use the hook's output.
- lib/housekeeping.js:32 — Lists system/claude-md-watchlist.jsonl with verb 'keep'. Documents retention only.
- Feature/Domain-Expansion/expansion-protocol.md:172 — DE step says 'overdue watches -> lib/watch.js resolve now'. Documents the manual resolve step. It is part of the audit-briefing step (lines 170-174). It does not read the boot output.
- system/INDEX.md:83 — Documents 'node lib/watch.js add ...' BEFORE the commit. Documentation of add only.
- domain/protime-plan/README.md:39 — Documents that the boot CHANGE-WATCH line is the visible signal until the first scheduled write is confirmed. The watch row wmutm5ont (monitoring-dashboard.md:248) is a human-attested observation. The text depends on the boot line existing.
- .claude/CLAUDE.md:298 — Only documents it: v1.70/v1.71 version-history lines name claude-md-watch as the update pipeline; the Version-bump discipline line (:300) points to domain/claude-md-watch/README.md. The grep output was truncated ('long matching line'), so I did not read the exact words.
- .claude/skills/system-audit/SKILL.md:27 — Documents that the audit reads system/claude-md-watchlist*.jsonl.
- system/system-architecture.md:63 — Documents the hook in the SessionStart catalog.
- system/feature-census.md:239 — Documents the Feature and that lib/watch.js is 'invoked-manually' (:306). Also liveness-dashboard.md:56-57, monitoring-dashboard.md:107, feature-audit-2026-09-06.md:54 (generated tables).
- domain/claude-md-watch/README.md:20 — Describes the pipeline: step 7 register a watch, step 8 'this Feature's SessionStart hook emits every active watch'. The boot alert is the designed repeat-until-resolved mechanism.
- main/handoff-2026-10-05-boot-structure-audit.md:51 — Documents the 14,596 character cost and the intended ruling (item 2).
- Feature/Session-Briefing-System/session-briefing.md — I found NO reference to watch.js, CHANGE-WATCH or claude-md-watch here (the Feature-folder grep, -o mode, matched only expansion-protocol.md). One long line (126) matched case-insensitive 'watch' in an earlier grep but was not read, so I do not claim anything about it.
- (no module consumer) — No file requires() the hook or lib/watch.js as a module. The only code that spawns lib/watch.js is the hook itself (lines 17-18). The other lib/*.js files and de-close-gate read the ledger file directly. No skill, quest/*.js or .claude/hooks/*.js file names the heading 'CHANGE-WATCH' (grep over .claude hooks/skills/CLAUDE.md found nothing).

**Existing trigger candidates**

- domain/de-close-gate/de-close-gate.check.hook.js (C5, lines 149-167, and C6 audit-briefing gate per expansion-protocol.md:174) — It already runs at DE close, when `lib/watch.js add` rows are required, and already reads the ledger. The overdue-watch ruling is already scripted at DE step 12.5 (expansion-protocol.md:170-172: audit-briefing output includes overdue watches, then 'resolve now').
- lib/audit-briefing.js:60-62 — Already computes and prints an overdue-watch count as a NOT WORKING line ('node lib/watch.js check'). Run from DE 12.5 and the /system-audit skill (system-audit/SKILL.md:27). A one-line count may replace the full list.
- lib/turn-report.js:101-103 and lib/observatory.js:1175 — Both already render the full overdue-watch list with the resolve command, on demand.
- .claude/hooks/open-quest-surfacer.js (SessionStart, settings.json:35) — Already runs at boot. I did not read it, so it is only a candidate for 'something that runs at boot already', not verified to be a fit.
- Gap, not an existing trigger: no existing hook keys off a watch row's target — `lib/watch.js add` runs before commit (system/INDEX.md:83) and de-close-gate C5 requires a watch row when domain/lib/core/.claude/hooks files are edited. But nothing fires the observe-and-verify step at the moment the watched target is next touched or used.


### 3.7 .claude/hooks/open-quest-surfacer.js

**What it does**: main() L109-160. Reads quest/active.txt (L110), parses blank-line-separated key=value blocks (L77-92), keeps blocks with qa= and status in {active,hold,blocked,delegated} (L31,119-134). If active.txt unreadable: warning and stop (L111-114). If zero open blocks: prints 'OPEN QUESTS: none' and returns (L136-139), so NO board call and NO Redmine call in that case. Otherwise prints header, one line per quest (qa, phase, status, one-liner cut to 120 chars), a 'Surface these in Session Briefing Standing Flags' line (L141-145), the static RANK_RULE text (L38-56, printed L146), then printLiveBoard() (L147). printLiveBoard (L58-71) runs 'node quest/redmine-board.js' with execFileSync, timeout 30000, prints a 'LIVE REDMINE BOARD' heading plus its stdout; on failure prints 'live board unavailable (...)'. The board is nearly all of the 7,421 chars (board output size not measured by me). Then a swallow-all try/catch (L152-159) requires quest/redmine-status-check and calls checkAll(open quests) (local status vs Redmine drift) and checkMissing(open qa list) (assigned on Redmine but no local block); their printing lives in that module. Whole main() in try/catch (L162-164). Never blocks boot.

**Prints**: stdout only. (a) 'OPEN QUESTS: none (active.txt has zero entries ...)' only when no open block (L137). (b) Otherwise: 'OPEN QUESTS - N entry/entries in active.txt with status in {...}' (L141); per-quest lines (L143); 'Surface these in Session Briefing Standing Flags. If briefing omits any, that is a verify failure.' (L145); RANK_RULE block 'BOARD SHAPE - 3 priority-ordered tables' (L38-56); 'LIVE REDMINE BOARD (Melaka Pelupusan - all trackers, all assignees):' plus board output (L66-67); then redmine-status-check output. Error lines: 'cannot read quest/active.txt - skipping' (L112), 'live board unavailable' (L69), 'open-quest-surfacer: error' (L163).

**Registration**: .claude/settings.json L33-36, SessionStart, 7th of 10 hooks, wrapped: node lib/hook-runtime.js --wrap .claude/hooks/open-quest-surfacer.js SessionStart (no explicit telemetry-name arg; name derives from the file name). Not in any domain/bundles manifest.

**Eval**: No eval for the hook (system/feature-census.md L30: 'GAPS: no eval'; no domain/open-quest-surfacer folder). Related only: domain/list-redmine/eval.js (13 assertions) tests redmine-board.js, not the hook. domain/list-redmine has only eval.js (no README, hook, log.jsonl).

**Log**: No log.jsonl and no Feature folder. Only central telemetry from the lib/hook-runtime.js wrapper (system/telemetry/hook-fires*.jsonl).

**Telemetry**: Main checkout, system/telemetry/hook-fires*.jsonl files (hook-fires.jsonl, -2026-09, -2026-10 and variants), rows with hook=open-quest-surfacer and ts within the last 7 days: 88 fires, average dur_ms about 8,745 (computed read-only with a node one-liner). This is higher than the 5.0 s in the handoff; the handoff figure may be from a different window or file set (not reconciled).

**Has a Feature folder**: false

**Reads**

- quest/active.txt (L29,110)
- quest/redmine-board.js existence check (L64) and execution (L65)
- quest/redmine-status-check.js via require (L153)
- redmine-board.js itself requires domain/steal-risk-flag/steal-risk and lib/states (redmine-board.js L23,69)

**Writes**

- The hook file itself writes nothing (stdout only). Not verified: whether redmine-board.js or redmine-status-check.js write any cache or log (my grep of redmine-status-check showed no writeFile/appendFile hit; redmine-board.js grep showed no writeFile hit within the first 40 matches). Central telemetry row is written by the lib/hook-runtime.js wrapper, not by this file.

**External calls**

- child_process.execFileSync(node quest/redmine-board.js) L62-65, 30 s timeout
- quest/redmine-board.js HTTP GETs to http://172.16.90.169/redmine (redmine-board.js L28): issues.json per FILTERS in parallel (L134-137) plus assigned_to_id=me unscoped (L137), versions/<id>.json (L146), users/current.json (L170), issues/<id>.json?include=journals per 'mine' row (L186, stamping received date L211-218). Redmine API key is a hard-coded constant at redmine-board.js L29.
- quest/redmine-status-check.js (require L153): http.get issue per open quest (L35, checkAll L102-107 in parallel) and an assigned-open query (L147, checkMissing L176)
- No git calls in the hook

**Install blockers**

- forgeInstall() (core/forge.js L360-): source must be directly under .claude/hooks and end .js (L365): satisfied.
- Safety 1 (L385-391): ROOT_UP regex allows only __dirname,'..','..'. The hook line 28 uses require('path').resolve(__dirname, '..', '..') (a comma form of two-levels-up, accepted by the regex, which is why the L28 comment says it was fixed). BUT L153 is: require(require('path').join(__dirname, '..', '..', 'quest', 'redmine-status-check')). After ROOT_UP is stripped from the line, the remaining text no longer contains __dirname... note the regex strips only the '__dirname, .., ..' fragment, leaving no __dirname, so L153 is likely NOT flagged. The second filter (L388) also tests /require\(\s*['"]\.\.?\/[^'"]+['"]\s*\)/ and the hook has no such relative require. Result: no sibling-relative line expected, so install not refused on this check (I did not run forge; this is a reading of the regex, not executed).
- Safety 2 (L393-412): refuses if any code file under domain, .claude, lib, core, quest, system names '.claude/hooks/open-quest-surfacer.js' in a non-comment line. My repo grep found only comments, docs and prose mentions (no code path string besides settings.json, which is rewritten). Expected: not refused; docs listed would need hand re-pointing (system-architecture.md, session-briefing.md, list-redmine SKILL.md, etc. only if they use the full path form).
- Not an install blocker but a note: settings.json entry has no telemetry-name arg; forge appends the base name (L441) so telemetry series stays one name.

**Consumers**

- Feature/Session-Briefing-System/session-briefing.md:74 — documents that the board is printed at boot by redmine-board.js executed from open-quest-surfacer.js; tells the model to read the board, not hand-query. Briefing depends on the text being in boot context (docs only; no code reads it).
- .claude/skills/list-redmine/SKILL.md:89 — documents 'Automatically at boot - open-quest-surfacer.js executes the script as part of the Session Briefing'; the on-demand path is /list-redmine (runs node quest/redmine-board.js, line 17). Docs only.
- system/system-architecture.md:211 — documents it (OPEN QUESTS list at boot, INV-3 status-enum dependency); also lines 66, 514, 581, 604. Docs only.
- lib/observatory.js:944 — lists 'open-quest-surfacer' as a member name of a boot feature group (string only).
- .claude/hooks/quest-resume-preflight.js:22 — comment only (pairs-with note).
- .claude/hooks/quest-active-grounding.js:26 — comment only, described as its SessionStart counterpart.
- .claude/hooks/quest-objective-anchor.js:43 — comment only.
- domain/checklist-reactivate/README.md:10 — doc: says boot awareness is already given by open-quest-surfacer, so checklist detail loads at /quest resume instead. Also checklist-show.js:9 and quest/SKILL.md:154 same remark.
- quest/redmine-status-check.js:12 — header comment naming the hook as a caller; hook requires this module (L153). The module is also called from active-cli per its comment.
- quest/redmine-sync.js:600 — comment about the surfacer reading active.txt (and L930).
- quest/routine-wrap.js:8 — comment: durable truth is Redmine, re-derived at boot by this hook.
- .gitignore:83 — comment: active.txt rots by design, surfacer rebuilds from Redmine.
- system/phrase-registry.md:88 — registry row for the regex /^\s*qa=/ used by the hook.
- main/handoff-2026-10-05-boot-structure-audit.md:64 — audit row: 5.0 s, 7,421 chars; owner wants it off boot, cache with time stamp; warns the Session Briefing reads its output.
- CLAUDE.md boot step 5 — No grep hit for the hook name or its headings in .claude/CLAUDE.md or expansion-protocol.md. The briefing (step 5) relies on the board being in boot context, per session-briefing.md L74. No hook, skill or lib script found that parses the printed OPEN QUESTS or LIVE REDMINE BOARD headings (grep of those strings across .claude, Feature, domain, lib, quest, core found only this file, system-architecture.md and Feature/Project-Awareness/draft-v1.md).

**Existing trigger candidates**

- .claude/hooks/ticket-gate.js (UserPromptSubmit, force-injects the quest skill on any ticket mention; first hook in the UserPromptSubmit list settings.json L57) — That is the moment the board/open quests are needed (first ticket or quest signal). Caveat: system-rules Rule 7 forbids new standalone UserPromptSubmit registration, so it would have to be joined through an existing bundle or called from ticket-gate; ticket-gate is not in domain/bundles manifests per my grep (grep for it there returned nothing).
- .claude/skills/list-redmine/SKILL.md (/list-redmine, runs node quest/redmine-board.js) — Already the on-demand path for the board with the same script; SKILL.md L91.
- .claude/skills/quest/SKILL.md (/quest start|resume, L154 area) and .claude/hooks/quest-resume-preflight.js — Fire when a quest is engaged; checklist-reactivate was already moved here from SessionStart for the same reason (domain/checklist-reactivate/README.md L10).
- Session Briefing (Feature/Session-Briefing-System/session-briefing.md L74 / CLAUDE.md boot step 5) — The briefing itself needs the board; it could run 'node quest/redmine-board.js' as its own step instead of relying on boot injection. Caveat from the handoff: briefing is delivered at boot, so moving the board off boot changes the briefing.
- domain/save-quest, domain/quest-bounty, lib/save-quest.js, quest/active-cli.js (redmine-status-check capture points per its header) — redmine-status-check already has primary capture points in active-cli start/update/archive; the hook only does the safety-net check.


### 3.8 .claude/hooks/system-audit.js (489 lines, SessionStart, advisory, always exit 0)

**What it does**: Read-only boot audit. Reads settings.json, settings.local.json, CLAUDE.md, system/system-architecture.md (l.179-187). Checks: 1 self-registered (l.192); 2 ghost hooks = on disk (.claude/hooks/*.js + domain/**/*.hook.js depth<=3) but unregistered and not marked "system-audit: skip-ghost-check" (l.197); 3 dangling registrations (l.204); 4 hooks inside settings.local.json (l.211); 5 doc drift CLAUDE.md/arch-doc vs registered (l.217-226); INV-3 active.txt status= enum (l.237); INV-4 "-> Skill: x" tokens resolve, scans quest-protocol.md + every SKILL.md (l.255); INV-5 active.txt ticket_type= enum (l.290); INV-6 CLAUDE.md "see X.md" refs resolve (l.318); 7 state-literal drift via lib/states.js check() (l.348); 8 root layout via lib/folder-structure.js check() (l.353); 9 OneDrive machine-suffix conflict copies, recursive walk of whole repo depth<=6 (l.365-389); 10 Windows-reserved names NUL/CON/etc in repo depth 4 plus every sibling worktree root depth 2 (l.396-419); 6 eval-less block-capable hooks, reads source of every registered hook (l.434-459). No per-check timing in the script; the cost likely sits in the CHECK 9/10 walks, CHECK 6 reads and lib/states.js check (inference, not measured).

**Prints**: stdout only. No findings (l.465): "system-audit: PASS - hook-registration integrity + INV-1..INV-6 verified." + a counts line (N on disk, N registered, N documented, 0 ghosts, 0 dangling, 0 doc drift, 0 invariant violations) + optional eval-coverage line (l.460). Any finding (l.476-487): heading "system-audit findings (Layer 0 structural integrity):", indented finding lines (GHOST HOOKS, DANGLING, SCOPE, DOC DRIFT, ONEDRIVE CONFLICT COPIES, WINDOWS-RESERVED FILE NAMES, ROOT ORPHANS, STATE-LITERAL drift, INV-x), then "Snapshot: N hook files, N registered, N documented, N opted-out", eval-coverage line, "(advisory - does not block boot...)". Telemetry shows it currently prints the findings form (reason field = the heading) on most runs.

**Registration**: .claude/settings.json l.11, SessionStart, first entry: node "${CLAUDE_PROJECT_DIR}\lib\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\.claude\hooks\system-audit.js" SessionStart (wrapped via hook-runtime, no telemetry-name arg). Also REGISTRY.md:50 row "system-audit | SessionStart | wrapped | pre-forge".

**Eval**: No eval. Glob .claude/hooks/system-audit* returns only system-audit.js. system/feature-census.md:53 says "legacy-hook, registered, GAPS: no eval". Note CHECK 6 of the script itself skips hooks with no block pattern, and this script has no block pattern.

**Log**: No own log.jsonl and no domain/ folder (Glob domain/*system-audit* empty). Only the central wrapper telemetry system/telemetry/hook-fires*.jsonl rows with "hook":"system-audit". Telemetry since 2026-09-28 (read-only, my PowerShell tally): 70 rows in the 2026-09/10 files (avg dur_ms 12236, min 2551, max 30376) plus 17 rows in the current hook-fires.jsonl on 2026-10-04 (avg 13740; last four 4917, 6376, 3685, 4800 ms). The earlier 3 digit-ms rows in mid-September were about 1.1 to 3.4 s. Counts may overlap slightly if a row was duplicated across the file variants (OneDrive copies).

**Telemetry**: 87 fires since 2026-09-28 (my tally, may include a few duplicate rows from OneDrive file variants). Average dur_ms about 12.2 s for 09-28..10-04 morning rows (70 rows; min 2.6 s, max 30.4 s), and the 17 rows on 2026-10-04 afternoon in the current hook-fires.jsonl average 13.7 s with the last four at 3.7 to 6.4 s. Recent warm cost matches the stated 4.0 to 5.0 s.

**Has a Feature folder**: false

**Reads**

- settings.json, settings.local.json (l.46-47,179-180)
- CLAUDE.md (l.48,181) and system/system-architecture.md (l.49,186)
- every .claude/hooks/*.js and domain/**/*.hook.js (full body for the opt-out marker, l.118,138)
- bundle manifest JSONs named by --manifest (l.84)
- every registered hook source (CHECK 6, l.448)
- quest/active.txt, quest/quest-protocol.md, .claude/skills/*/SKILL.md (l.231-234,255-266)
- .gitignore (l.367)
- lib/states.js and lib/folder-structure.js via require (l.348,353), plus whatever those read (system/states.json, system/FOLDER-STRUCTURE.md)
- full repo tree listing for CHECK 9 and 10 plus sibling worktree roots

**Writes**

- none. No fs write call in the file; stdout only. (hook-runtime.js wrapper writes the telemetry row to system/telemetry/hook-fires.jsonl)

**External calls**

- no network, no git, no child_process in the file
- in-process require of lib/states.js (l.348) and lib/folder-structure.js (l.353); their internals not read by me

**Install blockers**

- forgeInstall l.385-391 refuses on location-dependent __dirname or relative require('./..'). The script uses __dirname only at l.44 (require('path').resolve(__dirname,'..','..')) and l.75 (path.join(__dirname,'..','..')); both match the allowed ROOT_UP regex /__dirname\s*,\s*['"]\.\.['"]\s*,\s*['"]\.\.['"]/ (core/forge.js l.385). All other require() calls are fs, path or require(path.join(REPO_ROOT,...)), not literal ./ or ../. So safety 1 passes.
- forgeInstall l.399-412 safety 2 refuses when a .js/.json code file (outside settings.json and domain/bundles) names .claude/hooks/system-audit.js or join('hooks','system-audit.js'). Grep: only .md docs name that path (.claude/CLAUDE.md:119, domain/claude-md-watch/README.md:19), which are docRefs (warn only). Code references are comment lines or labels without the path (open-quest-surfacer.js:20, lib/change-checklist.js:80, lib/observatory.js). So not refused as far as grep shows; I did not run the install.
- side effects of an install: no eval exists, so forge writes an install-pin eval; it also renames to domain/system-audit/system-audit.hook.js, and then the script's own domain walk (l.126-142) will find itself as a .hook.js, which is fine because SELF_NAME is excluded from ghosts (l.197) and it is registered. After the move the registered name keeps telemetry name system-audit (forge appends it to the --wrap command, l.441). CHECK 1 derives the name from the --wrap path basename (l.101: system-audit.hook), so SELF_NAME 'system-audit' would no longer be found in the registered set and CHECK 1 would report a false 'SELF ... ghost'. That is a real behavioural break to verify (inference from l.50, l.101, l.192).

**Consumers**

- .claude/settings.json:11 — registration
- .claude/CLAUDE.md:119 — documents it (Layer 0 paragraph, says boot catches drift); also mentions the skip-ghost-check marker. Does not read output.
- system/system-architecture.md:67 — documents it: SessionStart table l.67, catalog row l.205, l.552-563 says boot output format shows invariants and 'absence = system-audit.js broke'
- domain/claude-md-watch/README.md:19 — documents: after a CLAUDE.md change, step 6 runs node .claude/hooks/system-audit.js by hand as a gate (path-in-doc; would break on a move, doc only)
- lib/change-checklist.js:80 — string label 'system-audit (ghost/drift)' in a gate list; no path or require, label only
- lib/observatory.js:950 — lists 'system-audit' as a member name of a group; lines 118,469,497 read the skip-ghost-check marker from hook files (depend on the marker text, not on the script)
- lib/feature-census.js:106 — reads the skip-ghost-check marker only
- system/sync-hook-catalog.js:6 — mirrors its extraction logic (l.49); comment dependency only
- system/FOLDER-STRUCTURE.md:3 — states system-audit.js flags root orphans at every boot (CHECK 8)
- domain/nul-redirect-gate/README.md:5 — its goal_signal is 'zero reserved-name files reported by system-audit at SessionStart' (CHECK 10 is its detect side, l.16); depends on CHECK 10 output
- domain/hook-syntax-check/README.md:3 — documents that system-audit checks only registration
- domain/falsifier-ran-check/README.md:100 — documents: a ghost is reported by system-audit at boot
- domain/ticket-criteria-gate/README.md:46 — documents expected system-audit flag until merge
- .claude/skills/system-audit/SKILL.md:6 — the /system-audit skill is a different thing (lib/audit-briefing.js reading ledgers); shares the name only
- Feature/Domain-Expansion/expansion-protocol.md:67 — documents that CHECK 9 lists conflict copies so a clobber cannot recur silently; the protocol does not call the script
- many hooks in .claude/hooks and domain:1 — carry the 'system-audit: skip-ghost-check' marker comment that this script reads (arabic-nudge, stop-point-summary, reply-log, commit-gate, ...)
- Feature/Session-Briefing-System/session-briefing.md — no reference found (grep of that folder for system-audit returned nothing; the grep-rubric warning applies, I did not run a positive control)
- main/handoff-2026-10-05-boot-structure-audit.md:65 — the effort doc: proposes run when a hook file or settings.json changed, and at Domain Expansion
- domain/bundles/* — no bundle manifest references it (grep: no files)

**Existing trigger candidates**

- domain/claude-md-watch (claude-md-watch.check.hook.js, SessionStart l.43 of settings.json) — its README l.19 already runs system-audit.js by hand as step 6 gate after a CLAUDE.md change; the audit's checks 1-6 are about hook/registration/doc drift, the same trigger moment
- lib/change-checklist.js (l.80 lists 'system-audit (ghost/drift)' in gateHits) — already a change-time gate list for hook, settings and doc edits; a natural place to run the audit when settings.json or a hook file changed
- domain/hook-syntax-check/hook-syntax-check.hook.js (SessionStart l.39) — already walks every registered hook at boot with node --check; same registered-hook enumeration as CHECK 2/3/6
- Feature/Domain-Expansion/expansion-protocol.md Step 12.5 meta-audit — described in CLAUDE.md as the self-enforcement step for hook-fire and index validity; session-end moment, handoff doc also proposes 'at Domain Expansion'
- .claude/skills/system-check/SKILL.md and system-check-trigger.js (SessionStart l.31) — deep periodic audit already exists and already surfaces ghost hooks; a per-day or per-change trigger is already there
- domain/nul-redirect-gate (PreToolUse Bash) — CHECK 10 is its detect side; the gate prevents the cause, so only a periodic detector is needed

