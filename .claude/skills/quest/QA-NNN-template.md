# QA-NNN — <ticket title>

> Single canonical doc per quest. Replaces the legacy multi-file pattern (early-diagnostic.md / scout-report.md / handoff-XXX.md / class-chain-traces.md / Fix.txt — all deprecated for new quests as of 2026-05-28).
>
> Every phase writes its section in THIS file. Reading one section without the others gives a stale view — read top-to-bottom on resume.
>
> Template version: 1.0 (2026-05-28, per plan cached-floating-hummingbird.md Phase 1).

---

## 0. Resume Point

> ← write this section ONLY when invoking `/quest hold`. Must cover: current phase, what IS done, what is NOT done, open decisions, first-step-on-resume, any みや-stated intent. The chat summary evaporates between sessions; this block is the durable home the next-session briefing reads first.

**Quest status**: <active | hold | delegated | blocked | closed | archived | archived-shipped-by-other>
**Phase**: <0 | 1 | 1-complete | 2 | 2-complete>
**Current sub-phase**: <Discovery | Recon | Simulate | Rubric | Apply | Verify | Commit | Push | Wrap>
**Held at**: <YYYY-MM-DD HH:MM MPST>
**Held reason / みや's intent**: <verbatim or paraphrased context>

**What IS done**: <bullet list of completed work this quest>
**What is NOT done**: <bullet list of remaining work>
**Open decisions**: <decisions awaiting みや input>
**First step on resume**: <the very next concrete action>

---

## Context Loading (Discovery)

> ← write this section at Quest accept (`/quest start`). Covers ticket-type classification + etanah-knowledge tiered load + Scout familiar output + etiology check + DOMAIN-GLOSSARY out-loud.

**Ticket type**: <bug | enhancement | cr | requirement>
**Justification (from Description.txt)**: <quote + reasoning>

**Issue (BA)**:
- Env (BA): <UAT / FAT / MLIT>
- Test app (Ruri verified): <id_pengenalan @ urusan + tugasan_kod> · login `<pengguna_semasa>` · role <kod>
- Symptom: <verbatim from BA>
- Expected: <verbatim or inferred from BA>

**Issue Checklist**:

| # | Item | Status |
|---|---|---|
| 1.1 | <item from ticket> | ⬜ |

**etanah-knowledge tiers loaded**:
- Always (5): index.md ✓ · DOMAIN-GLOSSARY ✓ · MODULE-ARCHITECTURE ✓ · BUG-BESTIARY ✓ · DEFERRED-CRITICAL-ISSUES ✓
- Conditional (per index.md routing for this ticket type + symptom): <list which loaded, file:line of routing evidence>
- On-demand (loaded mid-quest when needed): <list>

**Scout familiar output** (HYPOTHESES — verification pending):
- <hypothesis 1: claim + file:line tag>
- <hypothesis 2: ...>

**Etiology — related tickets, parent linkages & origin commits**:
- <ref 1: `git log --grep` finding + verbatim Description.txt line if applicable>

**Auto-pengguna at END of Recon section** (`feedback_pengguna_semasa.md` rule):
- Permohonan ID: <id> · Pengguna: <login> · Kod Tugasan: <kod> · Nama Tugasan: <name>

---

## Debugging (Recon + Simulate)

> ← write this section as Recon emits source-verified findings. Universal Checks 1-9 (including UC9 sibling-structure read added 2026-05-28). 100%-VERIFY clause applies — every file:line claim must quote actual code OR mark VERIFIED+summary.

**Recon block** (Universal Checks):

| # | Check | Status (HYPOTHESIS / VERIFIED / BA-Q) | Evidence (file:line + quote) |
|---|---|---|---|
| 1 | <Universal Check 1 — primary code path> | <VERIFIED> | `<file>:<line>` `"<code>"` |
| 2 | <UC2> | ... | ... |
| 9 | **Sibling-structure read** (≥2-3 closest siblings) | VERIFIED | <file:line per sibling + 1-line note on convention observed> |

**Predicate Box** (Debug Mode Ritual 1):
- TRUE IF: <assumption>
- PROVED BY: <evidence>
- FAILED WHEN: <falsifier>

**Contract Verification Table** (cross-cutting per `system-design` Step 6 — applies when ≥2 layers OR new methods/fields/bindings):

| Contract | HYPOTHESIS / VERIFIED (file:line) | Note |
|---|---|---|

**Simulate**: reproduce bug locally?
- Env: <mlkuat | mlkfat | mkit>
- Permohonan: <id + login>
- Tugasan walked: <kod sequence>
- Repro: <YES — verified ralat matches BA report / NO — reason>

**Proactive surface** (3 things noticed beyond what was asked — Phase 3.B.0):
1. <observation 1, with file:line or precedent ref>
2. <observation 2>
3. <observation 3>
   *(If genuinely nothing notable: write "no proactive items this emit" + 1-line reason)*

---

## Code-Review (Rubric)

> ← write this section at Phase 1 entry. Fix-shape options + Multi-Perspective Scrutiny + Blast-Radius + Etanah-system integration deep-think + Architecture diagram.

**Fix-shape options**:

| Option | Approach | Pros | Cons | Cost | Risk |
|---|---|---|---|---|---|
| A | <approach A> | <pros> | <cons> | <est> | <risk level> |
| B | <approach B> | ... | ... | ... | ... |
| C | <approach C — usually "do nothing / defer" baseline> | ... | ... | ... | ... |

**Recommendation**: <Option X, one-sentence reasoning citing decisive trade-off>

**Multi-Perspective Scrutiny** (6 lenses — mandatory for non-trivial change):

| Perspective | Verdict (✓ / ⚠️ / ✗) | Evidence | Risk |
|---|---|---|---|
| Correctness | | | |
| Completeness | | | |
| Blast-radius | | | |
| Edge cases | | | |
| Thread-safety | | | |
| Backward-compat | | | |

**Weakest perspective**: <name + 1-line elaboration>

**Sibling-structure verification** (cross-ref UC9):
- Checked N siblings: <file:line list — same as UC9 row>
- Convention observed: <1-2 sentence summary>
- This fix mirrors sibling X at: <file:line>

**Architecture diagram** (ASCII, file-level relationships — mandatory permanent fixture per みや 2026-05-14):

```
<plain ASCII boxes + arrows showing the touched layers and their relationships>
```

**Etanah-system integration deep-think** (mandatory for ≥2-layer fixes — Phase 4 addition):

<one paragraph on how this fix interacts with sibling urusans / common-tax bindings / etanah-awam (applicant-facing) vs etanah-pelupusan (officer-facing) / shared utilities / Flowable workflows. Triggers long-thinking — do not write 1 sentence when 3 are needed.>

**Proactive surface** (3 items per phase emit):
1. ...
2. ...
3. ...

---

## Ship — Apply

> ← write this section as the code edit is applied. Predicate Box mandatory (debug mode). PRESERVATION DISCIPLINE applies — only modify what Rubric specified. POST-REFACTOR DEAD-BRANCH AUDIT applies if a new variant method was created.

**Files modified**:
- `<repo>/<path>:line-line` — <one-line summary of change>

**Diff summary** (lines +X / -Y):

```
<paste relevant hunk(s) or `git diff` excerpt — keep tight>
```

**Predicate Box** (Debug Mode Ritual 1 — pre-Edit assumption):
- TRUE IF: <what the fix assumes>
- PROVED BY: <evidence cite>
- FAILED WHEN: <falsifier>

**Validation**: <build result + warnings + any compile output worth noting>

**Backup-on-mutation** (for binary files like .docx): `<file>.bak_<YYYY-MM-DD>_<short-reason>` exists

**Proactive surface** (3 items):
1. ...
2. ...
3. ...

---

## Ship — Verify

> ← write this section when みや local-tests the fix. Confirms ralat / behavior.

- **Test app**: <id + login + tugasan>
- **Result**: <green / red / partial — verbatim or paraphrased みや confirmation>
- **`local_test_confirmed=`** set to `true` in active.txt: <YES / NO + reason>

---

## Ship — Commit

> ← write this section at Phase 1 close-out. Stop-at-stage gate per quest skill v1: emit staged diff + commit message, wait for みや nod.

**Pre-commit checklist** (per `quest-protocol.md` Phase 1 close-out + `prepare-commit-trigger.js` 12-step sequence):
- All checklist items `[x]`: <YES / NO>
- `local_test_confirmed=true` in active.txt: <YES / NO>
- Workrepo cleanup done (no `*.bak*` / `*- Copy*` / orphaned `~$*` in staging): <YES / NO>
- `commit-conventions.md` read this session (Step 7.5): <YES / NO>

**Branch**: `<repo>/mlk/qa/<NNN>` (or `<repo>/main` for MemoryCore)

**Drafted commit message** (per `commit-conventions.md`):

For etanah-pelupusan / etanah-awam (subject-only, no body, no trailer):
```
QA #<num> - <URUSAN> - <TUGASAN> - <short action description>
```

For Project-AI-MemoryCore (descriptive prose + Ruri trailer):
```
<descriptive subject>

<body explaining what + why>

Co-Authored-By: Ruri <noreply@anthropic.com>
```

**みや approval**: <YES / NO + verbatim quote>

---

## Ship — Push

> ← write this section after `git push` succeeds.

- **Commit SHA**: <SHA>
- **Pushed to**: `origin/<branch>`
- **Remote state**: <new branch / fast-forward>

---

## Ship — Wrap (Phase 2)

> ← write this section at Phase 2 close. Post-mortem + KPI + folder hygiene + knowledge file updates.

**Post-mortem entry** (write to `main/post-mortems.md` AND summarize here):
- What went well: <bullets>
- What slipped: <bullets — also log to `meta/slip-log.md` with `lesson:` field>
- What changed in the meta-layer because of this quest: <bullets>

**KPI entry** (write to `main/kpi-tracker.md` AND summarize here):
- Effort: <estimated hours>
- Issue type: <bug | enhancement | cr | requirement>
- Duration (accept → Phase 1 close): <hours>
- Duration (Phase 1 close → Phase 2 close): <hours>
- Learnings: <bullets>

**Etanah-knowledge updates** (if applicable — per `feedback_knowledgebase_during_debug.md`):
- Added entry to `etanah-knowledge/melaka/BUG-BESTIARY.md`: <YES / NO>
- Updated relevant layer (DATABASE / MODULE-ARCHITECTURE / FLOW-TRACES / etc.): <list>

**Folder hygiene**:
- Task folder moved: `1. Tasks/Melaka/<NN>. ...` → `1. Tasks/Melaka/Archive/<NN>. ...`
- Project folder moved: `projects/coding-projects/active/QA-<NNN>/` → `projects/coding-projects/archive/QA-<NNN>/`

**`active.txt` state**: `phase=2-complete` · `status=archived` (or `archived-shipped-by-other` if colleague shipped)

---

## Etiology — related tickets / parent linkages / origin commits

> ← write this section at Discovery (auto-etiology check) and refine as more refs surface. Move from Scout HYPOTHESES to VERIFIED links.

| Ref | Verbatim cite | Git log finding | Status |
|---|---|---|---|

---

## Improvement Checklist

> ← capture みや's "check-further" pushes in real-time (per quest skill v1.1). When みや pushes Ruri to check further / dig a layer deeper / amend an incomplete first-pass, immediately append here. At Phase 2, promote each captured push (whose corrected fix worked) into the fix-category check-set.

- [ ] <what みや had to push for> → <the generalised check that would have pre-empted it>

---

*Resume-point format reminder: when invoking `/quest hold`, fill the §0 block at the top + leave the rest as-is. The next session's `quest-resume-preflight.js` hook will read §0 first.*
