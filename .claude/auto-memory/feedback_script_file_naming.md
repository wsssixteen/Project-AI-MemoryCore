---
name: feedback_script_file_naming
description: Script (.sql) deliverables in a Task folder are named by the TICKET NUMBER only — <ticket>.sql (e.g. 277309.sql) — never descriptive names like patch-ADHOC-...-STANDBY.sql or ddl-widen-....sql
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6617a39-e51c-4896-939d-62e88a55fe11
  modified: 2026-10-01T09:45:43.407Z
---

🚨 **Name by ROLE (updated 2026-09-25, #281650):** `<ticket>.sql` = the UPDATE/patch script (infra runs it, goes to Redmine) · `<ticket>-check.sql` = ONE combined check script showing every row the patch changes (UNION ALL across tables), before + after in the trailing comment. **Banned**: `-2` / `-3` numbering (reads as a duplicate of the update script) · more than one check script. **Why**: `281650-2.sql` looked like a redundant copy and the checks were split; miya wants the role visible from the name and all changes checked in one run.

🚨 **Always `.sql`, Task folder AND Redmine (2026-10-01, #274266, miya furious):** a script is a `.sql` file, never `.txt`, even when the ticket's older attachment is `.txt` (Aaron's `#274266.txt`). I told him to upload the PROD script "as `#274266.txt`"; he wanted `274266.sql`. Before naming or handing ANY script: (1) the Task-folder file and the Redmine upload are the SAME file, `<ticket>.sql`; (2) if a `<ticket>.sql` already exists in the folder, read it and replace it when it is a superseded script (the old 274266.sql was a 14-row partial patch that would have been wrong on PROD); (3) lint the file before handing: extension, statement count, one expected-row annotation per statement, nothing else commented, schema prefix on every table and sequence for PROD, no JOIN. Say "checked" only after that lint ran.

**Banned**: descriptive/verbose names — `patch-ADHOC-PRBB-2026-3-STANDBY.sql`, `ddl-widen-ulasan-277309.sql`, `upload-patch-TICKET.sql`. They look stupid and add lookup headache.

**Why (2026-08-27, per みや)**: みや opens Task folders and wants the script identifiable by the ticket at a glance; the descriptive suffixes are noise. One ticket → `<ticket>.sql`.

**How to apply**: when writing any `.sql` into `1. Tasks\Melaka\<folder>\2. Fix\`, the basename is the ticket number. Applies to patch / DDL / evidence scripts alike (evidence queries mostly live in chat anyway per [[feedback_cross_module_handoff_artifact]]).

enforcement: hook-pending: task-folder-sql-name-gate
