---
name: etanah-teach
description: Teach miya etanah from zero, in layers, overview first, down to the depth his question needs. ALWAYS invoke when he wants to LEARN or UNDERSTAND (not fix) an urusan, a tugasan, a screen, a business rule, a feature or a ticket or adhoc issue — "teach me", "explain to me", "I want to understand", "I want to learn", "what is <URUSAN> about", "what does this tugasan do", "why does the system do X", "explain this issue to me", "/etanah-teach". Feature home domain/etanah-teach/.
---

# etanah-teach — a lesson in layers, overview first

**Reader**: someone who knows nothing about etanah. Every layer opens with ONE plain sentence in everyday words, then ONE table or picture, then its `source:` line. No jargon before it is defined in an earlier layer.

## The layer ladder

| Layer | Answers | Read first (state folder `etanah-knowledge/<state>/`) |
|---|---|---|
| L0 eTanah + module | what the system is, which module this sits in | `MODULE-ARCHITECTURE.md` · `DOMAIN-GLOSSARY.md` |
| L1 Urusan | who applies, for what, under which law, what they get at the end, its kinds (jenis) | `DOMAIN-GLOSSARY.md` · `urusan/<KOD>-TICKETS.md` · `node quest/requirement-index.js --find "<KOD>"` |
| L2 Journey | the tugasan in order, who (peranan) does each, the branch this case takes | `flowables-bpmn/MLK_PLP_<KOD>.bpmn20.xml` · `PERANAN-MAP.md` · `URUSAN-FLOW.md` · `FLOWABLE-WORKFLOWS.md` |
| L3 Tugasan | the screen: what the officer sees, keys in and saves | `FLOW-TRACES.md` · the ticket's qa_doc · the BA's screenshots |
| L4 Rule / feature | what decides the value, which requirement or fix set it, with a worked example | `node quest/requirement-index.js --read <req>` · qa_docs · `BUG-BESTIARY.md` · `SPOC-COUNTER.md` |
| L5 Code + data | the method and the column (only when he asks, or the issue needs it) | `DATABASE.md` · codemap · read-only SELECT |

**Stop layer** = the shallowest layer that answers his question: "what is PRBB" → L1 · "what does PYB4CE do" → L3 · "why 07/12 and not 08/12" → L4 · "where is that computed" → L5. Every layer above the stop layer is still given, one short block each, so the reader climbs down from the overview.

## Procedure

1. **Name the subject and the stop layer** in one line: `TEACH: <URUSAN> · <topic> · stop L<n>`. A ticket or adhoc → its urusan and the tugasan where the issue shows.
2. **Read what is saved**: `node domain/etanah-teach/teach.js sources <URUSAN> [--state <state>]`. It prints the saved lesson's layers and the knowledge files for each layer. A layer already in the lesson is reused, re-checked only if its `checked:` date is older than 30 days or the question contradicts it.
3. **Fill each missing layer top down**, knowledge file first. A fact the files do not hold is verified (BPMN grep, read-only SELECT, code read on `origin/mlk/master`) before it is written; anything unverified is written as `not verified`. A worked example uses the real case of the question (dates, ids). Write the new fact back to its knowledge file too when it is reusable outside the lesson (CLAUDE.md KNOWLEDGE-FIRST).
4. **Save** the layers to `etanah-knowledge/<state>/learn/<URUSAN>.md` (shape below), then run `node domain/etanah-teach/teach.js audit <file> --to L<n>`. `TEACH: FAIL` → fix the named layer, re-run until `TEACH: PASS`.
5. **Reply**: the layers L0 → stop layer, each as heading + plain sentence + table or picture (a flow of 3+ boxes = an `explain-diagram` picture). End with the `TEACH: PASS` line and one line naming the next layer he can ask for.

## Lesson file shape

```
# Learn — <KOD> (<full urusan name>)
state: <state>

## L0 · <title>
<one plain sentence>
<table or ![picture](path)>
source: <file or ticket>
checked: YYYY-MM-DD

## L1 · ...          (L2, L3 ... in order, no gap)

## Questions asked
| Date | Question | Stop layer |
```

## Rules that shape the output (link, not copy)
- Plain words first, layers, pictures: `.claude/reply-shape-spec.md` §3c (no overload) · §3d (name the thing) · §3e (no vague words); `explain-diagram` skill for pictures.
- Business facts first from etanah-knowledge (CLAUDE.md KNOWLEDGE-FIRST); requirement lookups via `quest/requirement-index.js` (never read the whole index).
- A DB fact shows its SELECT (`domain/db-claim-proof`), unqualified, no JOIN.

**Banned**: starting at the code · a layer whose first line is a table, code or `file:line` · skipping a layer above the stop layer · a fact with no `source:` · stating an unverified fact as fact · editing code, writing a DB, or posting anywhere from this skill.

symptom: 2026-11-13 miya: 'I want to learn, please create a new Feature ... to explain as in someone that doesn't understand anything about etanah system ... explain in layers starting with the overview then go one layer and another layer to the question asked'
goal: miya understands any etanah urusan, tugasan, feature or ticket issue from zero, reading layer by layer from the overview down to exactly the depth his question needs, with every fact sourced
goal_signal: the lesson reply prints TEACH: PASS from domain/etanah-teach/teach.js audit on the saved lesson file
retention: keep
footprint: on-demand: no process at boot or per prompt; one node call under 0.2 s per lesson audit
boundary: covers etanah-knowledge files, requirement index, BPMN, qa_docs and read-only DB or code checks for the question, and the lesson file etanah-knowledge/<state>/learn/<URUSAN>.md · never edits etanah code, never writes a DB, never posts to Redmine or WhatsApp, never states an unverified fact as fact · stops at the lesson shown to him with the layer reached and the next layer he can ask for
