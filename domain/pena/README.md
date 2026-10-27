symptom: 2026-10-08 #279554 miya: 'Have you built like a Feature for you to learn my writing style? Where you log the sentences I changed, what are the keywords I used' after five rounds of corrections on one Redmine note
goal: text written in miya's name follows the named style modules of its surface, and every sentence he changes becomes a stored example the next draft is checked against
goal_signal: the reply that carries a draft in his name also carries a PENA line naming the profile and the check result
goal_signal_regex: PENA: (profile|modules)=
retention: keep
footprint: on-demand: 1 node process under 1 second per show, add or check; nothing at boot, per prompt or per session
state-scoped: no, state-agnostic (his writing style is the same for every state; a profile names a kind of text, not a state)

# Pena — miya's writing style, as named modules

**Why (miya 2026-10-08, #279554)**: his style lived in one memory file of pasted notes. Nothing split it into parts, nothing checked a draft against it, and nothing recorded what his style words meant. One mapping note took five correction rounds.

## Pieces

| Piece | Role |
|---|---|
| `.claude/skills/pena/SKILL.md` | The invokable skill `/pena`: the modules, the profiles, the steps |
| `lib/pena.js` | The engine: `list` · `show` · `check` · `add` · `keyword` · `analyze` |
| `modules.json` | MEMORY: each style module, what it means, its rules, its banned list, how it is checked |
| `profiles.json` | MEMORY: each kind of text and the modules it uses, with pointers to the memories that hold the stored note shapes |
| `corpus.jsonl` | MEMORY: every sentence miya changed (mine, his, his own words, ticket, module). Append-only |
| `keywords.jsonl` | MEMORY: his style words and what each one meant in the text he accepted. Append-only |
| `pena.eval.js` (+ `eval.js` entry) | 40 fixtures: the #279554 replay, every module check, out-of-spec inputs, memory commands, the skill and quest rows |
| `log.jsonl` | One row per run: command, profile, modules, findings per module, outcome |

No hook. Awareness comes from the skill description and from pointer lines in the skills that write text in his name.

## Trigger moment

The step that drafts text in miya's name, and the turn he changes a sentence. Nothing runs at boot or per prompt.

## Who points to Pena

| Caller | Profile |
|---|---|
| `.claude/skills/quest/SKILL.md` § Hand-over to BA | `redmine-ba-pass` · `redmine-dev-mapping` · `redmine-rootcause` |

Owed (not wired this session): `.claude/skills/deploy/SKILL.md` 6b · `.claude/skills/redmine-phase1-prefill/SKILL.md` · the infra hand-off memory · `.claude/skills/adhoc-save/SKILL.md`.

## Requirements (where each one was found, where it is encoded)

| Requirement | Found | Encoded |
|---|---|---|
| Log the sentences he changed | his message 2026-10-08 | `corpus.jsonl` + `pena.js add` · eval 29-30 |
| Record his style words and what he meant | his message 2026-10-08 | `keywords.jsonl` + `pena.js keyword` · eval 32, 34 |
| Own memory | his message | the four data files in this folder |
| Engine that analyses and refines | his message | `pena.js analyze` (repeats per module, keyword with two meanings) · eval 34 |
| Skill other Features invoke | his message | `.claude/skills/pena/SKILL.md` · eval 39-40 |
| Modular, each style named and explained | his message "Make it modular and clear what each style means" | `modules.json` `means` · `pena.js list` / `show` · eval 38 |
| A caller picks which modules, or all | his message | `--profile` and `--module a,b` · eval 9-19, 33 |
| Use the slip log | his message | corpus rows c6 and keyword rows carry the slip dates as evidence |
| Use what he asked to be saved before | his message; `main/todo.md` Audit row 2026-07-17 (speech) | corpus rows c1-c9 seeded from the speech collection |
| Short sentences, statements, one fact per sentence | slips 2026-09-30 | `line` |
| Related sentences share a line, at most 2 | his message 2026-10-08 | `line` · eval 9-10 |
| Tables preferred | his message 2026-10-08 | `table` · eval 5 |
| Scripts apart from the mapping | his message 2026-10-08 | `separate` · eval 6 |
| Script layout and asked columns | his messages 2026-10-08 | `script` · eval 7-8, 13 |
| Nothing unsubstantiated | his message 2026-10-08 | `proven` (by hand) · eval 3 |

## Out-of-spec scenarios considered

| # | Scenario | Verdict |
|---|---|---|
| 1 | A pasted `PENA: ... 0 finding(s)` line inside the draft | fixture-added (24) |
| 2 | Unknown profile name | fixture-added (20) |
| 3 | No draft given | fixture-added (21) |
| 4 | Empty or whitespace draft | fixture-added (22) |
| 5 | Draft file path does not exist | fixture-added (23) |
| 6 | `modules.json` is broken JSON | fixture-added (27) |
| 7 | A broken row in `corpus.jsonl` | fixture-added (28) |
| 8 | "No. Permit" read as a sentence end | fixture-added (10) |
| 9 | A clock time read as a line number | fixture-added (15) |
| 10 | The words select / from in a normal sentence | fixture-added (25) |
| 11 | A subquery on one line inside a WHERE clause | fixture-added (1, the accepted note) |
| 12 | The same changed sentence stored twice | fixture-added (30) |
| 13 | `add` with a module that does not exist | fixture-added (31) |
| 14 | A table with no header row | fixture-added (26) |
| 15 | One style word with two different meanings | fixture-added (34) |
| 16 | No command at all | fixture-added (36) |
| 17 | A profile that names a module removed from `modules.json` | fixture-added (37) |
| 18 | The engine run from a worktree while hooks run from the main checkout | handled: the engine resolves its data from its own file location, not from an env var |
| 19 | Two sessions appending to `corpus.jsonl` at once | accepted-risk: single-line appends; a torn row is skipped on read (scenario 7) |
| 20 | An infra script checked with the `script` module (infra scripts ARE schema-qualified) | handled: the `infra-handoff` profile does not include `script`; its pointer names the infra memory |
| 21 | The check is clean but the content is wrong | accepted-risk: stated in the skill Limits; `proven` stays a by-hand question |
| 22 | The memory file `feedback_ticket_writing_style.md` and `modules.json` drift apart | accepted-risk for now: profiles point to the memory for note shapes; folding the memory into Pena needs miya's ruling |
| 23 | miya changes a sentence and nobody runs `add` | accepted-risk: no hook this version; the skill description triggers on his phrases. `analyze` shows the gap as zero new rows |
| 24 | Markdown table in a non-Redmine draft flagged for a missing Textile header | accepted-risk: `table` is only in the Redmine mapping profile |
| 25 | A long but fine English sentence containing "so" | handled: only flagged above 18 words |

## Known limits

- The check reads shape only.
- `proven` and `hint` are questions, not checks.
- Wiring into the deploy, prefill, adhoc and infra steps is owed.

## Changed 2026-10-13 (#284544): self-audit scan on module `proven`

miya: "always add an audit for your self when preparing that redmine note handover. What do you mean only sometimes, that happened quite often."
What changed: `proven` keeps its by-hand question and also runs the script check `vague` (key `also` in modules.json). The by-hand question gained the self-audit line. Skill step 4b added.
Spec kept: `proven` is still never auto-passed (fixture 03, 44); every other module, the profiles and the PENA line are untouched. Nothing dropped.
Eval: 46/46 (fixtures 41 to 46 new).

| # | Scenario outside the spec | Verdict |
|---|---|---|
| 1 | "sometimes" where the count exists (the founding case) | fixture 41 |
| 2 | "uncontrolled factors", factor not named | fixture 42 |
| 3 | Malay "kadang-kadang" | fixture 43 |
| 4 | a counted sentence | fixture 44, passes |
| 5 | modules chosen without `proven` | fixture 45, no scan |
| 6 | "something", "someone" | fixture 46, not flagged |
| 7 | upper case "SOMETIMES" | handled, case-insensitive |
| 8 | the word inside a table row | accepted-risk: tables carry data, prose only is scanned |
| 9 | the word inside a script block | handled, not prose |
| 10 | the word inside a sentence quoted from the BA | accepted-risk: flagged, the by-hand look decides |
| 11 | "some cases" where nothing was counted | handled: flagged, the note says the count or the sentence goes to miya as not counted |
| 12 | "often", "usually", "most" | accepted-risk: not flagged, the by-hand question asks it |
| 13 | a number is given but it is the wrong number | accepted-risk: a script cannot know, by-hand |
| 14 | a cause is named but it is the wrong cause | accepted-risk: by-hand |
| 15 | a profile without `proven` (junior-handover) | accepted-risk: that text is hints, no rule sentences |
| 16 | an older modules.json with no `also` key | handled: scan off, no crash |
| 17 | `also` names a check that does not exist | handled: skipped, no crash |
| 18 | an empty draft | handled: exit 2 as before |
| 19 | two vague words on one line | handled: one finding for the line |
| 20 | "rarely" in an infra note | handled: infra-handoff carries `proven` |
| 21 | the finding is cleared by deleting the sentence | accepted-risk: the note then says less; by-hand |

*2026-10-27 per miya (#285768): greet closing becomes a judgement among five forms (Thank you. default · Thank you very much. large ticket · Thank you <name>. · Thanks. · Terima kasih.), grounded in 134 of his Redmine closings; the greet check accepts all five; ticket-close-block.js gains --closing. Spec change named: the 2026-10-09 #283960 rule 'BA pass note closes with exactly Thank you.' is retired by his new instruction. Kept: Salam + short name, nothing after the closing. Eval 50/50.*
