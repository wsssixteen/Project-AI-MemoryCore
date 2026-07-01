# Learn-From-Others-Fixes — plan v1

> Draft 2026-06-30. Awaiting みや review + nod. Routed through system-design + system-rules.

---

## Bottom Line

A **manually-invoked skill** — `learn-from-fix <ticket_or_commit>` — that reads a colleague's closed fix (git commit + Redmine ticket) and produces a **5-section structured extract** which lands into etanah-knowledge as durable learning. **No hook.** **No auto-fire.** Simple + specific + proven on ≥2 already-closed tickets before ship.

---

## Why this exists

```
┌──────────────────────────────────────────────────────────────┐
│ Colleagues (Aaron / Vincent / faizudin / Amirul / …) close   │
│ tickets we don't own. Their commit + Redmine journal carry   │
│ the WHY and HOW.                                             │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Without systematic capture: we rediscover their learnings    │
│ when we hit a similar shape next time — expensive.           │
│ Today's QA-268170 delegation is the trigger case: we PASSED  │
│ it to a colleague; when they land the fix, we lose the       │
│ lesson unless we capture it.                                 │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ WITH capture: each colleague fix produces a mini-postmortem  │
│ that (a) fills etanah-knowledge, (b) surfaces to future      │
│ Recon/Rubric via existing knowledge-load paths, (c) grows    │
│ the "BA-wording → code artifact" dictionary organically.     │
└──────────────────────────────────────────────────────────────┘
```

---

## What it IS / What it is NOT

| Aspect | Value |
|---|---|
| IS | manually-invoked skill; 1 folder under `.claude/skills/learn-from-fix/`; input = a ticket # or a commit SHA; output = a structured extract MD stub + edit-proposals to specific etanah-knowledge files |
| IS NOT | a hook · an auto-fire on deploy · a background watcher · a database · a Redmine scraper (uses local History.txt from the Task folder OR advises `redmine-sync.js --create` first) |

---

## Trigger MOMENT (per system-design Rule 8)

| When it fires | Why NOT broader |
|---|---|
| Manual invoke: みや (or I) says "learn from QA-268170" / "learn from commit abc1234" / `/learn-from-fix 268170` | SessionStart = too broad (fires when nothing to learn); every UserPromptSubmit = noise; deploy-watch = infrastructure we don't have. Manual = fires exactly when a lesson is available AND worth extracting. |

---

## The 5-Section Extraction Schema

The heart of the plan. Every learn-from-fix run produces THIS shape (skill enforces via schema).

### Section A — Ticket identity

| Field | Source |
|---|---|
| ticket # / urusan / tugasan / env | active-archive.txt block (if we owned prior) OR git commit message (`#<num>` ref) OR Redmine ticket lookup |
| BA verbatim symptom | Task folder `0. Brief/Description.txt` OR Redmine ticket description |
| BA verbatim Expected | Task folder `0. Brief/History.txt` latest cycle OR Redmine journal |
| colleague author + close date | `git log -1 --format="%an %ci %s" <commit>` |

### Section B — Root cause

| Field | Value shape |
|---|---|
| category | one of the closed enum: `shared-method-blast-radius` · `hardcoded-flag` · `wrong-writer` · `missing-populator` · `template-placeholder` · `config-exclusion` · `duplicate-on-append` · `cache-stale` · `cross-module-drift` · `other` |
| one-sentence root cause | plain-English, no jargon |

**Why closed enum**: forces us to name the SHAPE of the bug, not just describe it. Categories accumulate → we notice patterns (e.g. "3rd config-exclusion this quarter" = signal for a defender).

### Section C — Fix shape

| Field | Value shape |
|---|---|
| fix pattern | `minimal-diff-extension` · `analog-copy` · `restructure` · `config-toggle` · `template-restructure` · `OR-chain-extension` · `new-populator` · `other` |
| files touched + line-count | `git diff --stat <commit>` output |
| analog cited in commit body? | yes + which analog / no |
| blast-radius verified in commit? | yes + how / no |

### Section D — Learnable factors (the meat)

| Learnable factor | Where it lands |
|---|---|
| BA-Malay-wording → code artifact mapping (e.g. "Maklumat Pengguna" → CC tag `maklumatPengguna` + populator `PelupusanWordCCMethodConstant.java:906`) | `etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` §BA-wording |
| Symptom-class → root-cause-category dictionary entry (e.g. "papar placeholder text" → likely `config-exclusion` or `missing-populator`) | `BUG-BESTIARY.md` §symptom-class routing |
| New data-flow trace | `FLOW-TRACES.md` |
| New JSF wiring pattern | `JSF-WIRING.md` |
| New tugasan/langkah routing | `FLOWABLE-WORKFLOWS.md` §tugasan-map |

### Section E — Reuse potential

| Question | Action if YES |
|---|---|
| Would this fix pattern have accelerated a past OUR ticket? (grep past QA-NNNN.md for similar symptom keywords) | Note the historical parallel in the extract's cross-ref |
| Should this become a Debug Profile check-item? (Debug Profile = per-category BUG-BESTIARY section — todo.md Q2 pending) | Queue as a Debug Profile addition |
| Should a hook be built to detect this symptom-class going forward? | Route through meta-design-router; log to slip-log as "learning-triggered defender candidate" |

---

## Where extracts land

### Primary durable home

`etanah-knowledge/melaka/LEARNED-FROM-COLLEAGUES.md` (NEW — proposed) — one section per fix, dated + ticket-numbered + author-cited. Chronological append. Boot-loaded on-demand (via etanah-knowledge tiered load "Conditional" tier when a related keyword appears).

### Secondary edit-proposals

The skill EMITS proposed edits to these existing files (I apply after みや's nod, per convention-check-gate + no-parallel-code rule):

| Existing file | What the extract proposes to add |
|---|---|
| `BUG-BESTIARY.md` | root-cause category count + new symptom-class entry if novel |
| `DOMAIN-GLOSSARY.md` | new BA-wording → code artifact row |
| `FLOW-TRACES.md` / `JSF-WIRING.md` / `FLOWABLE-WORKFLOWS.md` | discovered flows / wiring / routing, when the fix revealed them |

---

## System-design layering (per Rule 7 pick primitive)

```
┌──────────────────────────────────┐
│ Skill layer:                     │
│  .claude/skills/learn-from-fix/  │  ← THE primitive
│  ├── SKILL.md (procedure)        │
│  └── template.md (extract shape) │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Hook layer: NONE                 │  ← Rule 4 "start simple"
│  (no trigger.hook · no back-gate)│    add only when observed slip
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Eval layer:                      │
│  eval.workflow.js — score the    │  ← per Rule 6 (behavior reliability)
│  extract quality on 2 known      │
│  tickets before ship             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Log layer (Rule 5):              │
│  domain/learn-from-fix/log.jsonl │  ← per-invoke audit trail
└──────────────────────────────────┘
```

---

## Validation ("proven" gate before ship)

Skill ships ONLY after PASS on both:

| Test ticket | Why | Pass criterion |
|---|---|---|
| **QA-267382** (my own, closed 2026-06-27) | I know the answer — control case | Extract surfaces JBIG2 root-cause category + `template-restructure` + `analog-copy` + BA-wording mapping. Zero surprise = OK. |
| **QA-245240** (faizudin's, delegated 2026-06-05) | Colleague's fix — real target-case | Extract surfaces the RPPLP Bayaran Yang Disyorkan mechanism + at least ONE new learnable factor NOT already in our knowledge. If zero new = extract is too shallow. |

---

## Decisions (みや 2026-06-30 — locked)

| Q | Answer |
|---|---|
| Q1 | **Fold into `BUG-BESTIARY.md`** — no new file. Keeps it simple; the ticket # + commit SHA + date in each entry carries provenance without a separate ledger. |
| Q2 | **No names.** Cite "colleague" + commit SHA + date + ticket #. Provenance = git; identity irrelevant to the learning. |
| Q3 | **Proposed edits + I apply.** Progressive trust: **promote to direct-apply IF quality holds** after ~3 extract runs (measured by みや-nods-without-correction rate). |
| Q4 | **Manual trigger only.** No SessionStart hook. Fires when みや (or I) explicitly ask. |

## Consequent scope shrinks (per "no need to over-complicate")

- **NO** new `LEARNED-FROM-COLLEAGUES.md` file (fold into `BUG-BESTIARY.md`).
- **NO** colleague-name field in the extract template.
- **NO** eval.workflow.js in v1 — the log.jsonl + みや-nod-rate IS the running eval. Build formal eval only if extract quality is inconsistent after 3 uses.
- **NO** SessionStart signal hook — manual invoke only.

---

## Build order (once みや nods)

| # | Step |
|---|---|
| 1 | `Feature/Learn-From-Others-Fixes/` — this plan lives here permanently |
| 2 | Create `.claude/skills/learn-from-fix/SKILL.md` + `template.md` (extract schema) |
| 3 | Create `domain/learn-from-fix/log.jsonl` audit log path (per system-rules Rule 5) |
| 4 | Write `eval.workflow.js` — score extract quality on QA-267382 + QA-245240 |
| 5 | Run eval; iterate skill until PASS on both |
| 6 | Create empty `etanah-knowledge/melaka/LEARNED-FROM-COLLEAGUES.md` header |
| 7 | Register skill in the meta-layer INDEX (`meta/INDEX.md`) |
| 8 | Update `meta/system-architecture.md` with the new Power |

**Estimated size**: 1 skill file + 1 template + 1 log dir + 1 eval workflow + 1 new knowledge file. Small. Single-session buildable after nod.

---

## Cross-references

- Trigger case: **QA-268170** (delegated 2026-06-30, `learning_marker=true` in active.txt) — first live test target when colleague ships
- Related todo.md standing flag: 🎓 LEARN STANDING FLAG (added this turn)
- Cousin concept: **Debug Profile** (todo.md Q2 — per-category BUG-BESTIARY check-items) — learn-from-fix FEEDS Debug Profile
