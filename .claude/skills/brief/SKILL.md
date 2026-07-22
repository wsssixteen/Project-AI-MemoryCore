---
name: brief
description: Brief みや on a ticket, quest, or work item BEFORE he starts it — a start-of-work orientation product, not an end-of-work summary. Story diagram + tables + short bullets only, zero prose walls. Triggers — "/brief", "brief me", "brief me on X", "brief me before I start", "what am I walking into", "orient me on X", "give me the brief", "what's this ticket about", "catch me up on X", any moment みや is about to pick up a ticket he has not been holding in his head.
---

# /brief — start-of-work orientation

**Job**: get みや from cold to ready-to-act on ONE work item. He reads this and knows where to click, what to change, and what could bite him.

**Not this skill**: `stop-point-summary` (end of work) · `kowalski` (architecture orientation in code) · Session Briefing (whole session, all quests).

---

## Format law

**Only three shapes are allowed in the body**: story diagram · table · bullet with a short sentence.

| Allowed | Banned |
|---|---|
| ASCII story diagram (boxes + arrows, data rides the arrow) | Any paragraph |
| Table (one concern per cell) | Multi-sentence bullets |
| Bullet — ONE short sentence | Narration of how I found it |

Format is already hook-enforced by `domain/show-gate` + `domain/terse-gate`. This skill does not restate their rules — it supplies the CONTENT.

---

## The 6 blocks — in this order, none skippable

Order is load-bearing: what he can SEE → then code → then risk. Never lead with code.

### 1. Bottom line — 1 sentence
What is broken (or wanted), in みや's/BA's words, not mine. Quote BA verbatim where a symptom is disputed.

### 2. Where he'll see it — table

| Row | Content |
|---|---|
| Urusan / module | e.g. PRBB |
| Screen or document | the thing he opens |
| 🚨 Repo | name it — reflex is often wrong |
| Env + test data | permohonan ID **+ pengguna semasa** (never an ID alone) |

### 3. The story diagram — MANDATORY
Trigger → path → ⚠️ defect site. Every node a full address (`<repo>\<path>\<File>.<ext>:<line>`, `<Class>.<method>():<line>`). Mark the defect `⚠️`.

```
<repo>\<path>\<UI file>:<line>   "<button label>"
       │  <what binds it>
       ▼
<Class>.<method>():<line>
       ▼
<repo>\<path>\<defect file>:<line>   ⚠️ <one-phrase what's wrong>
```

### 4. The fix — table, one row per site

| # | Site (full address) | From → To |
|---|---|---|

If the bug has a **class**, every sibling instance gets a row — never just the flagged one.

### 5. What could bite — bullets, ≤4
- Wrong-repo / wrong-module trap.
- Sites that look in-class but must NOT change, and why.
- Anything unverified, labelled `HYPOTHESIS`.
- Confidence % + the cheapest falsifier.

### 6. First move — 1 bullet, imperative
Exactly what みや does first. Names who acts.

---

## Rules

| Rule | Detail |
|---|---|
| Confidence | State a % once, in block 5. Never assert past verified evidence. |
| Evidence labels | `VERIFIED` (line read) / `HYPOTHESIS` / `BA-Q`. Unlabelled = claimed as fact. |
| Length | ≤60 content lines. Longer means the investigation is unfinished — finish it, don't pad the brief. |
| Source | Read the qa_doc + Task folder first. A brief written from memory is banned. |
| No asking-back | Any question a tool can answer, answer it before briefing. Only genuine forks reach him. |

**Banned**: leading with the code · a bare filename or bare method · a permohonan ID with no login · burying a blocker mid-table · "as discussed previously".

---

## Verify

```
node domain/brief/eval.js              # 3 fixtures
node domain/brief/eval.js <brief.md>   # score a real brief, 10 checks
```

**Rollback**: `domain/brief/NUKE-MARKER.md`.

*Version 1.0 — 2026-07-22. Born via `core/forge.js new skill brief`. Skill-only by design: the format constraint みや asked for is ALREADY hook-enforced by `domain/show-gate` + `domain/terse-gate`; a third gate would duplicate (system-rules Rule 1) and double-block. This skill supplies the missing piece — what a brief CONTAINS. Per system-design Rule 7 (leanest primitive). Eval 3/3 green before ship (Rule 6).*
