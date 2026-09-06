---
name: arabic
description: みや's daily Arabic vocabulary review — a few seconds to 2 minutes, in chat. Triggers — "/arabic", "arabic review", "arabic today", "/arabic more", "/arabic week <lesson>", "/arabic week next", "/arabic class at <topic>", "/arabic status", any reply that answers a pending Arabic recall (Arabic script or Latin transliteration like "sukkarun"). Spec: projects/learning-projects/active/arabic/SPEC.md.
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

PowerShell form: `node ".claude\skills\arabic\arabic.js" review`.

## Hard rules

1. **Effort ceiling**: the whole exchange is the table + one recall line. No explanations, no grammar notes, no praise, no extra words. みや types at most one line, or nothing (glancing counts as a review).
2. **Never ask みや for a meaning.** Malay comes from `words.json`. If a meaning looks wrong, fix `words.json` and add a row to `data/VERIFY-LOG.md`; never ask.
3. **Closed vocabulary on sentence days**: every content word must be in the `more` list. Cannot fit? Write fewer sentences.
4. **Answers**: `sukkarun`, `سكر`, `سكرن`, `سُكَّرٌ` are all valid — the engine normalises. Always run `answer`; never judge by eye.
5. Banned: re-explaining a rule みや already knows, showing more than 5 words, asking "ready?", adding a second recall.

## Boot nudge

`domain/arabic-nudge/arabic-nudge.check.hook.js` prints one line at SessionStart (`📖 Arabic: 2/5 reviews this week · not yet today`). Never shows words. The only unprompted mention of Arabic in the system.

## Eval

`node .claude/skills/arabic/arabic.test.js` — 42 scenarios (matching incl. no-shadda + typed-ن tanwin, chunk split, week roll, carry-over, override, modes, miss-first, idempotent same-day, status, nudge, corrupt state, real-data full walk). Must be green before any engine change ships.
