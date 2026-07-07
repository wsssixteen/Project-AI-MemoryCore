# convention-check-gate — Feature folder

> Relocated 2026-07-07 from `.claude/hooks/convention-check-gate.js` (flat hook) into this Feature folder.
> **v1.5 behavior preserved byte-for-byte** — the ONLY code changes in the migration are (a) the log path
> now resolves to `log.jsonl` beside the hook file, and (b) a header note recording the relocation.

## What it is

PreToolUse hook, **dual-registered** on `Edit|Write` AND `Bash` (plus it detects `mcp__postgres*query`
tool inputs when routed through it). Enforces the universal "find working analog first" rule
(`feedback_simplify_and_reference.md`, CLAUDE.md §8 Working-analog first): before adding/changing ANY
artifact, check what convention similar artifacts use — and CITE the analog checked.

## Contract

| Artifact kind | Trigger | Enforcement |
|---|---|---|
| `java` | Edit/Write on a `.java` file | **HARD-BLOCK (deny)** unless the session transcript already cites an analog |
| `docx` | Edit/Write on a `.docx` file | ADVISORY (additionalContext checklist, edit allowed) |
| `jsf` | Edit/Write on an `.xhtml` file | ADVISORY (in-file-first + sibling-wiring checklist) |
| `sql` (file) | Edit/Write on a `.sql` file | ADVISORY (value-format + verify-SELECT-true-values checklist) |
| `config` | Edit/Write on `.json/.xml/.properties` under a template/resources/config path | ADVISORY |
| `sql` (DML) | Bash command or postgres MCP query containing `UPDATE <table>` / `INSERT INTO <table>` | ADVISORY |
| anything else | — | silent (exit 0, no output) |

**Java HARD-BLOCK detail**: the deny fires ONLY when the transcript contains NO analog-citation marker.
Accepted markers (any one suffices, regex `ANALOG_CITED`):

- `← sibling` (the per-file sibling-diff emit line)
- `sibling ... <file>.<ext>:<line>` within ~90 chars
- `analog ... :<line>` / `convention ... :<line>` / `mirror(s/ed/ing) ... :<line>` within ~90 chars

**CAN (shape/presence, ~100%)**: verify an analog WAS cited before a Java edit → kills SKIPPING.
**CANNOT (correctness — stays judgment)**: verify the cited analog is the RIGHT one.

## Bypass

`[skip-convention-check: <reason>]` anywhere in the session transcript → Java edits pass (advisory still shown).

## Fail-open

Transcript unreadable / JSON parse error / any internal error → advisory only (or silent exit 0), never
blocks on the gate's own bug.

## Quest-independence

**Quest-independent by design** — this gate keys purely on the artifact kind being touched, NOT on
`quest/active.txt` state. The working-analog rule applies to every code/template/data change, quest or not.
(Contrast: `domain/quest-phase-gate/` is quest-gated by design.)

## Files

| File | Role |
|---|---|
| `convention-check-gate.gate.hook.js` | the hook (register PreToolUse `Edit\|Write` + `Bash`) |
| `eval.js` | 5-fixture eval (spawnSync + temp transcripts); exit 0 only at 5/5 |
| `log.jsonl` | fire log (`allowed` / `blocked` / `advisory` / `fail-open`), created on first fire |

Legacy log at `.claude/hooks/convention-check-gate.log.jsonl` stays in place as history (registrar handles
the flat-file retirement).

## Version history (carried from source)

v1.0 2026-05-25 (QA-262869) · v1.1 2026-05-26 registered + postgres regex · v1.2 2026-06-19 Java BLOCKING
· v1.3 2026-06-20 jsf kind + IN-FILE-FIRST (QA-261986/QA-261517) · v1.4 2026-06-22 comment-each-change
advisory · v1.5 2026-07-01 `.sql` file kind + VERIFY-SELECT-true-values (#239386) · **2026-07-07 relocated
here, behavior unchanged**.
