symptom: 2026-11-13 miya: "I want to learn, please create a new Feature for our system to explain as in someone that doesn't understand anything about etanah system ... explain in layers starting with the overview then go one layer and another layer to the question asked"
goal: miya understands any etanah urusan, tugasan, feature or ticket issue from zero, reading layer by layer from the overview down to exactly the depth his question needs, with every fact sourced
goal_signal: the lesson reply prints TEACH: PASS from teach.js audit on the saved lesson file
goal_signal_regex: TEACH: PASS
retention: keep
footprint: on-demand: no process at boot or per prompt; one node call under 0.2 s per lesson audit
self_audit: every lesson ends with `node domain/etanah-teach/teach.js audit <lesson> --to L<n>` (exit 0 PASS / 1 FAIL, a log row each run); a FAIL names the layer, the layer is fixed and the audit re-run before the reply
diagram: domain/etanah-teach/diagram.html + diagram.png
boundary: covers etanah-knowledge files, requirement index, BPMN, qa_docs and read-only DB or code checks for the question, and the lesson file etanah-knowledge/<state>/learn/<URUSAN>.md · never edits etanah code, never writes a DB, never posts to Redmine or WhatsApp, never states an unverified fact as fact · stops at the lesson shown to him with the layer reached and the next layer he can ask for
replaces: none: miya asked for a new Feature ("please create a new Feature for our system to explain ... Please proceed", 2026-11-13); brief, kowalski and explain-diagram stay, each does a different job
state-scoped: yes, keyed by --state (default melaka); lessons live in etanah-knowledge/<state>/learn/, so a Penang or Terengganu lesson gets its own folder

# etanah-teach — learn etanah from zero, one layer at a time

He asks to understand something (an urusan, a tugasan, a rule, an adhoc). The lesson starts at the overview (L0, what eTanah is) and goes down one layer at a time, stopping at the layer the question needs. Every layer is one plain sentence, one table or picture, and its source. Each lesson is saved per urusan, so the next question about the same urusan starts from what is already written.

## Pieces

| Piece | Role |
|---|---|
| `.claude/skills/etanah-teach/SKILL.md` | the procedure: the layer ladder L0 to L5, the stop layer, the five steps, the lesson file shape |
| `teach.js sources <URUSAN> [--state s]` | Tool: the saved lesson's layers and checked dates, then the knowledge files for each layer (ok / NO) |
| `teach.js audit <lesson> [--to Ln]` | self-audit: ladder in order with no gap, each layer opens with a plain sentence, has a table or picture, a `source:` and a `checked:` date, reaches the stop layer |
| `teach.eval.js` | 29 fixtures (the 20+ scenarios below), sandboxed, the real log untouched |
| `log.jsonl` | one row per run: ts · cmd · outcome · goal_met · dur_ms |
| `diagram.html` / `diagram.png` | the flow and the layer ladder |
| lessons | `projects/coding-projects/active/etanah-knowledge/<state>/learn/<URUSAN>.md` (untracked, confidential, like the rest of etanah-knowledge) |

## Inventory (why a new part)

| Existing part | What it does | Why it is not this |
|---|---|---|
| `brief` | orients him at the start of work on one ticket | ticket-scoped, assumes he knows etanah |
| `kowalski` | code architecture as two diagrams | starts at code, the layer this Feature reaches last |
| `explain-diagram` | draws one picture | a drawing tool; etanah-teach calls it |
| etanah-knowledge | the facts | memory, not a lesson; etanah-teach reads it first and writes new facts back |

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | lesson stops short of the layer asked | fixture-added S3 |
| 2 | gap in the ladder | fixture-added S4 |
| 3 | layers out of order | fixture-added S5 |
| 4 | layer opens with a table | fixture-added S6 |
| 5 | layer opens with code | fixture-added S7 |
| 6 | layer opens with a file:line | fixture-added S8 |
| 7 | layer with no source | fixture-added S9, S10 |
| 8 | prose-only layer | fixture-added S11 |
| 9 | a picture instead of a table | fixture-added S12 (allowed) |
| 10 | no checked date, so staleness unknown | fixture-added S13 |
| 11 | TODO left in a lesson | fixture-added S14 |
| 12 | missing title, state or questions table | fixture-added S15-S17 |
| 13 | empty file | fixture-added S18 |
| 14 | Windows CRLF file | fixture-added S19 |
| 15 | a list as the first line | fixture-added S20 |
| 16 | a notes section between layers | fixture-added S21 |
| 17 | unreadable lesson path | fixture-added S24 |
| 18 | hostile urusan code in `sources` | fixture-added S26 |
| 19 | run from a session folder where etanah-knowledge is absent (untracked) | handled: falls back to the main checkout; S27 covers the folder lookup |
| 20 | a state with no knowledge folder | fixture-added S28 |
| 21 | eval rows polluting the monitoring log | handled: `TEACH_LOG` sandbox, S29 |
| 22 | a stale saved layer contradicting today's code (e.g. a rule changed by a later fix) | handled: `checked:` date + the skill re-checks a layer older than 30 days or contradicted by the question |
| 23 | an unverified fact written as fact | accepted-risk: judgment; the audit cannot read meaning; the skill bans it and every layer needs a `source:` |
| 24 | he asks a fix question, not a learning one | handled: the trigger is learn or understand; fixes stay with quest and adhoc |
| 25 | the lesson grows too long over many questions | accepted-risk: each layer stays one sentence plus one table; the questions table records what was asked |
