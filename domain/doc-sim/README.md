symptom: 2026-10-05 QA-244600 BA failed the fix: first Kemaskini with no edit still added a versi; the falsifier was written and never run because it needed JBoss and a freshly filled paper
goal: every document-ticket claim about a fill result or a Word save is backed by one offline run before it reaches miya or BA
goal_signal: the quest doc or the reply carries a DOC-SIM line with the permohonan, the template and the verdict
goal_signal_regex: DOC-SIM:
retention: rotate monthly
footprint: on-demand: 1 java process about 1.1 to 2 GB (heap cap 2 GB) for 1.5 to 2 minutes per cold run; with --warm ONE shared JVM, about 1.1 GB, stays up to 15 idle minutes then stops itself (tg.ps1 stop ends it now); 1 Word process for the save step; 0 processes when not used
state-scoped: yes, keyed by `--jboss` (the JBoss home supplies the WAR, the jars and the `etanahDS` schema). Default is the Melaka pelupusan JBoss `E:\Dev\jboss-7.4-plp-melaka`. A second state passes its own JBoss home; the tool reads `template/MLK` through the app's own NegeriConfig, so no state literal lives in this folder besides that default.

# doc-sim — make the document offline, before anyone tests

**Why (miya 2026-10-05/06, #244600)**: a document fix was sent to BA on a compare that had never met a freshly filled paper. The check needed JBoss, a login and the right permohonan, so it was not run. This Feature makes that check one command.

## Pieces

| Piece | Role |
|---|---|
| `.claude/skills/doc-sim/SKILL.md` | The invokable skill `/doc-sim`: commands, the four quest points, what it never covers |
| `doc-sim.js` | Runner. Checks arguments, refuses a non-test schema, calls the tool, prints the `DOC-SIM:` line, writes one log row (in the MAIN checkout, also when run from a worktree) |
| `doc-sim.eval.js` | 52 fixtures: guards, command mapping, summary line, chain and warm summary, log location, real spawn through a stub tool, skill text, quest rows |
| `log.jsonl` | One row per real run, written by `doc-sim.js` (`via: doc-sim.js`) or, when `tg.ps1` is called directly, by `tg.ps1` (`via: tg.ps1`): mode, permohonan, steps, warm, boot ms, fill ms, images, total ms, exit. Gitignored; only the main checkout's copy is used |
| `E:\Dev\scripts\EtanahTemplateGen\` | The tool (Java + PowerShell). Outside this repo because it compiles against the local WAR |

No hook. Awareness comes from rows in `.claude/skills/quest/SKILL.md`, which the ticket gate loads on every ticket.

## Trigger moment

A quest phase on a document ticket, or miya typing `/doc-sim`. Nothing runs at boot or per prompt.

## Out-of-spec scenarios considered

| # | Scenario | Verdict |
|---|---|---|
| 1 | No arguments | fixture F1 |
| 2 | `gen` with no permohonan | fixture F2 |
| 3 | Hostile text as permohonan (quotes, SQL) | fixture F3 |
| 4 | Unknown mode word | fixture F4 |
| 5 | `--template-dir` that does not exist | fixture F5 |
| 6 | `compare` with one file | fixture F6 |
| 7 | Local datasource points at a live schema | fixture F7, refused |
| 8 | `--allow-schema` given for a different schema name | fixture F8, still refused |
| 9 | `standalone.xml` has no `etanahDS` | fixture F9 |
| 10 | JBoss home missing (another machine) | fixture F10 |
| 11 | Tool folder missing (another machine) | fixture F13, exit 4 names the path |
| 12 | Dry run must not log | fixture F12 |
| 13 | An old `DOC-SIM:` line pasted inside the tool output | fixture F18, one line only |
| 14 | The word TIMEOUT in the tool's own note line | fixture F16, not counted |
| 15 | Summary leaking document text | fixture F17, no quoted text |
| 16 | Empty tool output | fixture F21 |
| 17 | Tool exits non-zero mid-run | fixture F25, line says FAILED, runner exits 1 |
| 18 | Tool path with a space | fixture F26 |
| 19 | No template picked (syor not saved yet) | handled: `[config]` prints each `needs x=[..](now y)`; summary says `no template picked` |
| 20 | Deployed WAR is not the branch under test | handled 2026-10-22: `--java-src` compiles the changed files against the WAR and puts them ahead of it; accepted-risk: a changed file that needs other changed classes the WAR lacks must be listed too (or an adapted copy, as for QA-285871) |
| 21 | Compare code refactored into another class | handled: the build looks in `PelupusanWordLogUtil.java` then `BasePelupusanDokumenForm.java`, fails loudly if neither has it |
| 22 | VPN down, database unreachable | accepted-risk: the Java run fails, runner reports FAILED with the exit code |
| 23 | Word not installed or a Word dialog blocks | accepted-risk: `gen` still works; `repro` fails at the save step and reports FAILED |
| 24 | Two runs at once | handled: each run writes its own `out\<timestamp>` folder; log rows are appended whole |
| 25 | A write attempted by application code during the fill | handled: every connection opens read-only, the write throws and is printed |
| 26 | Filled RAHSIA files left on disk | accepted-risk: skill says delete `out\` at quest close; no automatic delete, since the file is the evidence during the quest |
| 27 | Quest skill row removed later | fixture F30 fails |
| 28 | Run inside a worktree | handled: runner paths come from `__dirname` and absolute tool paths |

## 2026-10-22 upgrade: chain, warm JVM, changed classes, run log

symptom: 2026-10-22 QA-285871: checking four signing flows took about an hour; every `tg.ps1 gen` per tugasan step booted Spring again (logged 38-121 s) while the fill was about 5 s; an undeployed Java fix needed a hand-built shadow class folder (`javac @javac6.args`); the runs called `tg.ps1` directly, so `log.jsonl` stayed empty
goal: a multi-step document check takes minutes, with the same output, and every run leaves a timed log row
goal_signal: a log row with `steps` or `warm_hit`, and a later step's `ms` under 30000
retention: rotate monthly (same log)

Measured on the QA-285871 3sign flow (stg1, read-only, 4 steps + 1 edit, same outputs by `doc-sim.js compare`):

| Run | Wall time |
|---|---|
| before: one cold `gen` per step (original tool) | 486 s |
| after, warm JVM, JVM started by step 1 | 139 s |
| after, warm JVM already up | 57 s |
| after, `chain` (4 steps, one boot, no edit step) | 119 s |

Requirements (proposals in `system/slips.jsonl` + the 2026-10-22 brief):

| Requirement | Where found | Encoded in |
|---|---|---|
| chain mode, one boot; PLPS/2026/1 steps 2757501:CREATE,2757934:SEMAK,2761973:SEMAK,2764770:PERAKU gives 3 signature images | slips.jsonl proposal A3 2026-10-20 | `tg.ps1 chain -Steps`, `Gen.chain()`; live run: images 0, 1, 2, 3 |
| warm JVM, second run under 30 s, stops after idle | slips.jsonl proposal A3 2026-10-06 | `tg.ps1 -Warm`, `Warm.java`; live: 12 to 15 s per warm step, idle stop seen at 60 s |
| `--classes-dir` for an undeployed populator fix | slips.jsonl proposal A2 2026-10-06 | `-ClassesDir` and `-JavaSrc` (compiles the files itself); live: SAME as the hand-built shadow on 4 steps, CHANGED without it |
| run each step with the real Selesai `-Action` | slips.jsonl proposal A2 2026-10-20 | `--action` and the step's action in `--steps`; skill text |
| measured audit, not estimates | brief | `[time]` line per run, slowest beans, DB connections |
| footprint declared (system-rules Rule 7) | brief | `footprint:` line above; warm is opt-in |
| a run log so the Tool is observable | brief, census gap | `tg.ps1` row for direct runs, `doc-sim.js` row otherwise |

Out-of-spec scenarios for the upgrade:

| # | Scenario | Verdict |
|---|---|---|
| 29 | Malformed step list: no action, `;rm`, letters as id, empty item, a path with a colon | fixture F37 |
| 30 | `--steps` on `gen`, or `chain` without `--steps` | fixtures F35, F36 |
| 31 | A chain step makes 0 or 2 documents | handled: the run stops and says to pass `-Dokumen` and `-Template` |
| 32 | Class path, changed classes, template folder, `standalone.xml` or the deployed WAR changed while a JVM is warm | handled: the key differs, the JVM is restarted (seen live when another session switched branch) |
| 33 | Another local program connects to the warm JVM | handled: token needed; a wrong token gets `TG-END 9` and nothing runs (smoke-tested) |
| 34 | Warm JVM forgotten | handled: stops after `-IdleMin` (15) idle minutes, removes `server.json` (smoke-tested with 1 minute) |
| 35 | Warm JVM killed or crashed | handled: a dead pid is detected, the stale `server.json` removed, a new JVM started |
| 36 | Two sessions use the warm JVM at once | handled: one run at a time; the second waits for the first |
| 37 | Two cold runs at once | handled: java and javac argument files are per process (were one shared file) |
| 38 | `doc-sim.js` waits for the long-lived JVM | handled: the JVM is started through WMI and holds none of the caller's pipes (live) |
| 39 | Database rows change while the JVM is warm | handled: entity cache and EntityManager cleared per run; accepted-risk: the app's own static caches stay, as on the real server; `tg.ps1 stop` resets |
| 40 | A `-JavaSrc` file changes under us (another session switches branch) | handled: content hash, recompile, JVM restart; accepted-risk: the run uses what the checkout holds at that moment, so name a stable copy or a worktree |
| 41 | `-JavaSrc` does not compile | handled: javac errors printed, run fails, log row has exit 1 and the error |
| 42 | `-JavaSrc` or `--input` file missing | fixtures F46, F47 |
| 43 | Tool rebuilt while another session's run is mid-way | accepted-risk: the build empties `build\classes`; it happens only after a tool source change; check `Get-Process java` first |
| 44 | Laptop low on RAM (15.4 GB, about 1 GB free seen 2026-10-22) | accepted-risk: warm is opt-in, short idle time, `tg.ps1 stop` frees about 1.1 GB at once |
| 45 | `server.json` read while half written | handled: written to a temp file, then moved in one step |
| 46 | The port is taken | handled: port 0, the system picks a free one |
| 47 | Log folder missing (another machine) | handled: the row goes to the tool folder `runs.jsonl` |
| 48 | A run through `doc-sim.js` logged twice | fixture F43 |
| 49 | A worktree copy of `doc-sim.js` writes its own log | fixture F44 |
| 50 | An unknown short action word (e.g. LULUS) | accepted-risk: becomes `STATUS_PENYEDIAAN_LULUS`; the fill prints NOT generated when the template has no such action |
| 51 | The fill throws inside the warm JVM | handled: the stack trace goes back to the caller, code 1, the JVM keeps serving |
| 52 | An outer block counts the image of a signature tag inside it | handled: `[tags]` counts a tag's own image only (live: 0, 1, 2, 3, the same as the ticket's own check) |
| 53 | Remote cache or DB calls of the app make a warm step slow | accepted-risk: about 9 to 10 s per step is the app's own `PelupusanTemplateReportMethodParameter` (DB and HTTP cache calls); it is the real system's work, so it stays |

## Rollback

See `NUKE-MARKER.md`.
