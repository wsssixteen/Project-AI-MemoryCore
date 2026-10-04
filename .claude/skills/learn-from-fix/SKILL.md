---
name: learn-from-fix
description: Extract lessons from a colleague's (or our own past) closed ticket fix — reads git log + commit diff + Redmine History.txt and produces a 5-section structured extract with proposed edits to etanah-knowledge. Manual-invoke only. Triggers — "learn from <ticket>", "learn from commit <SHA>", "extract lessons from <ticket>", "what can we learn from <ticket>", "/learn-from-fix <ticket>", "run learn-from-fix on <ticket>", the boot line "🎓 LEARN BEFORE CLOSE" (a delegated quest turned Closed on Redmine — run this BEFORE closing the block, per みや 2026-10-04). Never sweeps every closed ticket. Full spec + build history in Feature/Learn-From-Others-Fixes/plan-v1.md.
---

# /learn-from-fix — Extract lessons from a closed fix

## Purpose

When a colleague (or a past-self) closes a ticket, their git commit + Redmine journal carry the WHY and HOW. Without systematic capture, we rediscover the same learnings when we hit a similar shape next time. This skill produces a **5-section structured extract** and proposes edits to `etanah-knowledge/melaka/BUG-BESTIARY.md` (primary) + other knowledge files (secondary) so the lesson lands durably.

**Simple + specific + manual-invoke only.** No auto-fire. みや (or Ruri on his behalf) triggers when a lesson is available.

## When to invoke

- みや says "learn from QA-268170" / "learn from commit abc1234" / "extract lessons from #245240"
- I notice a colleague's fix just landed on a ticket we care about (e.g. delegated with `learning_marker=true` in active.txt) AND みや hasn't already asked
- We're doing a retrospective and want to mine 2-3 past fixes

- **Boot prints `🎓 LEARN BEFORE CLOSE`** (`quest/redmine-status-check.js`, verdict `learn`): a quest with `status=delegated` is now Closed on Redmine. Run this skill on it FIRST; the block is closed only after Step 3.5 has a verdict per finding.

**🚨 Delegated-quest close rule (みや 2026-10-04)**: a quest a colleague still holds open on Redmine (In Progress, Rework, Resolved) is NEVER closed locally — it stays `status=delegated` (boot verdict `tracking`). It closes only after Redmine shows Closed AND this skill ran. **Banned**: offering "close" for a `tracking` row.

Do NOT sweep every closed ticket. Do NOT invoke at SessionStart on a ticket that is not a delegated-and-Closed quest.

## Procedure

### Step 1 — Resolve input

Input = ticket number (`QA-268170`, `268170`, `#268170`, `QA-267382`) OR git commit SHA/ref.

- If TICKET → `git log --all --grep="#<num>"` OR `git log --all --grep="<QA-num>"` on etanah-pelupusan repo → get commit SHA(s) + author + date + subject line.
- If SHA → `git show --stat <sha>` → get files touched + commit body.
- If ticket has a Task folder under the resolved state's Task folder (`node lib/states.js show <state>` → `task_folder`; Melaka: `1. Tasks\Melaka\`) → read `0. Brief/Description.txt` + `0. Brief/History.txt` for BA verbatim.
- If neither task folder nor sync → advise: run `node quest/redmine-sync.js --create` first.

### Step 2 — Read the diff + commit body

`git show <sha>` for each commit. Note:
- Commit body (author's own words on the WHY)
- `git diff --stat <sha>` — files touched + line counts
- The actual diff hunks for each file (skim; deep-read only the load-bearing ones)

### Step 3 — Fill the 5-section extract (THE ARTIFACT)

Emit this shape as a fenced markdown block in chat. Use closed enums for A/B/C where offered — forces us to name the SHAPE, not just describe it.

```markdown
## <Ticket #> — <one-line title>
> commit `<SHA>` · <YYYY-MM-DD> · via colleague (or own-past)

### A. Ticket identity
- **Urusan / Tugasan / Env**: <fill>
- **BA verbatim symptom**: <quote from Description.txt or Redmine>
- **BA verbatim Expected**: <quote from History.txt latest cycle, or "none stated">
- **Close date**: <YYYY-MM-DD>

### B. Root cause
- **Category** (pick ONE): `shared-method-blast-radius` | `hardcoded-flag` | `wrong-writer` | `missing-populator` | `template-placeholder` | `config-exclusion` | `duplicate-on-append` | `cache-stale` | `cross-module-drift` | `other: <name>`
- **One-sentence root cause**: <plain-English, no jargon>

### C. Fix shape
- **Pattern** (pick ONE): `minimal-diff-extension` | `analog-copy` | `restructure` | `config-toggle` | `template-restructure` | `OR-chain-extension` | `new-populator` | `other: <name>`
- **Files touched**: <N> files, <M> lines (from `git diff --stat`)
- **Analog cited in commit body?**: yes (→ <analog ref>) | no
- **Blast-radius verified in commit?**: yes (→ <how>) | no

### D. Learnable factors
- **BA-Malay-wording → code artifact mapping** (if any new):
  - "<BA's word>" → `<file:line>` / `<CC tag>` / `<populator method>`
- **Symptom-class → root-cause-category** (if new):
  - "<symptom pattern>" → `<category from B>` (adds to BUG-BESTIARY routing)
- **New data-flow / JSF wiring / tugasan-routing revealed**: <cite or "none">

### E. Reuse potential
- **Past OUR ticket this would have accelerated**: <QA-NNN if any, or "none found">
- **Debug Profile check-item candidate?**: yes/no + which category
- **Hook candidate for detection?**: yes (→ <shape>) | no
```

### Step 3.5 — Audit the fix strictly, then route each finding (みや 2026-10-04)

A colleague's fix is evidence, not a spec. Before anything is proposed, scrutinize it (`/appraise` loop) and give EACH finding one verdict:

| Check | Question |
|---|---|
| Sound | Does the diff fix the root cause, or only the reported instance? Any regression risk on sibling urusan? |
| Ours vs theirs | Compare with OUR Recon/Rubric for the same ticket (quest MD). Where did we differ, and who was right? |
| Fits | Does the pattern match our conventions (working-analog, minimal-diff)? A pattern we would not copy is recorded as "do not copy", not as knowledge. |

| Verdict | Home |
|---|---|
| `workflow` | a quest step / skill / gate that would have found it sooner (propose the edit to that file) |
| `knowledge` | the resolved state's `etanah-knowledge/<state>/` file (Step 4) |
| `elsewhere` | name the file (memory, latent-bug register, a hook) |
| `none` | nothing reusable, or it does not fit — say why in one line |

Only after every finding has a verdict is the delegated block closed.

### Step 4 — Propose edits to etanah-knowledge

For each learnable factor in Section D that is NEW, emit a **proposed-edit block** — the exact new content + the target file:line. **Do NOT apply** — surface for みや to nod first (per Q3 answer).

Format:
```
### Proposed edit — <target file>

**Location**: after section "<name>" (line ~<N>)

**Content to add**:
<the exact prose/table row>

**Rationale**: <1 sentence — why this belongs here>
```

**Primary target**: `BUG-BESTIARY.md` in the resolved state's knowledge dir, never another state's file (`node lib/states.js show <state>` → `knowledge_dir`; Melaka: `projects/coding-projects/active/etanah-knowledge/melaka/BUG-BESTIARY.md`) (bug patterns + symptom-class routing).

**Secondary targets** (only if the fix genuinely revealed something new there):
- `DOMAIN-GLOSSARY.md` — BA-wording → code artifact
- `FLOW-TRACES.md` — new data flow
- `JSF-WIRING.md` — new JSF composite/binding pattern
- `FLOWABLE-WORKFLOWS.md` — tugasan/langkah routing

### Step 5 — Log the extraction

Append 1 JSONL line to `domain/learn-from-fix/log.jsonl`:
```json
{"ts":"<ISO>","ticket":"<num>","commit":"<sha>","category":"<from B>","pattern":"<from C>","proposed_edits":<count>,"applied":false}
```

Update `applied: true` when みや nods the edits and I apply them.

### Step 6 — Hand back

Emit ▶ YOUR MOVE with:
- The 5-section extract (Section 3 output)
- The proposed-edit blocks (Section 4 output) — count them so みや knows the shape
- Question: apply edits? or refine which ones first?

## Progressive trust (per Q3)

Track quality via `log.jsonl` entries + みや's nod-vs-correction rate:
- v1: **propose + apply after nod**
- If 3 consecutive extracts land without correction → surface upgrade proposal: promote to **direct-apply** for BUG-BESTIARY edits (still-propose for secondary targets)
- Never auto-apply for a NEW etanah-knowledge file — that always requires nod

## Banned

- Closing a delegated quest while Redmine still shows it open, or closing it once Closed without running this skill
- Sweeping closed tickets in bulk — the only automatic prompt is the boot `🎓 LEARN BEFORE CLOSE` line for a delegated-and-Closed quest (2026-10-04; replaces the 2026-06-30 "manual only, never on delegated-ticket-close" wording — that spec is dropped on みや's word)
- Colleague names in the extract (per Q2) — cite "colleague" + commit SHA
- Applying edits before みや nod (v1) — always propose-first
- Creating a new file `LEARNED-FROM-COLLEAGUES.md` (per Q1) — fold everything into `BUG-BESTIARY.md` with the ticket # + commit + date as provenance

## Cross-refs

- Plan: [Feature/Learn-From-Others-Fixes/plan-v1.md](../../../Feature/Learn-From-Others-Fixes/plan-v1.md)
- Standing flag: `main/todo.md` Q1 🎓 LEARN STANDING FLAG (QA-268170 delegated — first live test target)
- Audit log: `domain/learn-from-fix/log.jsonl`
- Cousin concept: Debug Profile (todo.md Q2) — this skill FEEDS Debug Profile
