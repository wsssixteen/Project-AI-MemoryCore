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
| Daily gates fired without error since the cut | `ticket-gate` 1 · `etanah-intake-gate` 1 · `quest-phase-gate` 13 · `convention-check-gate` 13 · `compile-gate` 40 · `release-mlk-plp-push-gate` 17 |
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

Independent runs (Workflow tool, read-only):

| Run | Run id | What | Result |
|---|---|---|---|
| Verification | `wf_49cf7fce-b89` | six review dimensions (quest load · Redmine intake · wrapper change · background cleanup · gate false-blocks · boot documents), one refuter per finding, one completeness critic | (appended when it returns) |
| Batch-2 design | `wf_923b9eaf-18e` | facts per remaining boot script and its consumers → design per script (two angles for the quest board) → cross-cutting critic | (appended when it returns) |

To resume either after a break: `Workflow({scriptPath: <script file under the session's workflows/scripts folder>, resumeFromRunId: "<run id>"})` — finished agents replay from cache.
