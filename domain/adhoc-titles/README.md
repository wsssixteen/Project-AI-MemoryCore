# adhoc-titles

Skill + script. No hook. Asked for by phrase ("adhoc titles", "protime titles", "tajuk protime").

| Part | File |
|---|---|
| Skill (procedure) | `.claude/skills/adhoc-titles/SKILL.md` |
| Script | `lib/adhoc-titles.js` (reads `quest/active.txt` + `quest/active-archive.txt` of the main checkout, read-only) |
| Script eval | `lib/adhoc-titles.eval.js` (13 fixtures) |
| Feature eval | `domain/adhoc-titles/eval.js` (runs the script eval + checks the skill file) |

symptom: 2026-10-04 miya: "I don't want to keep on repeating to ask for a simple short keyword title to put into protime"
goal: one trigger word returns the day's adhoc titles, paste-ready, with no follow-up question
goal_signal: `node lib/adhoc-titles.js` exits 0 in the same turn the titles are given
retention: keep
footprint: on-demand: 1 node process per call, about 1 second, nothing running otherwise
state-scoped: no, one list across every state (the block's `state=` is printed beside each title)

Titles are written by the `adhoc-save` skill at intake (`title=` in the block). This feature only reads them.
