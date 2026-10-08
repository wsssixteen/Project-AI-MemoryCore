---
name: pena
description: Pena — miya's writing style, as named modules. ALWAYS invoke before drafting ANY text that goes out in miya's name (Redmine note, BA pass, reply to another team's developer, Root cause and Solution, infra message, WhatsApp reply, junior handover), and whenever miya changes a sentence of mine or uses a style word. Triggers — "/pena", "pena", "my writing style", "my style", "write it like me", "in my voice", "redmine reply", "reply the redmine", "draft the note", "handover note", "I changed it to", "I used:", "another correction", "concise", "brief", "straight-forward", "too long", "jam", "separation of concern".
---

# Pena — how miya writes

Pena is the one home of miya's writing style. The style is split into **modules** (one style aspect each). A **profile** is the set of modules one kind of text uses. Other skills and tools name a profile, or name modules directly.

Engine: `node lib/pena.js` · Data: `domain/pena/` · Feature notes: `domain/pena/README.md` · Eval: `node domain/pena/eval.js`

symptom: 2026-10-08 #279554 miya: 'Have you built like a Feature for you to learn my writing style? Where you log the sentences I changed, what are the keywords I used'
goal: text written in miya's name follows the named style modules of its surface, and every sentence he changes becomes a stored example the next draft is checked against
goal_signal: the reply that carries a draft in his name also carries a PENA line naming the profile and the check result
retention: keep
footprint: on-demand: 1 node process under 1 second per show, add or check; nothing at boot, per prompt or per session

## Modules

| Module | What it means |
|---|---|
| `greet` | Salam + short name of the live assignee. Close with Thank you. |
| `lean` | Only what the reader does not have yet. No lead-in, no restating, stop after the last item. |
| `line` | Short sentences. A continuing sentence stays on the same line, at most 2. Never two facts in one sentence. |
| `table` | Field / table / column data goes in a table (Textile on Redmine). |
| `separate` | One kind of content per section: explanation, tables, scripts. |
| `script` | Scripts for another developer: one clause per line, mapped columns only, no JOIN, no schema prefix. |
| `proven` | A sentence about how the system behaves is counted or read in code first. Checked by hand. |
| `plain` | BA text: no file names, line numbers or code words. |
| `rojak` | Malay notes in his rojak. Dev words and connectors stay English. |
| `hint` | Junior handover: where to look, never the cause or the fix. Checked by hand. |

The full meaning, rules and banned list of each module live in `domain/pena/modules.json`. Read them with `show`; never retype them here.

## Profiles

| Profile | Use it for | Modules |
|---|---|---|
| `redmine-dev-mapping` | answer to another team's developer (table and column, how to read a value) | greet · lean · line · table · separate · script · proven |
| `redmine-ba-pass` | passing a fix or patch to the BA | greet · lean · line · plain · proven |
| `redmine-dev-fixlist` | fix list or findings for a developer | greet · lean · line · rojak · proven |
| `redmine-rootcause` | Root cause and Solution fields | lean · line · plain · rojak · proven |
| `infra-handoff` | message to infra | lean · line · proven |
| `whatsapp-dev` | WhatsApp reply | lean · line · rojak · proven |
| `junior-handover` | guide note for a junior | greet · lean · line · rojak · hint |

## Steps — every draft in his name

| # | Step | Command |
|---|---|---|
| 1 | Pick the profile for the text. No profile fits: name the modules. | `node lib/pena.js list` |
| 2 | Read the modules BEFORE the first draft. It prints each meaning, his style words and his last changed sentences. | `node lib/pena.js show --profile <profile>` |
| 3 | Write the draft into a scratch file. | — |
| 4 | Check it. Fix every finding, then answer each "by hand" question (for `proven`: the query or code line and the count behind each rule sentence). | `node lib/pena.js check --profile <profile> --file <draft>` |
| 5 | Put the `PENA:` line of the last check under the draft in the reply. | — |

## Steps — when miya changes a sentence or uses a style word

| When | Do, in the SAME turn |
|---|---|
| He changes a sentence of mine ("I changed it to", "I used:") | `node lib/pena.js add --module <m> --mine "<my sentence>" --his "<his sentence>" --ticket <n> --surface <profile> --his-words "<what he said>"` |
| He uses a style word (concise, brief, straight-forward, too long, jam, ...) | After he accepts the corrected text: `node lib/pena.js keyword --word "<his word>" --meant "<what the accepted text shows he meant>" --evidence "<ticket + his words>" --module <m>` |
| A correction fits no module | Say so. Propose a new module or a rule line for an existing one; he rules. |

`node lib/pena.js analyze` (Domain Expansion, or on ask) counts changed sentences per module. A module with 3 or more in the window is not holding: tighten its rule in `modules.json` or its check in `lib/pena.js`, then run the eval.

## How another skill or tool calls Pena

One line at the step that writes the text:

`→ Pena: node lib/pena.js show --profile <profile>` before drafting, `check` before the hand-back.

Or name modules when only some apply: `--module line,lean`.

## Limits

- `proven` and `hint` cannot be checked by a script. The check prints them as questions.
- The check reads shape, not truth. A clean check does not mean the content is right.
- Stored note shapes (the BA pass block, the infra block) stay in their own homes; each profile's `Also read:` line points to them.

**Banned**: drafting first and running `show` after · pasting a `PENA:` line from an older check · storing a changed sentence at the end of the session instead of the turn it happened.
