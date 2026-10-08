# NUKE-MARKER — pena

| Field | Value |
|---|---|
| Created  | 2026-10-08 |
| Session  | miya during #279554: "Have you built like a Feature for you to learn my writing style?" then "go based on all of this. Make it modular and clear what each style means. Give it a name if you can." |
| Files    | `domain/pena/` (README.md · modules.json · profiles.json · corpus.jsonl · keywords.jsonl · pena.eval.js · eval.js · log.jsonl · this file) + `lib/pena.js` + `.claude/skills/pena/SKILL.md` + the Pena pointer line and stamp in `.claude/skills/quest/SKILL.md` + two `system/registry.jsonl` rows named `pena` |
| Rollback | `Remove-Item -Recurse -Force domain\pena` · `Remove-Item -Force lib\pena.js` · `Remove-Item -Recurse -Force .claude\skills\pena` · delete the line containing `lib/pena.js` and the 2026-10-08 Pena stamp from `.claude\skills\quest\SKILL.md` · delete the two registry.jsonl lines for "pena" |
| Retire   | 2026-11-07 (creation + 30 days) — remove this file if the Feature ran at least once in the window AND no rollback |
