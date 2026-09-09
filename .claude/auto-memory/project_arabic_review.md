---
name: project-arabic-review
description: "みや's personal Arabic vocab review system (/arabic) — effort ceiling seconds-to-2-min in chat, book = Madina Book 1, class notes = grammar tag; meanings are Ruri's job, never asked"
metadata: 
  node_type: memory
  type: project
  originSessionId: da2b17cc-b076-4653-bd7a-dc4eb63325e8
  modified: 2026-09-06T07:48:08.247Z
---

`/arabic` built 2026-09-06 (commit d617868). Spec + data live in `projects/learning-projects/active/arabic/` (SPEC.md, data/words.json 198 words, data/progress.json). Engine `.claude/skills/arabic/arabic.js`; boot line from `domain/arabic-nudge/`.

**Why:** みや takes an Arabic class (teacher's Google Doc = grammar class notes, reverse-chronological, 39 entries to 18/08/2026; Madina Book 1 = exercise/reading book). He is too busy to review, so the review must be near-zero effort: 5-word table + 1 recall, in chat, between work tasks. He does NOT know the Malay meanings (he is the learner): "how should I know the translation bro" — meanings are mine, verified, never confirmed by him. He has an Arabic keyboard but cannot type shadda; he types `سكرن` for `سُكَّرٌ` and Latin like `sukkarun` — the matcher accepts all of these.

**How to apply:** when he says `/arabic` or answers a recall, run the engine and paste; never add explanations; never ask him a question inside the review; never derive-by-asking (2026-09-06 slip: asked which book lesson the class reached when it was derivable from the two sources — book position = current class topic relative pronoun = Lesson 12; data in source/ANALYSIS-book-position.md). Class position updates via `/arabic class at <topic>` when he mentions a new class. Related: [[feedback-no-on-the-fly-artifacts]] (project lives under projects/, new type `learning`).
