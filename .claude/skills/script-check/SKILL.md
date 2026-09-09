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
| 6 | **🚨 Schema-qualified · comments = mandatory annotation ONLY** (Infra 2026-08-19; comment-scope 2026-08-27 #275847) | schema prefix on every table (`et_main` PROD · `et_main_stg2` STG · `et_main_mlit` MLIT · `ET_MAIN` Perak Oracle). **EVERY statement ends with its expected-outcome annotation (mandatory, both kinds): DML → `-- N rows {updated\|deleted\|inserted}` · SELECT → `-- N rows, <expected state>`.** No other comment. 🚫 BANNED: header comment · env line · table/column-mapping · run-order · any explanation — those go in the **chat handoff message**, never the `.sql`. The prior "env-tagged header comment" mandate is WITHDRAWN (2026-08-27 #275847: I piled header + table description + `LOKASI=Tempat` mapping + run-order into a patch). Applies to any script HANDED OFF; unqualified default stays ONLY for queries みや runs himself |
| 7 | **🚨 File placement + name** (みや 2026-08-19) | the script file is named `patch-<ticket>.sql` and lives in the Task folder's `2. Fix\` — or the LATEST `Rework` folder when one exists (a rework supersedes `2. Fix\`). Never at the Task-folder root |
| 8 | **🚨 Patch-only justification + scope sweep** (みや 2026-09-07, ADHOC-PRBB-2026-5) — MANDATORY whenever the handback is a DATA PATCH with NO code fix applied in the same handback | Two things, both required, or the patch is not handed over: **(a) why patch-only** — name the CODE that produced the bad/missing data (`<repo>\path\File.java:line` — the write path, not the crash line) and state why it is a data patch now and not a code change (one-off legacy row · forward creation already prevented · code guard owed under a separate ticket). **(b) scope sweep** — the SELECT that swept ALL similar records + its result, proving exactly how many permohonan are affected and that the patch targets ONLY them; NAME this permohonan. 🚫 BANNED: a data patch with no sweep (blanket-patch risk) · claiming "only this permohonan" without the query that proves it. Code-fix included in the same handback → `⏭ N/A — code fix applied` |

## Rule 8 — the one that just landed (ADHOC-PRBB-2026-5, 2026-09-07)

PROD PRBB `PTMLK/01/L/PRBB/2026/12` threw the Borang 4Ce NPE because the applicant's registered address row was blank. The remedy is a one-row data patch — but a patch with no context reads like a blind guess. みや's two questions were the rule: *"what code caused the data missing?"* and *"you did a good job searching and mentioning only this permohonan — make that mandatory."*

**(a) Name the write path that caused it.** Here: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java` → `populateAppPihakBerkepentinganList()` manual-pemohon branch (lines ~369-414). It builds the `AppPihakBerkepentingan` row from the `maklumatPemohonManual` JSON — `setNama` / `setJenisPemohon` / `setNoPengenalan` / `setNoTelBimbit` only — and **never sets any address field, never looks up the registered user by IC to backfill it**. Result: `bandar_daftar_id`/`negeri_daftar_id` NULL → the Borang 4Ce read (`MlkBorang4CeForm.java:477`) dereferences null → NPE. Data patch now; code guard/backfill is a separate deferred fix.

**(b) The sweep, cited.** `SELECT … FROM et_main.umm_a_pihak_bkptg WHERE id_pengenalan LIKE 'PTMLK/%/L/PRBB/%' AND jns_pemohon_id IS NOT NULL AND bandar_daftar_id IS NULL` → returned **1 row** (`/12`, pihak 5523939). The sibling `/11` was already patched under #275501. So the patch touches ONLY this permohonan, and that is proven, not asserted.

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

`SCRIPT-CHECK — rule 1 ✓ · rule 2 <✓|⏭ ref> · rule 3 ✓ · rule 4 ✓ · rule 5 <display col = `<col>`, verified via <grep/DB-match>> · rule 6 <schema `<et_main|et_main_stg2|et_main_mlit|ET_MAIN>` on every table · every statement ends with `-- <expected>` (DML: N rows updated/deleted/inserted · SELECT: N rows + state) · env in handoff MESSAGE> · rule 8 <patch-only: cause `<File.java:line>` write-path + why-not-code · scope-sweep = N affected (query cited), this = `<permohonan>` | ⏭ code fix applied>`

## Hook pairing

- **Front gate (this skill)** — run when preparing the script.
- **Back gate** — `domain/patch-script-gate/patch-script-gate.discipline.hook.js` (Stop) re-checks all 5; CHECK 5 bypass token `[skip-display-col: <col the UI reads + how verified>]`.
- **Eval** — `node domain/patch-script-gate/eval.js` (22 fixtures, includes the QA-275009 miss).

*Created 2026-08-18 per みや (goal: "learn so we don't repeat the wrong-column patch; give the script code-check a standard name"). Names the SCRIPT-CHECK discipline; promotes patch-script-gate from hook-only to hook+skill.*

*v2 — 2026-08-19 per みや (Infra feedback #275501): added rule 6 — schema-qualified tables + env-tagged header (`-- #<ticket> (ENV: PROD|STG|MLIT · <schema>): …`) for any script handed off for execution; the unqualified default now applies ONLY to queries みや runs himself. Spec-preservation: rules 1-5 untouched; additive.*

*v3 — 2026-09-07 per みや (ADHOC-PRBB-2026-5): added rule 8 — a DATA PATCH with no code fix in the same handback MUST carry (a) the write-path code that caused the bad/missing data (`File.java:line`) + why patch-only not code, and (b) a scope-sweep SELECT proving how many permohonan are affected and that only they are patched. Emit line gains a rule-8 clause (`⏭ code fix applied` when a code change ships alongside). Spec-preservation: rules 1-7 untouched; additive.*
