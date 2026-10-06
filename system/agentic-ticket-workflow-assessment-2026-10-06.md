# Agentic ticket workflow assessment — 2026-10-06

Session: worktree `ticket-244600-review-89e02d`, 2026-10-05 to 2026-10-06. Tickets: QA #244600 (rework cycle 2), Internal Issue #275043 (covered).

## Assessment (one concrete instance per claim)

| Axis | Claim | Instance |
|---|---|---|
| A1 agentic system | A corrected behaviour was answered with a memory note, not an enforcing change | Formal Malay commit subjects on `mlk/review/244600` (2026-10-05). First action: one line in `feedback_commit_deploy_runbook.md`. The subject gate got rule R8 only after miya said "feedback_ is not enough" |
| A1 agentic system | "close quest" depended on the assistant matching a skill description | `domain/save-quest/` had a script and an eval but no hook; a trigger hook was built in this session |
| A1 agentic system | Domain Expansion runs a fixed step list; no part declares its own save rule | miya's ask of 2026-10-06; logged as proposal A1 (per-part `save:` line + `lib/save-rules.js`) |
| A2 quest workflow | The rework hand-back did not check every BA issue of the ticket and its related ticket | #275043 Expected: Jana Semula "naik sekali". I told miya "Jana Semula does not add a versi" and wrote it into the test table and a Redmine draft. Found only when he forced a full BA-issue re-list |
| A2 quest workflow | A BA-raised symptom was parked as another team's without reading our own writers | Carian Pintas missing versi: I said "Common side"; `PelupusanDocumentService.saveDocument` writes the same task link. Fix was 6 lines in our module |
| A3 debugging | Real stored before/after pairs settled the root cause in one step; guesses did not | Three MLIT pairs gave `kind=format before=[b;sz=24;] draft=[b;]`. The earlier guess (empty content control) had been refuted offline and cost half a day |
| A3 debugging | The database rows explained a screen symptom with no server log | "Tiada rekod yang dijumpai": 4 of 4 empty rows had `flag_aktif` N, 8 of 8 rows with a file had Y; confirmed in the Common 1.7.5 jar by `javap` |
| A4 etanah issue-solving | One rule from the BA covered three buttons; the fix shipped for one | Old versi marked not active at Jana Semula, at the Surat new-versi save and at Peraku. First deploy carried Jana Semula only; miya deployed twice |
| A4 etanah issue-solving | A colleague's env-only commit can hold the same defect | Peraku rise (`3aa68917eb`) existed on `mlk/int-env` only and carried the not-active mark |
| A5 sweep | Not used this session | A5 ⏭ single-ticket session |

## Proposals logged (each with an eval case, in `system/slips.jsonl`)

| Axis | Idea |
|---|---|
| A1 | Per-part save rules checked by Domain Expansion |
| A2 | BA issue coverage matrix across the ticket and its related tickets at every hand-back |
| A3 | Same-mark writers sweep before a fix ships |
| A4 | etanah-knowledge entry for document versi, Carian Pintas and Senarai Versi |
