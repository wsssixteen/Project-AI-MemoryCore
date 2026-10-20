# NUKE-MARKER - story-video

| Field | Value |
|---|---|
| Created  | 2026-10-20 |
| Session  | miya 2026-10-20: the accepted one-off PLPS explainer video (#300) becomes a reusable skill, triggered by "SV" / "story video" |
| Files    | `domain/story-video/` (render.py · draw.py · music.py · lint.js · kinds.json · eval.js · examples/plps-2026-2.json · README.md · this file) · `.claude/skills/story-video/SKILL.md` · `system/registry.jsonl` row "story-video" · `system/slips.jsonl` upgrade row "forge/new-skill" |
| Rollback | `rm -rf domain/story-video .claude/skills/story-video` · remove the "story-video" line from `system/registry.jsonl` · `git revert <SHA>` |
| Retire   | 2026-11-19 - remove this file if miya has used SV at least once and no rollback |
