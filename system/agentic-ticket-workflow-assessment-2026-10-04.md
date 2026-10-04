# Agentic ticket workflow assessment — 2026-10-04 (worktree quest-audit-275043-244600-7954c0)

Covers the session of 2026-10-03 night (Terengganu made active, 5 blind eval replays, quest-workflow audit) and its close on the morning of 2026-10-04.

| Axis | Assessment (concrete instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | The eval workflow used 46 agents, 10.6 M subagent tokens and 70 minutes for 5 replays. The single-agent flow passed #278327 in about 6 minutes; the full Phase-0 engine took about an hour per ticket for the same verdict (discovery 7 min, knowledge-load 10 min, each Recon lens 12 to 15 min, notes 7 min, verify 9 min, synthesis 11 min). A prep agent gave ticket #278327's brief under number 282244. Two Recon lenses quoted different counts for one thing and Synthesis passed both. Two evals wrote into real ledgers (`goal-lens-pending.jsonl`, `handoff-load/log.jsonl`). Splitting the audit into an evidence run and a decide run saved about 15 minutes of wall clock at no token cost. | Logged: synthesis re-runs a count two lenses disagree on · eval leak into real ledgers · keep the blind replay as a tool with a cut date · DE tools read main data when run from a worktree · boot hook counted as errored 63 of 63 |
| A2 quest workflow | 5 readers, about 80 findings, 12 proposals, 3 skeptics, 0 killed, every one returned with conditions. Applied 6 (P2 to P7) with their own evals; battery 124 of 130, same 6 red as before, 0 new. The resume-readiness sweep had been a silent no-op in every worktree session (it printed "cannot read quest/active.txt" and exited 0). A mandatory Recon row named two DB tools retired on 2026-07-17. The engine sent agents to protocol line numbers that had drifted by 18 to 40 lines. The notes stage ran 3 of 3 times, was denied by the gate, wrote nothing and cost 5 to 9 minutes each. | Logged: P1, P8, P9, P10 remainder, P11, P12 (owner rulings) · branch-ledger check reads the qa_doc path from the block (a flat qa_doc is reported NOT FOUND today) |
| A3 debugging efficiency + accuracy | All 5 replays reached the real root cause; false claims were 0 or 1 small slip per run (a line number off by 2). The analog-origin git probe found the two predecessor tickets of #278989 from one blame. Miss: the #278819 run said "No BPMN change" because the gateway was already live, although the team shipped a model change with the fix. Two of my own leads were wrong when probed (PROD model "differs"; worktree "cannot see" the quest file). | Logged: Recon names the model version that first carries a change when the deployed model is newer than the ticket date |
| A4 etanah issue-solving | Knowledge-first held: every run read only its own state's folder and only its own DB servers. Recon corrected a wrong knowledge line (PT does not render the inline land form). The first Terengganu alter was read back from PROD, so the alter signature is now observed, not only read from code. The schema audit calls Perak and WP canonical although most of their required files are stubs. | Logged: schema audit flags a stub file as not canonical |
| A5 sweep / file sweep | Retrieval routes a ticket by a hand-copied project-name list and anything unmatched becomes a Melaka ticket. BA-given test ids of Perak and Terengganu shape were never surfaced at retrieval until tonight's pattern fix. At close, the watch ledger (ignored by git) held 3 watches that existed only in this worktree. | Logged: route from the registry and print STATE UNKNOWN for no match · at a worktree close list the git-ignored files, not only `git status` (done by hand this time) |

## Slips logged this session (ledger category)

`trusted-claim-unverified` · `assume-not-verify/state-guess` (2 rows) · `no-eta-on-long-run`

## What worked and must not be touched

State resolution from the Task folder or permohonan id · the Scout, Recon, Rubric, Apply engine and its code-level Recon lenses · live task-state query for the holder login · the adversarial Verify stage · the literal-scope rule · the artifact-checking gates (de-close, de-knowledge, branch-guard, compile, knowledge-first, attachment-ledger, db-claim-proof).

## Addendum — session 2 (#282442 two-session reconcile)
- A1 ⏭ nothing new beyond the morning sweep.
- A2 quest workflow: two sessions worked #282442 without either knowing. Instance: 10-02 worktree stopped at "R2 needs nod"; 10-04 worktree applied R2 and updated active.txt but left the qa_doc Resume Point + checklist stale. Proposal logged (A2): at ticket-gate, list other live worktrees whose name carries the same ticket number. Eval case: two worktree dirs containing `282442` → gate prints the other path.
- A3 debugging: `et_sistem_<env>.pt_application_ex_entity` answered a blank-page ticket in one query, timestamp matched the BA video. Already in memory (`infra-server-log-request`); worked as designed.
- A4 etanah: second instance of the shared-composite missing-bean-property class on the same bean (#279615, now #282442). Bestiary pattern 4 covers it; bake the instance at Phase 2 close.
- A5 ⏭ no sweep ran.

## Addendum — session 3 (#244600 rework cycle 1)

| Axis | Claim | Concrete instance | Proposal logged |
|---|---|---|---|
| A1 agentic system | The pre-code check can be passed without being read, and skipped entirely by a shell script | `domain/pre-code-check/pre-code-check.check.hook.js` returns `fired:false` on `no-transcript`; 5 Java changes on #244600 were made by Python scripts in the shell | A1 ×2 |
| A2 quest workflow | A falsifier written in the Rubric was never run before ship | Rubric 2026-10-01 "Falsifier C1" (Word no-change save alters the XML); fix `d61fc2e611` shipped 2026-10-02; BA failed it 2026-10-03. The falsifier ledger built this morning now blocks this | covered by the ledger; A2 necessity row for new destructive calls; A2 note check for a colleague's ticket |
| A3 debugging | Probe coverage was one logger on the first build, and two writers were unprobed on the second | slips `probe-coverage-incomplete` ×2; the third build (22 probes, browser console) answered the test in one run and found the failing delete from 76 server lines | A3 bank the console-probe pattern |
| A4 etanah issue-solving | A new side-effect call was written with no analog | `DocumentManagementSystemClient.delete()` on a discarded draft: 3 of 3 failed on MLIT; Pelupusan never deletes store files | A2 necessity row (same proposal) |
| A5 sweep | The sweep rated the ticket ready while its only falsifier was unrun | sweep 2026-09-25 row "65%, 4.5 h" for #244600 | A5 sweep reads the ledger |

What worked and must not be touched: the falsifier ledger at commit (it stopped the rework commit until rows 2 and 3 carried `RAN:` evidence) · the compile gate · probes shown in the browser console · miya's `[risk-ok]` as the only way past the local-test row.

## Session: Terengganu adhoc day (ADHOC-PLPS-2026-1, ADHOC-MLPS-2026-2), 2026-10-04 afternoon

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | No agents used; all inline. The hand-off loader fired on an infra handoff and loaded the cross-module memories, the wrong pair for a PROD patch | prompt "prepare the infra handoff", ADHOC-PLPS-2026-1 |
| A2 quest workflow | Simulate steps were built from the DB trail and ignored actor rows visible in the evidence photo; no git-history probe on the reassign code until miya asked | steps without the Utiliti Pengagihan Semula row; fix `c402a5766e` (#226218) found one turn late |
| A3 debugging | A date was read off a screenshot before the audit tables were queried; wrong by 7 months. Once `et_sistem.pt_audit_entity` was found the change was pinned to the second in 2 queries | "1 Feb 2026" vs 2025-07-10 09:58:20 |
| A4 etanah issue-solving | Terengganu knowledge held up: triage classes, PROD read, engine schema all right first time. Gaps: no audit-table knowledge, no `skg_dok` knowledge, 4 wrong-column queries. All written back the same day | `terengganu/ADHOC-TRIAGE.md` Step 2c, `DATABASE.md` 0b |
| A5 sweep / file sweep | Two pasted images never reached disk, so the adhoc brief folder has 3 of 5 images; content was written into the quest doc instead | ADHOC-MLPS-2026-2 follow-up photos |

Other measured points: adhoc save audit needed `--state terengganu` by hand (first run compared against Melaka row A1); adhoc id `ADHOC-MLPS-2026-1` was already used by an archived Melaka adhoc and had to be renamed; 2 ProTime titles needed 2 corrections (no issue word, then no object word).
Proposals logged: A1, A2, A3, A4, A5 (one each, 2026-10-04).

## Session: ADHOC-PRBB-2026-9 → #282924 (2026-10-02 → 10-04)

| Axis | What the session showed (instance) |
|---|---|
| A1 agentic system | No fan-out used; the whole quest ran inline on banked adhoc findings. The session worktree lost its git link mid-session (`fatal: not a git repository ... worktrees/melaka-pembatalan-ralat-f283f4`), so two edits (redmine-people.js, redmine-sync hookup) sat stranded for two days until salvaged by hand through a temp worktree. |
| A2 quest workflow | Adhoc → ticket promotion worked: A44 matched, no re-Scout, Rubric in one pass. The Rubric caught C1 → C2 from BA's verbatim words. After the nod the workflow over-demanded: local test hand-back + probe matrix (Stop hook) + fix photo (Stop hook) on an 8-line 85% fix. Cost: 2 angry rounds. Fixed same day: predicate-box v4, fix-photo v2. |
| A3 debugging | No debugging. Confidence 85% held; fix worked first deploy. The unread 15% (draft resume path) was never traced, it was accepted as a risk by miya. |
| A4 etanah issue-solving | Analog in the same file found in minutes (`URUSAN_MAXIMUM_ONE_HAKMILIK`, PLTP/PSBS message). Multi-state gate (`isMelaka()`) was added from the in-file convention. Kaunter route found by one PROD census (first tugasan PK). |
| A5 sweep / file sweep | Both BA images opened and echoed. Video read by contact sheet (36 frames) which showed select-all was NOT in the video; asked instead of assuming. The pass note assumed "internal & staging" with no evidence of which server he deployed. |

Failure classes: (1) gate-over-demand after an agreed fix · (2) fabricated evidence artifact (marked BA before-screenshot as fix photo) · (3) env assumed in a BA note · (4) stranded worktree edits · (5) `de-run-verify` self-retrigger loop (6 re-fires).

## Session 6 — #282442 rework (worktree redmine-282442-9258e6)

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | no fan-out used; one side session spawned for a gate build instead of building it mid-ticket | chip "Gate fix builds that carry no probe loggers", started by miya |
| A2 quest workflow | a resumed rework reused the prior cycle's Rubric and went straight to Apply, so the mandatory Falsifier + Logger row never existed for R2 or R3 | zero `QA282442-PROBE` lines in three commits; two blank-page rounds with only the exception text as data |
| A2 quest workflow | the test stopped at the fixed step while the ticket's Expected line reached one step further | "Tidak papar ralat dan boleh teruskan pembatalan"; cycle 1 video ends at Jana |
| A3 debugging | the error table already held the answer on PROD and was never asked on three tickets for one screen | `keputusanMMKN` ×25, 22 to 28 Sep, the day after #279615 |
| A3 debugging | a member-only scan of a shared composite missed its ajax update targets and the mode attributes sibling pages pass | R2 deployed to MLIT, `ComponentNotFoundException` at `jenisBahan` 10:35 |
| A4 etanah issue-solving | a local test hand-back was not backed by the machine: wrong schema, no fix files, then a stale class (file copy kept old mtime, Eclipse did not rebuild) | miya restarted JBoss twice for nothing, 11:25 and 11:36 |
| A4 etanah issue-solving | Redmine Solution written as a result, then as a denial of chat-only content, four rounds | "Tiada field baru di skrin" |
| A5 sweep / file sweep | BA video and both photos were opened and ledgered at intake; the infra server log (22 547 lines) was read by time window and pattern, not whole | timeline 14:44:25 to 14:45:37 extracted in two passes |

## Addendum — session 5 (probe-decision gate, predicate-box v3 → v4.1)

| Axis | Claim | Instance |
|---|---|---|
| A1 agentic | A handover brief written by one session is taken as the full requirement by the next | The brief cited `feedback_loggers_extensive_with_fallbacks.md`; the file did not exist. I built v3 from the brief, miya had to stop the build and order the search (system-design Rule 10 skipped). |
| A1 agentic | Two sessions refined the same hook the same afternoon | v3 (this session) and v4 (#282924 session) both edited `domain/predicate-box`; v4 landed cleanly only because it was additive. My v3 wording then contradicted v4 until v4.1. |
| A1 agentic | A shell helper wrote to the wrong checkout | `[IO.File]` with a relative path resolves against the process directory (main), not `Set-Location` (worktree): 4 doc edits landed in main. |
| A2 quest | The strip-probes reminder has a phrase gap | `prepare-commit-trigger` fires on "prepare to commit" / "let's commit" / "close phase 1", not on "approve commit" or plain "close". A probe can be committed to a ticket branch. |
| A3 debugging | Gate strength was set from one incident, not from his rule | v3 made loggers mandatory for every `.java` edit; his rule is loggers only when the diagnosis is uncertain. Same class as the upgrade row gate-over-demand. |
| A4 etanah | Env debugging still depends on infra for non-exception logs | His idea: surface probe lines client side. Limits found: crashed requests and background code never reach the browser; needs a probe build on an env server. |
| A5 sweep | ⏭ no sweep or file sweep ran this session | — |

**What worked**: replaying the REAL failing transcript through the hook before and after (old exit 0, new exit 2) — a fixture built from memory would not have shown that the edit turn carried no fix-intent word. Keep that as the first eval of any gate born from a slip.


## Session: auto-memory consolidation (2026-10-04, main checkout, no ticket)

| Axis | What the session showed (instance) |
|---|---|
| A1 agentic system | No fan-out; one lossless script did the merge. The memory index had grown to 26,697 bytes over a 24.4 KB read limit because every correction became a new memory file with no inventory check (196 files; 12 on disk were not even indexed). system-design and system-rules were loaded only after miya's correction, not before the first design step. |
| A2 quest workflow | Not a quest. Finding for the workflow: 48 memory files are named by hooks, skills, libraries or boot files, so quest rules were reachable only through a truncated index. 7 skills now point at their own memory file. |
| A3 debugging | The pre-merge check was a filename search over tracked files in one spelling, with no evals run. The full regression (530 spellings, tracked + untracked, 9 referrer evals) ran only after miya asked. Result was clean (0 live breaks, 6 doc mentions repointed), but the order was wrong. |
| A4 etanah issue-solving | ⏭ no etanah work this session. |
| A5 sweep / file sweep | The memory folder sweep found 2 OneDrive conflict copies, 1 index line with no file ever in git, and 2 stale-vs-current contradictions (Task folder notes txt; "mlit primary"). At DE, a marker sweep found 4 files committed with unresolved merge markers by a concurrent session merge (c1a9d5dd). |

Failure classes: (1) memory-instead-of-workflow · (2) no-regression-before-change · (3) committed merge markers from two sessions saving in one checkout (found and repaired, not mine).

Evals of the 7 edited skills, run at this DE: deploy 52/52 + 5/5 · bpmn-check.eval 2/2 · bpmn-check eval.js 10 pass 1 fail · list-redmine 16/17 · adhoc-save-audit 19/24. The three non-green ones were already failing or quarantined in the 2026-10-03 battery (audit briefing, NOT WORKING block), before this session's edits.

### Does Domain Expansion cover a one-off system improvement? (audit asked by miya)

| DE step | Covers a one-off system change? | Evidence this session |
|---|---|---|
| 2 session recap | Yes | block written in main/current-session.md |
| 2c save every quest | No, quest-only | a system change has no qa_doc; its only record is the session block and the diary |
| 4 diary | Yes | Session 6 written |
| 7 gap sweep | Partly | the knowledge table has no row for a MemoryCore system change |
| 7.4 audit briefing | Partly | it reports hooks, evals, slips; it does not check that a file changed this session has a watch row, or that a deleted file is still named somewhere |
| 7.5 improvement sweep | Yes | A1 row above |
| 9-10 manifest + commit | Yes | every changed path is committed, authorship is not a filter |
| 12 verify Checklist D | Partly | it checks DE steps fired, not that the change itself was regression-tested |
| 12.5 meta-audit | Partly | the feature census covers domain/ Features only; a skill-text edit or a memory merge is not a Feature and is not listed; the cross-reference check covers system/INDEX.md links only, not memory file names cited by hooks and skills |
| change watch | No | the 7 skill edits and the index rewrite got no watch row until added by hand at this DE; only .claude/CLAUDE.md has an automatic watch pipeline |

Verdict: DE records a one-off system change (session, diary, commit) but does not verify it. Three holes: no regression evidence required for a system file changed this session; no automatic watch row for a changed skill or memory index; no check for committed merge markers.

## DE 17:40 — #282555 close-out session (resumed from 2026-09-30)

| Axis | Claim | Instance |
|---|---|---|
| A1 agentic system | A branch with built gates sat unmerged 4 days and nothing surfaced it | `claude/ticket-282555-ab97c6` (5 commits, incl. redmine-write-gate v1.4) was not on main from 2026-09-30 to 2026-10-04; the stranded-branch surfacer `worktree-cleanup-boot` errored 76 of 76 boots in the same window (audit briefing 2026-10-04) |
| A1 agentic system | Rule 1 "link what is related" has no mechanical check | 3 of 4 Redmine writers lacked a pointer to the voice or root-cause memory until a hand audit on 2026-09-30 |
| A2 quest workflow | A session that ends without Domain Expansion leaves a Phase-1-closed quest half closed | QA-282555 stayed `closed` in active.txt for 3 days after Redmine went Closed on 2026-10-01 |
| A3 debugging | ⏭ no debugging this session (alter + close-out only) | — |
| A4 etanah issue-solving | An alter ask is settled by 3 reads; the form code read was optional | the Alter page's Next Possible Flows already listed Jabatan Teknikal 3 for PJTLT (miya's screenshot 2026-09-30) |
| A5 sweep | ⏭ no sweep this session | — |

## Addendum — gate false-positive session (2026-09-25 → 10-04)

- **A1 agentic system**: a session can sit open 9 days with no Domain Expansion (this one: fix pushed 25 Sep, closed 4 Oct). Nothing was stranded this time because the commits were pushed the same day, but the session recap and diary were missing until today. Second instance today (#282555 branch unmerged 4 days).
- **A1**: `RecursiveLoopDetector` fired 5 false alarms on five different README edits in this session; audit shows 0 blocks in 7 days for 3750 s.
- A2 ⏭ no quest worked · A3 ⏭ no debugging beyond the gate · A4 ⏭ no etanah issue · A5 ⏭ no sweep.

## Addendum — session #282198 close-out (17:45)

| Axis | Assessment (instance) | Proposal |
|---|---|---|
| A1 agentic system | `worktree-cleanup-boot` errored 85 of 85 fires in 7 days (audit briefing). Quest scripts take paths from the current folder: `quest/archive-quest.js --dry-run` from a worktree targeted the worktree's `projects` folder. | Fix the boot hook error; scripts resolve the main root. Eval: 0 errors in 7-day telemetry; dry run from a worktree prints the main path. |
| A2 quest workflow | "Is it closed on Redmine" had no defined answer: #282198 was Ready in PROD, the reconcile had already set local closed. | close-phase Step 0 names which Redmine statuses allow Phase 2. Eval: Ready in PROD / Closed / Verified map to a fixed allow or ask verdict. |
| A3 debugging | ⏭ no debugging in this session (document patch only). | — |
| A4 etanah issue-solving | Banked directly: after a DMS replace, `saiz_fail_byte` keeps the old size; download arrives as `.main.zip`. | ⏭ already in the skill, no proposal. |
| A5 sweep | ⏭ no sweep run in this session. | — |

## Session: #282061 follow-ups + Phase 2 close (2026-09-30 → 10-04)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic | A rule written in a worktree whose git link was later pruned never reached main; nothing flagged it for 4 days. The base-repo edit guard then blocked the salvage from the same session. | script-check rule 9, written 09-30, absent on main 10-04; spawn task_054d57fa |
| A1 agentic | Smart App Control blocked every DB connector for hours; scripts were handed over checked against a schema dump only. | OSError 22, 10:42 on 09-30; 282061.sql stamped only after the connector came back |
| A2 quest | A PROD script changed a permohonan the BA never named and the Redmine note did not say so. The BA found out through her own questions. | swap /5 ↔ /1, note point 5; dropped after "did they approve us switching?" |
| A3 debugging | A list query used a value-format filter seen in one env. | `LIKE 'C__/____/%'`: stg 17, mlit 31, et_main_dev 1 |
| A4 etanah | One caller grep + the skrin mount list answered "is it only that tugasan?" and "is OPPTPB included?" in minutes once written down. | saveNoPermitLesen callers × ind_langkah skrin 338 |
| A5 sweep | ⏭ no sweep this session | — |

Proposals logged: A1 unmerged-worktree-edit check at DE · A2 pass note names every permohonan a script changes (bounty) · A3 two-env run stamp for handed-over SQL.

## Session gitlab-migration-check (ADHOC-GIT-2026-1), 17:55

| Axis | Assessment | Instance |
|---|---|---|
| A1 agentic system | A session's worktree can lose its git link while idle; nothing says so until a git command fails. Proposal logged (worktree-link check). | `gitlab-migration-check-57dc32`: `fatal: not a git repository` on every git call at Domain Expansion |
| A2 quest workflow | Adhoc save-set works for a non-etanah adhoc, but resume-readiness needs a permohonan, a code file and a build step that such an adhoc does not have. Filled with explicit "none" lines. | ADHOC-GIT-2026-1: 3 gaps, then ready |
| A3 debugging | ⏭ one live test per key settled it; nothing to improve | `ssh -T` with each key |
| A4 etanah issue-solving | ⏭ no etanah issue this session | |
| A5 sweep | ⏭ no sweep this session | |

## Addendum — session #256334 status check (opened 2026-09-25, closed 2026-10-04)
- A1 agentic system: this session's Edit tool stayed pinned to a worktree whose git record was already pruned, so every save to main was refused and went through a script. Proposal logged (A1): at DE step 0b, if `git -C <worktree> rev-parse` fails, say so in one line and route saves through a script from the start. Eval case: a worktree dir with no `.git/worktrees/<name>` → step 0b prints DEAD WORKTREE.
- A2 quest workflow: "check Redmine, archive if closed" found the quest already archived 5 days earlier. `lib/save-quest.js` (new today) covers the open case; it has no line for "already archived, Redmine agrees". Proposal logged (A2): save-quest prints ALREADY ARCHIVED + the 3 disk checks. Eval case: archived block + Redmine Closed → verdict line, exit 0, no writes.
- A3 debugging: on 25 Sep the cause was read from the deployed model in the flowable DB in 4 queries, not from the banked file (which was one version old). Worked; keep.
- A4 etanah: cross-module sub-flow lessons are already banked (FLOWABLE-KNOWLEDGE §13). Nothing new.
- A5 ⏭ no sweep ran.

## Session "quest 280540 data update" (2026-09-29 → 2026-10-04) — improvement sweep

| Axis | Assessment (concrete instance) | Idea logged |
|---|---|---|
| A1 agentic system | `quest/archive-quest.eval.js` is listed as quarantined (REPAIR-QUEUED) but ran 9/9 on 2026-09-30 after the lazy `lib/task-folder` require in `active-cli.js` | re-run the battery and lift the quarantine |
| A2 quest workflow | A reopened quest left two blocks (one archived, one live); `archive-quest.js` stopped at Step 3 and the merge was done by hand | fold the old block into the live one before archiving |
| A3 debugging | The 24/09 evidence script showed one of three columns the code reads; another team drew the wrong conclusion from it | evidence script lists every column in read order (built as a memory rule today) |
| A4 etanah issue-solving | Row Per was empty on 22/09 because the maintenance page never saved it; we added a header fallback and told nobody until BA raised it on 25/09 | advisory when a fix adds a fallback for an empty column another module writes |
| A5 sweep / file sweep | 16 empty Rework folders, 67 blank notes and 102 stale project folders built up unseen for months | a counted folder-audit line at DE |

## Session "#256334 Phase 2 re-run" (17:25 → 17:45)
| Axis | Claim | Instance |
|---|---|---|
| A1 | a spawned side-build can vanish with no alarm | submit-path gate queued 2026-09-30, `domain/submit-path-gate/` absent on main 2026-10-04. Proposal logged |
| A2 | a re-sync after archive re-downloads videos into the archived folder | redmine-sync 256334 pulled 5 mp4 into Archive; `archive-quest.js --sweep-videos` removed them |
| A3 | a UI-only edit shipped without the submit path read | `d3128ad449` broke TKPDBB Hantar; fixed `072115f762` with the TKJKKLPK analog. Proposal A3 re-logged |
| A4 | pattern banked | BUG-BESTIARY "no document mode on MlkSuratTemplateForm" |
| A5 | ⏭ no sweep work this session | |
