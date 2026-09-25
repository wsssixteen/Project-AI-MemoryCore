---
name: adhoc-save
description: Save an adhoc's findings as the full 4-part save-set (Task folder · active.txt block · ADHOC-REGISTER row · qa_doc), then AUDIT the round with lib/adhoc-save-audit.js and fix every FAIL before replying. ALWAYS invoke — on adhoc intake, whenever an adhoc finding appears or changes (diagnosis, DB proof, BA reply, approval, ticket raised), and on "save adhoc" / "save this adhoc" / "save the adhoc findings" / "update the adhoc". Not for Redmine tickets (quest-knowledge-save owns those).
---

# adhoc-save — every adhoc round saved, audited, fixed

## When
- Adhoc intake (adhoc-paste-detector fired, or a BA relay with a permohonan-id / hakmilik / No Resit and no owning Redmine #).
- Any turn where an adhoc finding appears or changes: root cause, DB proof, BA reply, boss approval, workaround, ticket number arrives.
- "save adhoc", "save the adhoc findings", "update the adhoc".

## The save-set (all 4, every round)

| # | Part | Home | Written by |
|---|---|---|---|
| 1 | Task folder | `1. Tasks\<State>\<N+1>. AH - <ENV> - <URUSAN> - <desc>` with `0. Brief\` (brief.txt = BA verbatim + screenshots), `1. Simulate\`, `2. Fix\` | PowerShell `New-Item` + copy |
| 2 | Notes file | `<Task folder>\1. <ADHOC-ID>.txt` | `node quest/notes.js --folder "<folder>" --qa <ADHOC-ID> --env <ENV> --urusan <X> --id "<permohonan or No Resit ...>" --user "<login>" --reset` (never hand-written) |
| 3 | active.txt block | `quest/active.txt` (main checkout) — keys `qa phase status ticket_type=adhoc env urusan quest_start local_test_confirmed adhoc_register_row qa_doc task_folder issue_one_liner branch` (`branch=none-until-ticket` is fine) | `node quest/active-cli.js start <ADHOC-ID> ...` or append |
| 4 | Register row | `etanah-knowledge/<state>/ADHOC-REGISTER.md` next free `A#` — conclusion carries `file:line` / `table.column`; Status cell starts `OPEN` / `ANSWERED` / `OWNED-ELSEWHERE` / `LATENT` / `TICKETED` / `RESOLVED` | append |
| 5 | qa_doc | `projects/coding-projects/active/<ADHOC-ID>/<ADHOC-ID>.md` — opens with `## Issue Summary` (Symptom · Screen · Verdict) + `## Match Keys` (permohonan · aplikasi · warta · lesen/resit/hakmilik), then `## 0. Resume Point` (mandatory while status is hold/blocked/delegated — expansion-protocol §Step 2b rows) · Status · Env · evidence SELECTs · mechanism · analog · `## Next-Steps Checklist` | Write to scratchpad → copy (projects/ is main-checkout only) |

ID = `ADHOC-<URUSAN>-<YYYY>-<n>` — next n after grepping `active.txt` + `active-archive.txt`.

## Each round
1. Write or update every part the new finding touches. A status change (approved / ticketed / answered) updates BOTH the block `status=`/`issue_one_liner=` AND the register Status cell in the same round.
2. Audit: `node lib/adhoc-save-audit.js <ADHOC-ID>` (run from the worktree or main; resolves the main checkout itself).
3. Every FAIL → fix it now → re-run. Loop until `save-set green`. A FAIL caused by a tool (e.g. notes.js naming) → fix the tool too, not just the file.
4. Reply with one line: `adhoc saved → <ADHOC-ID>: audit N/N PASS`.

## Ticket arrives for the adhoc
`node domain/adhoc-lifecycle/adhoc-lifecycle.js promote --row <A#> --ticket QA-<n>` → start the quest from the qa_doc (no re-Scout) → re-run the audit on the ADHOC id until the block sits in active-archive.txt and the register says `TICKETED`.

## Banned
- Replying on an adhoc finding with the save-set unwritten or the audit not run this round.
- Hand-writing the notes file · reusing an `A#` another block holds · an open block whose register row says RESOLVED (or the reverse).
- Names / dates / monologue inside Task-folder deliverables (brief.txt is BA verbatim, exempt).

symptom: 2026-09-25 miya: 'Create a skill that you will always invoke to properly save every adhoc findings properly, make sure to always audit each round of save and apply the fixes straight-away'
goal: every adhoc save round ends with all 4 save-set parts present, consistent, and audit-green
goal_signal: adhoc-save-audit exits 0 for the saved ADHOC id in the same turn
goal_signal_regex: adhoc saved → ADHOC-[A-Z0-9-]+: audit (\d+)/\1 PASS
retention: keep
