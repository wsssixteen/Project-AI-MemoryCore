# template-scenario

symptom: 2026-11-04 miya: 287346 template shipped twice with requirement gaps my own audit listed; 288095 test data held a placeholder; he asked for a complete template test scenario step
goal: every template ticket hand-back carries a requirement checklist with every row done, every changed CC tag holding a real value across all config actions, a word diff with 0 defects, and a green-highlighted generated paper
goal_signal: TEMPLATE-SCENARIO: lines in tool results before template hand-backs; 0 template hand-backs without one
goal_signal_regex: TEMPLATE-SCENARIO: PASS
retention: keep
footprint: per-turn: 1 node process under 50 ms on Stop, reads the transcript tail; on-demand script runs doc-sim JVM 1-2 GB for 2-3 min, 1 python per helper call
boundary: covers the Stop reply text and this session's tool results for a TEMPLATE-SCENARIO line, and (script) one ticket's checklist, doc-sim chain, CC values, word diff and green PDF · never edits the template, the qa_doc or any database, never posts to Redmine, never touches non-template hand-backs · stops at one block naming the missing run (bypass [skip-template-scenario: <real reason>]) or at the TEMPLATE-SCENARIO line with each gap named
self_audit: the script ends by reading its own outputs back (the filled docx, the saved PDF's annotation count, every Find phrase located) and exits 1 with the gaps named; each run writes a log.jsonl row
diagram: domain/template-scenario/diagram.png
state-scoped: no for the gate; the script takes every path as an argument (requirement, template, config, Task folder), so any state's template runs through it

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

Prints `TEMPLATE-SCENARIO: PASS|FAIL QA-<num> · checklist k/n · chain a/b · CC gaps · word diff defect/data/accepted · highlight <pdf> annots 0`.

## The gate

`template-scenario.check.hook.js` (Stop, BLOCK): a hand-back (`▶ YOUR MOVE`, `Test Scenario`, `DEPLOY —`, `Redmine`, `post it <num>`) in a session that ran doc-sim or touched a `Template*.docx`, with no `TEMPLATE-SCENARIO: PASS` in a tool result this session. A PASS line typed in my own reply never counts. Bypass `[skip-template-scenario: <real reason>]`.

## Red boxes (miya 2026-11-05)

Screenshots use `domain/fix-photo/mark.py`, which now refuses boxes that overlap or sit inside each other (`--merge` draws their union) and draws label backgrounds without a red frame: specific boxes, one per change, never nested, never overlapping.

**Layer choice (Rule 7)**: script + Stop gate. The CC-PREFLIGHT skill row (2026-08-19) and its advisory hook did not stop 287346 or 288095, so the step is enforced; the advisory `template-cc-preflight` hook is retired by this Feature (its `preflight.js` tag lister stays).

**Trigger moment (Rule 8)**: the Stop of a hand-back only, and only in a session that did template work.

**Observability**: `log.jsonl` one row per script run: ts · qa · status · checklist · chain · touched tags · gaps · defects · pdf · fails. Gate fires go to `system/telemetry/hook-fires.jsonl`.

## Verified on QA-287346 (2026-11-05)

| Run | Result |
|---|---|
| eval | 33/33 (checklist, chain, CC gaps, word diff replays, gate self-disarm, mark.py nested/overlap/merge) |
| replay: paper from the first shipped template (7db07ab23d) on PTMLK/01/L/MCL/2026/1 | DEFECT on all five misses: Mukim order, (Nominal), "ialah: -", PPD "Bertarikh:", PT "Bertarikh:" |
| live: fixed template, chain 2876137 CREATE · 2877849 SEMAK · 2878165 PERAKU | PASS · checklist 27/27 · chain 3/3 · CC 34 touched, gaps none (3 FIXED-DATA rows) · defect 0, accepted 6 · green PDF annots 0 |
