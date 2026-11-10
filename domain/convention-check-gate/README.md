goal_status: draft (derived from nuke-marker+header on 2026-09-06; promote with node lib/goal-backfill.js promote convention-check-gate)
symptom: Familiar-built batch (commit `2750811`). Migration to `domain/` per trinity convention + first-ever eval; only code change is the log path (now `log.jsonl` beside the hook). Legacy log stays at `.claude/hooks/`.
goal: convention-check-gate.gate.hook.js — PreToolUse hook (Edit | Write | Bash) RELOCATED 2026-07-07 from .claude/hooks/convention-check-gate.js into the domain/convention-check-gate/ Feature folder. v1.5 behavior preserved
goal_signal: a fire on: its trigger
retention: rotate monthly
diagram: domain/convention-check-gate/diagram.png
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
| `sql` (file) | Edit/Write on a `.sql` file | ADVISORY checklist, plus **HARD-BLOCK (deny)** on: a JOIN (v1.6) · `TRUNCATE` · a `DELETE` with no `WHERE` · a `DELETE` on a proof table · any other `DELETE` with no `SELECT` ending `-- 0 rows` above it (v1.9, see below) |
| `config` | Edit/Write on `.json/.xml/.properties` under a template/resources/config path | ADVISORY |
| `sql` (DML) | Bash command or postgres MCP query containing `UPDATE <table>` / `INSERT INTO <table>` | ADVISORY |
| anything else | — | silent (exit 0, no output) |

**Java HARD-BLOCK detail**: the deny fires ONLY when the transcript contains NO analog-citation marker.
Accepted markers (any one suffices, regex `ANALOG_CITED`):

- `← sibling` (the per-file sibling-diff emit line)
- `sibling ... <file>.<ext>:<line>` within ~90 chars
- `analog ... :<line>` / `convention ... :<line>` / `mirror(s/ed/ing) ... :<line>` within ~90 chars

**DELETE in a `.sql` file (v1.9, 2026-11-10 per みや, 288625)**: a DELETE is assessed, not banned; the rule is `.claude/skills/script-check/SKILL.md` §Rule 4 (five questions, four flag proofs). The gate blocks only what a string test can prove unsafe:

| Denied | Why |
|---|---|
| `TRUNCATE` | removes every row |
| `DELETE` with no `WHERE` | removes every row |
| `DELETE` on a proof table: `ind_*` (registry) · a name with a `log`, `audit` or `sejarah` word · `umm_aplikasi` · `umm_a_tgsn` · `skg_dok` · `hsl_bayaran`, `hsl_bayaran_luar`, `hsl_bayaran_cukai_pintu`, `hsl_pindahan_cukai_tnh_resit` (receipts and payments made) | a record or proof is cancelled by its own flag or the app cancel screen, never deleted |
| any other `DELETE` with no `SELECT` ending `-- 0 rows` above it | "nothing points to it" must be shown in the script |

The table names were read from `et_main_stg1` on 2026-11-10. No module prefix is denied: `hsl_` and `tkr_` also hold config and temp tables. The check reads the file as it will be after the Write or Edit; an Edit whose file cannot be read checks the new text only and skips the child check. CANNOT: decide whether a row is a record, whether a flag works, or whether the 0-row SELECT names the right child tables. Bypass: `[skip-convention-check: <reason>]` in the same turn.

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
| `eval.js` | 37 fixtures (5 base + 32 for the v1.9 DELETE check, the adversarial set: comments, quoting, case, order of the SELECT, Edit of a file on disk and not on disk, bypass); exit 0 only when all pass |
| `diagram.html` / `diagram.png` | the picture of what the gate stops |
| `log.jsonl` | fire log (`allowed` / `blocked` / `advisory` / `fail-open`), created on first fire |

Legacy log at `.claude/hooks/convention-check-gate.log.jsonl` stays in place as history (registrar handles
the flat-file retirement).

## Version history (carried from source)

v1.0 2026-05-25 (QA-262869) · v1.1 2026-05-26 registered + postgres regex · v1.2 2026-06-19 Java BLOCKING
· v1.3 2026-06-20 jsf kind + IN-FILE-FIRST (QA-261986/QA-261517) · v1.4 2026-06-22 comment-each-change
advisory · v1.5 2026-07-01 `.sql` file kind + VERIFY-SELECT-true-values (#239386) · **2026-07-07 relocated
here, behavior unchanged** · v1.6 2026-07-17 JOIN in a `.sql` file BLOCKING · v1.7 2026-07-17 space + noise lines
· v1.8 2026-11-06 every DELETE in a `.sql` file BLOCKING, **retired 2026-11-10 as wrong** (みや: "It should be assessed
accordingly, things that has been recorded and is a proof like receipts should be kept") · **v1.9 2026-11-10** the
assessed DELETE check above; designed on claude-fable-5-2. Rollback of v1.9: `git revert` its commit (returns v1.8).
