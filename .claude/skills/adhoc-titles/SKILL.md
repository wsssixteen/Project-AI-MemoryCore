---
name: adhoc-titles
description: List the short ProTime titles of the day's adhocs, ready to paste. ALWAYS invoke on — "/adhoc-titles", "adhoc titles", "titles for protime", "protime titles", "compile the titles", "today's adhoc titles", "what do I write in protime", "tajuk adhoc", "tajuk protime", any ask for the day's adhoc list to log time against. Reads the titles the adhoc-save skill already stored; never invents one on the spot.
---

# adhoc-titles — the day's adhoc titles for ProTime

## When
みや asks for the titles to write into ProTime, by any of the trigger phrases, or at the end of an adhoc day.

## Do
1. Run `node lib/adhoc-titles.js` (today) or `node lib/adhoc-titles.js --date YYYY-MM-DD`.
2. Exit 1 means a listed adhoc has no title. Write one now (shape below) with
   `node quest/active-cli.js update <ADHOC-ID> "title=<title>"`, put the same title on the `- Title :` line of its qa_doc, then run step 1 again.
3. Read each title before sending. It must carry the ISSUE word (what is wrong). A title that only names the subject is rewritten first, same command as step 2.
4. Reply with the titles only, ONE fenced block PER title (each gets its own copy button), in the order the script printed them.

## Title shape (same rule as adhoc-save)
`<URUSAN> <subject keywords> <issue word>` · max 6 words · max 40 chars · no ids, no permohonan, no env, no punctuation.
The issue word is mandatory: `missing` · `tiada` · `hilang` · `tak papar` · `ralat` · `salah` · `stuck` · `tak boleh` · or the ask itself (`alter`, `patch`, `semak`).
The title must also NAME THE THING the issue is about in a plain word (`tugasan`, `dokumen`, `ulasan`, `bayaran`, `surat`). A kod alone (`SKM`) does not say what it is.
Test before sending: reading only the title, can みや answer "what is wrong with what?" If not, rewrite.
Good: `PLPS tugasan SKM tiada dalam inbox` · `MLPS ulasan SOK laporan tanah missing`.
Bad: `MLPS ulasan SOK laporan tanah` (no issue word) · `PLPS SKM tiada dalam senarai` (what is missing? the word `tugasan` is absent).

## Reply shape
First line: how many adhocs and the date. Then one fenced block per title. Nothing else, no table, no ids, no Next steps.
Never put two titles inside one fence.
An adhoc that started on an earlier day and was picked up again today is listed too; say "continued" beside it only if みや asks which is which.

## Banned
- Making up titles from chat memory instead of running the script.
- Adding ids, permohonan numbers or the environment to a title.
- Asking みや which adhocs he worked on today; the blocks already say.

symptom: 2026-10-04 miya: "I don't want to keep on repeating to ask for a simple short keyword title to put into protime"
goal: one trigger word returns the day's adhoc titles, paste-ready, with no follow-up question
goal_signal: `node lib/adhoc-titles.js` exits 0 in the same turn the titles are given
retention: keep
footprint: on-demand: 1 node process per call, about 1 second, nothing running otherwise
state-scoped: no, one list across every state
