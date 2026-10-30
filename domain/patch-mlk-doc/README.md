# patch-mlk-doc

symptom: #282198 (2026-10-02) — document patch handed over as PATCH-REQUEST-282198.txt with jammed STEP 1/STEP 2 text and the BA docx under its own name · 285768 (2026-10-29) — letters I edited myself went out with the signature above the table instead of beside the QR and peranan "-" (miya: "I think you just butchered this part. Not aligned, no peranan filled.")
goal: every DMS document patch leaves 2. Fix\ with exactly <ticket>.sql + the edited docx renamed to the lokasi_fail basename, and nothing banned; every letter I edit matches the system's own layout with every field filled
goal_signal: deliverable-check.js prints PASS and letter-check.py prints PASS for every patched letter before the hand-back reply
retention: rotate monthly (log.jsonl, one row per check run)
footprint: on-demand: 1 node process or 1 python process per manual run (PyMuPDF), <80 MB, exits immediately
self_audit: letter-check.py reads the patched file and its rendered PDF back from disk and exits 1 on any FAIL; every run writes a row (ts · outcome · goal_met · dur_ms) to log.jsonl when --log is given
diagram: diagram.html + diagram.png
state-scoped: yes, Melaka today (lokasi_fail shape LAIN-<n>_<v>.main + et_dms schema; Malay month names); another state passes its own basename/schema

| File | Role |
|---|---|
| eval.js | anchors in `.claude/skills/patch-mlk-doc/SKILL.md` |
| deliverable-check.js | lints the Task folder `2. Fix\` before the reply; 2+ files (comma-separated names) need `<num>.zip` holding every one and one UPDATE per file (2026-10-30 per みや, 287292: "please zip the files, always"; rollback watch wmvu9pnx8) |
| deliverable-check.eval.js | 26 fixtures for the lint (8 for the multi-file zip rule) |
| letter-check.py | checks a patched letter: STANDARD (only declared tags changed, Malay dates) · ALIGNMENT (signature and QR on one row, name below, left edges aligned, from the PDF) · DATA (no `-`, blank or `( )`) |
| letter-check.eval.py | 29 fixtures on synthetic letters (no PROD data) |
