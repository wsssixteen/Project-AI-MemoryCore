---
name: quest
description: Quest workflow management — accept, hold, or resume a QA ticket quest
argument-hint: "start <QA-number> <task-folder-path> | hold | resume"
allowed-tools: Read, Glob, Write, Bash
---

# Quest — Work Ticket Execution System

ARGUMENTS: $ARGUMENTS

## /quest start <QA-number> <task-folder-path>

Phase 0 — Accept the Quest:

1. Read every file in the provided task folder path (Glob + Read all)
2. Parse: ticket description, bug/enhancement details, scope items, screenshots notes
3. Build scope checklist table:

| Item | Description | Status |
|---|---|---|
| 1a | [from ticket] | ⬜ |

4. Save checklist to project file at `projects/coding-projects/active/<QA-number>/`
5. Write quest state to `quest/active.txt`:
   ```
   qa=<number>
   task_folder=<path>
   phase=1
   local_test_confirmed=false
   ```
6. Present checklist to みや — wait for confirmation before touching any code

Only proceed to Phase 1 after explicit confirmation.

---

## /quest hold

1. Read `quest/active.txt` to get current quest
2. Update state: `status=hold`; append `held_reason=<date+time> — <context + みや's stated intent>`
3. **Write a "Resume Point" block into `QA-NNNN.md`** — section `## 0. Resume Point` at the top of the doc. Must cover: current phase, what IS done, what is NOT done, open decisions, first-step-on-resume, and any みや-stated intent (e.g. "wants a fresh re-read from start"). The chat summary evaporates; `QA-NNNN.md` is the durable home the next-session briefing reads.
4. Summarise where we left off in one paragraph
5. Confirm: "Quest <QA-number> is on hold. Run `/quest resume` to return to it."

---

## /quest resume

1. Read `quest/active.txt`
2. If status=hold: restore context — read `QA-NNNN.md` (the `## 0. Resume Point` block FIRST), read project file, show checklist state
3. Confirm: "Resuming Quest <QA-number>. Last state: [summary]."

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

*Protocol reference: `quest/quest-protocol.md`*
