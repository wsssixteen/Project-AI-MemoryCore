symptom: 2026-10-05 QA-244600 BA failed the fix: first Kemaskini with no edit still added a versi; the falsifier was written and never run because it needed JBoss and a freshly filled paper
goal: every document-ticket claim about a fill result or a Word save is backed by one offline run before it reaches miya or BA
goal_signal: the quest doc or the reply carries a DOC-SIM line with the permohonan, the template and the verdict
goal_signal_regex: DOC-SIM:
retention: rotate monthly
footprint: on-demand: 1 java process about 2 GB for 2 to 3 minutes, 1 Word process for the save step
state-scoped: yes, keyed by `--jboss` (the JBoss home supplies the WAR, the jars and the `etanahDS` schema). Default is the Melaka pelupusan JBoss `E:\Dev\jboss-7.4-plp-melaka`. A second state passes its own JBoss home; the tool reads `template/MLK` through the app's own NegeriConfig, so no state literal lives in this folder besides that default.

# doc-sim — make the document offline, before anyone tests

**Why (miya 2026-10-05/06, #244600)**: a document fix was sent to BA on a compare that had never met a freshly filled paper. The check needed JBoss, a login and the right permohonan, so it was not run. This Feature makes that check one command.

## Pieces

| Piece | Role |
|---|---|
| `.claude/skills/doc-sim/SKILL.md` | The invokable skill `/doc-sim`: commands, the four quest points, what it never covers |
| `doc-sim.js` | Runner. Checks arguments, refuses a non-test schema, calls the tool, prints the `DOC-SIM:` line, writes one log row |
| `doc-sim.eval.js` | 34 fixtures: guards, command mapping, summary line, real spawn through a stub tool, skill text, quest rows |
| `log.jsonl` | One row per real run: mode, permohonan, schema, templates, verdict, hidden errors, fill ms, total ms, exit |
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
| 20 | Deployed WAR is not the branch under test | accepted-risk: the tool prints the compare's git ref; the skill states a Java fix must be deployed first |
| 21 | Compare code refactored into another class | handled: the build looks in `PelupusanWordLogUtil.java` then `BasePelupusanDokumenForm.java`, fails loudly if neither has it |
| 22 | VPN down, database unreachable | accepted-risk: the Java run fails, runner reports FAILED with the exit code |
| 23 | Word not installed or a Word dialog blocks | accepted-risk: `gen` still works; `repro` fails at the save step and reports FAILED |
| 24 | Two runs at once | handled: each run writes its own `out\<timestamp>` folder; log rows are appended whole |
| 25 | A write attempted by application code during the fill | handled: every connection opens read-only, the write throws and is printed |
| 26 | Filled RAHSIA files left on disk | accepted-risk: skill says delete `out\` at quest close; no automatic delete, since the file is the evidence during the quest |
| 27 | Quest skill row removed later | fixture F30 fails |
| 28 | Run inside a worktree | handled: runner paths come from `__dirname` and absolute tool paths |

## Rollback

See `NUKE-MARKER.md`.
