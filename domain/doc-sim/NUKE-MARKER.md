# NUKE-MARKER — doc-sim

| Field | Value |
|---|---|
| Created  | 2026-10-06 |
| Session  | miya after #244600 rework cycle 2: "Create a proper skill or something that is invokable that you are aware when we start a quest", for the offline template generator built 2026-10-05 |
| Files    | `domain/doc-sim/` (doc-sim.js · doc-sim.eval.js · README.md · log.jsonl · this file) + `.claude/skills/doc-sim/SKILL.md` + the `doc-sim` rows in `.claude/skills/quest/SKILL.md` (start step 6e · phase table 2 rows · falsifier ledger bullet · hand-back gate row) + `system/registry.jsonl` row `doc-sim` + the tool at `E:\Dev\scripts\EtanahTemplateGen\` (outside the repo) |
| Rollback | `Remove-Item -Recurse -Force domain\doc-sim` · `Remove-Item -Recurse -Force .claude\skills\doc-sim` · delete every line containing `doc-sim` added to `.claude\skills\quest\SKILL.md` on 2026-10-06 · delete the registry.jsonl line for "doc-sim" · optional `Remove-Item -Recurse -Force E:\Dev\scripts\EtanahTemplateGen` |
| Retire   | 2026-11-05 (creation + 30 days) — remove this file if the Feature ran at least once in the window AND no rollback |
| Upgrade  | 2026-10-22 (QA-285871 doc-sim audit): chain mode, `--warm` JVM, `--java-src`, `[time]` and `[tags]` lines, one log row per run. Repo files: `doc-sim.js` · `doc-sim.eval.js` · `README.md` · `.claude/skills/doc-sim/SKILL.md` · the doc-sim hand-back row in `.claude/skills/quest/SKILL.md` · the `doc-sim` row of `system/tools.json`. Tool files: `tg.ps1` · `README.md` · `src\tg\Gen.java` · `Boot.java` · `Overrides.java` · `log\TgServiceProvider.java` · new `Warm.java` + `Timing.java` |
| Rollback of the upgrade | `E:\Dev\scripts\EtanahTemplateGen\tg.ps1 stop` · restore the tool from `E:\Dev\scripts\EtanahTemplateGen-backup-20261022\` (copy over `tg.ps1`, `README.md`, `src\`; delete `src\tg\Warm.java` and `src\tg\Timing.java`) · `tg.ps1 build` · `git revert <the upgrade commit>` for the repo files |
