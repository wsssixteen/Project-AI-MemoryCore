---
name: change-card
description: The What / Why / How / When / Where card for a system change, one sentence each, How as a flow picture, Where as the change map. ALWAYS invoke at system/INDEX.md change route step 3 (the BEFORE card, shown before his nod) and step 8 (the AFTER card, as built), and whenever miya says "change card", "what why how when where", "5W", "before and after card", "card for this change".
---

# change-card — five lines before and after every system change

He reads the card before he nods (change route step 3) and after the change lands (step 8). Same five lines both times, so the two compare at a glance.

## The card

| Line | One sentence that says |
|---|---|
| **What** | the part and what it does, in his words |
| **Why** | the failure or ask it answers, with the date |
| **How** | how it works; the picture is the **step 2 flow picture, reused by name**, never drawn a second time |
| **When** | the moment the part runs: its trigger (a step, an event, or "on ask"), the same fact as its footprint line |
| **Where** | the folder(s); the picture is the **change map** (`node lib/change-map.js <spec.json>`, the system map's boxes, each part tagged new / changed / removed) |

One sentence = one full stop at the end, no semicolon. Close the card with this exact line, so he knows the Where picture's name:

```text
Where picture = the change map (lib/change-map.js).
```

## The two moments

| Moment | Block written in `main/current-session.md` | Pictures |
|---|---|---|
| BEFORE (step 3) | `CHANGE-CARD (before): <change name>` under the STEP-3 block | How = the step 2 flow picture · Where = a **planned** change map, drawn from a spec JSON with planned tags |
| AFTER (step 8) | `CHANGE-CARD (after): <change name>`, the five lines rewritten from what landed | How = the same flow picture · Where = the step 8 change map: the SAME spec JSON, edited only where the build differed, rendered again. No third picture |

The GitHub main SHA and the main-folder SHA follow the AFTER card.

## Check before showing (self-audit)

```bash
node domain/change-card/change-card.js main/current-session.md --stage before
```

It checks the LAST card block of that stage. Show the card only on `CHANGE-CARD: PASS`; on a FAIL fix the named line and run it again. Eval: `node domain/change-card/eval.js`.

**Banned**: a line of two sentences or a semicolon · a How told in words only · a Where without the change map · an AFTER card copied from the BEFORE card without checking what landed · a second render of the flow picture.

symptom: 2026-11-05 miya: "Answer in single sentence each: What, Why, How, When, Where. How using diagram flow. Where using the boxed diagram (please remind me at the end what's the name) ... a very easy thing to review, before and after."
goal: every system change is shown to him as the same five one-sentence lines before the nod and after it lands
goal_signal: the step 3 and step 8 replies of a system change each carry a card that printed CHANGE-CARD: PASS
retention: keep
footprint: on-demand: no process; the checker is 1 node call under 0.1 s, twice per system change
boundary: covers the card text and its two pictures at change route steps 3 and 8 · never edits the change being carded, never replaces the STEP-3 block or the step 8 report · stops at the card shown to him with the PASS line
