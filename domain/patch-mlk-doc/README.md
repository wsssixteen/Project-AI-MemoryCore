# patch-mlk-doc

symptom: #282198 (2026-10-02) — document patch handed over as PATCH-REQUEST-282198.txt with jammed STEP 1/STEP 2 text and the BA docx under its own name
goal: every DMS document patch leaves 2. Fix\ with exactly <ticket>.sql + the edited docx renamed to the lokasi_fail basename, and nothing banned
goal_signal: deliverable-check.js prints PASS before the hand-back reply
retention: rotate monthly (log.jsonl, one row per check run)
footprint: on-demand: 1 node process per manual run, <50 MB, exits immediately
state-scoped: yes, Melaka today (lokasi_fail shape LAIN-<n>_<v>.main + et_dms schema); another state passes its own basename/schema

| File | Role |
|---|---|
| eval.js | anchors in `.claude/skills/patch-mlk-doc/SKILL.md` |
| deliverable-check.js | lints the Task folder `2. Fix\` before the reply |
| deliverable-check.eval.js | 18 fixtures for the lint |
