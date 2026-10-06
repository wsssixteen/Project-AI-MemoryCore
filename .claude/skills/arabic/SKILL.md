---
name: arabic
description: みや's daily Arabic vocabulary review — a few seconds to 2 minutes, in chat. Triggers — "/arabic", "arabic review", "arabic today", "/arabic more", "/arabic week <lesson>", "/arabic week next", "/arabic class at <topic>", "/arabic status", "/arabic topic [id]", "/arabic root [root]", "/arabic form [paradigm]", "/arabic drill", "I am in my arabic class" / learning along the class / a screenshot of a book page (class-along mode: one section per reply, harakat + Malay translation on every row, no Latin transliteration), any reply that answers a pending Arabic recall or form drill (Arabic script or Latin transliteration like "sukkarun"). Spec: projects/learning-projects/active/arabic/SPEC.md.
allowed-tools: Bash, PowerShell, Read
---

# /arabic — daily vocabulary review

Born via `core/forge.js` 2026-09-06 · nod: みや `/goal build and verify` (arabic wayfinder map, 11 tickets resolved).

Engine (deterministic, no dependencies): `.claude/skills/arabic/arabic.js`. Data: `projects/learning-projects/active/arabic/data/` (not git-tracked; OneDrive). The model does exactly two things: paste the engine output, and write sentences on sentence days. Nothing else.

## Commands → engine calls

| みや says | Run (from repo root) | Then |
|---|---|---|
| `/arabic` | `node .claude/skills/arabic/arabic.js review` | paste output verbatim. If it contains `SENTENCE DAY`, ALSO run `more`, write 2–3 short sentences using ONLY the listed words (Malay under each), then still end with the `Recall:` line. |
| a reply that is an Arabic word or a Latin transliteration while a `Recall:` line is pending | `node .claude/skills/arabic/arabic.js answer "<reply>"` | paste the one-line verdict. Nothing more. |
| `/arabic more` | `node .claude/skills/arabic/arabic.js more` | write 3 new short sentences using ONLY the closed vocabulary + function words printed. Malay under each. |
| `/arabic week <lesson>` · `/arabic week next` | `node .claude/skills/arabic/arabic.js week <lesson\|next>` | paste output. |
| `/arabic class at <text>` | `node .claude/skills/arabic/arabic.js class "<text>"` | paste output. |
| `/arabic status` | `node .claude/skills/arabic/arabic.js status` | paste output. |
| `/arabic settings` · `/arabic settings <key> <n>` (keys: `words` rows per review 3–15 · `pace` lessons per week 1–4 · `min_reviews` 1–7 · `set_max` 5–30) | `node .claude/skills/arabic/arabic.js settings [key n]` | paste output. |
| `/arabic stats` | `node .claude/skills/arabic/arabic.js stats` | paste the table. Observability: every engine call also appends to `data/log.jsonl` (ts · cmd · outcome · dur_ms). |
| `/arabic topic [id\|list]` | `node .claude/skills/arabic/arabic.js topic [id\|list]` | paste. Grammar-topic review — a topic's rules + worked examples from `data/syllabus.json` (24 topics). No arg = today's topic (date-seeded). |
| `/arabic root [root\|list]` | `node .claude/skills/arabic/arabic.js root [root\|list]` | paste. Root family from `data/roots.json` — same 3 letters, different harakat = different meaning (e.g. حجر). No arg = date-seeded. |
| `/arabic form [paradigm\|list]` | `node .claude/skills/arabic/arabic.js form [paradigm]` | paste the drill question ("give the 3rd-person feminine of نَصَرَ → Arabic?"). When みや replies, run the SAME `answer "<reply>"` — it resolves the pending form drill first. `form list` = the 8 paradigms. |
| `/arabic drill` | `node .claude/skills/arabic/arabic.js drill` | paste. Difficulty-aware pick — word recall early, then root/topic, then form drills once the review reaches the pronoun/verb lessons (book L10+). |

PowerShell form: `node ".claude\skills\arabic\arabic.js" review`.

## Class-along mode (added 2026-10-06 per みや)

Trigger: みや says he is in class / learning along the class and loads `/arabic`, or shares a screenshot of a book page.

1. **Find the page myself.** The whole book is on disk: `projects/learning-projects/active/arabic/source/pages/pNNN.png` (file number = printed page − 3 around lesson 13; lesson → page map in `source/ANALYSIS-book-*.md`). Read the full pages of that lesson part on the FIRST screenshot. Never wait for him to send the rest of a page.
2. **One section per reply.** A section = one dialogue or one numbered exercise. An exercise that continues onto the next page is sent whole, in one table, never cut at the page break. Send it, stop, and send the next when he says next (or shares the next screenshot). Never the whole lesson part in one reply.
3. **Fixed format, every row**: Arabic with full harakat · Malay translation. Exercises add the answer column, and the answer also carries its translation. The book's example (مثال) is the first table row, labelled `Eg` in the `#` column (never the full word "Example", never a mixed Arabic/Latin line above the table: it breaks the layout). **NO Latin transliteration / "Reading" column, ever** (per みや 2026-10-06: the harakat is how he reads it).
4. Record the position with `class "<book lesson + part>"` once per class. Hard rules 1 and 5 (effort ceiling, 5-word cap) apply to the daily review only, not to this mode.
5. **Revision focus = the most recent class** (per みや 2026-10-06). After a class-along, every `/arabic` review and drill stays on that class's lesson until the next class, or until みや names another topic. This is State: one value, overwritten, never a list. Set it with `week <lesson>` + `class "<lesson + part>"`; a new class or a named topic replaces both. ⚠ The engine does not hold it yet: `rollIfNeeded` still advances the set on a Monday after `min_reviews`. Until the engine has a focus field, run `status` first on every `/arabic` and re-pin with `week <lesson>` when the set has left the class's lesson.
6. After each class, add one dated line to `projects/learning-projects/active/arabic/arabic.md` → Progress (lesson + part, pages, sections worked, anything he asked to repeat). That file is the journey of the classes.

## Data (built by the Phase 1–2 pipeline, frozen + verified)

- `data/syllabus.json` — 24 grammar topics in class order (rules + examples, doc-cited). `data/classes.json` — 69 classes. Both verified against the teacher's doc (`data/VERIFY-LOG.md`).
- `data/paradigms.json` — 8 closed form-tables (pronouns ×3 · demonstratives · relative · numbers · verb madhi + mudhari) keyed by person/gender/number → deterministic form-drill lookup.
- `data/roots.json` — 16 root families where harakat flips meaning. `data/words.json` v2 — 198 words with `root` + `pos`.
- Rebuild provenance: `library/scripts/phase1|phase2/` (BUILD once → verify → freeze; USE = script over the frozen JSON).
- Checking whether a word is in `words.json`: compare with harakat stripped (a node one-liner over the file), never a bare-letter Grep. Vocalised text does not match bare letters, so a present word looks absent. The list holds each lesson's الكلمات الجديدة box only, not every word of a dialogue.

## Hard rules

1. **Effort ceiling**: the whole exchange is the table + one recall line. No explanations, no grammar notes, no praise, no extra words. みや types at most one line, or nothing (glancing counts as a review).
2. **Never ask みや for a meaning.** Malay comes from `words.json`. If a meaning looks wrong, fix `words.json` and add a row to `data/VERIFY-LOG.md`; never ask.
3. **Closed vocabulary on sentence days**: every content word must be in the `more` list. Cannot fit? Write fewer sentences.
4. **Answers**: `sukkarun`, `سكر`, `سكرن`, `سُكَّرٌ` are all valid — the engine normalises. Always run `answer`; never judge by eye.
5. Banned: re-explaining a rule みや already knows, showing more than 5 words, asking "ready?", adding a second recall.

## Boot nudge

**Off since 2026-10-05** (per みや: Arabic runs only when `/arabic` is invoked). `domain/arabic-nudge/arabic-nudge.check.hook.js` used to print one line at SessionStart (`📖 Arabic: 2/5 reviews this week · not yet today`); it is no longer registered. That exact line now comes only from `node .claude/skills/arabic/arabic.js nudge`; `/arabic status` prints the fuller week line (`Week N · Lesson X · N/5 reviews · misses · next roll`). There is now NO unprompted mention of Arabic in the system.

## Eval

`node .claude/skills/arabic/arabic.test.js` — 62 scenarios (S1–S48 core: matching incl. no-shadda + typed-ن tanwin, chunk split, week roll, carry-over, override, modes, miss-first, idempotent same-day, status, nudge, corrupt state, real-data full walk; S49–S60 Phase-3: syllabus/paradigms/roots load, topic review, root families, form drill pose+resolve, drill routing, no-disturbance of the daily flow). Must be green before any engine change ships.
