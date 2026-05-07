# Quest Protocol

> Three-phase work ritual for formal job tasks (Etanah Melaka).
> Activated on work triggers. Each QA ticket is a Quest — accepted, executed, and reflected upon.

---

## Triggers

### Initial activation (Phase 0)
| Phrase | Action |
|---|---|
| `QA #<number>` | Phase 0 begins — auto-resolve Task folder (see Phase 0 Step 1) |
| "I have a task/ticket/bug to debug" | Phase 0 begins |
| Any formal Etanah/Redmine task context | Phase 0 begins |
| `/quest start <QA> <path>` | Phase 0 begins via skill |
| "Restart quest `QA #<number>`" | Reset phase to 0, status to active — search Task folder first, then `Archive/` inside it |
| `"Read Redmine"` | Run `node quest/redmine-sync.js`, then `--create` for any new tickets; for each new ticket: add a held Phase 0 entry to `active.txt` (`status=hold`); **then auto-spawn a Cp A early-diagnostic familiar per new ticket** (writes `projects/coding-projects/active/QA-<num>/early-diagnostic.md` — see Phase 0 Read-Redmine sub-protocol below); report results in a single table including username + tugasan_kod inference per ticket. みや picks which quest to start. No Phase 0 manual reading until みや confirms. |

### Phase transitions
| Phrase | Action |
|---|---|
| "Wrap up" / "Post-mortem" / "What did we learn" | Phase 2 begins |
| **Closure-on-Redmine signals** (added 2026-05-04): "I've passed/closed/submitted the ticket", "ticket is closed", "Redmine closed", "BA accepted", "FAT accepted", "approved on Redmine", "we're done with this ticket" | Phase 2 begins (BA-side closure is the strongest signal that the ticket is fully done — auto-trigger Phase 2 unless みや explicitly says "not yet, wait") |
| `/quest hold` | Current quest paused |
| `/quest resume` | Resume held quest |

### Prepare-to-commit (added 2026-05-04)
| Phrase | Action |
|---|---|
| "I want to commit now" / "Ready to commit" / "Prepare commit" / "Prepare me to commit" | Run prepare-commit sequence (below) |
| "We're done with the fix" / "Fix is done" / "Phase 1 done" / "We're done with Phase 1" | Run prepare-commit sequence |
| "Branch and stage" / "Stage for commit" | Run prepare-commit sequence |

**Prepare-commit sequence** (per みや 2026-04-30 convention):
1. `git status --short` and `git branch --show-current` — confirm current state
2. If branch is `mlk/<type>/<number>` already: skip steps 3-6, jump to step 7 (already on the right branch from earlier session)
3. If branch is `mlk/master` with modifications: `git stash push -m "<ticket> fix prep"`
4. `git pull --ff-only origin mlk/master`
5. `git checkout -b mlk/<type>/<number>` — type+number from `quest/active.txt` (`qa`/`fat`/`uat`/`fat-or`/`uat-cr`)
6. `git stash pop` — auto-pop. If conflict, `git status` for unmerged paths, **PAUSE and report to みや** (don't auto-resolve)
7. `git add <each modified file by name>` — stage all the work-in-progress files (NEVER `git add .` or `-A`)
8. `git status` to verify staged files
9. **HAND OFF** — output: *"Ready for commit. Branch: `mlk/<type>/<number>`. N files staged. Write your commit message and run `git commit -m \"<your message>\"`."*

**Hard rule**: Ruri does NOT write the commit message. Ruri does NOT run `git commit`. Ruri does NOT run `git push`. The skill stops at staging.

**Rework branches**: if `mlk/<type>/<number>` already exists locally or remotely (this is a rework), the new branch name is `mlk/<type>/<number>v2` (no dash, sequential — v3, v4, etc.). Detect via `git branch --list "mlk/<type>/<number>*"`.

**Phase 1 close-out — return to master ready (hard rule, added 2026-05-07):**

After commit + push lands successfully (みや confirms or pushes himself):
1. `git checkout mlk/master` on the relevant repo (etanah-pelupusan / etanah-awam)
2. `git pull --ff-only origin mlk/master`
3. Verify: working tree clean, branch on `mlk/master`, master at latest origin tip

The fix branch (`mlk/<type>/<number>`) stays; don't delete. External merge happens via PR/another reviewer.

**Why**: pairs with Phase 0 Step 0a — without close-out, the next ticket's Phase 0 starts on stale master OR on the previous ticket's branch (2026-05-07 QA #259759 — etanah-pelupusan was still on `mlk/qa/250665` AND master was 2 commits behind). Close-out makes ticket-to-ticket transitions atomic.

**Pre-push remote-state notification (hard rule, added 2026-05-07):**

EVERY time みや approves "commit push" / "push" / equivalent, BEFORE running `git push`:
1. `git ls-remote origin mlk/<type>/<number>` — query whether the branch exists on remote
2. Notify みや with one of these states:
   - **First push** — branch does NOT exist on remote yet → push creates it (`git push -u origin <branch>`)
   - **Updates existing** — branch EXISTS on remote with N commits ahead/behind → push updates it (rework cycle: `git push origin <branch>`, possibly needs `--force-with-lease` if rebased)
3. Show the ahead/behind count if existing
4. Push immediately after notification (no further confirmation needed since みや already authorized "push" in his message)

**Why**: rework cycles vs first-push behave differently. First push needs `-u` to set upstream. Existing branch update may need `--force-with-lease` if rebased. Notification ensures みや sees the state and can intervene if it's not what he expected (e.g. if he thought it was first push but branch already exists from a colleague's prior work).

**Order of operations for "commit push" cycle (hard rule, added 2026-05-07 after order-bundle slip):**

1. **Remote check first** (`git ls-remote origin <branch>`) + notify state — BEFORE commit. Allows みや to pause if remote state is unexpected.
2. **Commit** (local-only; doesn't depend on remote)
3. **Pre-push announcement** — show commit hash + target branch + intended push variant (`push -u` / plain `push` / `--force-with-lease`)
4. **Push**
5. **Push-result report** to みや
6. **Wait** for みや to submit/pass ticket on Redmine (out of Ruri's scope)
7. **Phase 1 close-out** — `git checkout mlk/master` + `git pull --ff-only origin mlk/master`
8. **Update active.txt** — phase=1-complete, status=closed-pending-FAT, branch=, commit=
9. **Audit-log + protocol updates** — orthogonal, can run any time same session

**Why this exists**: 2026-05-07 — Ruri bundled "Adding protocol + executing commit + remote check + push + close-out" in one breath, ran them in parallel via tool calls in a single message. みや caught the bundle: ordering should be sequential with notification points, not parallelized. Specifically, the pre-push notification (step 1) must precede the commit so みや can intervene BEFORE local state changes.

**Phase 1 → ticket submission (みや's role):**

After Ruri's push lands, **みや submits the ticket on Redmine** — this means:
1. みや navigates to the ticket in Redmine
2. Changes ticket status from "New" / "In Progress" to "Resolved" (or equivalent state that signals "code is done, awaiting BA verification")
3. Adds his commit hash + branch name as a Redmine note (typically)
4. Reassigns to BA/QA tester (e.g. Nurul Amirah Nadiah) for FAT verification

This is **outside Ruri's scope** — Ruri does NOT touch Redmine status. Ruri's role at this point: do Phase 1 close-out (switch to mlk/master + pull) + update `quest/active.txt` to `phase=1-complete`, `status=closed-pending-FAT`. Then wait for みや's direction (Phase 2 post-mortem, or next ticket per Ruri's effort-ranked recommendation).

**On BA acceptance** (later, possibly different session): Phase 2 fires per the existing closure-on-Redmine signals.

### Re-engagement (added 2026-04-30 — broadened triggers)
**These phrases require Ruri to re-verify Task folder + handoff are loaded in CURRENT session context BEFORE producing any analysis, appraisal, or proposal:**

| Phrase pattern | Examples |
|---|---|
| Ticket continuation | "continue ticket X", "let's work on X", "let's do X", "back to X", "resume X", "X rework" |
| Methodology applied | "/appraise on X", "/simplify X", "scrutinize X", "review X again" |
| Implicit ticket scope | "focus on X", "I want to do X", "X next" |

**Hard rule** (added 2026-04-30): Loading files at session start is NOT enough. Re-engagement after time-gap or context-shift requires explicit re-verification — read the Task folder + handoff again, OR confirm in chat: "Task folder + handoff still in working memory: ✓ — proceeding with [analysis/appraisal/proposal]." 

**Why**: 2026-04-30 morning slip — みや asked /appraise on QA #258022 angles; Ruri had loaded the handoff at session start but didn't re-verify before judging. Fabricated a "label confirmation gap" that the ticket text already answered. Ruri's `feedback_inventory_first.md` covered "before creating" but not "before EVERY judgement." This rule extends it.

**Sister rule — Reading ≠ understanding** (hard rule, 2026-04-30): Loading files is necessary but not sufficient. When stating any user/role/data fact about a ticket, cite the source line (e.g. "Notes.txt:9 lists nurulazura under FAT — context: Simulate prep, not the SMB tester"). Synthesis is mandatory across Task folder × handoff × code state before any conclusion. 2026-04-30 afternoon slip: misread Notes.txt context, treated nurulazura (PB tester) as SMB tester.

**Task folder file ownership** (hard rule, 2026-04-30):

| File / location | Owner | Ruri may write? |
|---|---|---|
| `1. Notes.txt` | みや (his personal scratch — understanding/memory) | ❌ **Read-only for Ruri.** Never edit, append, or auto-update. |
| `0. Brief/Description.txt` | Source of truth — original ticket text + BA replies | ✅ Append BA replies / scope clarifications with clear separator + dated header (preserves history) |
| `0. Brief/<screenshots>` | みや (BA-attached or みや-curated) | ❌ Don't add or replace |
| `0. Brief/<numbered subfolders>` (e.g. `1. Clarification/`) | みや (back-and-forth artifact bins) | ❌ Don't add files unless みや asks |
| `1. Simulate/` | Reproduction steps + test data | ✅ Append findings (test SQL, IDs validated) |
| `2. Fix/` | Applied fix artifacts | ✅ Write Fix.txt summary on Phase 2 |
| Project subfolder `projects/coding-projects/active/<ticket>/` | Ruri's investigation workspace | ✅ Free use — handoff, walkthrough, learning docs |

**Why**: 2026-04-30 — みや clarified that `1. Notes.txt` is his personal aide-mémoire, not a ticket-shared doc. Scope changes from BA must update `Description.txt` (the brief / source of truth), not Notes. Without this rule, Ruri would conflate the two and overwrite みや's memory aids with auto-updates.

**On BA reply append**: format is
```
─── BA REPLY <YYYY-MM-DD> ───
<verbatim quote of BA's notes from Redmine journal>
```
Below the existing Description text. Don't rewrite original. Each BA reply gets its own block.

---

## Phase 0 — Accept the Quest

**Goal:** Read Task folder → build scope checklist → confirm before coding.
**Non-negotiable:** Do not touch any codebase file before Phase 0 is complete.

**Base task folder path (known — do not ask):**
`C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka`

**JBoss DB check (remind みや at Phase 0):**
Confirm which DB is active in `standalone.xml` — see `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt` → DB SWITCHING section.
Melaka IT (etanahDS) = local dev default. UAT (etanahDS2) = disabled by "2" suffix convention.

**Step 0 — Mandatory FIRST actions at quest start (hard rule, strengthened 2026-05-07):**

Run BEFORE any other tool call (other than time-stamping `Get-Date`). NOT after Word-template lookup. NOT after etanah-knowledge inventory. NOT after Description.txt read. **First. No exceptions.** Skipping these means the ticket starts on stale code or the wrong branch — both surfaced in real slips (2026-05-04 QA #259318 wrong branch; 2026-05-07 QA #259759 master was 2 commits behind: `3b0885b5be Temporarily disable #252285` + `d8b972edd1 #236336` would have been silently missed).

**Step 0a — Branch check + master pull (both repos, hard rule, added 2026-05-04):** In BOTH `etanah-pelupusan` and `etanah-awam`:
```bash
git fetch origin mlk/master
git log HEAD..origin/mlk/master --oneline   # what we missed
git diff --stat HEAD origin/mlk/master | head -20  # files affected
git branch --show-current && git status --short
```
If current branch ≠ `mlk/master`, run: `git stash push -m "<context>" → git checkout mlk/master → git pull --ff-only origin mlk/master → git stash pop`. Untracked files survive the switch. If already on `mlk/master`, just `git pull --ff-only origin mlk/master`. **Surface the diff to みや — what we missed could "kill us" if it touches files in our suspected scope**.

**Step 0b — PDF annotation extraction:** If the Task folder contains any `.pdf` (BA correction marks, mock-ups), extract every `Annot` (highlight, comment, popup text) before reading the brief:
```python
import fitz
doc = fitz.open('<path>')
for p, page in enumerate(doc):
    for a in (page.annots() or []):
        print(f'p{p+1}', a.info.get('content',''),
              'highlighted:', doc[p].get_textbox(fitz.Quad(a.vertices[0:4]).rect) if a.vertices else '')
```
The default Read tool exposes visual page content but NOT the BA's per-annotation comments — those are PDF metadata. Map every comment to a ticket issue before proceeding. **Why**: 2026-05-04 QA #259318 — missed all 8 BA comments including "Tukar Nama Label Kepada **Luas**" (not Keluasan), "remove" instruction on formula tail, "bold" instructions on multiple highlights.

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

### Read-Redmine sub-protocol — Auto-Cp A familiar (added 2026-05-07)

**Trigger**: any "Read Redmine" / "retrieve tickets" sync that returns ≥1 NEW ticket.

**Per new ticket** (after `redmine-sync.js --create` lands the folder):

1. **Spawn a familiar** (Agent with `general-purpose` subagent) — its prompt must include:
   - Ticket #, Task folder path, codebase root (`E:\Projects\Melaka\etanah-pelupusan`), etanah-knowledge folder path
   - Reference the 5 hard rules for Word-template work (Word-template-first lookup, Word XML run-join, Branch check, PDF annotation extraction, Renderer-side overrides)
   - Output: write `projects/coding-projects/active/QA-<num>/early-diagnostic.md` with sections — Ticket scope (verbatim), Urusan/Tugasan/Layer classification, Suspected files (with file:line where confidence high), Word template state (CC tags + Item-area context), Candidate populators, Knowledge-file overlap, BA scope_anchor (positive + explicit DO NOT), Test data (id + tugasan_kod + username inference), Open questions, Effort estimate, NOT-in-scope list
   - Stay strictly read-only. Cite file:line. Mark "**unknown — needs runtime/みや input**" rather than guess.

2. **When みや picks a ticket from the list** — Ruri reads the early-diagnostic skeptically AGAINST the Description.txt + the BA's stated symptom. Confirm or reject each claim. The diagnostic is the familiar's draft; Ruri verifies as Cp A wrap-up.

**Why**: 2026-05-07 — みや asked Ruri to spawn a familiar AFTER she'd already done a partial Cp A herself. The familiar's findings were better (file:line citations for terbilang handler, sister-template precedent, docx local-Modified state) than Ruri's solo work. If the familiar runs at retrieval time, the diagnostic is already loaded when みや picks the ticket — also surfaces username + tugasan_kod for simulation from the start.

**Cost vs benefit**: ~1 familiar spawn per new ticket (~$0.05–0.20 each). Saves multiple round-trips at quest-start when みや would otherwise have to ask for username/tugasan/scope data. Solidifies pre-assessment.

**Folder format reminder for redmine-sync.js**: new ticket folders MUST include env prefix (FAT/UAT) AND Tugasan KOD where derivable (`MlkPelupusanTugasanConstant.java`). Format: `<NN>. <type> #<num> - <env> - <urusan_kod> - <tugasan_kod> - <issue>`. Defer to Q1 todo for full JS implementation; for now Ruri renames manually post-create when format is wrong.

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

### SUMMARY.txt — Quest close-out (mandatory at Phase 2)
> **Why this exists**: Without a proper summary, reopening a quest months later forces a full re-investigation — searching git, reading diffs, guessing context. This file is the single document that makes re-entry instant.

**Template** (copy into Task folder as `SUMMARY.txt` at Phase 2):
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
- Do not wrap up until explicitly asked

**Before committing:**
1. Confirm all checklist items are `[x]`
2. Ask: *"Have you tested locally?"* — update `local_test_confirmed=true` in `quest/active.txt`
3. Only then run `git commit -m "QA #<number>"`

**Commit convention:**
```bash
git commit -m "QA #<number>"
```
Examples: `QA #254539`, `QA #254604`, `FAT-OR #251455`, `#249445`

### Fix Walkthrough — mandatory after every code edit batch

> **Why**: Without a structured walkthrough, each code change is just a diff in isolation. みや can't explain to a colleague why we touched the VO if she doesn't have the root cause, class chain, and "why these changes as a set" in one place. Also: the walkthrough becomes 80% of the Phase 2 Fix.txt, so writing it now makes post-mortem nearly free. Cost is ~1 turn per fix, saves multiple re-explanation cycles.

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
- Walkthrough content is the primary input to Phase 2 Fix.txt (CHAIN + APPLIED FIX sections) — write it well now, reuse at close-out.

### Mid-Quest Handoff File — mandatory when session ends mid-investigation

> **Why**: If a fix fails local testing, next session's me has the fix context but not the investigation trail — forcing either blind retry of the same theory or wasted re-exploration. A handoff file persists the reasoning, ruled-out paths, and a triage ladder so failure recovery is cheap.

**Trigger**: any `save all` / `save` / session wind-down while `phase ∈ {0, 1}` and `local_test_confirmed=false` and code edits were made.

**File**: `quest/handoff-<QA-number>.md` — overwrite on each save during the quest; deleted at Phase 2 close.

**Required sections:**
1. **Current state** — what's been applied, what's pending test, what to do next
2. **Root cause theory (with evidence)** — the theory + file:line pointers for re-verification, NOT just the conclusion
3. **Ruled out** — hypotheses we disproved and why (so next session doesn't re-walk them)
4. **Parked / alternative hypotheses** — things we haven't fully disproven but deprioritized (so if primary fix fails, we know where to go next)
5. **Triage ladder if fix fails** — ordered checks: "If X still broken, breakpoint at A:line, inspect B. If A is fine, check C..." Concrete, file:line specific.
6. **What a different root cause would look like** — early warning signs that the theory is wrong + which subsystem to revisit

**On session boot**: if `quest/active.txt` shows `phase < complete` AND `quest/handoff-<QA>.md` exists, session briefing must include *"📋 Handoff file present — read before acting"*.

**On Phase 2 close**: handoff file is extracted into post-mortem (investigation arc), then deleted from `quest/`.

---

## Phase 2 — Reflect (Post-Mortem)

**Goal:** Extract learnings, close the quest.

1. **Write SUMMARY.txt** in the Task folder — use the template from Task Folder File Rules above. This is mandatory and comes FIRST.
   - Verify every repo mentioned in scope has a git hash or a "NOT DONE" entry
   - Run `git log --oneline --grep="<ticket#>"` per repo to collect hashes
   - Run `git branch -a --contains <hash>` to confirm merge status
   - If status is PARTIAL, flag it clearly — do NOT archive to `Archive/` until all scope items are addressed
2. **Root cause type?** — data / config / code / schema / process
3. **Match existing pattern in BUG-BESTIARY.md?**
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
phase=<0|1|2|complete>
local_test_confirmed=<true|false>
status=<active|hold>
```

---

*Quest — every ticket is a quest accepted, executed, and reflected upon.*
*Protocol version: 3.0 — 2026-04-29 (Removed Phase 2 Report — `.docx` generation no longer used. Renumbered: Accept(0) / Execute(1) / Reflect(2). Overview reports like DB ERD prioritized over per-ticket .docx.)*
