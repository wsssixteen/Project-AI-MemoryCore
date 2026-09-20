---
name: project-arabic-review
description: "みや's personal Arabic vocab review system (/arabic) — effort ceiling seconds-to-2-min in chat, book = Madina Book 1, class notes = grammar tag; meanings are Ruri's job, never asked. v2 syllabus-driven (24 topics, form drills, roots) COMPLETE"
metadata: 
  node_type: memory
  type: project
  originSessionId: da2b17cc-b076-4653-bd7a-dc4eb63325e8
  modified: 2026-09-21T00:00:00.000Z
---

`/arabic` built 2026-09-06 (commit d617868). Spec + data live in `projects/learning-projects/active/arabic/` (SPEC.md, data/words.json 198 words, data/progress.json). Engine `.claude/skills/arabic/arabic.js`; boot line from `domain/arabic-nudge/`.

**Why:** みや takes an Arabic class (teacher's Google Doc = grammar class notes, reverse-chronological, 39 entries to 18/08/2026; Madina Book 1 = exercise/reading book). He is too busy to review, so the review must be near-zero effort: 5-word table + 1 recall, in chat, between work tasks. He does NOT know the Malay meanings (he is the learner): "how should I know the translation bro" — meanings are mine, verified, never confirmed by him. He has an Arabic keyboard but cannot type shadda; he types `سكرن` for `سُكَّرٌ` and Latin like `sukkarun` — the matcher accepts all of these.

**How to apply:** when he says `/arabic` or answers a recall, run the engine and paste; never add explanations; never ask him a question inside the review; never derive-by-asking. Class position updates via `/arabic class at <topic>`. Related: [[feedback-no-on-the-fly-artifacts]] (project lives under projects/, type `learning`).

---
**v2 COMPLETE (2026-09-21):** /arabic evolved into a syllabus-driven study system. All 69 recordings transcribed (view-only 48 via [[drive-viewonly-download]]). Built + verified + frozen (100% doc spot-check, `data/VERIFY-LOG.md`):
- `data/syllabus.json` (24 grammar topics, class order, rules+examples doc-cited) · `data/classes.json` (69) · `library/classes/NN.md`.
- `data/paradigms.json` (8 form-tables: pronouns/demonstratives/relative/numbers/verb madhi+mudhari) · `data/roots.json` (16 harakat-variant families) · `data/words.json` v2 (root+pos).
- Engine gained `topic` · `root` · `form` (drill; `answer` resolves it) · `drill` (difficulty-aware) · `sync`. Eval `arabic.test.js` = 63 scenarios green.
- Governed by [[mechanical-deterministic]] (BUILD once→verify→freeze; USE=deterministic script/engine over frozen JSON). Provenance: `library/scripts/phase1|phase2|phase4/`.
- ONE open gap: deterministic Drive folder-lister (owner-shared folder not searchable; get_file_metadata by-id works). Ingest a new class via `library/sync.md`. Full state: `library/HANDOFF-arabic-v2.md`.
