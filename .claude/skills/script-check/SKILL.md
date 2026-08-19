---
name: script-check
description: Use when preparing, writing, or handing みや ANY SQL data patch or script (UPDATE / DELETE / INSERT against etanah) — run the SCRIPT-CHECK 5-rule pre-flight BEFORE emitting the script. Triggers — "SCRIPT-CHECK", "/script-check", "patch this", "data patch", "fix the data", "write a patch", "hand me a script", "patch the row", "UPDATE the", "correct the value", "reset the tugasan", any moment a runnable SQL mutation is about to be produced for etanah.
---

# script-check — the SCRIPT-CHECK pre-flight

Run this BEFORE handing みや any SQL mutation. It is the script sibling of code review's `pre-code-check`. The `patch-script-gate` Stop hook enforces the same rules as a back-stop, but SCRIPT-CHECK is run FIRST so the miss never reaches him.

## The Iron Law

```
NO SQL MUTATION IS HANDED TO みや UNTIL ALL 5 SCRIPT-CHECK RULES ARE ANSWERED IN-TURN.
```

**Violating the letter of this rule is violating the spirit of this rule.**

## The 5 rules (mirror patch-script-gate CHECK 1–5)

| # | Rule | The test |
|---|---|---|
| 1 | **Expected-outcome annotation** | ends with `-- N rows {updated\|deleted\|inserted}` — executor verifies actual vs N |
| 2 | **Stage-Match** (transactional tables `umm_*`/`dft_a_*`/`pks_a_*`) | derive the row's workflow stage + the code method that writes these columns; emit the 5-step block. Reference tables → `⏭ N/A — reference table` |
| 3 | **Reviewer-obvious safe** | pinned `IN ('v1','v2')` + a leading BEFORE SELECT; never a broad `LIKE '%'` / buried `NOT IN (SELECT …)` |
| 4 | **Never DELETE registry** | no `DELETE FROM ind_*` (a daftar-succeeded row is permanent); reset the `umm_a_*` side only |
| 5 | **🚨 Display-column verification** | if the patch fixes what a user SEES, confirm WHICH column the UI/report renders BEFORE writing — reference rows carry sibling labels (`nama` AND `perihal`); patch the wrong one and nothing changes on screen |
| 6 | **🚨 Schema-qualified + env-tagged** (Infra 2026-08-19) | every table carries its schema prefix (`et_main` PROD · `et_main_stg2` STG · `et_main_mlit` MLIT) AND the header names the env. Header format: `-- #<ticket> (ENV: <PROD\|STG\|MLIT> · <schema>): <short plain explanation, no jargon>`. Applies to any script HANDED OFF for execution (Infra/PROD). Supersedes the unqualified default, which stays ONLY for queries みや runs himself in his own MCP-connected session |
| 7 | **🚨 File placement + name** (みや 2026-08-19) | the script file is named `patch-<ticket>.sql` and lives in the Task folder's `2. Fix\` — or the LATEST `Rework` folder when one exists (a rework supersedes `2. Fix\`). Never at the Task-folder root |

## Rule 5 — the one that just bit us (QA-275009, 2026-08-18)

Patched `ind_tgsn.nama = 'Semakan Minit Bebas'`; the Sejarah Tugasan grid reads **`perihal`**, which still said "Semakan Maklumat Bantahan". The patch was correct SQL against the wrong column — zero visible change, hours lost chasing cache / wrong-DB theories.

**Before any label/display patch on a reference table (`ind_*` / `rjk_*` / `kod_*`):**
1. **Find the read column** — grep the `.xhtml` / bean / `.jrxml` for the field, OR match the exact on-screen string to the column whose value equals it (`SELECT * FROM <table> WHERE id=…` and eyeball which column holds the displayed text).
2. **Set sibling labels together** — `SET nama = X, perihal = X` unless you have PROVEN only one is read.
3. **Cache** — reference tables are cached in the app; a raw UPDATE needs a **full app cold restart** to show. Say so in the hand-off.

## Red Flags — STOP if you catch yourself thinking

| Thought | Reality |
|---|---|
| "It's obviously the `nama` column" | `nama` vs `perihal` vs `keterangan` — the grid picks ONE; verify which |
| "The SQL is correct, so it's done" | Correct SQL against the wrong column fixes nothing on screen |
| "The value didn't change → cache / wrong DB" | First suspect the WRONG COLUMN, not the environment |
| "It's just a label, skip the checks" | The label miss cost QA-275009 hours; that's exactly why this rule exists |

## Emit before the script

`SCRIPT-CHECK — rule 1 ✓ · rule 2 <✓|⏭ ref> · rule 3 ✓ · rule 4 ✓ · rule 5 <display col = `<col>`, verified via <grep/DB-match>> · rule 6 <ENV: <PROD|STG|MLIT> · schema `<et_main|et_main_stg2|et_main_mlit>` in header + every table>`

## Hook pairing

- **Front gate (this skill)** — run when preparing the script.
- **Back gate** — `domain/patch-script-gate/patch-script-gate.discipline.hook.js` (Stop) re-checks all 5; CHECK 5 bypass token `[skip-display-col: <col the UI reads + how verified>]`.
- **Eval** — `node domain/patch-script-gate/eval.js` (22 fixtures, includes the QA-275009 miss).

*Created 2026-08-18 per みや (goal: "learn so we don't repeat the wrong-column patch; give the script code-check a standard name"). Names the SCRIPT-CHECK discipline; promotes patch-script-gate from hook-only to hook+skill.*

*v2 — 2026-08-19 per みや (Infra feedback #275501): added rule 6 — schema-qualified tables + env-tagged header (`-- #<ticket> (ENV: PROD|STG|MLIT · <schema>): …`) for any script handed off for execution; the unqualified default now applies ONLY to queries みや runs himself. Spec-preservation: rules 1-5 untouched; additive.*
