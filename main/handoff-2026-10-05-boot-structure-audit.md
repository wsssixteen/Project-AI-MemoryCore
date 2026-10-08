# Handover — boot audit + system structure (2026-10-02 → 2026-10-05)

> Written 2026-10-05 mid-session, on みや's ask, so a compaction or a new session can continue without this
> conversation. Session worktree: `claude/new-session-77cffa`. Everything below is on `main` unless marked.
> Read this file, then `system/INDEX.md` (the one map). Update the "Status" tables here whenever a row changes.

## 1. What this effort is

| Item | Fact |
|---|---|
| Started as | An urgent AWAM build break (Danial, `mlk/stag-env`, duplicate PDBB method + constants). Fixed and pushed as `98e8595245` on etanah-awam. DONE. |
| Became | An audit of that session → two gate fixes → a BOOT audit (boot cost ~55–61 s) → a STRUCTURE audit, because 8 of 13 boot scripts were not Features. |
| The goal now | Boot is fast AND every part of the system is properly installed (has a home, a goal, a log, tests). Top to bottom, at みや's pace. |
| みや's order | Top overview first → then each kind → then each Workflow / Feature. He asks; I do not run ahead. |

## 2. Decisions (all saved in `system/INDEX.md`, section "Structure rulings")

| # | Decision | By |
|---|---|---|
| 1 | Everything that DOES A JOB is a Feature in `domain/<name>/`. Kernel (`core/`) and shared code (`lib/`) stay outside. | みや, popup, 2026-10-04 |
| 2 | A skill is a Feature PART: every skill gets a Feature folder (goal + log + eval) that points to its `SKILL.md`. | みや |
| 3 | Root `Feature/` moves into `domain/`; the word Feature keeps one meaning. | みや |
| 4 | `system/INDEX.md` is THE one map. CLAUDE.md, FOLDER-STRUCTURE.md, the system-design skill point to it. | みや |
| 5–8 | Workflow = a route (Layer 2) made of Features · its SKILL owns the step list · quest engine stays in `quest/` · "Workflow" means a route only. | みや said "no preference" → my recommended options stand, open to re-ruling |
| — | Six kinds of parts: Rules · Workflows · Features · Memory · Kernel · Projects. "Installed" has one meaning per kind. | built 2026-10-05 |
| — | "Install" = a part enters through `core/forge.js` (`new` or `install`), never hand-placed. | みや 2026-10-05 |
| — | Design constraints: NO new steps file · NO new shared step gate · load only the current step's text · each Feature says which Workflow step it serves. | audit 2026-10-04 |
| — | Observability and monitoring are the two layers of EVERY Feature, not the dashboard (`lib/observatory.js` only reads them). | みや 2026-10-04, after my slip |

## 3. What is built (status)

| Piece | Where | Proof | Commit |
|---|---|---|---|
| Push gate v5 + compile gate v2: repo named by its git REMOTE, not folder name | `lib/git-target.js` · `domain/release-mlk-plp-push-gate/` · `domain/compile-gate/` | evals 35/35 · 27/27 | `63f0ebee` |
| The one map: six kinds + machine-read fence | `system/INDEX.md` | `node lib/folder-structure.js map` → 0 missing / 0 duplicate / 0 unmapped · eval 15/15 | `19bc4963` |
| Pointers to the map | `system/FOLDER-STRUCTURE.md` · `.claude/CLAUDE.md` v1.78 · `.claude/skills/system-design/SKILL.md` v3.0 | changelog entry v1.78 | `19bc4963` |
| `forge install hook` | `core/forge.js` | `core/forge.eval.js` 39/39 | `19bc4963` |
| Wrapper keeps the old telemetry name after an install | `lib/hook-runtime.js` (3rd `--wrap` argument) | `lib/hook-runtime.eval.js` 12/12 | `19bc4963` |
| `hook-syntax-check` INSTALLED + v2 (cache, one git call, wrapped + bundled hooks covered) | `domain/hook-syntax-check/` | eval 17/17 · 12.0 s → 0.52 s warm · 138 files (was ~90) | `19bc4963` |
| `worktree-cleanup-boot` INSTALLED + v2.0 (launcher + background run, headlines only at boot) | `domain/worktree-cleanup-boot/` | eval 63/63 · 30.2 s → 0.35 s · a full run takes 221 s | `19bc4963` · `a954de41` |
| Off boot: `unmerged-release-boot` · `arabic-nudge` · `knowledge-schema-audit` boot copy | `.claude/settings.json` SessionStart | SessionStart 13 → 10 hooks | `19bc4963` |
| Hook catalog regenerated; arabic hook opted out of the ghost check | `system/system-architecture.md` §3.0 · `domain/arabic-nudge/` | system-audit on main: no ghost, no doc-drift line | `6beed4ba` |

Measured boot on the main checkout, scripts run one after another: **61.4 s → 12.7 s**. Boot text into context: 26,393 → 24,884 chars.

## 4. What is NOT done (ordered worklist)

| # | Item | Notes for whoever continues |
|---|---|---|
| 1 | **Boot batch 2** — みや said "I want to boot batch 2" (2026-10-05) | Six scripts still at boot. His verdicts are in §5. Design must be shown to him before building: it changes what he sees at boot. |
| 2 | Rule the overdue change watches | `claude-md-watch` prints 14,596 chars at boot (59% of boot text) until each watch is resolved `ok` or `anomaly`. `node lib/watch.js check`. |
| 3 | Install the remaining loose hooks | 53 left in `.claude/hooks/` (census kind `legacy-hook`). Use `forge install hook`; it refuses on sibling-relative paths or code referencers — fix those first. |
| 4 | Skills without a Feature folder | 52 of 72. `forge install skill` does NOT exist yet — design it first (what is a skill's log and eval?). |
| 5 | Legacy `Feature/` → `domain/` | 7 folders (Domain-Expansion, Session-Briefing-System, Observation-System, Time-based-Aware-System, Forge-Self-Improvement-System, Learn-From-Others-Fixes, Project-Awareness). Boot reads two of them; re-point readers before moving. |
| 6 | Workflow items (defaults 5–8) | Give every Workflow what quest has (step table + position); quest Feature folder; `serves:` key on Features; load only the current step (quest skill 120 KB + protocol 188 KB load whole). PARKED by みや. |
| 7 | Memory audit | みや asked "are we entering the memory audit phase?" System rules still live in 73 auto-memory notes; `MEMORY.md` has a dangling entry (`feedback_observability_vs_monitoring.md` was merged into `feedback_inventory_first.md`). Saving still leans on Domain Expansion. |
| 8 | Two boot modes (task-first vs full boot) | Proposed 2026-10-02, not ruled. A full boot reads ~450 KB (`main-memory.md` alone 230 KB). |
| 9 | `forge install` date stamp | It writes the UTC date; READMEs say "Installed 2026-10-04" for work done 2026-10-05 local. Cosmetic. |

## 5. Boot batch 2 — the six scripts, with みや's verdicts (2026-10-04)

| Script | Cost now | みや said | Plan agreed |
|---|---|---|---|
| `open-quest-surfacer` | 5.0 s · 7,421 chars | "How do you plan to cache? … I don't want this loading when I want to do other projects with Ruri." | Off boot. Run on the first ticket / quest signal, or when the board is asked for. Cache the board with a time stamp. ⚠ The Session Briefing reads its output — the briefing must still work. |
| `system-audit` | 4.0 s | "run once a day when?" | Run when a hook file or `settings.json` changed, and at Domain Expansion. Not on a clock. |
| `boot-required-read-gate` | 1.0 s | "How to prevent us from needing this?" | Check when CLAUDE.md is edited or a linked file moves. |
| `evolution-check-trigger` | 0.35 s | "How relevant is this? … do this manually for now or only during system-audit" | Off boot. Manual, inside the system check. |
| `system-check-trigger` | 0.33 s | "Why we wanted to run this in the first place?" | Off boot. Show "last system check N days ago" at Domain Expansion. |
| `adhoc-lifecycle` | 0.2 s | "Is this even running? There are still many task folders" | Off boot. Real fix = move the folder when an adhoc is closed (today it only lists). |
| `boot-load-verification` | 0.39 s | — | Decide together with the two boot modes (item 8). |
| `claude-md-watch` | 0.49 s · 14,596 chars | — | Stays; the text shrinks once the watches are ruled (item 2). |

## 6. Standing instructions from みや this session (not yet all encoded in a hook)

| Instruction | His words | Encoded? |
|---|---|---|
| An artifact for every system change, kept for my own reference | "I want you to keep creating artifacts for your reference every time a system change." | In `system/INDEX.md` "Change record" (2026-10-05) |
| Save at the moment of change, not at Domain Expansion | "I do not want to rely simply on domain expansion to save anything that is important … save every time you updated something. So that you will know the history and purpose and reason behind it." | This handover + INDEX "Change record"; NOT yet a gate |
| Questions go through the popup tool, with a diagram or table when the question needs understanding | "please ask me using the question popup tool & don't forget to explain using diagram" | memory `feedback_popup_questions` |
| On the phone: short sentences, infographics over text | "/goal only reply to me short sentences" · "use infographic instead. This is too much." | reply contract hook |
| System rules never live in auto-memory | "Still with your … useless feedback auto-memory" | `system/INDEX.md` Memory row |
| Install first, then change; observability is part of every Feature | see §2 | system-design skill v3.0 |
| Use the Workflow tool (ultracode on, 2026-10-05) | he invoked `/workflow-authoring` | session setting |

## 7. Known issues and caveats

| Issue | Detail |
|---|---|
| Watch `wmuu2uoib` has the wrong rollback anchor | I added it AFTER committing, so its printed `git checkout 19bc49634e` restores the NEW state. True rollback = `git revert 6beed4ba a954de41 635197ba 19bc4963` (or the NUKE-MARKER recipes). Resolve the watch with that note. |
| Arabic nudge eval flake | `domain/arabic-nudge/arabic-nudge.eval.js` F2 fails between 00:00 and 08:00 local (UTC date vs local date). Same on the untouched copy — predates today. |
| Hooks run from the MAIN checkout | In a worktree session `CLAUDE_PROJECT_DIR` resolved to main (the old compile gate fired while my worktree held the new one). A hook change is live only after `main` is fast-forwarded. |
| Cold syntax cache | First boot after many hook files change re-checks them (~13–18 s for all 138). Progress is saved every 20 files. |
| Cleanup report is the previous run's | Boot shows the last finished run's headlines; a brand-new checkout shows none on its first boot. |
| `lib/hook-runtime.eval.js` wrote fixture rows into the real telemetry | FIXED 2026-10-05: the eval uses a temp telemetry folder (13 of 13). Old fixture rows (`crash-child` / `does-not-exist`) stay in the monthly file until it rotates. |
| The eval battery has one flat 120 s limit and prints a timeout as FAIL (exit null) | The cleanup eval (178 s) is quarantined because of it; `domain/release-mlk-plp/discover.eval.js` also ends with exit null. No per-eval duration is logged. Repair not built. |
| Timings | One run each, on this laptop, scripts one after another. Whether Claude Code runs startup hooks side by side is NOT verified. |
| Full eval battery | Only the affected evals were run before the merge. See §9 for the verification run. |

## 8. How to resume

| Step | Command / file |
|---|---|
| 1 | Read `system/INDEX.md` (map + rulings) and this file |
| 2 | `node lib/folder-structure.js map` — must print 0 missing · 0 duplicate · 0 unmapped |
| 3 | `node lib/feature-census.js` then read `system/feature-census.md` — what is installed |
| 4 | `Get-Content domain/worktree-cleanup-boot/log.jsonl -Tail 3` and `domain/hook-syntax-check/log.jsonl -Tail 3` — are the two installed scripts behaving at real boots |
| 5 | `node lib/watch.js check` — the open change watches |
| 6 | Artifacts for みや: Boot page https://claude.ai/artifact/WnyAt8Jdg9LEkZjdytmWzB · System map https://claude.ai/artifact/7rC3ck11zTHQdfqbtAnNGv · this handover as a page https://claude.ai/artifact/FYG8o9tQy6KzRTqMN1doDo (all three listed in `system/INDEX.md` "Change record") |

## 9. Verification of "daily work is not affected" (2026-10-05 01:30)

Mechanical checks, run by Ruri on the MAIN checkout (where hooks execute):

| Check | Result |
|---|---|
| Every `.js` named by a `settings.json` hook command exists | 126 registrations · 0 missing |
| Real telemetry since main got the change (cut 2026-10-04T17:05Z) vs the 7 days before | 691 fires across 131 hooks · 0 error rows (before: 128 errors in 205,078) · no hook appears under a new name |
| Daily gates ran without error since the cut — **CORRECTED 03:00** | The first version of this row counted eval rows as proof. Split by session id (cut 17:05Z → 19:00Z): real-session rows `ticket-gate` 16 (3 sessions, fired 1) · `etanah-intake-gate` 8 (fired 3) · `quest-phase-gate` 58 · `convention-check-gate` 61 · `compile-gate` 2,180 (fired 0) · `release-mlk-plp-push-gate` 586 (blocked 1: my own edit command). So the gates run error-free on every tool call, and ticket intake fired for real. **NOT proven by any real run: an etanah commit decision and an etanah push decision.** Those blocked rows (compile 4, push 20) came from eval runs with no session id. |
| Redmine board at a real boot after the change | printed live (3 open tickets, 2 tracked, 1 missing block) at the 01:26 boot |
| Syntax check at that real boot | 0 checked · 136 cached · 0 broken · 211 ms (`domain/hook-syntax-check/log.jsonl`) |
| Startup scripts in 3 real boots since the cut, summed averages | about 12.9 s (same 10 scripts averaged 82 s over the 7 days before) |
| Stale references to the two moved hook paths | one, `Feature/Domain-Expansion/expansion-protocol.md:61` (fixed in the same commit as this file) |
| Full eval battery (`node lib/eval-battery.js` on main, 01:49) | **129 of 139 green**, 5 quarantined, 10 failing. Breakdown in the next table. |

The 10 failing evals of the 01:49 battery run:

| Eval | Why | Caused by this session? |
|---|---|---|
| `domain/bpmn-check/eval.js` · `domain/deploy/eval-deploy-check.js` · `domain/release-mlk-plp/discover.eval.js` · `domain/release-mlk-plp/eval.js` · `domain/sweep/eval.js` · `lib/adhoc-save-audit.eval.js` | the same six failed in all three battery runs of 2026-10-03 (`system/telemetry/eval-battery.jsonl`) | no, older; not investigated here |
| `domain/arabic-nudge/arabic-nudge.eval.js` | F2 compares a UTC date with a local date; fails 00:00–08:00 local | no, known |
| `domain/observatory/observatory.eval.js` | 57 of 59. One check recounts hook rows while rows are still being appended (diff 4,173); one check wants a cold snapshot under 5,000 ms and took 6,311 ms. Both ran while the battery and about 15 agents were running. It also failed once on 2026-10-03 13:05 and passed twice after. | not confirmed either way; re-run it on an idle machine |
| `lib/hook-runtime.eval.js` | 10 of 12. F3 and F4 assert "exactly one new row" in the REAL telemetry file; a live hook appended a row at the same moment. The wrapper itself wrote the right rows. | test design (older), exposed tonight. **REPAIRED**: the eval now points the wrapper at a temp telemetry folder; 13 of 13, four runs in a row, and it no longer writes fixture rows into the real telemetry (new check F6). |
| `domain/worktree-cleanup-boot/worktree-cleanup-boot.eval.js` | 63 of 63 when run alone, but it takes 178 s and the battery kills every eval at 120 s. It entered the battery when the hook was installed into `domain/` (the battery does not scan `.claude/hooks/`). | **yes, a side effect of the install.** Quarantined with the reason (`system/eval-quarantine.jsonl`, class SLOW-NOT-BROKEN) so the battery reports it and does not count it green. Repair = a per-eval time budget in `lib/eval-battery.js`, or faster fixtures. |

### 9a. INCIDENT 2026-10-05 01:47 — every session worktree lost its git link (cause NOT proven)

| Item | Fact (each checked on disk this session) |
|---|---|
| What | At 01:47:40–42 local, `.git\worktrees\` went from 5 linked entries to 0 usable ones. `git worktree list` showed only the main checkout (the 01:28 sweep row said `registered: 6`). |
| What survived | Every folder and every file. 61 folders under `.claude\worktrees\`: 49 with a `.git` link to a missing admin folder, 11 with no `.git` file, 1 intact (this session, after repair). |
| This session | `HEAD`, `commondir`, `gitdir` were gone from `.git\worktrees\new-session-77cffa\`; `index`, `COMMIT_EDITMSG`, `logs` remained. Found at 01:57 when `git add` answered `fatal: not a git repository`. |
| Repair | Rewrote the three files (`HEAD` = `ref: refs/heads/claude/new-session-77cffa`, `commondir` = `../..`, `gitdir` = the worktree's `.git` path). Then `git worktree lock` with a reason. Commit `0fed42c6` went through after that. |
| What other sessions see | A session in another worktree gets `fatal: not a git repository` on its next git command. Same repair works: three small files, branch name from `git branch --list "claude/*"`. |

Causes examined:

| Candidate | Verdict | Evidence |
|---|---|---|
| The cleanup eval, killed by the battery at 120 s in that same second | EXCLUDED (one reproduction) | Re-ran it exactly as the battery does, with an unlocked canary worktree registered: canary and this session's link untouched right after the kill and 45 s later. |
| A Workflow subagent ran a git command that did it | EXCLUDED | 462 shell commands logged across 57 agents; none ran `worktree prune / remove`, `gc` or a delete before 01:47:40. All commands in that minute were `git log / show / blame`. |
| A session boot on this laptop launched the background cleanup | EXCLUDED | No SessionStart rows near 17:47Z in telemetry; no finished-run row after 17:28:59Z in `domain\worktree-cleanup-boot\log.jsonl`. And a prune on this laptop keeps entries whose folders exist. |
| The other laptop (device name `miyazaki` in OneDrive conflict copies) ran `git worktree prune` and OneDrive synced the deletions here | NOT EXCLUDED, NOT PROVEN | `domain\worktree-cleanup-boot\worktree-cleanup-boot.hook.js:371` runs a bare `git worktree prune` at every boot on every machine; on a machine where the stored absolute paths do not exist, prune drops every entry. The hook's own eval (block S) names this. Last trace of that laptop: `.git\index-miyazaki-4`, 04/10 17:08:49, which is also when two sessions lost their links on 4 October. No trace for tonight. |

Not caused by the boot change, as far as the evidence goes: the prune line is old and ran at every boot before the change too. Not confirmed safe either: the change did not make it worse and did not fix it.

Standing risk and the open choice (みや's, proposal A1 of 2026-10-04 "lock a live session's worktree"): (a) lock each session's worktree at boot, git-native, a prune on any machine skips a locked entry and the lock file syncs; (b) stop the bare prune and let only the main-checkout sweep decide; (c) move worktrees out of OneDrive (memory `project_onedrive_worktrees`). Until ruled: this session is locked by hand.

**RULED by みや, popup 2026-10-05 02:45**: the other laptop WAS on around 01:47 → the open candidate is now the accepted cause (still not observed directly). Protection = **(a) lock live sessions**. BUILT the same hour as `worktree-cleanup-boot` v2.1: the launcher locks the booting session's worktree (reason `live-session host=<hostname> since=<date>`); step 1 lifts only locks this host set and whose folder is gone; the background run gets the session folder for path protection. Fixtures LK1-LK8 in its eval. The plain prune stays (not part of his ruling). Not built: automatic repair of a link that is already cut.

Leftover: `.git\worktrees\mc-canary-13156\` (my test canary: `logs`, `refs`, `ORIG_HEAD`) could not be deleted, "Permission denied". Harmless; git lists it as prunable and the next prune removes it.

Independent runs (Workflow tool, read-only):

| Run | Run id | What | Result |
|---|---|---|---|
| Verification | `wf_49cf7fce-b89` | six review dimensions (quest load · Redmine intake · wrapper change · background cleanup · gate false-blocks · boot documents), one refuter per finding, one completeness critic | **DONE 02:36** (40 agents, 0 errors): 24 findings confirmed (20 cosmetic, 4 degrades, 0 "breaks daily work"), 9 refuted, 9 critic gaps. Summary and what was done about each: §11. |
| Batch-2 design | `wf_923b9eaf-18e` | facts per remaining boot script and its consumers → design per script (two angles for the quest board) → cross-cutting critic | **DONE 02:14** (18 agents, 0 errors). Full record: `main/handoff-2026-10-05-boot-batch-2-design.md` (critic first, then one design and one fact sheet per script). Summary in §10 below. |

To resume either after a break: `Workflow({scriptPath: <script file under the session's workflows/scripts folder>, resumeFromRunId: "<run id>"})` — finished agents replay from cache.

## 10. Batch 2 — design summary (NOT built, NOT ruled; full text in `main/handoff-2026-10-05-boot-batch-2-design.md`)

Boot after batch 2, by the critic's arithmetic (single-run figures): 10 scripts → 4 (5 if the required-reads banner stays) · about 12.7 s → about 2.2 s · boot text 24,884 → between 989 and 3,384 characters. Moved, not removed: the first ticket / board / briefing prompt of a session-day waits 5–13 s for Redmine; session close gains about 5–20 s.

| Script | Design in one line |
|---|---|
| `open-quest-surfacer` | SIGNAL-FIRST chosen over cache-first: nothing at boot; the live board prints at the first ticket / board / briefing signal, as a 4th child of the existing `domain/bundles/upsm-mode.json`; a last-good copy is shown only when Redmine fails, with its age. Two-step cutover: add the signal path while the boot entry stays, prove the last board row reaches context, then remove the boot entry together with CLAUDE.md boot step 5 and session-briefing.md. |
| `system-audit` | Stays registered but becomes a change detector: full audit only on the first boot after a hook file / settings.json / bundle manifest changed, and at session close inside the audit screen. Name clash with the existing `system-audit` skill row in the registry must be settled before install. |
| `boot-required-read-gate` | Off boot; checks at the moment `.claude/CLAUDE.md` is edited (child of the existing `pretool-editwrite-gates` bundle) plus a `--check` at session close. Critic: weigh `claude-md-edit-guard.js`, which already fires at that moment. |
| `evolution-check-trigger` + `system-check-trigger` | Off boot, one commit; "last system check N days ago" becomes a row in the session-close audit screen (`lib/audit-briefing.js`). |
| `adhoc-lifecycle` | Part 1: off boot (the weekly list). Part 2: the folder moves to Archive at the moment an adhoc is closed (adhoc-save skill + audit check + video guard in `quest/archive-quest.js`). |
| `claude-md-watch` | Stays at boot; prints a count + the 3 oldest (5 lines, about 640 characters instead of about 16,000); the countdown steps once a day, not once a boot. |
| `boot-load-verification` | Not in batch 2 unless ruled; tied to the two-boot-modes decision. |

Pre-step found by the run and CONFIRMED on disk: `forge install hook` refuses all six loose boot hooks today, because `domain/hook-syntax-check/cache.json` names their old paths and `core/forge.js:399-412` counts a `.json` under `domain/` as code. One condition in forge + one fixture fixes it. This is a defect of the install built on 2026-10-05.

Build order (critic): forge pre-step → claude-md-watch (eval, then the short boot form) → pin `lib/audit-briefing.eval.js` → the two reminders → boot-required-read-gate → system-audit → adhoc part 1 → adhoc part 2 → ticket board in three steps (install · add signal path · remove boot entry) → boot-load-verification only if ruled.

Decisions that are みや's (asked by popup 2026-10-05; answers recorded below when given):

| # | Question | Recommended |
|---|---|---|
| 1 | First message is not about tickets: what does Ruri load and say about tickets? | Nothing loads; the briefing row says "not loaded"; the live board loads when a ticket, "board" or a briefing is named. Price: a ticket assigned during a non-ticket session shows only at the next ticket word. |
| 2 | The two reminder scripts and the required-reads banner | Delete the two reminders (their job moves to the session-close screen); keep the banner until the boot-modes decision. |
| 3 | Should a finished adhoc's Task folder move to Archive by itself? | Yes, at the closing status; videos kept; the 9 leftovers shown for ticking. |
| 4 | What should boot show about change watches? | A count, the 3 oldest and where the full list is; "overdue" counted in days. |

Answers given by popup, 2026-10-05 02:45:

| # | His answer |
|---|---|
| 1 | **RULED: nothing loads.** The briefing row says "not loaded"; the live board loads when he names a ticket, says "board" or asks for a briefing. |
| 2 | not asked yet |
| 3 | not asked yet |
| 4 | **NOT ruled.** His words: "I don't understand this part, also, I am thinking of adding a keyword so that you know we are starting our daily work. Or it is better if you can detect where we are or is it working day and also holiday days from redmine to determine if you boot in what mode. Can this be updated by a routine. or quick enough to be done boot time?" → explained in chat (a watch = a note to check that a change behaves; 32 open; boot prints 5 lines each). Ask again in plain words. His boot-mode idea: §12. |

Biggest risk (critic): the board leaves boot and ticket work starts without it. Four required fixes are in the design record §1.7 (change the boot prose in the same commit · pin the trigger to ticket-gate's signal tests with a phase-1 block · board and briefing asks always fetch live · keep the boot entry until one real session shows the last table row in context).

## 11. Independent review of batch 1 (run `wf_49cf7fce-b89`) — findings and what was done

Verdict in one line: quest loading and Redmine intake are intact; nothing "breaks daily work"; two real gate defects came from the 2026-10-02 gate change and are fixed; the rest is cosmetic or older.

| # | Finding | Severity | From this session's changes? | Status 2026-10-05 03:30 |
|---|---|---|---|---|
| 1 | Push gate fails OPEN when the command names the repo with a Git Bash path (`cd /e/Dev/... && git push`), an unset variable or a missing folder: identity null → "not foreign" → a shared-branch push from another team's repo passes unchecked. v4 blocked the Git Bash form by path text. The form is in real use (int-env pushes from `/e/Dev/etanah-work/wt-282442` on 2026-10-04). | degrades (safety gate) | YES, `63f0ebee` | FIXED: `lib/git-target.js` v2 (`resolveDir`, `inlineVars`, `named` / `unresolved`) + push gate v6 (blocks a shared-branch push when the named directory cannot be identified). Eval 50/50 (was 35). Adversarial review `wf_9f2f6a5c-fdc` launched; result appended in §11a. |
| 2 | Compile gate refuses a commit issued through a Git Bash path with "is not an etanah git repo", after a green compile; the printed remedy cannot work. Happened live 2026-10-04T08:04:57Z. | wrongly blocks a daily flow | YES, same root | FIXED by the same helper; `compile-check.js` accepts a Git Bash path. Eval 43/43 (was 27). |
| 3 | All linked worktrees lost their git link at 01:47 (two findings) | degrades | no, older mechanism | §9a. Lock built (v2.1). |
| 4 | v2.0 background run starts with cwd = the hook's checkout, so the sweep no longer protects the booting session's folder by path | cosmetic today (deletes are frozen) | YES | FIXED in v2.1 (`WORKTREE_CLEANUP_SESSION_DIR`). |
| 5 | The worktree content-sync (step 1.5) never runs when the hook executes from main, so a worktree session does not get `projects/` copied in | degrades | no, since 2026-06-04 | NOT fixed. A worktree session reads etanah-knowledge from the main checkout's absolute path. |
| 6 | `lib/audit-briefing.js:36` dropped every registration that carries the telemetry-name token from its `registered` set | cosmetic, latent | YES | FIXED (regex accepts the trailing token). Smoke: 121 of 126 commands match, both installed hooks under their telemetry names; the screen runs, exit 0. No eval file exists for it yet. |
| 7 | `core/registry.js:111` does not strip a bare `.hook`, so a manual run lists the two installed hooks as `*.hook` rows with no last fire | cosmetic | YES | NOT fixed. |
| 8 | `forge install hook` says the telemetry name is kept, but for a hook that lives only in a bundle `lib/dispatch-hooks.js:98` names rows after the file | cosmetic, latent (next bundle-child install) | YES | NOT fixed. Fix before installing any bundle child. |
| 9 | Documents made stale by this session's commits: release-mlk-plp `SKILL.md:405` · cleanup eval header path · arabic "same line" claim (2 files) · knowledge-schema-audit `README.md:24-25` · system-architecture §3.1 | cosmetic | YES | FIXED. |
| 10 | Older stale documents: `.claude/save-commands.md:40` (banned columns) · hotfix `SKILL.md:20` and release `SKILL.md:190,415` (raw `mvn compile`, now blocked once with the right command) · expansion-protocol step 11(c), session-briefing.md:56-57 and `domain-expansion-trigger.js:108` (still describe automatic removal of merged worktrees, frozen since 2026-09-27) · system-audit CHECK 6 looks only at direct registrations · each finished cleanup run modifies the tracked sweep log in main | cosmetic | no | NOT fixed; listed here. |

Gaps the critic named (not findings, things still unproven):

| Gap | State |
|---|---|
| No real etanah commit, push or quest start has run since the change | still ahead. After the next real ticket: read the last rows of `domain/compile-gate/log.jsonl` and the telemetry rows of ticket-gate / etanah-intake-gate / quest-phase-gate with a session id and a qa value. |
| Session close (Domain Expansion) has not run since the change; `de-close-gate` C5 wants one watch row per edited file under `domain/`, `lib/`, `core/`, `.claude/hooks/` | to do at the close of this session. |
| Watch `wmuu2uoib` (the boot change) lost 3 of its 4 ticks to eval and compaction runs; one real boot was observed | resolve it with that note, never from the printed rollback line. |
| The falsifier ledger check inside the compile gate (`domain/falsifier-ran-check/check.js`, 2026-10-04, not part of this session) was read by no reviewer | open. It sits on the etanah commit path and can block. |
| `domain/release-mlk-plp/eval.js`, `domain/sweep/eval.js`, `lib/adhoc-save-audit.eval.js` were green on 2026-09-14 and red since 2026-10-03 | open, not this session's change; run each alone on an idle machine and read the failing fixture names. |
| 47 of 61 folders under `.claude/worktrees/` hold an old `settings.json` that names the two old hook paths; whether a resumed old session reads its own settings.json is not verified | open. If it does, those two hooks log `target-missing` and are skipped (fail open). |
| The background run does `git update-index --refresh` and `git fetch origin main` in the main checkout: a session opened in MAIN may hit `index.lock` in its first minutes | open, a retry fixes it. |

## 12. みや's idea, 2026-10-05: boot mode by keyword or by working day (not designed, not ruled)

His words are in §10 answer 4. It is the "two boot modes" item of §4 (row 8), now with a concrete trigger.

| Fact (checked on disk) | Where |
|---|---|
| A holiday list and a lookup already exist locally | `E:\Dev\scripts\PymTime\holidays-2026.json` (1,195 bytes) + `lib\holiday.js` `isHolidayCached()`; `domain/protime-plan/protime-plan.js:141` already calls it |
| Workdays and the clock-in window are PymTime settings | named in PymTime's own docs; the file that stores them was NOT read |
| Working-day arithmetic exists for the board | `quest/redmine-board.js:249` (Sat/Sun excluded) |
| A per-prompt mode line exists | `.claude/hooks/mode-detector.js` (Quest-active vs Discussion, from `quest/active.txt`) |
| Redmine holds no holiday calendar that this repo reads | not verified against Redmine itself; nothing in `quest/redmine-*.js` reads one |

Advice given in chat: fast enough at boot (a local file, milliseconds), no routine needed, Redmine not needed; use BOTH signals: working day + work hours picks the mode, a keyword such as "start work" overrides either way. To do: design it with system-design, bring it to him as a popup with a diagram.
## 11a. The gate fix — round 1 attack, and the rebuild (state 2026-10-05 13:00; NOT on main yet)

Round 1 (`wf_9f2f6a5c-fdc`, 3 attackers + a refuter per finding, 40 agents): **37 ways through, 0 refuted.** 13 were new problems in my first fix (v6), 24 were older than this session. Full list: the run's result file in the session folder (`tasks\wytuixxmb.output`, key `result.confirmed`).

| Class | Example | Age |
|---|---|---|
| A push on its own line, indented, after a comment line | newline as the only separator | older, since the gate was born |
| Anything between a separator and the word git | output assigned to a variable, inside an if block, inside parentheses, `git.exe`, the call operator, an env prefix | older |
| Options before the verb | `-c k=v` or `--no-pager` between git and the verb; and `-c k=v` read as `-C <dir>` | older |
| A push inside a string handed to another shell | bash -lc "…", pwsh -c "…" | older |
| Only the first push of a command was judged | two pushes; repo from one, branch from the other | older |
| The target is not written | a bare push on a checked-out shared branch, all-branches and mirror forms, a branch in a variable | older |
| Only `mlk/*` counted as shared | `trg/stag-env`, `prk/master`, `mlk/beta` in another team's repo | older |
| Things that undo a cd | `Pop-Location`, a cd in a quoted string, a relative `-C` | older |
| The Terminal-panel tool was not inspected | `mcp__terminal__run_in_terminal` | older |
| The check report was tied to the folder's HEAD, not to the commit pushed | another local branch sent to the staging branch with a report for HEAD | older |
| A Git Bash path read as a drive path in PowerShell (where that cd fails) | a `/e/…` path in the PowerShell tool | new in v6 |
| The tool's own cwd parsed as shell text | a folder name containing `$` | new in v6 |
| Variables substituted without knowing their value | re-assignment after the push, single quotes, expressions, `$env:` | new in v6 |
| A folder created by the same command | worktree add, then a push from it, in one command: now refused | new in v6 (accepted, with a reason line) |

The rebuild (uncommitted in the session worktree at the time of writing):

| File | What changed |
|---|---|
| `lib/git-target.js` v3 | Finds EVERY git call (after any separator, with options, `git.exe`, env prefix; quoted text and here-strings are text). Reads a path the way the tool's SHELL reads it. Follows cd chains in order; a missing folder, a popd, a subshell cd make it uncertain. Variables only when certain (one quoted literal, before the call, no other assignment in between, never in single quotes). The tool cwd is never parsed. Says `unresolved` + `why`. |
| push gate v7 | Every push judged. Unknown repo + a push that could reach a shared branch = REFUSED with the reason and the one plain form. In another team's repo everything that is not a ticket branch (`<state>/<tracker>/<number>`) is shared, including a bare push, the all-branches forms, deletes, other states. The check must cover the commit really pushed. Terminal-panel tool included (one new PreToolUse group in `settings.json`; catalog regenerated, 140 registrations). |
| compile gate v2.2 | Every commit call judged, shell-aware. Unknown repo + an etanah signal outside the commit message (or an etanah tool folder) = refused with the reason; bypass token unchanged. `-c k=v` no longer read as `-C`. `compile-check.js` accepts a Git Bash path. |
| evals | push gate 113/113 (was 35 at v5, 50 at v6) · compile gate 56/56 (was 27). Three older fixtures (F10/F11/F15) now use a real fixture repo; F34's expectation is reversed and named. |

Round 2 (`wf_91995105-40c`) is attacking the rebuild: closure of all 37, a replay of real past commands from logs and transcripts (false blocks), fresh fail-open ideas, a parser attack. Nothing lands on main until it is back.

**What a text gate can never close**: a push inside a script file, an alias or function, anything typed outside Ruri. Proposal for みや (NOT asked yet, NOT built): a second lock inside git itself, a `pre-push` hook in each foreign etanah clone on this laptop (`E:\Projects\Melaka\etanah-awam`, `etanah-common`, `etanah-spoc-hasil`; `E:\Dev\etanah-work\etanah-awam`, `etanah-common`; worktrees share their clone's hooks). git runs it on every push however the command was written, with the exact refs. It would act only when `CLAUDECODE=1` is in the environment (verified present in Ruri's tool shells), so his own pushes from Sourcetree or Eclipse are untouched. It changes files under his clones' `.git\hooks\`, so it needs his yes.

Until the rebuild is on main: main still runs push gate v5 and compile gate v2 (the Git Bash path hole and the multi-line hole are live). Use literal Windows paths and one push per command.

Note for whoever edits this file: the live gates read command text, so a shell command that CONTAINS push examples (a here-string appended to this file) is refused by them. Write such text with the file editor, never through a shell here-string.

## 13. Boot batch 2 — BUILT and on main (2026-10-06, commit `93820c46`, merged as `4dedb429`)

みや's words: "Please just build this and test, eval, etc to make sure everything still meets the previous behaviour just what changed is the efficiency" + "please add a lot of triggers related. work/redmine/tickets".

| Part | What changed | Proof |
|---|---|---|
| Ticket list (`.claude/hooks/open-quest-surfacer.js`) | Off SessionStart; 4th child of `domain/bundles/upsm-mode.json`. Same block, printed on a work prompt. ASK (always, live): board, my tickets, retrieve / check / list tickets or redmine, briefing, where were we, update me on my tickets or work. SOFT (once per 4 h per session): any ticket id or number of an open block, redmine, ticket, tiket, esokongan, quest, backlog, permohonan, "let's do some work", "back to work", "jom kerja", "what should we do today". Nothing otherwise. `--now` prints on purpose. | eval 95/95 · block on a signal = session-start block byte-for-byte · real bundle + live Redmine with "Let's do some work": 5.2 s, board present; same prompt again: 0.5 s, silent |
| Audit (`.claude/hooks/system-audit.js` v1.2) | Full audit on change (hook file, settings, bundle, CLAUDE.md, architecture doc), first start of the day, or `--full`; else one line. A full run also runs `boot-required-read-gate.js`, `evolution-check-trigger.js`, `system-check-trigger.js` (off SessionStart, files kept, ghost-check opt-out marker). | eval 29/29 · old audit text = prefix of the new full run · on main: 4,042 ms then 122 ms |
| Watches (`lib/watch.js` `brief`, `tick` once a day) | Session start prints count + 3 oldest + the command for the full list. `check` unchanged. | eval 17/17 (was a stub) · on main: 21,234 → 641 characters |
| Registrations | SessionStart 10 → 6; every other event unchanged; catalog regenerated. | settings check in the edit script + `system-audit --full`: no ghost, no dangling |

Measured on the eight batch-2 scripts (worktree, one run each): 10.1 s / 10,710 characters → 1.3 s / 542 characters on an ordinary start; 4.4 s when the full audit runs.

Design choices that differ from the 2026-10-05 design record, and why: the three small scripts ride on the audit's full run instead of the session-close screen (one mechanism, and the reminder still appears at a start, once a day); no forge install or file move (not needed for the efficiency goal; the forge blocker stays open); the cache and the "shown" marker live in the temp folder (machine-local, outside git and OneDrive).

NOT done: adhoc folders auto-archive (new behaviour, needs his ruling); `adhoc-lifecycle` and the required-reads banner stay at start; the forge fix for loose-hook installs.

Open points, honest:
- `system-audit.eval.js` failed 1 of 29 once in 6 runs on the live main checkout; the failing check was not captured. Likely a check that compares two full runs while another session changes the repo between them. Not reproduced in 5 further runs.
- What moved: a pointer in CLAUDE.md that breaks is now seen at the next full audit (after a CLAUDE.md change, or next morning), not at every start.
- The harness shows a hook output over roughly 10,000 characters as a 2,000-character preview plus a file path. The ticket block is about 8,500 to 9,900 characters with 28 open quests, so it sits at that edge. This was already true at session start. If the list grows, read the saved file or run `--now`.
- No real session has started on the new registrations yet; four watches are registered for that (`wmuwtzpy0`, `wmuwtzqb9`, `wmuwtzqky`, `wmuwtzqt8`).
- The unreviewed gate rebuild is parked on branch `claude/gates-v7-wip` (`559f431b`), not on main.

## 14. Round of 2026-10-06 23:40 — his rulings, what was done, boot mode design

His rulings (verbatim sense): (1) etanah-awam is pushed by us, like etanah-pelupusan; (2) adhoc videos are deleted at archive; (3) "Yes design that boot mode"; (4) proceed, then brief.

| Item | Done | Proof |
|---|---|---|
| etanah-awam = own repo in the push gate | `domain/release-mlk-plp-push-gate/release-mlk-plp-push-gate.check.hook.js`: "another team" = every etanah repo except pelupusan and awam. The mlk/master ban holds for both. | eval 38/38 on the live gate; 116/116 on the parked rebuild |
| Second git lock | DROPPED. Its premise (awam is another team's) was wrong. Not built for common / spoc-hasil either: not asked. | — |
| Closed adhoc archives itself, videos deleted | adhoc-save skill step 1b: the closing round runs `node quest/archive-quest.js <ADHOC-ID>` (it already moves the folder, deletes videos, moves the block and the project folder). `lib/adhoc-save-audit.js` now FAILS a closed adhoc that is not archived and prints that command. | archive eval 20/20; audit eval 19/24, the same five that failed before this change; dry run on ADHOC-PRBB-2026-8 lists the moves |
| "brief me the results" loaded the ticket list by mistake | briefing trigger narrowed; 4 new negative fixtures | eval 99/99 |
| Reviews | both resumed (`wf_91995105-40c`, `wf_b8401d64-729`); gate rebuild restored into the worktree as uncommitted work with the awam rule | results appended when back |

**INCIDENT, mine**: commit `c1e6ad56` ("ledger: slip rows"), made in the MAIN checkout, reverted all of batch 2 in git history. Cause: I committed there while another session was working in the same checkout; its index was not mine. The files on disk in main kept the batch-2 content, so the hooks kept running batch 2. Repaired by `25c21d4a` (re-applies `93820c46` unchanged). Rule from now on: a worktree session NEVER commits in the main checkout; it only fast-forwards it, and leaves it alone when that is refused. At 23:45 the main checkout had a live git process and an `index.lock` from another session, so it was left at `a6b5ea77`; it takes `25c21d4a` (awam rule, adhoc check) at its next fast-forward. Batch 2 is already live there.

### Boot mode — DESIGN ONLY (not built; needs his nod)

Goal: a session knows at its first prompt whether this is a work session, without loading anything at start.

| Mode | When | What it changes |
|---|---|---|
| Work | working day (PymTime `workdays`, default Mon–Fri) AND not a public holiday (`lib/holiday.js` `isHolidayCached`) AND not approved full-day leave (`lib/leave.js` `onLeave`) AND inside work hours (proposed 08:30–18:30) | the first prompt of the session loads the ticket list even with no ticket word in it |
| Quiet | any other time | as today after batch 2: the list loads only on a work word |
| Keyword | "start work" / "work mode" forces Work · "quiet mode" / "not working today" forces Quiet, for that session | overrides the clock either way |

- Where: one function in `.claude/hooks/open-quest-surfacer.js` (the first-prompt check it already makes), reading PymTime's two local cache files. No new script, no start-up cost, no network.
- Wrong guess is cheap: Work on a sick day = one 5 s load; Quiet on a work day = the list still loads at the first work word.
- Unknown data (PymTime missing, cache unreadable) = Quiet.
- Not covered: medical leave entered after the fact; that is what the keyword is for.
- One line is printed with the reason, e.g. `Work mode: Tuesday, no holiday, no leave, 09:12`.

## 15. Round of 2026-10-08 — major keywords, videos, checks on real use

His words: (1) "board" alone is not enough, "Tickets" and "Redmine" are major keywords too; (2) videos are deleted after archive; (3) ignore the "Incident, 5 Oct 01:47" block; (4) proceed, run the evals, verify, add negative tests.

| Item | Done | Proof |
|---|---|---|
| Major keywords | `.claude/hooks/open-quest-surfacer.js`: a message of 8 words or fewer that holds "tickets" or "redmine" loads the ticket list every time (`MAJOR_RX`, `MAJOR_MAX_WORDS`). "board" already did. Hint texts name all three (CLAUDE.md v1.82, session briefing, list-redmine skill). | eval 123/123; 14/14 through the real prompt bundle against the real Redmine, 8 of them negative |
| Videos deleted after archive | No code change needed: `quest/archive-quest.js` already moves the folder first, then deletes the videos. Four new fixtures 9b to 9e (adhoc, dry run, neighbour folder, unknown id). | eval 24/24 |
| Adhoc audit eval | Its sample adhoc lacked the title the audit has required since the title rule (19/24 red). Fixture repaired; E25 to E29 added. | eval 29/29 |
| Adhoc audit, false alarm | Found on real data: a closed adhoc with `task_folder=none (adhoc, no ticket)` was told to archive a folder it never had. One condition in `lib/adhoc-save-audit.js` (`noFolder`), fixture E29 red first, then green. | 29/29 |
| Archive eval out of quarantine | `system/eval-quarantine.jsonl` row for `quest/archive-quest.eval.js` (since 2026-08-16) removed: the eval passes in the worktree (24/24) and in the main checkout (20/20, older copy), 16 s. | both runs |
| Page | https://claude.ai/artifact/FYG8o9tQy6KzRTqMN1doDo updated: three keywords, videos deleted, incident block removed, batch 2 shown as built. | published |

Real use since batch 2 went live (main checkout telemetry, 6 Oct 23:45 to 8 Oct, 24 real sessions):

| Measure | Value |
|---|---|
| Session start, sum of script medians | 90.4 s (29 Sep to 4 Oct, 12 scripts) → 3.8 s (6 scripts) |
| Error rows on the changed parts | 0 |
| The four moved scripts, runs at SessionStart | 0 |
| Ticket list loads | 31, in 20 of 21 sessions; median 8.6 s, max 27.7 s (bundle kill at 30 s) |
| Watch countdown | one tick moment per day |
| Cleanup | 22 finished runs, 9 locks set, 0 lock failures |

Archive rule on the 46 real adhocs (worktree audit code, main checkout data, read-only): 16 archived folders on disk hold 0 videos; no open adhoc is told to archive; 4 closed ones are flagged and are real: `ADHOC-PT-2026-10` (folder 237 still in the live list), `ADHOC-MLPS-2026-1` (149, live, renamed ADHOC → AH), `ADHOC-PPTPB-2026-1` (146, live, renamed), `ADHOC-0402DIS2025000170` (folder is in Archive as 81 under the AH name; the block still names the ADHOC name). The three live folders hold 0 videos. Not acted on: the quest files sit in the main checkout, which another session is using.

Full battery 2026-10-08 16:58 (worktree, 733 s): 138/146 green, 6 quarantined, 8 failing, none from this work.

| Failing | Why |
|---|---|
| bpmn-check, deploy-check, release-mlk-plp (2), sweep | same as the 5 Oct baseline; not looked into |
| observatory | timeout under battery load, as on 5 Oct |
| `domain/pre-code-check/eval-self-audit.js` | 5/5 alone; failed only inside the battery |
| `domain/ticket-gate/eval.js` | 60/61: F22 uses Kedah as the empty scaffold state; `system/states.json` gave Kedah its data on 2026-10-06 (`3016d2ec`). Stale fixture, not touched. |

Open, honest:
- The main checkout is 13 commits behind `origin/main` and 2 ahead, with 23 edited tracked files of another session (9 differ from the remote). Fast-forward refused; left alone. Hooks run from that checkout, so the major-keyword rule, the `noFolder` fix and the quarantine lift start there only after it syncs. Batch 2, the awam rule and the adhoc archive check were already in its files.
- Waiting for his word, not built: push guard step 2 (Git Bash path gives an empty repo name, so steps 3 and 4 are skipped); boot mode (section 14); a flow page per Workflow; the 4 closed adhocs above.
- Parked: gate rewrite on `claude/gates-v7-wip`.

## 16. Round of 2026-10-08 night — main synced, 4 adhocs archived, boot mode BUILT

His words: (1) "okay sync main folder" (2) "okay archive the 4 closed adhocs" (3) "explain to me briefly on the fix push" (4) "build boot mode" (5) "briefly, what is this flow pages for? One page per workflow? What page?"

| Item | Done | Proof |
|---|---|---|
| Main checkout in sync | Another session had already saved and synced it at 22:31 (`581f0390`): 0 behind, 0 ahead. The major-keyword rule and the `noFolder` fix are in its files. | `git rev-list --left-right --count origin/main...HEAD` = 0 0; `MAJOR_RX` and `noFolder` found in the main checkout's files |
| The 4 closed adhocs | Folders of `ADHOC-PT-2026-10` (237), `ADHOC-MLPS-2026-1` (149), `ADHOC-PPTPB-2026-1` (146) moved to `Melaka\Archive\`; 0 videos in them. Four records in `quest/active-archive.txt` now name the real folder (three were written before the "ADHOC" → "AH" folder rename; `ADHOC-0402DIS2025000170` already sat in Archive as 81). | audit on the 46 real adhocs: 46 pass, 0 flagged; 3 lines differ in the record file after the correction step, then 3 tool runs |
| Archive tool gap, found on the way | `quest/archive-quest.js` did nothing to a folder when the record was already in `active-archive.txt` (it read `task_folder=` from `active.txt` only). Now it reads the archived record, moves the folder, deletes videos, and writes the Archive path back with `active-cli update … --file active-archive.txt`. | fixtures 9f (red first), 9g, 9h; eval 27/27 |
| Boot mode | `.claude/hooks/open-quest-surfacer.js` v3: `workNow()`, `firstMessageInWorkHours()`, `QUIET_RX`, `--mode`. No new file, no new registration. | eval 157/157 (123 earlier + 34 new, 17 of the new ones negative); 10/10 through the real bundle + real PymTime data + real Redmine with a fixed clock |

Flow of the loader, with the one changed step:

```
his message → 1. sweep running? → silent
            → 2. keyword? ask word / "tickets" "redmine" "board" → load · work word → load once per 4 h
            → 3. no keyword → silent                                   ◀ CHANGED
                   first real message of the session + Work → load, header says why
                   "quiet mode" / "not working today"       → no load, one line says so
            → 4. load = open quests + live board, session marked
```

Boot mode rules as built:

| Rule | Value | Source |
|---|---|---|
| Work | PymTime `workdays` (1=Mon..7=Sun) has today · `isHolidayCached(now)` empty · `onLeave(now)` not (APPROVED and Full) · 08:30 ≤ now < 18:30 local | `E:\Dev\scripts\PymTime\lib\config.js` `holiday.js` `leave.js`, required the way `domain/protime-plan/protime-plan.js:141` does; `PYMTIME_DIR` overrides the folder |
| Quiet | everything else; also: PymTime folder missing, no config, leave cache unreadable, any throw | fail closed to Quiet |
| Decided | once per session, at his first real message (not a machine notification, not empty); kept as `mode:<session id>` in the loader's marker file in the temp folder | same file as the "shown" marker |
| Force Work | "start work" / "work mode" are existing work words: they load on any day | `SOFT_RX`, unchanged |
| Force Quiet | "quiet mode" / "not working today" / "no work today": no unasked load in that session; keywords still load | `QUIET_RX`; checked before the work words because "not working today" holds "working today" |
| See the decision | `node .claude/hooks/open-quest-surfacer.js --mode` | prints `Work mode: …` or `Quiet mode: …` with the reason |

Requirements, from his words (section 10 answer 4) to the build:

| His words | Built as |
|---|---|
| "a keyword so that you know we are starting our daily work" | "start work", "work mode", "daily work", "let's do some work" load the list on any day (fixtures G10a, G10b, B1) |
| "detect … is it working day and also holiday" | PymTime workdays + holiday cache + leave cache (fixtures G3, G5, G6, G8) |
| "to determine if you boot in what mode" | Work = first message loads the list; Quiet = nothing loads unasked (G1, G2) |
| "Can this be updated by a routine. or quick enough to be done boot time?" | No routine. Read at his first message: 21 ms to load the three PymTime files; outside 08:30 to 18:30 they are not read at all |
| "holiday days from redmine" | NOT from Redmine: PymTime already keeps the Protime holiday list on this laptop. Said in chat on 2026-10-05; unchanged |

Accepted limits, each on purpose: a session that starts before 08:30 stays Quiet for its whole life (a keyword loads the list) · a scheduled or automated session that starts in work hours gets one unneeded load · leave entered today may not be in the cache yet (one load; "quiet mode" covers it) · on a laptop without PymTime boot mode is always Quiet · work hours 08:30 to 18:30 are two constants (`WORK_FROM`, `WORK_TO`), the value proposed in section 14 and not separately ruled.

Not installed as a Feature: the loader is still a loose hook in `.claude/hooks/` (the forge blocker of section 10 is open). Its goal, symptom and signal are in the file's v3 comment; its fires are in `system/telemetry/hook-fires*.jsonl`. Watch `wmuzp7jiu` registered in the main checkout's watch list (that file is machine-local, not in git).

CLAUDE.md v1.83 (boot step 5 names boot mode) + changelog + session-briefing line.

Push guard step 2, explained to him, NOT built: proven on this laptop that `cd /e/Dev/etanah-work/etanah-common` gives repo name "" while the Windows path gives "etanah-common" (`lib/git-target.js` hands the Git Bash path to `git -C` unchanged, and that fails). With an empty name the "another team's repo" check (steps 3 and 4) is skipped. Fix on offer: read `/e/…` as `E:\…`, and block a push to a shared branch when the repo still cannot be named.

Flow pages, explained to him, NOT started: one published page per Workflow (quest, deploy, release, adhoc, close-phase, hotfix, Domain Expansion …) with its steps in order and what each checks; read before changing any step.

Full battery after these changes: 2026-10-08 23:32 (worktree, 665 s): 142/148 green, 5 quarantined, 6 failing, none from this work: bpmn-check, deploy-check, release-mlk-plp (2), sweep (all as on 5 Oct) and ticket-gate F22 (stale since Kedah got its registry data on 2026-10-06). The archive eval runs in the battery again.

Commits follow system-design Rule 15 (land on main; index built in the same command; stat read before and after).
