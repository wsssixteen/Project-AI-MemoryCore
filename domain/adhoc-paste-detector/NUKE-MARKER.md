# NUKE-MARKER — adhoc-paste-detector

| Field | Value |
|---|---|
| Created  | 2026-08-13 |
| Session  | miya /goal — BA pasted the "PDTAG/Urusan/Tugasan/Id/User" format for the PPTPB Teknikal-Selangor issue; it was answered inline, never scaffolded as an ADHOC (slip: workflow-scaffold-miss, ADHOC-PPTPB-2026-1) |
| Files    | `domain/adhoc-paste-detector/adhoc-paste-detector.check.hook.js` · `domain/adhoc-paste-detector/adhoc-paste-detector.eval.js` · `domain/adhoc-paste-detector/README.md` · `domain/adhoc-paste-detector/NUKE-MARKER.md` · registration in `.claude/settings.json` (UserPromptSubmit) · `system/registry.jsonl` line · auto-gen row in `system/system-architecture.md` HOOK-REGISTRY |
| Rollback | `rm -rf domain/adhoc-paste-detector` · remove the `adhoc-paste-detector.check.hook.js` entry from `.claude/settings.json` UserPromptSubmit · remove the `"name":"adhoc-paste-detector"` line from `system/registry.jsonl` · `node system/sync-hook-catalog.js` |
| Retire   | 2026-09-12 (creation + 30 days) — remove this file if the hook fired ≥1× in window AND no rollback |
