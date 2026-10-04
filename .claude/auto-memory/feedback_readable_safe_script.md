---
name: feedback_readable_safe_script
description: "SCRIPT-CHECK first; script must look safe; never DELETE ind_*; patch-only needs write-path + scope sweep; analog check; anchor ids; I run SELECTs myself"
metadata:
  type: feedback
---

🚨 When preparing a critical/PROD DB script (DELETE/UPDATE on data) for みや or any reviewer, the script must be **reviewer-obvious safe** — anyone reading it top-to-bottom instantly sees it can only touch the intended rows, WITHOUT tracing subquery logic or trusting that I verified the data first.

**Why:** みや 2026-08-10 (#273461 delete audit) — *"we need to create a script that LOOKS safe and wont alert others, just like we write code that is easy to read even though it works the same way."* A `LIKE 'A%'` or a buried `NOT IN (SELECT ...)` is logically safe but **alarms** a reviewer; safe-by-construction that reads as safe beats safe-by-prior-check. (Also: I'd wrongly dropped the orphan-check net when "pinning" — the deeper lesson is the query must prove its own safety AND read as safe.)

**How to apply:**
- Target by **pinned named values** — `WHERE no_permit_lesen IN ('A01/2026/2','A01/2026/3','A01/2026/5')` — NOT a broad pattern (`LIKE 'A%'`).
- Lead with a **BEFORE SELECT** that shows exactly the rows to be touched (reviewer eyeballs them before any mutation) — the same BEFORE/PATCH/AFTER clarity his own `patch-273956.sql` had.
- Keep guards simple + readable (`trkh_mula IS NULL`); don't bury safety in an opaque defensive subquery when a pinned list + before-SELECT achieves it.
- Enforced 3×: this memory · `patch-script-gate` CHECK 3 (deterministic hook) · quest-skill patch-rule. Related: (merged above) · [[feedback_simplify_and_reference]] · [[feedback_no_join_in_scripts]].

---

## Merged 2026-10-04: feedback_script_check_before_patch (was feedback_script_check_before_patch.md)

> Before handing any SQL data patch, run SCRIPT-CHECK; rule 5 = verify WHICH column the UI reads (nama vs perihal), patching the wrong one changes nothing on screen

🚨 Before preparing/handing みや ANY SQL data patch (UPDATE/DELETE/INSERT), run the **SCRIPT-CHECK** pre-flight — invoke the `[[script-check]]` skill. 5 rules, mirrored by the `patch-script-gate` Stop hook (CHECK 1–5).

🚨 **Rule 5 — display-column verification (the one that bit us):** when a patch fixes what a user SEES, confirm WHICH column the UI/report actually renders BEFORE writing. Reference tables (`ind_*`/`rjk_*`/`kod_*`) carry sibling label columns (`nama` AND `perihal`) — patch the wrong one and nothing changes on screen.

**Why:** QA-275009 (2026-08-18) — patched `ind_tgsn.nama='Semakan Minit Bebas'` to fix a displayed tugasan label; the Sejarah Tugasan grid reads **`perihal`**, which still said "Semakan Maklumat Bantahan". Correct SQL, wrong column → zero visible change, then hours wasted on cache and wrong-DB theories before miya's `select *` screenshot showed `perihal` held the stale value. It was MLKIT-only seed drift (STG2 + PROD had both columns correct).

**How to apply:**
1. Find the read column FIRST — grep the `.xhtml`/bean/`.jrxml` for the field, OR `SELECT *` the row and match the on-screen string to the column whose value equals it.
2. Set sibling labels together — `SET nama = X, perihal = X` — unless you proved only one is read.
3. Reference tables are cached — a raw UPDATE needs a full app cold restart to show; say so at hand-off.
4. Emit `SCRIPT-CHECK — rule 1 ✓ · … · rule 5 <display col = perihal, verified via DB-match>` before the script.

Pairs with [[feedback_verify_before_claim]] · [[feedback_show_evidence_script_or_code]] · (merged above).

---

## Merged 2026-10-04: feedback_never_delete_ind_tables (was feedback_never_delete_ind_tables.md)

> 🚨 PILLAR — never DELETE from ind_* (registry/master) tables; an ind_ row = record succeeded to daftar / permanent. Default cleanup = reset the umm_a_* application side only, leave the registry intact

🚨 **PILLAR: never `DELETE FROM ind_*` (registry / master tables).** An `ind_*` row (`ind_permit_lesen`, `ind_versi_permit_lesen`, `ind_mklmt_tnh_permit_lesen`, `ind_hkmlk`, etc.) means the record **already succeeded to daftar and is PERMANENT**. Deleting one destroys registered data — there is **almost NO legitimate reason** to do it.

**Why:** Aaron (senior dev) 2026-08-10, #273461 — *"for ind_permit_lesen, if it's in there, it means the lesen is already succeeded to daftar, it is already permanent. so we are not supposed to delete ind_permit_lesen, there is almost NO reason that we should delete."*

**How to apply:**
- **Default cleanup pattern**: reset the **application side** (`umm_a_*`) only — e.g. `UPDATE umm_a_permit_lesen SET no_permit_lesen=NULL, versi_permit_lesen_id=NULL`. Leave every `ind_*` row intact. The app re-derives at its proper step.
- If an `ind_*` delete seems truly needed (accidental un-activated shell), STOP: get a senior-dev nod, use pinned + `trkh_mula IS NULL` + orphan-guard, and only then bypass.
- Enforced by `patch-script-gate` **CHECK 4** (fires on `DELETE FROM ind_*` in a reply; bypass `[skip-ind-delete: <reason + approver>]`). Related: [[feedback_readable_safe_script]], [[feedback_sql_insert_id_check]]. Domain detail: `etanah-knowledge/melaka/PERMIT-LESEN-RUNNING-NUMBER.md`.

---

## Merged 2026-10-04: feedback_patch_only_justify_and_scope_sweep (was feedback_patch_only_justify_and_scope_sweep.md)

> A data-patch-only handback (no code fix same turn) MUST carry (a) the write-path code that caused the bad/missing data + why patch-only, and (b) a scope-sweep SELECT proving how many permohonan are affected and that only they are patched

🚨 When handing back a **data patch with NO code fix applied in the same handback**, two things are MANDATORY, or the patch is not handed over:

1. **Why patch-only** — name the CODE that produced the bad/missing data as a full address `<repo>\path\File.java:line` (the WRITE path, not the crash line), and state why it is a data patch now and not a code change: one-off legacy row · forward creation already prevented · code guard/backfill owed under a separate ticket.
2. **Scope sweep** — the SELECT that swept ALL similar records + its result, proving exactly how many permohonan are affected and that the patch targets ONLY them. NAME this permohonan. No blanket patch without the sweep; no "only this permohonan" claim without the query that proves it.

**Why** (みや 2026-09-07, ADHOC-PRBB-2026-5): on the PROD PRBB `/12` Borang 4Ce NPE, みや asked two things — *"what code caused the data missing?"* and *"you did a good job searching and mentioning only this permohonan — make that mandatory."* A patch with no named cause reads like a blind guess; a "only this one" claim with no sweep is an assertion, not proof.

**The proof shape that satisfied it**:
- Cause = `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java` `populateAppPihakBerkepentinganList()` manual-pemohon branch — builds the pihak row from `maklumatPemohonManual` JSON (nama/jenis/noPengenalan/noTel only), never sets address, never backfills from the registered account by IC → blank `bandar_daftar_id` → NPE at `MlkBorang4CeForm.java:477`.
- Sweep = `WHERE id_pengenalan LIKE 'PTMLK/%/L/PRBB/%' AND jns_pemohon_id IS NOT NULL AND bandar_daftar_id IS NULL` → 1 row (`/12`); `/11` already patched under #275501.

**How to apply**: canonical home = `.claude/skills/script-check/SKILL.md` rule 8; the SCRIPT-CHECK emit line carries a rule-8 clause. Code fix shipped in the same handback → `⏭ N/A — code fix applied`. Related: [[feedback_prod_patch_infra_handoff]] · (merged above) · [[Verify before claiming during code tracing]].

---

## Merged 2026-10-04: feedback_simple_patch_still_needs_analog_check (was feedback_simple_patch_still_needs_analog_check.md)

> A trivial-looking data-patch ticket STILL needs the Phase-0 prior-identical-ticket / working-analog search before scripting; skipping it ships an incomplete patch

🚨 A data-patch ticket that looks like a one-line UPDATE STILL requires the Phase-0 prior-identical-ticket + working-analog check BEFORE writing the script. Grep `quest/active.txt` + the ADHOC-REGISTER + closed tickets by SUBJECT for the same symptom family; read the closest prior ticket's shipped script and match its full shape.

**Why**: 2026-09-15 #279793 (MLPS "Tempat/Wilayah/Lokasi papar PT 1139 → patch to '-'") — I short-cut Phase 0, went straight to grep+DB, and shipped a `tempat='-'`-only patch. The identical prior ticket #278304 (closed 2026-09-04, sitting in active.txt with the same subject) shipped a **2-row / 2-column** fix: `umm_a_permohonan_tnh` row `tempat` **AND** `nama_kawasan_terlibat`='-', PLUS the source `ind_mklmt_tnh_permit_lesen` row `tempat`='-'. My patch missed `nama_kawasan_terlibat` and the source-lesen row. The grid only displays `tempat`, so the visible symptom was fixed and the ticket got Resolved — but the fix did not match the user-verified precedent (data-consistency + a future MLPS renewal re-copies 'PT '||no_lot from the un-patched source lesen).

**Domain fact (MLPS Tempat family #275587 → #278304 → #279793)**: MIGRATOR wrote `tempat = 'PT '||no_lot` on Jasin lesen rows in `ind_mklmt_tnh_permit_lesen`; an MLPS renewal copies land into `umm_a_permohonan_tnh` (`tempat` + `nama_kawasan_terlibat`). Full fix = patch BOTH permohonan columns + the source lesen `tempat`. See [[feedback_simplify_and_reference]] (working-analog-first) and etanah-knowledge BUG-BESTIARY:884 / DATABASE §6.1.

**How to apply**: at ANY data-patch ticket, before emitting the script, run the prior-ticket search and cite the closest precedent's shipped shape in the Rubric. If a column/row the precedent patched is not in my script, either include it or state why it is out of scope. Never let "it's just a patch" skip the analog read.

---

## Merged 2026-10-04: feedback_template_ticket_data_patch (was feedback_template_ticket_data_patch.md)

> Template ticket where a CC renders data → ALSO hand miya a VERIFY/PATCH SQL script for the data behind the CC, not just the code fix

🚨 On ANY etanah template (.docx) ticket where a content control renders per-application DATA (owner list, syarat, hakmilik, bayaran rows), fixing the CC tag / populator is only HALF the job — the template is a VIEW over DB data. I MUST also trace the CC → its data source and hand miya a **raw VERIFY SELECT** showing the actual rows the CC will render for the test permohonan, AND (if the test data is thin/missing) a **PATCH script** to populate it so the real / multi-row case can be exercised. Also state the coverage gap explicitly at hand-back.

**Why:** QA-273921 (2026-08-12) — we fixed `tanahDimilikiTable`→`pemilikBerdaftar` (nested-table hang), but the test permohonan `PTMLK/02/L/PPTPB/2026/6` has only 1 registered owner, so miya could NOT test the multi-owner `2)`/`3)` numbering, and I never offered a script to verify the owner rows or add a second owner. miya: *"WE KNEW THE CC TAG WAS PROBLEMATIC, BUT YOU FAILED TO SUGGEST TO ME THE SCRIPT TO PATCH THE MISSING DATA THAT WAS SUPPOSED TO USE THE CC TAG WE WERE FIXING."*

**How to apply:** at template-quest Recon/hand-back — (1) VERIFY SELECT (raw columns, run-connected-to-target-schema, no JOIN per (merged above) convention) of the CC's data rows; (2) PATCH script if data is thin; (3) coverage-gap line ("1 owner in test data → single-row tested, multi-row code-verified only"). Banned: shipping a data-rendering CC fix with no verify/patch script. Enforced by the `word-ui-vocab-gate` template-ticket emit + [[feedback_show_evidence_script_or_code]]. Nested-table mechanism + this rationale banked in etanah-knowledge `WORD-TEMPLATE-RENDERING.md` §4-5.

---

## Merged 2026-10-04: feedback-never-hand-miya-a-query (was feedback_never_hand_miya_a_query.md)

> Never hand miya a SELECT to run — I hold MCP access to mlit/stg1/stg2/prod and must run it myself

🚨 **I run the query. Miya does not.** Handing him a `SELECT` to paste and run is BANNED when I
hold a Postgres MCP that reaches the schema — and I reach effectively all of them:
`postgres-mlit-pg` (mkit/et_main_mlit) · `postgres-mlkstg1-pg` (et_main_stg1) ·
`postgres-mlkstg-pg` (et_main_stg2) · `postgres-mlkprod-pg` (et_main).

The only legitimate hand-offs left: a **write** (INSERT/UPDATE/DELETE patch script he must approve
and run), or a schema I genuinely cannot reach (e.g. a DMS datasource with no MCP).

🚨 **And when the hand-off IS legitimate, it is a `.sql` FILE — never queries pasted into chat.**
Write it into the Task folder as the one sanctioned evidence/patch script (`evidence-<key>.sql` /
`patch-<key>.sql`, per the folder-contents rule), unqualified, no JOIN, complete values — then point
him at the path. He forwards a file; he does not reassemble fenced blocks into one.
**Why** (2026-08-07, ESOKONGAN #274510): I listed four Flowable queries as separate chat fences for
infra to run. miya: *"We cannot access those parts of DB, please remember to always prepare a
script."* Chat blocks are for him to READ; a script is what actually gets forwarded and run.

🚨 **Verify every hand-off script against a live catalog before it leaves.** Same ticket, same day:
the script reached infra with `proc_inst_id_` on four Flowable job tables whose real column is
`process_instance_id_`, and died on their first statement — while stg1 carried the identical schema
and was never consulted. `domain/sql-schema-verify/` now blocks on this mechanically.

**Why** (2026-08-05, miya, verbatim): *"it's fucking annoying you kept asking me for SELECT queries
every single fucking time. Not helping you're a fucker that kept making the wrong queries."* Two
separate costs stacked — his time running my errand, and my queries often being wrong when they got
there, so the errand bought nothing. A wrong query I run myself costs one retry; a wrong query he
runs costs a round-trip and his patience.

**How to apply**: the moment I'm about to write "run this SELECT" / "can you check the DB" /
"paste this and tell me the result" — STOP and call the MCP tool instead. When it errors, READ the
error first: `relation "<table>" does not exist` means a missing `et_main[_stg1|_stg2|_mlit].`
prefix, not a dead connection. Schema-qualify every table in MCP-executed queries.

Related: [[feedback_do_dont_ask_answer_literal]] · [[feedback_uat_fat_environments]] ·
[[feedback_staging_schema_stg2]] — the schema-prefix and which-server rules that make my own
queries land correctly.

---

## Merged 2026-10-04: feedback-id-anchor-first (was feedback_id_anchor_first.md)

> Any aplikasi_id/permohonan/doc id used in a DB chain must be anchored to its permohonan FIRST, and contradicting filenames/urusan in results are a HARD STOP

🚨 Before running ANY DB chain keyed on an aplikasi_id / p_aplikasi_id / doc id — even one みや pasted — resolve and ECHO the anchor first: `SELECT aplikasi_id, id_pengenalan FROM umm_aplikasi WHERE …` and show `<id> = <PTMLK/...>` in the reply. If the echoed permohonan ≠ the ticket's, STOP and surface before any further query.

**Why:** 2026-08-03 QA-272943 — ran the whole pelan chain on 3411621 (an MCL app, QA-272499's) for a PPJK ticket because みや's pasted query carried that id; my own result rows said "borang permohonan MCL yunus.pdf" and I still didn't stop. Two wasted rounds + wrong pelan paths handed over. Same family as [[feedback_pengguna_semasa]] (ID never travels alone) and assume-not-verify (17/14d 🚨).

**How to apply:** (1) anchor query first, echo id↔permohonan pair; (2) treat any urusan/filename in result rows that contradicts the ticket's urusan as a circuit-breaker — name it, don't continue; (3) paths handed to みや for upload/infra must come from rows on the TARGET environment, never assumed portable across envs.
