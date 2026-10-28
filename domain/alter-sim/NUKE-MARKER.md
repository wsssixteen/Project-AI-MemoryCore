# NUKE-MARKER — alter-sim

| Field | Value |
|---|---|
| Created  | 2026-10-28 |
| Session  | QA-262027: miya asked why an alter goes through the Alter Page when the Flowable schema is readable; agreed a rollback preview of the real alter code for stg/mlit only, plus engine reads without the page |
| Files    | `domain/alter-sim/` (README.md, alter-sim.js, alter-sim.eval.js, diagram.html, diagram.png, NUKE-MARKER.md) · `domain/alter-ticket-gate/alter-ticket-gate.check.hook.js` A1 line + `alter-ticket-gate.eval.js` F24a/F24b · outside the repo: `E:\Dev\scripts\AlterSim\` (whole folder), `E:\Dev\scripts\FlowableAlter\alter.js` (`live` command + engine read in the AFTER check; copy before: `alter.js.before-engine-reads-20261028`), `E:\Dev\scripts\EtanahTemplateGen\src\tg\Boot.java` (4 additive hooks; copy before: `E:\Dev\scripts\AlterSim\backup\Boot.java.before-altersim`) · no settings.json entry |
| Rollback | `git rm -r domain/alter-sim` · `git revert <commit>` for the alter-ticket-gate lines · `Remove-Item -Recurse E:\Dev\scripts\AlterSim` · `Copy-Item E:\Dev\scripts\FlowableAlter\alter.js.before-engine-reads-20261028 E:\Dev\scripts\FlowableAlter\alter.js` · restore Boot.java from the copy, then `tg.ps1 build` |
| Retire   | 2026-11-27 — remove this file if `log.jsonl` shows at least 1 preview and 1 compare in the window and no rollback |
