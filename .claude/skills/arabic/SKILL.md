---
name: arabic
description: みや's daily Arabic vocabulary review — a few seconds to 2 minutes, in chat. Triggers — "/arabic", "/arabic vocab", "/arabic baris", "baris drill", "/arabic class", "the class started", "continue the class", "/arabic latest", "/arabic class <lesson> [part]", "/arabic menu", "next" (per mode), "arabic review", "arabic today", "/arabic more", "/arabic week <lesson>", "/arabic week next", "/arabic class at <topic>", "/arabic status", "/arabic topic [id]", "/arabic root [root]", "/arabic form [paradigm]", "/arabic drill", "/arabic sentence", "next ayat", "/arabic focus <lesson> [part]", "/arabic words", "I am in my arabic class" / learning along the class / a screenshot of a book page (class-along mode: one section per reply, harakat + Malay translation on every row, no Latin transliteration), any reply that answers a pending Arabic recall or form drill (Arabic script or Latin transliteration like "sukkarun"). Spec: projects/learning-projects/active/arabic/SPEC.md.
allowed-tools: Bash, PowerShell, Read
---

# /arabic — daily vocabulary review

Born via `core/forge.js` 2026-09-06 · nod: みや `/goal build and verify` (arabic wayfinder map, 11 tickets resolved).

Engine (deterministic, no dependencies): `.claude/skills/arabic/arabic.js`. Data: `projects/learning-projects/active/arabic/data/` (not git-tracked; OneDrive). The model does exactly two things: paste the engine output, and write sentences on sentence days. Nothing else.

## Commands → engine calls

| みや says | Run (from repo root) | Then |
|---|---|---|
| `/arabic` | `node .claude/skills/arabic/arabic.js daily` | paste output verbatim, blank lines kept. It follows the stored **mode** (see "Start mode"). **No mode stored** = the menu table: paste it and stop, he picks. **Mode vocab** = the word review: if it contains `SENTENCE DAY`, ALSO run `more`, write 2–3 short sentences using ONLY the listed words (Malay under each), then still end with the `Recall:` line. **A class mode** = the next ayat, word by word (see "Ayat walk"): add NOTHING to it. |
| `/arabic menu` · "which mode" | `node .claude/skills/arabic/arabic.js mode` | paste the menu. |
| `/arabic vocab` · "vocab" | `node .claude/skills/arabic/arabic.js mode vocab` | paste. Stores the mode and prints today's word review. |
| `/arabic baris` · "baris" | `node .claude/skills/arabic/arabic.js mode baris` | paste. Stores the mode and prints 5 baris questions (see "Baris drill"). |
| `/arabic class` · "class" · "the class started" · "continue the class" (no lesson) | `node .claude/skills/arabic/arabic.js mode class` | paste. Stores the mode and prints where the last class stopped + its page files; then go on in class-along mode from that section. |
| `/arabic latest` · "latest class revision" | `node .claude/skills/arabic/arabic.js mode class-latest` | paste. Stores the mode and prints the next ayat of the latest class (lesson + part read from the last `class` position). |
| a reply holding depan / atas / bawah while a baris round is open | `node .claude/skills/arabic/arabic.js answer "<reply>"` | paste the verdict table. Nothing more. |
| `/arabic class <lesson> [part]` · `/arabic topic-mode <topic id>` | `node .claude/skills/arabic/arabic.js mode class-topic <lesson> [part]` · `… mode class-topic <topic id>` | paste. Lesson + part = the ayat walk of that part from ayat 1; topic id = that grammar topic (`topic list` shows the ids). |
| "next" | `node .claude/skills/arabic/arabic.js next` | paste. Per mode: **vocab** = 5 more words of the week set (not the same 5; wraps after all are seen) · **baris** = 5 more questions · **class** = the stop point again (in class-along, "next" = the next book section, sent by me) · **class-latest / class-topic part** = the next ayat · **class-topic topic** = the next grammar topic in class order. One block per reply. |
| `/arabic words` · "arabic review" (the 5-word review, any mode) · "more words" | `node .claude/skills/arabic/arabic.js review` · `review next` | paste output verbatim; `SENTENCE DAY` handled as above. `review next` (same as `words next`) = 5 more words; a same-day re-run shows the latest five. |
| "next ayat" · `/arabic sentence` (any mode, focus set) | `node .claude/skills/arabic/arabic.js sentence` | paste. One ayat per reply. |
| "again" · "ayat <n>" · `/arabic sentences` | `sentence again` · `sentence <n>` · `sentence list` | paste. `again` does not move the pointer. |
| `/arabic focus <lesson> [part]` · `/arabic focus` · `/arabic focus off` | `node .claude/skills/arabic/arabic.js focus [<lesson> [part]\|off]` | paste. Sets / shows / clears the class focus (State: one value, replaced). |
| a reply that is an Arabic word or a Latin transliteration while a `Recall:` line is pending | `node .claude/skills/arabic/arabic.js answer "<reply>"` | paste the one-line verdict. Nothing more. |
| `/arabic more` | `node .claude/skills/arabic/arabic.js more` | write 3 new short sentences using ONLY the closed vocabulary + function words printed. Malay under each. |
| `/arabic week <lesson>` · `/arabic week next` | `node .claude/skills/arabic/arabic.js week <lesson\|next>` | paste output. |
| `/arabic class at <text>` | `node .claude/skills/arabic/arabic.js class "<text>"` | paste output. |
| in class: a section sent · a thing discussed · "add to my revision" · class ends | `class "<text>"` · `note "<text>"` · `revise add "<text>"` · `class close` | see "Class save". `revise` lists the open asks; `save-check` says whether today's class is saved. |
| before translating a page | `node .claude/skills/arabic/arabic.js gloss "<arabic>"` | use **Makna kelas** for every word returned (see "Class vocabulary"). |
| `/arabic status` | `node .claude/skills/arabic/arabic.js status` | paste output. |
| `/arabic settings` · `/arabic settings <key> <n>` (keys: `words` rows per review 3–15 · `pace` lessons per week 1–4 · `min_reviews` 1–7 · `set_max` 5–30) | `node .claude/skills/arabic/arabic.js settings [key n]` | paste output. |
| `/arabic stats` | `node .claude/skills/arabic/arabic.js stats` | paste the table. Observability: every engine call also appends to `data/log.jsonl` (ts · cmd · outcome · dur_ms). |
| `/arabic topic [id\|list]` | `node .claude/skills/arabic/arabic.js topic [id\|list]` | paste. Grammar-topic review — a topic's rules + worked examples from `data/syllabus.json` (24 topics). No arg = today's topic (date-seeded). |
| `/arabic root [root\|list]` | `node .claude/skills/arabic/arabic.js root [root\|list]` | paste. Root family from `data/roots.json` — same 3 letters, different harakat = different meaning (e.g. حجر). No arg = date-seeded. |
| `/arabic form [paradigm\|list]` | `node .claude/skills/arabic/arabic.js form [paradigm]` | paste the drill question ("give the 3rd-person feminine of نَصَرَ → Arabic?"). When みや replies, run the SAME `answer "<reply>"` — it resolves the pending form drill first. `form list` = the 8 paradigms. |
| `/arabic drill` | `node .claude/skills/arabic/arabic.js drill` | paste. Difficulty-aware pick — word recall early, then root/topic, then form drills once the review reaches the pronoun/verb lessons (book L10+). |

PowerShell form: `node ".claude\skills\arabic\arabic.js" review`.

`/arabic class at <text>` stays the class log; only `/arabic class` alone or followed by a lesson number picks a mode.

## Start mode (added 2026-10-27 per みや)

He picks at the start what `/arabic` gives; the engine stores it (State: one value in `progress.json`, replaced by the next `mode`).

| Mode | `/arabic` gives | "next" gives |
|---|---|---|
| `vocab` | 5 words of this week's set + one recall | 5 more words of the set |
| `baris` | 5 words from the class ayat: he gives the baris akhir + the reason number | 5 more questions |
| `class` | where the last class stopped (class log) + the page files: continue the live class in class-along mode | the stop point again |
| `class-latest` | the ayat walk of the latest class part (moves by itself when `class` records a new part) | the next ayat |
| `class-topic` | the ayat walk of the lesson part he names, or the grammar topic he names | the next ayat, or the next topic |

`class-topic <lesson> [part]` sets the same `focus` as `focus <lesson> [part]`; `focus` keeps working on its own. A class mode whose part has no ayat entered prints one line saying so, then the word review.

**Switching (added 2026-10-28 per みや)**: he can change mode at any point by saying its name ("vocab", "baris", "class", "latest class"). Example: he starts on vocab, the class begins, he says "class" → `mode class` → I continue from the printed stop point.

### Baris drill (added 2026-10-28 per みや)

- Light like vocab: 5 questions per round, one table. Each row = the ayat, the marked word, the Malay of the ayat.
- Pool = word rows of `data/sentences.json` whose ending changes (depan / atas / bawah, never "tetap") AND whose every reason is class-cited. One `belum` reason drops the word (learned-only, same rule as the ayat walk). Asked reason = the word's first reason among: mubtada · khabar · khabar muqaddam · mudaf ilaih · selepas huruf jarr · sifat · badal · munada.
- He replies like `1 depan 1 · 2 bawah 4` (a reason name also works: `depan mudaf ilaih`). The engine judges baris and reason separately and prints the right answer with the reason text from the class; I add nothing.
- Missed words come back first next round. Only Lesson 13 has ayat today; a new lesson joins the pool when its ayat are built (Ayat walk rule 4).

## Class-along mode (added 2026-10-06 per みや)

Trigger: みや says he is in class / learning along the class and loads `/arabic`, or shares a screenshot of a book page.

1. **Find the page myself.** The whole book is on disk: `projects/learning-projects/active/arabic/source/pages/pNNN.png` (file number = printed page − 3 around lesson 13; lesson → page map in `source/ANALYSIS-book-*.md`). Read the full pages of that lesson part on the FIRST screenshot. Never wait for him to send the rest of a page.
2. **One section per reply.** A section = one dialogue or one numbered exercise. An exercise that continues onto the next page is sent whole, in one table, never cut at the page break. Send it, stop, and send the next when he says next (or shares the next screenshot). Never the whole lesson part in one reply.
3. **Fixed format, every row**: Arabic with full harakat · Malay translation. Exercises add the answer column, and the answer also carries its translation. The book's example (مثال) is the first table row, labelled `Eg` in the `#` column (never the full word "Example", never a mixed Arabic/Latin line above the table: it breaks the layout). **NO Latin transliteration / "Reading" column, ever** (per みや 2026-10-06: the harakat is how he reads it).
4. Record the position with `class "<book lesson + part>"` once per class. Hard rules 1 and 5 (effort ceiling, 5-word cap) apply to the daily review only, not to this mode.
5. **Revision focus = the most recent class** (per みや 2026-10-06). After a class-along, every `/arabic` stays on that class until the next class, or until みや names another topic. This is State: one value, overwritten, never a list. Set it with `focus <lesson> <part>` + `class "<lesson + part>"`. The engine holds it (since 2026-10-07): the Week Set cannot leave the focus lesson on a Monday roll, and only a new `focus`, a `week <other lesson>` or `focus off` replaces it.
6. The class journal is `projects/learning-projects/active/arabic/arabic.md` → Progress. The line is written by the engine at `class close` (step 10), never by hand.

### Class save — the steps of a class, in order (added 2026-10-13 per みや)

Class-along is the Workflow part of `/arabic` (a route with a position: `class_position` + the class log `data/class.json`); the engine and the daily review are Feature parts. Each step below is an engine call, so nothing depends on my memory at the end of the session.

| # | When | Run | Kept in |
|---|---|---|---|
| 7 | every section sent (dialogue, exercise, page) | `class "<lesson + part + section, pages>"` | class log: every position of the day, in order |
| 8 | he asks a question, the teacher corrects or prefers a form, a section is skipped or not done, he rules on the format | `note "<one sentence>"` in the same turn | class log |
| 9 | he says "add this to my revision" | `revise add "<what>"`, then build the ayat (Ayat walk rule 4) and `revise link <id> <lesson> <part>` | revision asks |
| 10 | class ends, or Domain Expansion | `class close` | journal line in `arabic.md` |

- **Where the class stopped is what HE says**, not the last section I sent (2026-10-13: I sent Exercise 2, the class had stopped at Exercise 1). When he corrects it, run `class` again with his words.
- **A revision ask is cleared by amount, never by date**: each ayat walked for that class part counts one; the ask clears at its goal (7, or the number of ayat of the part if that is more; `revise goal <id> <n>` changes it). `revise` lists the open asks.
- **The save check**: `node .claude/skills/arabic/arabic.js save-check` (exit 1 = today's class is not saved, and the line says which step is missing). Domain Expansion step 12.7 runs it through `lib/save-rules.js` (rule `learning-class-saved` in `system/save-rules.json`): a class day cannot close with the class open.

### Class vocabulary — the teacher's words first (added 2026-10-13 per みや)

His words: "I hate being disrespectful to my teacher by not applying what he taught in the class."

1. Before writing the Malay of a page, run `gloss "<the Arabic of the section>"`. Every word it returns is translated with **Makna kelas**; my own or the more common word goes after it in brackets, only when it adds something. The habits it prints (how the teacher renders alif lam, the fi'il madhi, the link between mubtada and khabar) shape every sentence.
2. The teacher corrects a word or a form in class, or みや reports one → add the row to `data/class-vocab.json` in the same turn (`cite: "kelas:<date>"`) and a `note`.
3. `data/class-vocab.json` holds ONLY rows where the class differs from my choice, each with its cite (`doc:<line>` of the teacher's notes · `<NN>.ms@<mm:ss>` of a recording · `kelas:<date>`). Eval S95 fails on an uncited row.
4. Coverage is stated in the file's `coverage` key (which notes and recordings were read). A word outside it is my translation: say so when he asks.

## Ayat walk — one class, sentence by sentence (added 2026-10-07 per みや)

His reason for the focus: review ONE class through the week, sentence by sentence, in depth: mubtada, khabar, the kind of each isim, how to read each ending (baris depan / atas / bawah), **based ONLY on what the classes have taught, to avoid going overboard**.

1. **The engine prints, I paste.** `sentence` prints one ayat: the Arabic, the Malay, one table row per word (Kalimah · Jenis · Peranan · Baris akhir · Sebab), `Binaan`, `Sumber kelas`. I add no grammar sentence of my own, before or after.
2. **Learned-only is mechanical, not a promise.** Every reason text comes from the closed `sebab` table in `data/sentences.json`. A reason either cites the class that taught it (`doc:<line>` of the teacher's notes or `<NN>.ms` = recording NN) or is marked `belum` and reads "belum dipelajari di kelas". Eval S76 fails on an uncited reason, on a row that uses a key outside the table, and on word rows that do not rebuild the ayat.
3. **A "why?" beyond the table**: answer only from `topic <id>` output or by reading the cited recording in `source/transcripts/`. If the class did not cover it, the answer is "belum dipelajari di kelas". Never explain from general Arabic grammar. The teacher's own words are the vocabulary: baris depan / atas / bawah, tanwin, mubtada, khabar, mudaf, mudaf ilaih, sifat, mawsuf, badal, huruf jarr, majrur; he avoided "mabni" (say "barisnya tetap").
4. **Adding a class's ayat is a BUILD step** (once, verified, frozen): read the page images, write full harakat, split attached pronouns and prefixes into their own rows, use only existing `sebab` keys. A new reason needs its class cite found first (grep `source/transcripts/` and `data/syllabus.json`); no cite = `belum`. Run the eval, add a row to `data/VERIFY-LOG.md`.
5. Entered so far: Lesson 13 part ب, the dialogue (9 ayat) and Exercise 2 (23 ayat); Lesson 13 part ج, the dialogue (13 ayat, 2026-10-13). NOT entered: Exercises 1, 3, 4, 5, 6 of part ب, the exercises of part ج, and every other lesson.
6. Format: Arabic stands alone in its cell or on its own line; Malay cells carry no Arabic letters; no Latin transliteration (S76 checks all three).
7. **In chat, Arabic sits ONLY in a table cell, alone** (2026-10-13 per みや: "no writing from the right"). Never in a heading, a bullet, a sentence, or a cell that also holds Latin text: his app turns any line that holds Arabic to right-to-left and scrambles the word order. A heading is Latin only (`Ayat 1`); a reason names the thing in Malay ("seorang lelaki"), never by quoting the Arabic word. Applies to class-along and the ayat walk alike.

## Data (built by the Phase 1–2 pipeline, frozen + verified)

- `data/syllabus.json` — 24 grammar topics in class order (rules + examples, doc-cited). `data/classes.json` — 69 classes. Both verified against the teacher's doc (`data/VERIFY-LOG.md`).
- `data/paradigms.json` — 8 closed form-tables (pronouns ×3 · demonstratives · relative · numbers · verb madhi + mudhari) keyed by person/gender/number → deterministic form-drill lookup.
- `data/roots.json` — 16 root families where harakat flips meaning. `data/words.json` v2 — 198 words with `root` + `pos`.
- `data/sentences.json` — the ayat of a class for the ayat walk: a closed `sebab` table (26 reasons, class-cited or `belum`) + 45 ayat (Lesson 13 part ب 32, part ج 13), each split into word rows. Schema in `data/SCHEMA.md`.
- `data/class.json` — the class log (one session per class day: positions, notes, closed) + the revision asks. `data/class-vocab.json` — the teacher's own Malay where it differs from mine, each row cited.
- Rebuild provenance: `library/scripts/phase1|phase2/` (BUILD once → verify → freeze; USE = script over the frozen JSON).
- Checking whether a word is in `words.json`: compare with harakat stripped (a node one-liner over the file), never a bare-letter Grep. Vocalised text does not match bare letters, so a present word looks absent. The list holds each lesson's الكلمات الجديدة box only, not every word of a dialogue.

## Hard rules

Rules 1, 3 and 5 are for the word review. In the ayat walk the engine's ayat block is the whole reply (one ayat, nothing added).

1. **Effort ceiling**: the whole exchange is the table + one recall line. No explanations, no grammar notes, no praise, no extra words. みや types at most one line, or nothing (glancing counts as a review).
2. **Never ask みや for a meaning.** Malay comes from `words.json`. If a meaning looks wrong, fix `words.json` and add a row to `data/VERIFY-LOG.md`; never ask.
3. **Closed vocabulary on sentence days**: every content word must be in the `more` list. Cannot fit? Write fewer sentences.
4. **Answers**: `sukkarun`, `سكر`, `سكرن`, `سُكَّرٌ` are all valid — the engine normalises. Always run `answer`; never judge by eye.
5. Banned: re-explaining a rule みや already knows, showing more than 5 words, asking "ready?", adding a second recall.

## Boot nudge

**Off since 2026-10-05** (per みや: Arabic runs only when `/arabic` is invoked). `domain/arabic-nudge/arabic-nudge.check.hook.js` used to print one line at SessionStart (`📖 Arabic: 2/5 reviews this week · not yet today`); it is no longer registered. That exact line now comes only from `node .claude/skills/arabic/arabic.js nudge`; `/arabic status` prints the fuller week line (`Week N · Lesson X · N/5 reviews · misses · next roll`). There is now NO unprompted mention of Arabic in the system.

## Eval

`node .claude/skills/arabic/arabic.test.js` — 115 checks (S105–S112 + S107b, 2026-10-28: menu of five modes in order, baris pool keeps only changing endings with every reason class-cited (a `belum` reason never asked, also checked on the real data), verdict on baris and reason separately by number or name ("khabar di depan" stays one name), missed word first next round, a reply with no baris word goes to the word recall, class mode reads the latest stop point and maps its pages to files, `mode class 1 ب` stays class-topic; run it from the main folder, the real-data checks need `data/`; S96–S104, 2026-10-27: start mode — menu with no mode, vocab / class-latest / class-topic set and routed, class-latest follows the last class position, topic mode and its next, `review next` gives 5 new words and wraps; S78–S95, 2026-10-13: class log, close and journal line, reopen after a late note, save check pass / fail / no class, revision asks counted by ayat and never by date, `gloss` matching, the real class vocabulary cited; S1–S48 core: matching incl. no-shadda + typed-ن tanwin, chunk split, week roll, carry-over, override, modes, miss-first, idempotent same-day, status, nudge, corrupt state, real-data full walk; S49–S63 Phase-3: syllabus/paradigms/roots load, topic review, root families, form drill pose+resolve, drill routing, no-disturbance of the daily flow; S64–S77 class focus + ayat walk: hold across the week roll, wrap inside the lesson, replace rules, walk / again / jump / list, `daily` routing, S76 the learned-only gate on the real data, S77 every real ayat renders). Must be green before any engine change ships.
