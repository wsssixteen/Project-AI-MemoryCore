---
name: quest
description: Quest workflow management — accept, hold, resume, or START a QA ticket quest. Triggers — "/quest start|hold|resume", "let's start with <ticket>", "let's start on X", "start working on X", "start X", "begin X", "pick up X", "continue X", "back to X", "resume X", "X rework", any bare ticket number that cross-matches a `quest/active.txt` qa= entry (e.g. "262233", "PTMLK/.../PRZ/2026/N"), any formal Etanah/Redmine ticket reference. Loads protocol, reads Notes.txt + History.txt, classifies New/Rework/Addition, emits Phase 0 visible checklist.
argument-hint: "start <QA-number> <task-folder-path> | hold | resume"
allowed-tools: Read, Glob, Write, Bash
---

# Quest — Work Ticket Execution System

ARGUMENTS: $ARGUMENTS

## /quest start <QA-number> <task-folder-path>

Phase 0 — Accept the Quest:

1. Read every file in the provided task folder path (Glob + Read all)
2. Parse: ticket description, bug/enhancement details, scope items, screenshots notes
3. Classify ticket type (per plan Phase 2): read `Description.txt` + `History.txt`, classify as `bug | enhancement | cr | requirement` — write to `active.txt` `ticket_type=` field + the QA-NNN.md Context Loading section with Description-quote justification
4. **Initialize the canonical per-quest doc** (per plan Phase 1, 2026-05-28): copy `.claude/skills/quest/QA-NNN-template.md` to `projects/coding-projects/active/QA-<number>/QA-<number>.md` and write the Discovery checklist into the `## Context Loading (Discovery)` section. Subsequent phase emits write into the SAME file (Recon → `## Debugging` section, Rubric → `## Code-Review` section, etc.). Do NOT create sibling files (`early-diagnostic.md` / `scout-report.md` / `handoff-XXX.md` / `class-chain-traces.md` / `Fix.txt`) — those are deprecated for new quests. `pre-action-check-gate.js` blocks edits to such sibling files.

| Item | Description | Status |
|---|---|---|
| 1a | [from ticket] | ⬜ |

5. → Skill: etanah-knowledge-load (with `tier=always` — load 5 always-load layers per plan Phase 2; conditional layers load as `index.md` routes by ticket type + symptom)
6. Write quest state to `quest/active.txt`:
   ```
   qa=<number>
   task_folder=<path>
   qa_doc=projects/coding-projects/active/<number>/QA-<number>.md
   phase=0
   status=active
   ticket_type=<bug|enhancement|cr|requirement>
   current_phase=Discovery
   local_test_confirmed=false
   ```
7. Present Issue Checklist to みや — wait for confirmation before touching any code

Only proceed to Phase 1 after explicit confirmation.

---

## /quest hold [<QA-number>]

1. Read `quest/active.txt` to find the target quest:
   - If `<QA-number>` arg supplied: match that specific entry
   - If no arg: pick the single quest with `status=active` (error if 0 or >1 active)
2. Update state: `status=hold`; append `held_reason=<date+time> — <context + みや's stated intent>`
3. **Write a "Resume Point" block into `QA-<NNN>.md`** — section `## 0. Resume Point` at the top of the doc. Must cover: current phase, what IS done, what is NOT done, open decisions, first-step-on-resume, and any みや-stated intent (e.g. "wants a fresh re-read from start"). The chat summary evaporates; `QA-<NNN>.md` is the durable home the next-session briefing reads.
4. Summarise where we left off in one paragraph
5. Confirm: "Quest <QA-number> is on hold. Run `/quest resume [<QA-number>]` to return to it."

---

## /quest resume [<QA-number>]

1. Read `quest/active.txt` to find the target quest:
   - If `<QA-number>` arg supplied: match that specific held entry
   - If no arg: pick the single quest with `status=hold` (error if 0 or >1 held)
2. Restore context — read `QA-<NNN>.md` (the `## 0. Resume Point` block FIRST), then the rest of the doc top-to-bottom (Discovery → Debugging → Code-Review → Apply etc. — single canonical doc means no sibling files to chase)
3. Confirm: "Resuming Quest <QA-number>. Last state: [Resume Point summary]."

---

## Stop-Point Action Summary (mandatory after /quest start)

At **every** point Ruri stops and hands back to みや after `/quest start` — Recon emit, fix-shape package, a blocker, awaiting-a-nod, end of a work chunk, or a hold — the response MUST end with a **TABLE-based** action block. **NEVER wrap it in triple-backticks** — a fenced code block renders as barely-readable monospace (みや 2026-05-21). Per Output-Format Discipline the tables render raw and the `═══` banners are plain-text delimiters:

═══ ▶ YOUR MOVE — QA-NNNN ═══

Pre-emit gate: Notes.txt ✓ · Tugasan ✓ · Flag-WHERE ✓ · Login ✓

| Test data | Value |
|---|---|
| Permohonan | <id_pengenalan + aplikasi_id> |
| Login | <pengguna_semasa> |
| Env | <UAT / FAT> |
| Tugasan | <kod — nama> (where the affected behaviour actually occurs) |
| Note | <alter-from caveat / anything else — omit the row if none> |

| # | Do now — concrete action みや can act on immediately |
|---|---|
| 1 | <test X / fetch Y / open screen Z — never "review the analysis"> |

| Waiting on you for |
|---|
| <decision / nod / info Ruri needs to continue> |

═══ END ═══

Rules:
- **Do now** = actions みや can act on without any further input from Ruri. Each is concrete (a command, a screen, a ticket to open) — never "review the analysis".
- **Waiting on you for** = the specific decisions/info that unblock Ruri's next step.
- If a row implies Ruri should do something first (run a query, spawn an agent), Ruri does it BEFORE handing back — the block lists only what genuinely needs みや.
- Complements the per-finding "Next operational step" line (amendment A9): A9 fires inline per finding; this block consolidates everything pending into one place at the hand-back, so みや never reverse-engineers his next move from prose.

### Pre-emit gate — MANDATORY before every ▶ YOUR MOVE block (added 2026-05-21 by みや — Notes.txt ≥4-strike redesign)

Before emitting ▶ YOUR MOVE, run this gate and emit it as the FIRST lines of the block (✓ only after the real check). If any row cannot be satisfied, do the work it names FIRST — never emit a partial hand-back.

| Gate | Requirement |
|---|---|
| Notes.txt written | If the hand-back asks みや to test/simulate, `1. Notes.txt` in the Task folder MUST already hold this quest's entry (env / urusan / tugasan / langkah + permohonan ID + login). Missing → run `node quest/notes.js` NOW. Never hand-write it. |
| Tugasan named | Every test/simulate instruction names the specific **tugasan** — not just the document/screen. みや needs to know where in the workflow to go. Omitting it = the same failure as a blank Notes.txt. |
| Flag states WHERE — human-findable | Every flag / ⚠️ / caveat states a location みや can actually FIND: the file path PLUS, for a document, the visible **searchable text** + page number. NEVER cite an internal machine ID (Word `paraId`, SDT `id`, XML attribute) — みや cannot search those in Word. Say "the line reading '<visible text>' on page N", not "paragraph 78F8C270". |
| Login present | Any permohonan ID carries its `pengguna_semasa` login (`feedback_pengguna_semasa.md`). Unknown → DB-query it first. |

**Why** (2026-05-21, QA-259339): the Notes.txt auto-write has slipped ≥4 times; per the skill-failure-log ≥3-strike rule the cure is structural, not another trigger phrase. The hand-back (▶ YOUR MOVE) is the single moment all this info is needed, so the gate lives here — Notes.txt / tugasan / WHERE / login become hard preconditions of the emit, checked visibly so a skip leaves a trace.

## Improvement Checklist — capture みや's "check-further" pushes (added 2026-05-21 by みや)

**Purpose**: every time みや pushes Ruri to check further / dig a layer deeper / amend an incomplete first-pass, that push is signal. Captured per-quest, promoted at Phase 2 into standing checks — so the next quest runs the check proactively and みや stops having to push.

**Distinct from `skill-failure-log.md`**: that log is clean rule-violations (a named rule didn't fire → auto-skill-on-mistake). The Improvement Checklist is THOROUGHNESS gaps — Ruri delivered something real but stopped a layer short, and みや had to prompt the next layer. Often no named rule was broken. The two tracks complement — never double-log the same item.

**Capture — real-time, mid-quest** (same discipline as `remember later` → todo.md): when みや's message is a check-further push — "check further", "why didn't you check X", "did you verify Y", "amend this", "go deeper", "halfway there", "that's not enough" — AND it is NOT a clean correction (→ skill-failure-log) AND NOT a new requirement / scope change — Ruri immediately appends to the `## Improvement Checklist` section of the quest's Ruri-side doc (`QA-NNNN.md`, or `early-diagnostic.md` if no `QA-NNNN.md` exists):

`- [ ] <what みや had to push for> → <the generalised check that would have pre-empted it>`

**Promote — Phase 2 (automatic — no separate nod)**: at Phase 2 the Refine pass promotes each captured push whose corrected fix ended up working — みや's acceptance of that working fix during the quest IS the nod (per みや 2026-05-21: *"the fact that I accepted the change after the mistake & the next fix works is a nod"*). Each promoted check files into its **fix-category check-set** (the category-scoped Debug Profile — see `todo.md` Q2). One-offs, or pushes whose corrected fix did not pan out, are dropped. The per-quest section is transient — only promoted checks persist. No pile-up.

**Negative test — do NOT capture**: clean corrections, みや changing requirements/scope, trivial clarifications, positive feedback.

**v1**: capture is automatic (low-risk logging); promotion is みや-gated at Phase 2.

## Pre-commit confirmation (Phase 1 → commit)

Before any `git commit` on a quest:
1. Confirm all checklist items are `[x]`
2. Ask みや: "Have you tested locally?" — if yes, update `local_test_confirmed=true` in `quest/active.txt`
3. **Stop-at-stage gate (MANDATORY in v1 — added 2026-05-21 by みや)**: after `git add`, STOP. Emit the staged file list + the FULL staged diff (`git diff --cached`) + the drafted commit message, and WAIT for みや to review the message. Do NOT run `git commit` until みや explicitly approves the message. No auto-commit in this skill version — the stop is a hard gate, even when みや earlier said "close the ticket". **Why**: commit-message slips (QA-262233 missing urusan-hyphen, QA-260316 wrong subject) all happened when the message went uncommitted-unreviewed; a visible stop at the staged state lets みや catch the message before it is permanent.
3b. **Work-repo cleanup (MANDATORY — added 2026-05-21 by みや)**: before staging, remove the throwaway artifacts Ruri created in the work repo during Apply — `*.bak*` backups, `*- Copy*` duplicates, orphaned `~$*` Word locks. Ruri's `.docx` backups belong in `outputs-temp/`, never the etanah repo. After cleanup, `git status` shows only the intended fix files + pre-existing unrelated changes — no Ruri-generated junk. **Why** (2026-05-21, QA-262004): Phase 1 close left `- Copy.docx` + 3 `.bak_ruri_*` files in the etanah repo; they were flagged to みや instead of cleaned.
4. Only then proceed to commit

---

---

## Workflow runner mode (NEW 2026-05-28 — plan Phase 2.5)

Quest is a **workflow-type skill, not a one-shot**. Its job is to programmatically chain sub-skills via the Skill tool at each phase boundary — not to be a checklist Ruri reads and might skip.

**Phase-boundary skill invocations (the contract — write these tokens at every phase emit)**:

| Phase boundary | Required Skill tool invocations |
|---|---|
| `/quest start` Step 5 (Context Loading) | `→ Skill: etanah-knowledge-load` (tier=always) |
| Discovery emit (Scout familiar output) | `→ Skill: scout` if multi-ticket retrieve mode |
| Recon emit (per HYPOTHESIS claim) | `→ Skill: predicate-box` (TRUE IF / PROVED BY / FAILED WHEN per claim) |
| Recon emit (Universal Check 9 sibling-structure read) | inline citation of 2-3 siblings file:line in Recon block; no separate Skill tool call but blocks Recon emit if absent (per Phase 3 scout-completeness-gate.js) |
| Rubric emit (option-ranking) | `→ Skill: rubric` (currently absorbed into Quest Rubric phase per Phase 4 — slash-trigger still routes to stub) |
| Rubric emit (≥2-layer fix) | `→ Skill: system-design` (Step 6 Multi-Perspective Scrutiny Table) |
| Apply boundary (per Edit while debugging) | `→ Skill: predicate-box` (Debug Mode Ritual 1) + `→ Skill: scope-anchor-echo` |
| Hand-back (every emit) | `→ Skill: claim-verification` + `→ Skill: test-data-echo` + `→ Skill: task-assignment-honesty` |
| Phase 1 close-out | `prepare-commit-trigger.js` injects 12-step sequence (incl. Step 7.5 commit-conventions.md read); → Skill: verify (Checklist C) |

**`current_phase=` tracking in active.txt**: as Quest progresses through phases, the `current_phase=` field updates so boot-time resume reads know where to pick up. Mutable per turn.

**Skill-tool-failure fallback contract**:

When Quest skill calls Skill tool for a sub-skill and the call FAILS (skill not in registry, body error, runtime exception):
- **Surface** the error in chat — never silently continue
- **Pause** workflow at that boundary — do NOT proceed to next phase
- **Message** みや: "Skill tool call to `<skill>` failed: `<error>`. Workflow paused at `<phase>`. Investigate or bypass with `[skip-invoke <skill>: <reason>]`."
- The existing `skill-invocation-discipline-gate.js` rule applies: "If it errors (skill not in available list, etc.), SURFACE the error to みや — do NOT shortcut to manual."

**Workflow-execution bypass**: `[skip-phase-execution: <reason>]` for legitimate cases (turn is just a clarification question, no phase work intended). Visible in transcript for audit.

---

*Protocol reference: `quest/quest-protocol.md`*
