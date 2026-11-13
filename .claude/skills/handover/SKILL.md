---
name: handover
description: Use when a cause or a fix is handed to another team or module (Common, GIS, SPOC, reports, teknikal, DMS) — a "pass to Common", a "not ours" verdict going out, a Redmine note for another team's developer — and whenever miya says "/handover", "handover", "hand-over", "hand it over", "pass to <team>", "pass this ticket to them". ALWAYS invoke BEFORE the note or file is staged.
---

# handover — nothing leaves us unproven, unfixed or unaudited

Picture: `.claude/skills/handover/diagram.png`.

## The Iron Law

```
NO NOTE TO ANOTHER TEAM IS STAGED UNTIL STEPS 1-5 ARE DONE AND THE Handover: LINE IS IN THE REPLY
```

**Violating the letter of this skill is violating the spirit of it.** Enforced at Stop by `domain/ownership-input-check` (the `Handover:` rider).

## Who reads it decides the route

| Reader | Route |
|---|---|
| Another team's or module's developer (a cause or a fix of theirs) | **this skill, steps 1-6** |
| BA (our fix passed for testing) | `redmine-phase1-prefill` + Pena `redmine-ba-pass` |
| Junior (guide, hints only) | Pena `junior-handover`: never the cause or the fix |
| Infra (server, network, PROD patch run) | `.claude/auto-memory/feedback_prod_patch_infra_handoff.md` block |

## Steps (another team's developer)

| # | Step | Done when |
|---|---|---|
| 1 | **Ownership proven** — `cross-module-check` steps 1-7, verdict THEIRS / BOTH / CATER | `Input check:` rows + verdict row shown |
| 2 | **Proof split** — one table for miya: PROVEN (DB row or code line read this session) · INFERRED · NOT RUN, with a confidence %. Pena `proven` + step 4b run on the note | an inferred fact is never written as fact in the note; what was not run is said to miya, not in the note |
| 3 | **Fix file** in the cycle folder (`2. Fix\` or the latest `N. Rework\`): the bare BEFORE / AFTER file (shape: `.claude/auto-memory/feedback_cross_module_handoff_artifact.md`) + a screenshot of it named `<n>. <what it shows>.png`. No Task folder yet → `node quest/redmine-sync.js <ticket>` creates it | both files exist; "none" only when the cause is not in code: `none: data` · `none: config` · `none: env` |
| 4 | **Note** — Pena profile `redmine-dev-mapping`, plus Root cause and Solution rows (Solution = the fix we suggest); each section carries only what it discusses; nothing aimed at another reader (the SLA impact card goes to the manager, never into this note). Then `node lib/handover-check.js --brief "<Task folder>\1. Brief" --draft <note.txt>` exits 0: no Expected row the ticket did not ask for, no line number without its file and branch; a flagged row is kept as today's output or put to the BA as a question, never guessed | `PENA:` clean · `EXPECTED SOURCE` + `HANDOVER-CHECK:` lines pasted |
| 5 | **Audit before staging** — ONE agent on the highest model (`node lib/models.js highest`), prompt line `// opus-reason: adversarial check of the cause and fix handed to another team`, given the draft + the evidence paths only, never my conclusion. It refutes the cause, checks the fix compiles and breaks no caller, names the cheapest live check, and marks each claim of the note `PROVEN (file/row)` · `NOT PROVEN` · `WRONG` | every change it names is made; `CLAIM-AUDIT: <n> claims · <n> proven · <cut/reworded>` pasted |
| 6 | **Stage, then stop** — the ticket's edit form in Edge (Claude in Chrome): Assignee + Notes + Root Cause (DEV) + Solutions; % Done = 50 ONLY when Module is Pelupusan or Awam AND the BA asks us to fix it, else untouched; every file uploaded from the cycle folder (`domain/redmine-upload-path` blocks any other folder). Reports team (any `.jrxml`) = Assignee Nurhayati Abdul Razak, note opens "Salam kak Yati," (people: `etanah-knowledge/<state>/STATE-FACTS.md` § 8). Submit only on miya's word | form filled, read back, not submitted |

## The Handover: line (last line of the staging reply)

```text
Handover: proof <proven % or "proven"> · fix <cycle-folder file name | none: data|config|env> · audit <model> <verdict>
```

Self-audit: before the reply, read back the staged form (note text, assignee, attached file names) and check each against steps 2-5; a miss is fixed and read back again.

## Red Flags — STOP

- "The sweep already audited it" — the sweep audited the cause; nobody audited the hand-over (289337)
- "Common will write the fix themselves" — miya wants the fix file with every hand-over
- "92% is close enough to say it as fact" — inferred goes in the proof split, never as fact in the note
- "The impact card is evidence, put it in" — it is for the manager; a section carries only what it discusses

| Excuse | Reality |
|---|---|
| "No fix file: it is their module" | the file is a suggestion, not an edit of their repo |
| "Audit costs tokens" | one agent per hand-over; a bounce-back costs a day (#282442) |
| "He didn't ask for an audit this time" | he asked once for every time (289337) |

symptom: 2026-11-13 miya 289337: 'you didn't even attach a handover fix ... I typically ask you to check properly and even ask you to audit and use highest model before handing over ... invoke a /handover skill to make it more deterministic'
goal: every hand-over of a cause or fix to another team leaves with the proof split, the fix file and a highest-model audit, in a note whose sections carry only what they discuss
goal_signal: a reply that stages a note or file for another team carries a Handover: line naming proof, fix file and audit verdict
retention: keep
footprint: on-demand: no process; skill text loaded on a hand-over turn, plus one highest-model agent per hand-over
boundary: covers a hand-over of a cause or fix to another team or module · never submits a Redmine form or edits another team's repo · stops at the staged note, Submit is miya's
self_audit: the staged form is read back against steps 2-5 before the reply

## History
- 2026-11-13 — born per miya (289337). Audit model = highest per his answer: "Fix this rule since it goes against what I requested and had in mind." Moved here, word for word in substance, from the quest skill §Hand-over to ANOTHER TEAM (2026-10-27, 286462 / 286650: note + Root cause/Solution, bare file, prefilled tab, % Done rule, Reports to kak Yati, `handover-check.js`, CLAIM-AUDIT on the highest model, cycle-folder upload) and from `feedback_cross_module_handoff_artifact.md` (keeps the file shape only). Added: the proof split, the screenshot of the fix file, the focused-section rule, the `Handover:` line and its Stop check. Root cause of the 289337 miss: that section lived only inside the quest workflow, and a sweep-to-staging turn never loaded it.
