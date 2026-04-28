# Quest Protocol

> Four-phase work ritual for formal job tasks (Etanah Melaka).
> Activated on work triggers. Produces a structured Fix Report .docx at close.
> Each QA ticket is a Quest — accepted, executed, chronicled, and reflected upon.

---

## Triggers

| Phrase | Action |
|---|---|
| `QA #<number>` | Phase 0 begins — auto-resolve Task folder (see Phase 0 Step 1) |
| "I have a task/ticket/bug to debug" | Phase 0 begins |
| Any formal Etanah/Redmine task context | Phase 0 begins |
| "Create the report" | Phase 2 begins — ask for output path + screenshot paths |
| "Wrap up" / "Post-mortem" / "What did we learn" | Phase 3 begins |
| `/quest start <QA> <path>` | Phase 0 begins via skill |
| `/quest hold` | Current quest paused |
| `/quest resume` | Resume held quest |
| "Restart quest `QA #<number>`" | Reset phase to 0, status to active — search Task folder first, then `Archive/` inside it |
| `"Read Redmine"` | Run `node quest/redmine-sync.js`, then `--create` for any new tickets; for each new ticket: add a held Phase 0 entry to `active.txt` (`status=hold`); report results. みや picks which quest to start. No Phase 0 reading until みや confirms. |

---

## Phase 0 — Accept the Quest

**Goal:** Read Task folder → build scope checklist → confirm before coding.
**Non-negotiable:** Do not touch any codebase file before Phase 0 is complete.

**Base task folder path (known — do not ask):**
`C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka`

**JBoss DB check (remind みや at Phase 0):**
Confirm which DB is active in `standalone.xml` — see `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt` → DB SWITCHING section.
Melaka IT (etanahDS) = local dev default. UAT (etanahDS2) = disabled by "2" suffix convention.

**Steps:**
1. **Locate or create Task folder:**
   - Glob `1. Tasks\Melaka\` for existing folders matching the QA/UAT-CR number — if found, that IS the Task folder; read it
   - If not found in active: Glob `1. Tasks\Melaka\Archive\` as well (archive for numbering reference)
   - If creating new: find the highest leading number across BOTH active + Archive, then create `<highest+1>. <title as given by みや>` in `1. Tasks\Melaka\`
   - Base structure — always 3 folders:
     - `0. Brief/` — ticket info, screenshots, references
     - `1. Simulate/` — reproduction steps, test data
     - `2. Fix/` — applied fix artifacts
   - Then `3. {Status}/` — named after current ticket status (e.g. `3. New`, `3. In Progress`). Increments on each return: `4. Rework`, `5. In Progress`, etc.
   - `redmine-sync.js --create` handles all of the above automatically when creating via sync
   - Confirm folder path back to みや
2. Wait for みや to populate `0. Brief`, then read every file in it
3. Read every file in the Task folder (Glob + Read all)
4. Parse: ticket description, scope items (a, b, c…), bug details, screenshots
5. **Inventory-first knowledgebase load** — `Glob projects/coding-projects/active/etanah-knowledge/<state>/` → `Read` every file whose scope overlaps the ticket's symptom (not just `DATABASE.md` — `BUG-BESTIARY.md`, `FLOWABLE-WORKFLOWS.md`, `DOMAIN-GLOSSARY.md`, `MODULE-ARCHITECTURE.md`, `JSF-WIRING.md`, `FLOW-TRACES.md` as relevant). No hypothesis, no SQL, no code grep before this step. See `feedback_inventory_first.md`.
   - **Flowable/workflow tickets only**: also locate the relevant BPMN XML from `E:\Projects\Melaka\etanah-pelupusan\src\main\resources\processes\`. Read service task `class` attributes and user task names directly — treat BPMN XML as source code, not a black box. Do not rely on delegate Java class names alone when the process XML is accessible.
6. **Generate test record SQL** — auto-fill from ticket context using the standard template below:
   - **Urusan**: grep `DOMAIN-GLOSSARY.md` for the urusan KOD from the ticket (e.g. PSBS, PRZ, PPJK)
   - **Tugasan**: grep `DOMAIN-GLOSSARY.md` Known Tugasan Codes section for matching KOD or NAMA
   - **ID_PENGENALAN**: if provided in ticket → use subquery approach (preferred)
   - **If ID_PENGENALAN not provided**: uncomment and fill `IT.KOD` or `IT.NAMA` filter instead
   - `LAST_MODIFIED_DATE` may be NULL on unmodified records — always wrap with `COALESCE(LAST_MODIFIED_DATE, CREATED_DATE)`
   ```sql
   -- Auto-filled at quest creation. Uncomment tugasan filter only if ID_PENGENALAN not available.
   SELECT
     UAT.A_TGSN_ID, UAT.CREATED_DATE, UAT.LAST_MODIFIED_DATE, UAT.PEJABAT_ID, UAT.LAST_MODIFIED_BY,
     IT.TGSN_ID, IT.NAMA AS NAMA_TUGASAN, IT.KOD AS KOD_TUGASAN,
     AK.PROCESS_INSTANCE_ID, UAT.PERANAN_SEMASA, PPS.NAMA_PENGGUNA AS PENGGUNA_SEMASA,
     IPS.KOD AS KOD_PEJABAT_PENGGUNA_SEMASA, IPS.NAMA AS PEJABAT_PENGGUNA_SEMASA,
     UAT.FLAG_AKTIF, UAT.APLIKASI_ID
   FROM UMM_A_TGSN UAT
   INNER JOIN IND_TGSN IT ON IT.TGSN_ID = UAT.TGSN_ID
   LEFT JOIN UMM_ALIRAN_KERJA AK ON AK.ALIRAN_KERJA_ID = UAT.ALIRAN_KERJA_ID
   LEFT JOIN PCP_PENGGUNA PPS ON PPS.PENGGUNA_ID = UAT.PENGGUNA_SEMASA_ID
   LEFT JOIN IND_PEJABAT IPS ON IPS.PEJABAT_ID = PPS.PEJABAT_ID
   WHERE UAT.APLIKASI_ID IN (
     SELECT UA.APLIKASI_ID
     FROM UMM_APLIKASI UA
     WHERE UA.ID_PENGENALAN ILIKE '%<ID_PENGENALAN>%'  -- fill from ticket, or replace block with urusan filter
   )
   AND UAT.FLAG_AKTIF = 'Y'
   AND COALESCE(UAT.LAST_MODIFIED_DATE, UAT.CREATED_DATE) <= CURRENT_DATE - INTERVAL '2 months'
   --AND IT.KOD ILIKE '%<TUGASAN_KOD>%'   -- uncomment if no ID_PENGENALAN
   --AND IT.NAMA ILIKE '%<TUGASAN_NAMA>%'  -- uncomment if no ID_PENGENALAN
   ORDER BY UAT.CREATED_DATE DESC;
   ```
   Present the filled script to リドワンさん before Phase 1 — do not skip this step.
6. Build checklist table — one row per deliverable:

| Item | Tugasan | Description | Status |
|---|---|---|---|
| 1a | PRMMKNPDT | Syor Permohonan field (editable) | ⬜ |
| 1b | SRMMKNPDT / PPT | Syor Permohonan field (disabled) | ⬜ |

7. Save checklist to QA project file under `projects/coding-projects/active/<QA-number>/`
8. Write `quest/active.txt` with current quest state
9. Present checklist — **wait for みや's confirmation** before Phase 1

> Skip Phase 0 checklist table for pure single-root-cause bug fixes. Still read the Task folder.

---

## Task Folder File Rules

### Notes.txt — Keep it SHORT
- Test data, codebase path, key finding (1-3 lines max)
- No deferred topics, no investigation logs, no strategy explanations
- If it's longer than ~15 lines, it's too long — move detail to Fix.txt or knowledgebase

### Fix.txt — 4-section compact format
Fix.txt is a quick-reference for re-reading the fix months later. 4 sections, blank-line separated, no named headers. Total length: ~10–15 lines max.

**Template:**
```
TICKET: QA #XXXXXX

[Class].[method]:
[code before → after, or just the after if removal]

[What was wrong and what was done. 1–3 lines max.]

[ClassA → ClassB → ClassC → output]

[Other classes / configs / tugasan / scopes touched by this change]
```

**Sections (in order):**
1. **FIX** — `Class.method:` then the code change (before → after, or new line only if removal)
2. **EXPLANATION** — 1–3 lines: what was wrong, what was done. Plain language.
3. **CHAIN** — execution flow from entry point to affected output
4. **RELATED** — other classes / configs / tugasan / scopes in blast radius

**Rules:**
- No section headers — blank lines separate the 4 parts
- No VERIFICATION, GLOSSARY, or investigation notes — those live in the handoff file / post-mortem
- Never use みや, リドワンさん, or any nickname — Task folder files are potential colleague handover artifacts

**Why**: Compact layout forces extreme brevity. Old named-section format was hard to scan. Investigation trail belongs in `quest/handoff-<QA>.md` during the quest and `main/post-mortems.md` after close. Format confirmed 2026-04-27.

### SUMMARY.txt — Quest close-out (mandatory at Phase 3)
> **Why this exists**: Without a proper summary, reopening a quest months later forces a full re-investigation — searching git, reading diffs, guessing context. This file is the single document that makes re-entry instant.

**Template** (copy into Task folder as `SUMMARY.txt` at Phase 3):
```
TICKET: <ticket type + number, e.g. UAT-CR #239225>
DATE CLOSED: <YYYY-MM-DD>
STATUS: <COMPLETE | PARTIAL — list what's missing>

--- SCOPE ---
<paste original scope from ticket/Alex — verbatim or near-verbatim>

--- REPOS + BRANCHES ---
<for each repo that needed changes>
Repo: <repo name>
Branch: <branch name>
Commit: <short hash + message>
Merged to: <target branches, e.g. mlk/release/uat, mlk/int-env>
Author: <who committed>

--- WHAT WAS DONE ---
<one line per fix, with file path>

--- WHAT WAS NOT DONE (if PARTIAL) ---
<repo, file, what's missing, why>

--- GIT VERIFICATION ---
Committed: YES/NO per repo
Pushed: YES/NO per repo
Merged: YES/NO + target branch
Stashed: YES/NO — describe if yes

--- REOPENING NOTES ---
<anything a future session needs to know to pick this up cold>
```

**Rules:**
- Every field is mandatory — if a repo was mentioned in scope but no fix was committed, it MUST appear under "WHAT WAS NOT DONE"
- Status must be PARTIAL if any scope item is unfinished — never mark COMPLETE with missing work
- Git hashes are required — not just "committed", the actual hash
- This file replaces the old ad-hoc SUMMARY.md format

---

## Phase 1 — Execute

**Goal:** Solve the ticket.

- Summon a familiar for any file read >500 lines
- Work through Phase 0 checklist — tick `[x]` only when verified in code
- Track key findings silently: what was NULL, what was root cause, what changed
- Note files involved and whether compilation is required
- Do not generate report or wrap up until explicitly asked

**Before committing:**
1. Confirm all checklist items are `[x]`
2. Ask: *"Have you tested locally?"* — update `local_test_confirmed=true` in `quest/active.txt`
3. Only then run `git commit -m "QA #<number>"`

### Fix Walkthrough — mandatory after every code edit batch

> **Why**: Without a structured walkthrough, each code change is just a diff in isolation. みや can't explain to a colleague why we touched the VO if she doesn't have the root cause, class chain, and "why these changes as a set" in one place. Also: the walkthrough becomes 80% of the Phase 3 Fix.txt, so writing it now makes post-mortem nearly free. Cost is ~1 turn per fix, saves multiple re-explanation cycles.

**Trigger**: immediately after code edits land in Phase 1 — **unprompted, same turn as the edits**. Do NOT wait for みや to ask.

**Required structure:**

```
## Fix Walkthrough

### The problem (1–2 sentences)
<root cause in plain language — no jargon unless defined right there>

### Class chain
CallerA → CallerB → EngineC → PopulatorD
(mark where the bug lives with ⚠️)

### Why these changes as a set (2–3 sentences)
<the big why — how the edits collectively address the root cause,
what would be incomplete if any single one were missing>

### Per-change walkthrough
For each file changed:
- **File:line**
- diff block
- **Why this change**: 1 short paragraph
- **What would break without it**: 1 sentence

### Blast radius
<who is affected / who is untouched / why the scope is right>

### Document / template changes
<explicit "none" if none — prevents silent skipping of Word-side check>
```

**Rules:**
- **Big why goes FIRST** — before any diff. If みや can't explain the fix to a colleague from the first three sections alone, the walkthrough has failed.
- **Class chain always present** — per CLAUDE.md top-priority rule. Visual anchor for how execution reaches the bug.
- **"What would break without it"** forces justification of each diff independently. If you can't answer that line for a change, it probably shouldn't be in the patch.
- **Document/template changes line is mandatory** — even when "none". Catches the silent-skip failure mode.
- Walkthrough content is the primary input to Phase 3 Fix.txt (CHAIN + APPLIED FIX sections) — write it well now, reuse at close-out.

### Mid-Quest Handoff File — mandatory when session ends mid-investigation

> **Why**: If a fix fails local testing, next session's me has the fix context but not the investigation trail — forcing either blind retry of the same theory or wasted re-exploration. A handoff file persists the reasoning, ruled-out paths, and a triage ladder so failure recovery is cheap.

**Trigger**: any `save all` / `save` / session wind-down while `phase ∈ {0, 1, 2}` and `local_test_confirmed=false` and code edits were made.

**File**: `quest/handoff-<QA-number>.md` — overwrite on each save during the quest; deleted at Phase 3 close.

**Required sections:**
1. **Current state** — what's been applied, what's pending test, what to do next
2. **Root cause theory (with evidence)** — the theory + file:line pointers for re-verification, NOT just the conclusion
3. **Ruled out** — hypotheses we disproved and why (so next session doesn't re-walk them)
4. **Parked / alternative hypotheses** — things we haven't fully disproven but deprioritized (so if primary fix fails, we know where to go next)
5. **Triage ladder if fix fails** — ordered checks: "If X still broken, breakpoint at A:line, inspect B. If A is fine, check C..." Concrete, file:line specific.
6. **What a different root cause would look like** — early warning signs that the theory is wrong + which subsystem to revisit

**On session boot**: if `quest/active.txt` shows `phase < complete` AND `quest/handoff-<QA>.md` exists, session briefing must include *"📋 Handoff file present — read before acting"*.

**On Phase 3 close**: handoff file is extracted into post-mortem (investigation arc), then deleted from `quest/`.

---

## Phase 2 — Chronicle (Report)

**Goal:** Produce the .docx fix report.

**On trigger:**
1. Ask: *"Output path for the .docx report?"*
2. Ask: *"Screenshot paths? Drop them in a folder and share the full paths, or null for placeholders."*
   - Expected: ticket, issue (bug visible), root cause (1+), fix (1–2)
3. Edit the DATA section of `quest/generate_fix_report.js`
4. Run: `node quest/generate_fix_report.js`
5. Confirm: *"Report saved to [path]."*

**Screenshot naming convention:**
```
1_ticket.png
2_issue.png
3_root_cause.png
4_fix_1.png
4_fix_2.png
```

**Commit convention:**
```bash
git commit -m "QA #<number>"
```
Examples: `QA #254539`, `QA #254604`, `FAT-OR #251455`, `#249445`

---

## Phase 3 — Reflect (Post-Mortem)

**Goal:** Extract learnings, close the quest.

1. **Write SUMMARY.txt** in the Task folder — use the template from Task Folder File Rules above. This is mandatory and comes FIRST.
   - Verify every repo mentioned in scope has a git hash or a "NOT DONE" entry
   - Run `git log --oneline --grep="<ticket#>"` per repo to collect hashes
   - Run `git branch -a --contains <hash>` to confirm merge status
   - If status is PARTIAL, flag it clearly — do NOT archive to `Archive/` until all scope items are addressed
2. **Root cause type?** — data / config / code / schema / process
3. **Match existing pattern in DEBUGGING-PLAYBOOK.md?**
   - Yes → confirm it
   - No → add new Pattern entry
4. **Codebase knowledge to carry forward?** → update `etanah-knowledge/`
5. **What would have been faster?** — process note
6. Write post-mortem entry → `main/post-mortems.md` (use format in that file)
7. **KPI tagging** (Forge Review — quest-scoped) — tag this ticket against 1-3 KPI categories in `growth/kpi-evidence-log.md` with a one-line evidence note per category. See `Feature/Forge-Self-Improvement-System/forge-review-protocol.md`. If missed here, run `forge quest` later to recover.
8. Check Forge log → `Feature/Forge-Self-Improvement-System/forge-log.md` — any entries to promote?
9. Update `quest/active.txt`: set `phase=complete`
10. Quick save

---

## Report Generator

| Item | Value |
|---|---|
| Script | `quest/generate_fix_report.js` |
| Run | `node quest/generate_fix_report.js` |
| Template reference | DEBUGGING-PLAYBOOK.md Part 3 |
| Output format | `.docx` matching Bug Fix Report standard |
| Images | Full path per screenshot, or `null` for placeholder |

---

## Quest Re-Entry Protocol

> **When reopening/investigating a past quest** — whether to check status, fix a regression, or resume partial work.

**Step 1 — Find the Task folder:**
- Check `1. Tasks/Melaka/` first (active), then `1. Tasks/Melaka/Archive/` (closed)
- The Task folder is the SINGLE SOURCE OF TRUTH — read everything in it before any git/code investigation

**Step 2 — Read SUMMARY.txt FIRST:**
- If SUMMARY.txt exists → it has all commits, branches, scope, and what's missing. No git archaeology needed.
- If SUMMARY.txt does NOT exist (old quests before this protocol) → read whatever summary/notes exist, then verify via git

**Step 3 — Only then go to git:**
- Use commit hashes from SUMMARY.txt to verify current state
- Do NOT grep the entire codebase or search git history blindly — SUMMARY.txt should have every hash

**Why:** Without this protocol, re-entry costs 10+ tool calls and hundreds of tokens to reconstruct context that should be in one file. UAT-CR #239225 (2026-04-11) proved this — the Task folder had an incomplete ad-hoc summary, forcing a full git archaeology session.

---

## Quest State File (`quest/active.txt`)

```
qa=<number>
task_folder=<path>
phase=<0|1|2|3|complete>
local_test_confirmed=<true|false>
status=<active|hold>
```

---

*Quest — every ticket is a quest accepted, executed, and chronicled.*
*Protocol version: 2.5 — 2026-04-17 (Base task folder path hardcoded; Phase 0 auto-resolves folder via Glob active + Archive — no longer asks みや for path)*
