---
name: doc-sim
description: Document simulator. Makes an etanah Word document offline the way the system does, for one permohonan, with no JBoss and no database write. Shows which template is picked, each content control's time and hidden errors, and whether a no-edit Word save reads as a change. Triggers — "/doc-sim", "doc-sim", "simulate the document", "generate the document offline", "which tag is slow", "why is Kemaskini slow", "test this template", "does this template fill", "run the template generator", and inside a quest whenever the ticket touches a generated Word document (template .docx, content control, populator, Kemaskini, versi).
---

# doc-sim — make the document offline, before anyone tests

One run answers what a deploy would: does this permohonan produce this document, and is it right.

## Run

| Want | Command |
|---|---|
| Fill + time per tag | `node domain/doc-sim/doc-sim.js gen --permohonan "<id>" --profile` |
| Fill + Word no-edit save + compare | `node domain/doc-sim/doc-sim.js repro --permohonan "<id>"` |
| Test an edited template not yet committed | add `--template-dir "<folder holding template\MLK\<file>.docx>"` |
| Force a template whose conditions are not met yet | add `--template "<file>.docx"` |
| Compare two files | `node domain/doc-sim/doc-sim.js compare --a "<docx>" --b "<docx>"` |
| Compare code changed in the source | `node domain/doc-sim/doc-sim.js build` once |

Each run takes 2 to 3 minutes. The last line is the one to carry:

`DOC-SIM: <permohonan> · <template> · fill <ms> ms · <n> hidden errors · compare <SAME|CHANGED|n/a> · first diff …`

## When to use it in a quest

Only on a ticket that touches a generated Word document. Say `doc-sim applies` in the Phase 0 checklist when it does, `doc-sim n/a` when it does not.

| Quest point | Run | What it settles |
|---|---|---|
| Phase 0, test data | `gen` on the candidate permohonan | Does it pick the template under test. `[config]` shows `needs x=[..](now y)` when it does not |
| Recon | `gen --profile` on BA's permohonan | Which tag is empty, wrong, slow or failing, before any code trace |
| Rubric, Falsifier ledger | `repro` or `compare` | A falsifier about a fill result or a Word save. Write `RAN: DOC-SIM …` in the row |
| Before the hand-back, template edited | `gen --profile --template-dir` | A missing or mistyped tag, before a deploy |

The DOC-SIM line goes into `QA-<num>.md` and into the reply. The permohonan is picked by the quest's own test-data rules (`feedback_pengguna_semasa.md`: id + live holder from the DB).

## How it feeds the two existing gates

| Gate | What doc-sim gives it |
|---|---|
| `CC-PREFLIGHT:` (`domain/template-cc-preflight/`) | The data check per tag is run, not judged: `no value`, `tag not in the file`, `[ERROR]` rows are the data gaps |
| `RENDER-VERIFY:` (`domain/render-verify/`) | The generated `.docx` to open and read is `out\<run>\…__filled.docx` |

## What it never covers

| Case | Why |
|---|---|
| miya's local test | No screen and no logged-in user. It never sets `local_test_confirmed` |
| A Java populator fix not deployed locally | It runs the classes of the local deployed WAR. Deploy first, or say the fix is unverified |
| Screens, Simpan, Hantar, signature | Read-only by design |
| PROD or any live schema | The runner refuses a schema that is not a test schema. RAHSIA text must not land on the laptop |

## Reading and reporting

- Report masked text only. The compare prints letters as `a` and digits as `9`. Never paste text from a filled file.
- A `[ERROR]` line is an error the real system catches and hides. Name the tag.
- `FAILED (exit N)` means the run did not finish. Read the lines above it. Never report a verdict from a failed run.
- Delete `E:\Dev\scripts\EtanahTemplateGen\out\` when the quest closes.

## Where things are

| Thing | Path |
|---|---|
| Runner, log, eval | `domain/doc-sim/` |
| The tool itself | `E:\Dev\scripts\EtanahTemplateGen\` (`README.md` there lists every option and limit) |

symptom: 2026-10-05 QA-244600 BA failed the fix: first Kemaskini with no edit still added a versi; the falsifier was written and never run because it needed JBoss and a freshly filled paper
goal: every document-ticket claim about a fill result or a Word save is backed by one offline run before it reaches miya or BA
goal_signal: the quest doc or the reply carries a DOC-SIM line with the permohonan, the template and the verdict
retention: rotate monthly
footprint: on-demand: 1 java process about 2 GB for 2 to 3 minutes, 1 Word process for the save step
