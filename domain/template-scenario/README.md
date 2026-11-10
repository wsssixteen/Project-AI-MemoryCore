# template-scenario

symptom: 2026-11-04 miya: 287346 template shipped twice with requirement gaps my own audit listed; 288095 test data held a placeholder; he asked for a complete template test scenario step
goal: every template ticket hand-back carries a requirement checklist with every row done, every changed CC tag holding a real value across all config actions, every printed tag with a known source whose PROD-empty case printed a real value on paper, the BA's own test ID run, a word diff with 0 defects, and a green-highlighted generated paper
goal_signal: a TEMPLATE-SCENARIO: PASS line in the tool results of each template ticket before its hand-back
goal_signal_regex: TEMPLATE-SCENARIO: PASS
retention: keep
footprint: on-demand script only (no hook) runs doc-sim JVM 1-2 GB for 2-3 min, 1 python per helper call, one read-only PROD count per source column and one env read per empty case through the shared db-gateway (no new process)
boundary: (script) one ticket's checklist, doc-sim chain, CC values, tag sources (read-only SELECT counts on the state's PROD and env databases), word diff and green PDF · never edits the template, the qa_doc, tag-sources.json or any database, never posts to Redmine, never touches non-template hand-backs · stops at the TEMPLATE-SCENARIO line with each gap named
self_audit: the script ends by reading its own outputs back (the filled docx, the saved PDF's annotation count, every Find phrase located) and exits 1 with the gaps named; each run writes a log.jsonl row
diagram: domain/template-scenario/diagram.png
state-scoped: no; the script takes every path as an argument (requirement, template, config, Task folder), so any state's template runs through it

**What it is**: the quest step TEMPLATE-SCENARIO (row in `.claude/skills/quest/SKILL.md`). Every ticket that changes a generated Word document runs it before any hand-back (Test Scenario, Redmine handover, deploy card).

## The step (one command)

```
node domain/template-scenario/template-scenario.js --qa <num> --req "<requirement .docx>" --template "<edited template .docx>" --base "<template before the fix>" \
     --config "<template.config.json>" --permohonan "<id>" --steps "<a_tgsn>:CREATE,<a_tgsn>:SEMAK,<a_tgsn>:PERAKU" --dokumen <kod> \
     [--template-dir <dir>] [--classes-dir <dir>] --out "<Task 2. Fix folder>"   (or --filled <generated .docx> to skip doc-sim)
```

| # | Check | Fails when |
|---|---|---|
| 1 | `## Template checklist` in QA-<num>.md: one row per requirement docx comment, ticket Issue/Expected line, BA ask and earlier audit row (`| R | Source | Text | Status | Find |`) | a row is not `done` or `na: <reason>`; no section (the script prints seed rows from the requirement comments) |
| 2 | doc-sim chain covers every action the template.config.json block runs (CREATE, SEMAK, PERAKU) | a signature, name, Daerah or date tag would stay unfilled |
| 3 | every CC tag in a paragraph the fix changed holds a real value in the final paper | empty, `-`, `<placeholder>`, signature image under 1 KB; a `FIXED-DATA <tag>` row with `na: <reason>` accepts a staging data gap |
| 4 | word diff, requirement docx vs final paper (run-split words joined, auto-numbering dropped) | any DEFECT: a requirement word missing, moved or changed that is not CC data; `diff` rows accept requirement typos and placeholders |
| 5 | green highlight of every Find phrase, drawn into the page | a phrase not found, or any annotation left in the PDF |
| 6 | **tag sources** (2026-11-06): every text tag the paper prints has a source column (`tag-sources.json` for the state, or a `\| Sx \| SOURCE <tag> \| table.column \| done \|` row; `na: <reason>` when no single column); each column gets one read-only count on PROD for the urusan; a column with empty rows needs `--case "empty\|<permohonan>\|<filled .docx>" --env <mlit\|stg1\|stg2>` whose column is proved empty on that env and whose paper prints a real value; the BA's own test ID runs as `--case "ba\|<id>\|<filled .docx>"` | an unknown source · a PROD-empty column with no empty case (287346: luasDipohon 1718 of 3551 MCL) · the empty-case paper prints `-` · no BA case and no `--no-ba-id "<reason>"` · a PROD count that did not run (never a silent pass) · `EMPTY-OK <tag>` row accepts a blank that is the requirement |

Prints `TEMPLATE-SCENARIO: PASS|FAIL QA-<num> · checklist k/n · chain a/b · CC gaps · sources k/n known, PROD empty …, cases … · word diff defect/data/accepted · highlight <pdf> annots 0`.

Check 6 alone (no chain, no diff, no PDF): `node domain/template-scenario/template-scenario.js sources --qa <num> --filled <generated .docx> --permohonan <id> [--case …] [--env …]` prints `TAG-SOURCES: PASS|FAIL`. Run it from PowerShell, or set `MSYS_NO_PATHCONV=1` in Git Bash: Git Bash rewrites a `--case "empty|PTMLK/..."` argument into a Windows path (found 2026-11-06).

`tag-sources.json`: state-keyed map, tag → `{table, column, seen}` or `{none, seen}`; a tag is added only after reading its populator, with the line named in `seen`. A tag traced on a ticket is copied there in the same save, so the next ticket finds it.

## The Stop gate (retired 2026-11-10)

`template-scenario.check.hook.js` blocked a template hand-back with no `TEMPLATE-SCENARIO: PASS` in a tool result. Retired: 637 runs since birth, 23 blocks and 19 bypasses (45% of its decisions were the bypass token, 3 sessions). The quest SKILL.md row still requires the step; nothing blocks a hand-back that skips it.

## Red boxes (miya 2026-11-05)

Screenshots use `domain/fix-photo/mark.py`, which now refuses boxes that overlap or sit inside each other (`--merge` draws their union) and draws label backgrounds without a red frame: specific boxes, one per change, never nested, never overlapping.

**Layer choice (Rule 7)**: script plus the quest SKILL.md row. The advisory `template-cc-preflight` hook was retired by this Feature (its `preflight.js` tag lister stays).

**Trigger moment (Rule 8)**: run by hand at the template step of a quest.

**Observability**: `log.jsonl` one row per script run: ts · qa · status · checklist · chain · touched tags · gaps · defects · pdf · fails.

## Verified: tag sources (2026-11-06)

| Run | Result |
|---|---|
| eval | 58/58 (F34-F58: urusan parse, printed tags, SOURCE rows beat the map, SQL-looking entry refused, count SQL shape, 287346 replay, empty case prints "-", empty case with the column filled does not count, PROD count error fails, BA case, map file shape) |
| live replay: cycle-1 paper PTMLK/01/L/MCL/2026/1 (luas 164), no cases | FAIL: luasDipohon 1718 of 3551 PROD MCL empty, empty case never ran, BA ID never ran |
| + `--case empty` PTMLK/01/L/MCL/2026/25 on stg1 (luas_dipohon empty, prints 1109 meter persegi) | PASS |
| + `--case empty` with /1 itself (luas filled) | FAIL: the case does not count |

## Verified on QA-287346 (2026-11-05)

| Run | Result |
|---|---|
| eval | 33/33 at the time (checklist, chain, CC gaps, word diff replays, gate self-disarm, mark.py nested/overlap/merge); the gate fixtures were removed with the gate |
| replay: paper from the first shipped template (7db07ab23d) on PTMLK/01/L/MCL/2026/1 | DEFECT on all five misses: Mukim order, (Nominal), "ialah: -", PPD "Bertarikh:", PT "Bertarikh:" |
| live: fixed template, chain 2876137 CREATE · 2877849 SEMAK · 2878165 PERAKU | PASS · checklist 27/27 · chain 3/3 · CC 34 touched, gaps none (3 FIXED-DATA rows) · defect 0, accepted 6 · green PDF annots 0 |
