---
name: quest
description: Quest workflow management — accept, hold, resume, or START a QA ticket quest. Triggers — "/quest start|hold|resume", "let's start with <ticket>", "let's start on X", "start working on X", "start X", "begin X", "pick up X", "continue X", "back to X", "resume X", "X rework", any bare ticket number that cross-matches a `quest/active.txt` qa= entry (e.g. "262233", "PTMLK/.../PRZ/2026/N"), any formal Etanah/Redmine ticket reference. Loads protocol, reads Notes.txt + History.txt, classifies New/Rework/Addition, emits Phase 0 visible checklist.
argument-hint: "start <QA-number> <task-folder-path> | hold | resume"
allowed-tools: Read, Glob, Write, Bash
---

# Quest — Work Ticket Execution System

ARGUMENTS: $ARGUMENTS

## 🎯 Core methodology — the engine (keep it simple)

`Scout (trace the whole class chain, start→end · 100%-verify) → Recon (distrust + verify the Scout, prove it wrong) → Rubric (blast-radius + read sibling code for format/structure/style + emit 2-5 candidate fixes) → Apply`. This loop covers debugging → implementation in one straightforward pass; the phase machinery + skill invocations below **serve** it, never replace it. If a gate gets in the loop's way, the loop wins. Detail: `quest/quest-protocol.md`.

## 📌 Vocabulary — "save everything" in quest context (per みや 2026-06-18)

When みや says **"save everything" / "save the quest" / "save it" / "document the quest"** DURING quest work, it means **persist into the quest's own MD files** — NOT a session save / diary / Domain Expansion. The three homes, in order:

1. **`projects/coding-projects/active/QA-<num>/QA-<num>.md`** — the canonical per-quest doc (primary). Write the section matching the phase that just completed: Scout→`Context Loading (Discovery)` · Recon→`Debugging` · Rubric→`Code-Review` · Apply→`Ship — Apply` · test→`Ship — Verify`.
2. **Task folder `1. <NNN NNN>.txt`** — test-data only, via `node quest/notes.js` (never hand-write).
3. **`quest/active.txt`** block — phase/status/scope fields, via `node quest/active-cli.js update`.

See "QA-NNNN.md persistence — save after EVERY stop" below for the full rule. If unsure whether "save" means quest-save vs session-save, the quest context (a ticket is active) defaults to quest-save.

## /quest start <QA-number> <task-folder-path>

**Phase 0 runs as the `quest-phase0` Workflow (NEW 2026-05-29).** On `/quest start`, after deriving the ticket context, invoke the Workflow tool:

```
Workflow({ name: 'quest-phase0', args: {
  qa, taskFolder, env,
  codebaseRoot,            // 'etanah-pelupusan' (PLP/APPS) | 'etanah-awam' (AWAM) — by ticket subject
  ticketType,              // bug | enhancement | template | cr
  depth,                   // 'full' for bugs (adversarial Verify) | 'quick' otherwise; みや can override "deep"/"quick"
  protocolPath: 'quest/quest-protocol.md',
  knowledgeDir: 'projects/coding-projects/active/etanah-knowledge/melaka',
  qaDocPath,               // projects/coding-projects/active/QA-<num>/QA-<num>.md
  dbMcp                    // mcp__postgres-mlkuat__query | mcp__postgres-mlkfat__query — per ticket Env
} })
```

- **Depth scaling** — `full` (Discovery → KnowledgeLoad → Recon → adversarial Verify → Synthesize) when `ticketType==='bug'`; `quick` (skips the adversarial fan-out) otherwise.
- **Blast-radius by codebaseRoot** — `etanah-pelupusan` → codebase-only, **TRG BANNED** (ignored entirely). `etanah-awam` → **multi-state-aware** (other states share the portal).
- The workflow **writes `1. <NNN NNN>.txt`** (canonical format, `quest-protocol.md:373-403`) **and the QA-NNN.md investigation sections**, then returns a verified diagnosis + fix-shape.
- After it returns: present the **Issue Checklist + diagnosis** to みや and **wait for confirmation before any code**. The interactive remainder (Rubric-pick → Apply → test → commit) stays human-gated in this skill — the workflow owns Phase 0 investigation ONLY.
- **Fallback**: if the Workflow tool is unavailable (headless/cron), run the manual Phase 0 steps below directly.

Phase 0 — Accept the Quest (manual steps / what the workflow encodes):

1. Read every file in the provided task folder path (Glob + Read all)
2. Parse: ticket description, bug/enhancement details, scope items, screenshots notes
3. Classify ticket type (per plan Phase 2): read `Description.txt` + `History.txt`, classify as `bug | enhancement | cr | requirement` — write to `active.txt` `ticket_type=` field + the QA-NNN.md Context Loading section with Description-quote justification
4. **Initialize the canonical per-quest doc** (per plan Phase 1, 2026-05-28): copy `.claude/skills/quest/QA-NNN-template.md` to `projects/coding-projects/active/QA-<number>/QA-<number>.md` and write the Discovery checklist into the `## Context Loading (Discovery)` section. Subsequent phase emits write into the SAME file (Recon → `## Debugging` section, Rubric → `## Code-Review` section, etc.). Do NOT create sibling files (`early-diagnostic.md` / `scout-report.md` / `handoff-XXX.md` / `class-chain-traces.md` / `Fix.txt`) — those are deprecated for new quests. `pre-action-check-gate.js` blocks edits to such sibling files.

| Item | Description | Status |
|---|---|---|
| 1a | [from ticket] | ⬜ |

5. → load etanah-knowledge **inline** (tier=always — read the 5 always-load layers per plan Phase 2; conditional layers load as `index.md` routes by ticket type + symptom). NOT a Skill-tool call — there is no `etanah-knowledge-load` skill dir; the load is a direct file-read (or the `quest-phase0` Workflow).
6. Write quest state to `quest/active.txt`. The block usually **already exists** (redmine-sync created it at retrieval with `status=hold` + `assigned_to_me=`). **Update it in place** — never recreate (that would drop `assigned_to_me`):
   ```
   node quest/active-cli.js update QA-<number> \
     status=active phase=0 current_phase=Discovery \
     ticket_type=<bug|enhancement|cr|requirement> \
     local_test_confirmed=false \
     quest_start=@now \
     qa_doc=projects/coding-projects/active/<number>/QA-<number>.md
   ```
   - `quest_start=@now` — stamps **when work actually begins** (active-cli.js resolves `@now` → local date; `@nowts` for time-of-day). Distinct from `assigned_to_me` (when it became mine) and from the folder-creation time (retrieval — deliberately not tracked).
   - If no block exists yet (rare — manual quest with no sync), use `start` instead of `update` with the same fields.
7. Present Issue Checklist to みや — wait for confirmation before touching any code

Only proceed to Phase 1 after explicit confirmation.

---

## /quest hold [<QA-number>]

1. Read `quest/active.txt` to find the target quest:
   - If `<QA-number>` arg supplied: match that specific entry
   - If no arg: pick the single quest with `status=active` (error if 0 or >1 active)
2. Update state: `status=hold`; append `held_reason=<date+time> — <context + みや's stated intent>`
3. **Write a "Resume Point" block into `QA-<NNN>.md`** — section `## 0. Resume Point` at the top of the doc. Must cover: current phase, what IS done, what is NOT done, open decisions, first-step-on-resume, and any みや-stated intent. **🆕 COLD-READER SELF-CONTAINMENT (2026-06-28)**: write it for a session with ZERO context — every reference must resolve cold. Include: test permohonan ID + login (`test-data-echo`), **FULL file paths not tail-fragments** (`MlkPengiraanBayaranLesenForm.xhtml:33`, NOT `L8:33` — `feedback_full_names`), branch + env, the exact next action, and the build/deploy step. The curse-of-knowledge trap: anything still live in this session's memory feels resolved to you but is MISSING to the cold reader.
4. **Verify cold-resumability** — run `node domain/checklist-reactivate/resume-readiness.js <QA>`; fill any `✗` row in the qa_doc BEFORE confirming the hold (deterministic check — replaces the ad-hoc familiar cold-resume test).
5. Summarise where we left off in one paragraph
6. Confirm: "Quest <QA-number> is on hold. Run `/quest resume [<QA-number>]` to return to it."

---

## /quest resume [<QA-number>]

1. Read `quest/active.txt` to find the target quest:
   - If `<QA-number>` arg supplied: match that specific held entry
   - If no arg: pick the single quest with `status=hold` (error if 0 or >1 held)
2. Restore context — read `QA-<NNN>.md` (the **`## Ticket Summary` block FIRST** — created at retrieval, always exists, rebinds you to what the ticket is about; THEN the `## 0. Resume Point` block), then the rest of the doc top-to-bottom (Discovery → Debugging → Code-Review → Apply etc. — single canonical doc means no sibling files to chase). **Reading `## Ticket Summary` on resume is MANDATORY** — it is the binding anchor that stops a quest being resumed without re-understanding it.
3. **Surface the live checklist** — run `node domain/checklist-reactivate/checklist-show.js <QA>` to print the persisted `## Next-Steps Checklist` open rows (the *reactivate* half of the checklist-reactivate Power; `/checklist` is the *persist* half). Fires HERE at resume, NOT at SessionStart — boot stays lean (open-quest-surfacer already gives boot awareness).
4. **🚨 GIT-STATE CHECK — COMPULSORY ON RESUME, not only on `/quest start` (added 2026-07-27 per みや, QA-265537).** For EVERY repo the quest touches (`etanah-pelupusan` / `etanah-awam` / `etanah-common` — read them off the qa_doc's file table, not from memory), run and EMIT:
   ```
   git branch --show-current · git status --short · git fetch origin
   git rev-list --count HEAD..origin/<baseline>      # behind-count — baseline is mlk/master for BOTH pelupusan and awam
   ```
   Emit one line per repo: `<repo>: branch <b> · behind <n> · dirty <n files> · stash <n>`. **If behind > 0, resolve it BEFORE any diagnosis** (capture uncommitted work → `git stash push -m "<descriptive>"` → `git pull --ff-only` → `git stash pop`), then state whether the pulled delta touched any file the quest's diagnosis rests on (`git log --oneline ORIG_HEAD..HEAD -- <those files>`) — a non-empty result **invalidates the prior Recon** and forces a re-read before continuing.
   **Banned**: diagnosing, building, or staging a deployment from a repo whose behind-count was never measured. **Why** (2026-07-27, QA-265537): a whole morning of AWAM diagnosis + a hand-staged deployment repair ran on a base **39 commits behind** `origin/mlk/master`. `/quest start` had this row (Quest Preparation Verification); `/quest resume` did not — that asymmetry was the structural gap.
   **Latent trap found in the same pass (verified, but NOT the 2026-07-24 outage trigger)**: the *committed* `.settings/org.eclipse.wst.common.component` pointed the etanah-common overlay at **`1.0.112-MLK`, a version absent from `E:\Dev\.m2_etanah`** (`Test-Path` = False) — an overlay handle resolving to nothing produces exactly the documented "`target/m2e-wtp/web-resources/` holds only `META-INF`" signature. Upstream had already corrected it to `1.0.141-MLK`. ⚠️ **It does NOT explain the 2026-07-24 outage**: the local working copy was already hand-edited to `1.0.141` on **2026-07-23 15:28** (file mtime), i.e. before that outage — hypothesis REFUTED, the trigger stays **UNKNOWN**. It remains a real trap for any fresh clone or hard reset of the committed state.
5. Confirm: "Resuming Quest <QA-number>. Last state: [Resume Point summary] · <N> open checklist items · git-state: [per-repo line]."

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
| Notes.txt written | If the hand-back asks みや to test/simulate, `1. <NNN NNN>.txt` in the Task folder MUST already hold this quest's entry (env / urusan / tugasan / langkah + permohonan ID + login). Missing → run `node quest/notes.js` NOW. Never hand-write it. |
| Tugasan named | Every test/simulate instruction names the specific **tugasan** — not just the document/screen. みや needs to know where in the workflow to go. Omitting it = the same failure as a blank Notes.txt. |
| Flag states WHERE — human-findable | Every flag / ⚠️ / caveat states a location みや can actually FIND: the file path PLUS, for a document, the visible **searchable text** + page number. NEVER cite an internal machine ID (Word `paraId`, SDT `id`, XML attribute) — みや cannot search those in Word. Say "the line reading '<visible text>' on page N", not "paragraph 78F8C270". |
| Login present | Any permohonan ID carries its `pengguna_semasa` login (`feedback_pengguna_semasa.md`). Unknown → DB-query it first. |

**Why** (2026-05-21, QA-259339): the Notes.txt auto-write has slipped ≥4 times; per the skill-failure-log ≥3-strike rule the cure is structural, not another trigger phrase. The hand-back (▶ YOUR MOVE) is the single moment all this info is needed, so the gate lives here — Notes.txt / tugasan / WHERE / login become hard preconditions of the emit, checked visibly so a skip leaves a trace.

### QA-NNNN.md persistence — save after EVERY stop (added 2026-06-04 by みや)

At **every** stop / hand-back (each ▶ YOUR MOVE), persist the just-completed phase's findings into `QA-NNNN.md` BEFORE the chat evaporates — whether the stop is a single phase (Recon now, Rubric later) or a combined pass (Recon+Rubric in one go → save once after). Write the matching section: Scout→`Context Loading (Discovery)` · Recon→`Debugging` · Rubric→`Code-Review` · Apply→`Ship — Apply` · test result→`Ship — Verify`.

**Spawn a `general-purpose` familiar to do the write so it does NOT block the main thread** — hand it the phase content + the target section name; it formats + writes per the QA-NNN template while the main thread proceeds to the hand-back. (For a tiny append, an inline Edit is fine — the familiar is to avoid slowing a substantive multi-section write.)

**Why**: the chat summary is lost between sessions; `QA-NNNN.md` is the durable home `/quest resume` reads (its `## Ticket Summary` first). Saving only at `/quest hold` or Phase 2 risks losing a phase's reasoning if the session ends mid-quest. Per-stop save = no lost work. Pairs with the retrieval-time Ticket Summary rule (`save-commands.md`).

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

### 🌐 ENV-PARITY row — MANDATORY at Phase 1 close for any DB/config deliverable (added 2026-08-05 per みや)

**Fires when** the fix includes ANY of: a `.sql` script · a reference/config table edit (`ind_*`,
`rjk_*`, `kod_*`) · a Kemaskini-Tugasan / maintenance-screen change · a flowable (BPMN) change.

**Why**: a config change applied in ONE schema is invisible everywhere else, and nothing records
where it is still owed. QA-270900 cycle-1 was closed by a maintenance-UI edit on `et_main_stg2`
alone — it came back as cycle-2 because `et_main_mlit` never got it, and on 2026-08-05 PROD was
found still on the pre-fix value weeks later. みや: *"this probably could've been prevented if we
pasted the flowable and sql ticket name + script name."*

**Emit this table, and paste it into the Redmine close note:**

| Env | Schema | Current value | Script owed? |
|---|---|---|---|
| MLIT | `et_main_mlit` | `<queried>` | ✓ / ⬜ |
| Staging | *(live pointer — `feedback_staging_schema_stg2.md`)* | `<queried>` | ✓ / ⬜ |
| PROD | `et_main` | `<queried>` | ✓ / ⬜ |

**Rules:**
- **I run the SELECTs** — all four MCP servers are mine (`feedback_never_hand_miya_a_query`). Only the
  write is みや's / the patching team's.
- **Query, never infer.** A row is `<queried>` or it is not in the table.
- **Blast radius**: for a transactional-table touch, also count in-flight rows (`umm_a_tgsn` etc.)
  that would keep a stale value; state `0` explicitly when there are none.
- **The Redmine close note carries three things**, so nobody has to re-derive them later:
  `flowable path` · `#<ticket>, <script filename>` · this ENV-PARITY table.
- **Banned**: closing a config/SQL ticket with only one env verified, or with the script named
  nowhere in the ticket.

### 🏷️ Scripts are `.sql` — ALWAYS (added 2026-08-05 per みや)

**Every script created during a quest is written as `#<ticket>.sql`.** Never `.txt`.

| Rule | Detail |
|---|---|
| Extension | `.sql` — so it opens with syntax highlighting instead of as plain text |
| Name | `#<ticket>.sql` — one file per ticket, greppable from the ticket number alone |
| Combine | multiple statements for one ticket go in ONE file; do not split |
| Existing files | keep their real names — the ticket/Sheet must name what is actually attached |

みや: *"please make it mandatory we always create `.sql` during quest itself. So that it is user
friendly when they open the file."* This **supersedes** the `#<ticket> sql.txt` shape recorded
earlier the same day in `release-mlk-plp` §E2 (that was read off an older attachment, `#269802
sql.txt`); `.sql` wins for anything we author from now on.

Content rules unchanged and still binding: no JOIN · kod-subquery id resolution · no schema prefix ·
RAW-FIRST · expected-outcome annotation (`-- N rows updated`).

### Close stamp — `closed=@now` (added 2026-06-04, work-date drift fix)

The moment the quest is actually **done** — status flips to `closed` (Phase 1) — stamp the close date in the SAME `active-cli.js` call:

```
node quest/active-cli.js update QA-<number> status=closed closed=@now local_test_confirmed=true
```

- `closed=` is the **universal done-date** — it fires for **data-patch / config / non-git** closes too, where there is no `commit=` to read a date from. For git fixes both `commit=` (code-change date) and `closed=` (done date) coexist.
- For **rework cycles**, append a cycle-tagged variant rather than overwriting — `closed_cycle2=@now` — so each cycle keeps its own done-date (mirrors `commit_cycle1`/`commit_cycle2`).
- Phase 2 archive (`quest/archive-quest.js`) does NOT re-stamp — `closed=` is set once at the Phase 1 done-moment and travels with the block into `active-archive.txt`.

---

---

## Workflow runner mode (NEW 2026-05-28 — plan Phase 2.5)

Quest is a **workflow-type skill, not a one-shot**. Its job is to programmatically chain sub-skills via the Skill tool at each phase boundary — not to be a checklist Ruri reads and might skip.

**Phase-boundary skill invocations (the contract — write these tokens at every phase emit)**:

| Phase boundary | Required Skill tool invocations |
|---|---|
| `/quest start` Step 5 (Context Loading) | load etanah-knowledge **inline** (tier=always) — direct file-read / `quest-phase0` Workflow, NOT a Skill-tool call |
| Discovery emit (Scout familiar output) | spawn a **Scout familiar** (Agent) if multi-ticket retrieve mode — Agent-based, NOT a Skill-tool call |
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

## Boot-summary content — absorbed from CLAUDE.md v1.64 (2026-07-13, external-audit C1)

> This section is JIT-loaded on every quest trigger (via `ticket-gate.js` / the `quest` skill description match), replacing the need for these rules to live boot-loaded in `.claude/CLAUDE.md`. Bodies below are preserved **verbatim** from CLAUDE.md; only the headings' original emoji/level are kept for traceability. Where CLAUDE.md content already existed in this SKILL.md (the Core-Methodology engine statement), it was **not** duplicated — see the "Core Methodology" note at the end of this section.

---

### 🗄️ Database & Entity Resolution

> ⚓ **Format Anchor** — DB-discovery findings emit as tables, never prose paragraphs. Apply §2 HARD PRE-SEND GATE.

> Added 2026-05-30 (merges the DB discipline trimmed out 2026-05-22 with みや's instructions), after a session where I guessed table/column names, queries errored, and I **fabricated** results. The resolving info was already in hand — the code entities I'd scanned, `DATABASE.md`, and the live DB keyed on `aplikasi_id`. (The `et_main[_uat].` **schema-prefix** rule lives in the **Entity-first SQL** bullet in CLAUDE.md's Etanah Non-Negotiable Rules; this section is the rest.)

- **Load the schema knowledge file first** — `projects/coding-projects/active/etanah-knowledge/melaka/DATABASE.md` (from the TDD SQL exports; lives in the main-repo working tree, absent from worktrees) is the source of truth for table + column names. Trust it over assumptions; Glob + Read it at Phase 0 of any DB-touching work.
- **The spine — `umm_aplikasi` + `aplikasi_id`**: a permohonan ID (`PTMLK/...`) = `umm_aplikasi.id_pengenalan`; from it get `aplikasi_id`, then reach every related table by joining on `aplikasi_id` (`umm_a_permohonan_tnh`, `umm_a_dok_keluaran`, `umm_a_tgsn`, …). Layer convention: `_p_` = AWAM/portal, `_a_` = PLU/internal (`_a_` ≠ approved).
- **Entity-first, but don't skip the DB** — read the JPA `@Table`/`@Column` (or `DATABASE.md`) before naming a table/column; never infer from Java names. "Never infer" ≠ "skip the lookup": when the DB completes the answer or was asked for, query it — I have live access.
- **100% complete chain check → save into `QA-NNNN.md`**: when scanning code for a fix, trace the FULL chain — XHTML/CC tag → bean/populator → entity getter → `@Table`/`@Column` → DB table+column → `aplikasi_id` join — and WRITE it into the quest's `QA-NNNN.md` (Debugging section). Reusable next cycle + auditable; don't keep it only in working memory.
- **An errored/empty query is a STOP, never a fill-in** — read the actual error (wrong column / unqualified schema / wrong table), correct it, re-run. NEVER narrate a result the database did not return. This is verify-before-claim applied to SQL — the slip this section exists to kill.
- **🎯 Symptom → screen lookup via `ind_langkah.nama`** (added v1.48 2026-06-01 per sonnet research) — when a ticket names a UI panel / langkah / screen (e.g. "Jabatan Teknikal tidak papar", "Maklumat Hakmilik kosong"), the cheapest first DB move is querying the `ind_langkah` master-table whose `nama` column stores the **exact BA-readable panel name**: `SELECT l.nama, s.jsf_view FROM et_main_uat.ind_langkah l JOIN et_main_uat.ind_skrin s ON s.skrin_id = l.skrin_id WHERE l.nama ILIKE '%<keyword>%';` — returns the XHTML file path directly. Skips guessing "which table family"; the database itself maps BA-language → file. Use BEFORE grepping DATABASE.md when the symptom is panel-shaped.
- **🩹 Patch-script portability + minimal-footprint (added 2026-06-18, ref QA-263344 — Aaron's revised script; hardened + Stage-Match + expected-outcome added 2026-06-29 per みや, PROD patch for `0402DIS2025000170`; salvaged to main 2026-07-05 from stranded worktree amazing-bassi).** A data patch is run by someone ELSE in ANOTHER environment — so: (1) resolve IDs by **kod-subquery**, NEVER a hardcoded PK (`tgsn_id=5134780` is UAT-only → hits no row / the wrong row elsewhere); (2) cover **sibling rows** (e.g. PYMB + SMB), not just the one in the ticket; (3) **🚨 ONLY UPDATE WHAT IS REQUIRED** (hardened 2026-06-29 per みや) — touch **ONLY the column being fixed** + nothing else. **No `version = version + 1` proactively** — not on config tables (`ind_*`, `rjk_*`) AND not on transactional tables either, UNLESS `version` IS itself the column being fixed. The prior carve-out "version-bump OK on transactional rows" is **WITHDRAWN**; "minimal-footprint" wins. No audit-column touches (`created_by` / `last_modified_by` / dates). No tidy-ups that aren't the bug. **Banned**: bookkeeping scope-creep ("while I'm in there I'll also bump version / refresh last_modified") — that is the failure mode this rule kills. (4) **🆕 Stage-Match Block MANDATORY for transactional-table patches** (added 2026-06-29 per みや — refining the `0402DIS2025000170` slip class). Before any UPDATE on a **transactional/workflow table** (`umm_aplikasi`, `umm_a_*`, `umm_p_*`, `dft_a_*`, `pks_a_*`, etc.), Ruri MUST emit a **Stage-Match Block** that derives the row's workflow stage from the DB AND locates the code method that normally writes those columns at that stage. Format (1-3 lines per step OK; tables allowed):
   - **Step 1 — Row stage**: derive `urusan_kod` (from `umm_aplikasi.ursn_id → ind_ursn` or equivalent), `current_tugasan_kod` (from canonical task-state SQL — `umm_a_tgsn → ind_tgsn`), `langkah` (from `ind_langkah` if relevant). Cite the SQL.
   - **Step 2 — Code owner**: grep `setColumnX` / `setColumnY` callers; identify the `<Class.method():line>` that writes these columns AT THIS STAGE. If none exists for this stage, name it: *"no normal forward owner — revert-shape patch."*
   - **Step 3 — Column-match scan**: list which columns the owner writes vs which the patch sets. Gap = additional columns the owner writes that the patch omits → either add them or justify the omission.
   - **Step 4 — FK companions**: query child tables that reference this row (`umm_a_tgsn`, `umm_aliran_kerja`, audit/log tables) — do any need parallel patches to stay consistent?
   - **Step 5 — Verdict**: ONE of three: `✓ matches owner` (normal forward state-change) · `⚠️ revert-shape` (no normal owner — patching against the grain; tell みや explicitly so he decides knowingly) · `🚨 mismatch` (owner writes more/different columns than patch — STOP, reconcile before scripting).

   **Exception**: for **reference/config tables** (`ind_*`, `rjk_*`, `kod_*`, lookup tables) the stage concept does not apply — emit `⏭ N/A — reference table` and proceed straight to checklist. **Why this rule exists**: the `0402DIS2025000170` patch had the row stage, the code chain, and the canonical task-state SQL all available as Quest disciplines, but they were never assembled into the patch-script flow — Ruri drafted a revert from "Diselesaikan Diluar e-Tanah" to "Awalan" without ever asking "what tugasan is this row AT now, and what code path would write that revert?" — the answer "no normal forward owner" would have surfaced the revert-shape verdict upfront. The block is the assembly point.

   (5) **🆕 Expected-outcome annotation MANDATORY** (added 2026-06-29 per みや) — every patch script ENDS with a trailing comment stating the expected row count + action verb: `-- N row(s) updated` / `-- N row(s) deleted` / `-- N row(s) inserted`. The **executor** verifies the actual `<n> rows affected` output matches the annotation; mismatch = STOP (do not commit, surface the discrepancy). Example minimum-bar patch みや sent to PROD for `0402DIS2025000170`: `UPDATE et_main.umm_aplikasi SET status_proses = 'Awalan', status_awam = 'Sedang Diproses' WHERE id_pengenalan = '0402DIS2025000170'; -- 1 row updated`. **Emit a patch checklist before any UPDATE patch**: kod-subquery ✓ · siblings ✓ · only-fixed-column ✓ · no-version-bump-unless-version-IS-the-fix ✓ · stage-match block ✓ (or ⏭ N/A — reference table) · expected-outcome annotation ✓. **Enforced deterministically by**: `domain/patch-script-gate/patch-script-gate.discipline.hook.js` (Stop hook, ADVISORY v1 — fires when a SQL UPDATE/DELETE/INSERT block ships without the `-- N rows {updated|deleted|inserted}` trailing comment OR when an UPDATE on a transactional table (`umm_*` / `dft_a_*` / `pks_a_*`) ships without a "Stage-Match" marker in the same reply; bypass `[skip-patch-gate: <reason>]`).
- **🔍 RAW-FIRST scripts for みや — `AS` aliases + functions BANNED unless necessary / the purpose / requested (added 2026-07-03 per みや, #239386 Langkah-Evidence).** Every script delivered to みや shows **TRUE column names + TRUE table contents**: no column renames, no COUNT/FILTER/string_agg/CASE wrappers, no clever one-query-does-everything joins that abstract the data away. **Prefer MULTIPLE simple scripts** (one per table / one urusan at a time) over one combined query. Allowed exceptions, each earned: (a) a column alias ONLY to disambiguate genuine same-name collisions across joined tables (e.g. `u.kod` vs `l.kod` — and the alias PRESERVES the true name: `urusan_kod`, never a free rename); (b) a join ONLY when the needed column truly lives in another table (kod_skrin in `ind_skrin`); (c) an aggregate ONLY when aggregation IS the requested purpose. みや 2026-07-03: *"ALWAYS try to show what are the true columns names & true contents of the table… avoid combining tables & abstracting too much. It is desirable to break it down into multiple scripts instead."* Generalizes the Verify-SELECT rule below from patch-verifies to ALL delivered scripts.
- **🔍 Verify-SELECT shows the TRUE stored column values, never a derived stand-in (added 2026-07-01 per みや, ref #239386 per-urusan patch).** A verification SELECT in a DB script MUST project the ACTUAL stored column values (`flag_boleh_dikemaskini`, `flag_aktif`, `kod_skrin`, `skrin_id`, `turutan`) — one row per record — so the reviewer sees exactly what is in the row. **Banned**: replacing the real value with a computed/aggregated check-value — `BOOL_OR(flag_boleh_dikemaskini='Y') AS any_editable`, `COUNT(*)`-only summaries, `CASE`-rewrites, or any projection that hides the raw column behind a true/false/count. Those answer "did my assumption hold" — they do NOT show the truth; a wrong assumption in the rewrite silently passes. **It is fine to run the verify one urusan (or one key) at a time** — swap the `kod` in the WHERE clause; a per-key raw-value SELECT beats a single all-rows aggregate. Enforced by `convention-check-gate.js` SQL branch (advisory line).

---

### ⚔️ Quest Workflow — Canonical Phase Emit Template + class-chain form

> ⚓ **Format Anchor** — every Quest emit (Scout / Recon / Rubric / Apply / Quest Briefing / RCRL / Test Scenario) is table-first per §2 HARD PRE-SEND GATE. Prose paragraphs explaining a fix when a 3-row table would carry it = rule violation. Arrow flows for any sequence (UI → code → table).

**📐 CANONICAL PHASE EMIT TEMPLATE — defined ONCE, referenced per phase (added 2026-05-31 per みや, after the haiku compliance audit found "load" / "execute" / "sibling-diff" all ambiguous):** every quest-phase emit (Scout / Recon / Rubric) MUST follow this 4-part shape — same template each time so the structure IS the discipline:

```
1. Description    — one plain sentence: what this emit answers in everyday language (no jargon / no file:line)
2. Table          — the load-bearing content (Universal Checks / fix options / sibling matrix) as a MARKDOWN TABLE
3. Arrows         — class chain / data flow / state transition as `A → B → ⚠️ C → D` (when applicable; OK to omit if no flow)
4. Summary        — 1-3 lines: the conclusion + the next-step action this emit unlocks
```

**Per-phase reference**: Scout emit, Recon emit, and Rubric emit each follow this template. If the shape is missing, the phase did not run. The auditor (you or any reviewer) scores compliance against the 4 parts.

**🚨 LABEL → KOD RESOLUTION TABLE — mandatory in the Recon emit whenever the ticket names a tugasan / urusan / status in HUMAN WORDS (added 2026-08-03 per みや, QA-273201).** A BA writes screen labels, never kods. Resolving those labels to Java constants **by name resemblance is BANNED** — the constant whose name reads closest is routinely the wrong one. Resolve every label through the **reference table** and emit the mapping:

| BA's words (verbatim + `file:line` of the ticket text) | `ind_tgsn.nama` / `ind_ursn.nama` | kod | pk | role-arm / consumer verified at |
|---|---|---|---|---|

**Rules**: (a) one row per BA-named item, quoting the ticket, not a summary of it; (b) the kod comes from the DB row you actually read, with its pk; (c) if a label maps to **more than one** kod (PDT/PTG variants, per-urusan twins), emit **every** candidate and state which are in scope — never silently pick one; (d) a label with no matching reference row is a BA-Q, not a guess.

**Why**: QA-273201 — BA's *"Perakuan Pentadbir Tanah"* was mapped to `TGS_PERAKUAN_PENTADBIR_TANAH` (`"PPT"`) purely because the constant name matched the words. `PPT` has **no row under PRBB at all**; the real kod is `PPTPRBB` (`ind_tgsn` 5134409), and the two carry *different* role sets (`{KPT,PPD,KPPD}` vs `{KPT,PPD,KPPD,PT}`). The same slip dropped `SRJKBBPTG` / `PRJKBBPTG` because BA's label carried no PDT/PTG suffix. Shipped, it would have looked like a fix and changed nothing on that tugasan. Enforced deterministically at edit-time by the `kod-resolution` row in `pre-code-check` (eval F10).

**Class chain — vertical ASCII form (canonical for Arrows part of the template).** Horizontal `A → B → C → D` doesn't fit ≥3 hops on screen; the canonical shape is vertical with multi-line arrows + annotation in parens for each hop:

```
  MlkKertasTemplateForm.initData():211
        |
        ↓  (super.populatePenyediaanDokumenByDocumentMode)
  BasePenyediaanDokumenForm.initPenyediaanMode():2489
        |
        ↓  (findPenyediaanDokumenList finds STORED doc)
  BasePelupusanDokumenForm.refreshDokumenList():511
        |
        ↓  (passes isFirstEntry=true at :564)
  ⚠️ updateDocumentListAndProcessTemplateIfNotAvailable():468
        |
        ↓  (if(!isFirstEntry) processTemplateList() — SKIPPED)
  stale stored doc served → populator never re-runs → JT empty on paper
```

---

### 🚨 Forced Phase-Emit Gates (HARD RULE)

**🚨 FORCED PHASE-EMIT GATES — the loop only works when each phase produces a VISIBLE emit before the next (HARD RULE, added 2026-05-31 per みや, QA-259702).** The decomposition/trim kept the arrow text but lost the *forced emits* — so a session can "run the quest skill" yet freelance straight from a glance to an Edit, skipping Recon + Rubric. That is exactly what failed QA-259702 (built a new method instead of grepping the file for its own idiom). **The rule — during ANY quest, these emits are MANDATORY, in order, and an Edit to code/template/config is BANNED until they exist in THIS session:**

- **Scout emit** — follow the **📐 Canonical Phase Emit Template** above (description / table of file:line cites with kind=file-read|grep / arrows of the class chain / summary naming the bug-site `⚠️`). **Honesty primitive**: state exactly which files you read + which file:line cites are PROVEN vs HYPOTHETICAL — never imply broader code-reading than you actually did.
  - **Scout step 0.5 — Git history probe (added v1.48 2026-06-01, per みや real solved-issue + sonnet brainstorm)** — BEFORE tracing the class chain, run `git log --oneline -20 -- <suspect file/dir>` + `git log --grep=<ticket-keyword>` (+ for matched commits, `git log -1 --format=%B <SHA>` to read full message). Emit findings as a **separate sub-section** of the Scout output (NOT inline with class chain). Format per commit row: `<SHA> · <YYYY-MM-DD> · <author> · <QA-ref if in msg> · <1-line msg> · signal-tag=<file-overlap | keyword-match | timeline-near | none>`. **Banned**: writing a relevance verdict ("this is related" / "not related") — judgment belongs to Recon. Scout reports neutrally + tags signals mechanically; **Recon cross-checks git timeline vs ticket symptom timeline + chain overlap as part of adversarial verification**. **Why**: git history is the cheapest temporal axis available — recent commits often ARE the bug (regression); a prior fix's QA-ref links to a Redmine ticket with the discussion that would have saved hours of code-tracing. Banned: tracing a class chain without a git-log check on the entry point.
    - **🔎 Existing-fix probe (added 2026-06-19 per みや, QA-266215)** — in the SAME git probe, ALSO check whether THIS ticket already has a fix in flight by someone ELSE, BEFORE deep-diving: `git branch -a --list "*<ticket#>*"` + `git log --all --grep="#<ticket#>" --format="%h %ci %an %s"`. If a fix branch/commit exists under another author (QA-266215 → Vincent's `mlk/internal/266215` `fc6f6d4ba6`), **STOP + surface it** — don't burn a deep-dive on already-owned/solved work; archive shipped-by-other. This is the ticket's OWN fix-existence (distinct from the related-ticket etiology check). **Why**: QA-266215's owner-count misdiagnosis wasted a full deep-dive on a ticket Vincent had already fixed; みや caught it with "check who else handled it" — this makes that probe mechanical.
- **🚨 Step 0 — Recon Context Re-load (RCRL) — fires at Recon start, BEFORE any Scout-claim verify** (HARD 2026-06-01, QA-246923 Description-vs-History clash + RCRL slip own). Emit a `═══ Recon Context Re-load ═══` block with VERBATIM quotes from: (1) Ticket Description, (2) Latest-cycle BA Journal (every entry after the last `Status changed to Rework` boundary — these are the LIVE scope, not the original Description), (3) prior cycle Notes file entries, (4) BA attachments' key annotations (PDF FreeText / photo red-box wording), (5) prior cycle QA-NNNN.md key claims. Then EXTRACT (Ruri's reading, must align with quotes above): BA's broken-claim sentence · BA's asks (bullets) · BA-RULED-OUT items (so we don't re-investigate) · ambiguities = BA-Q candidates. **Conflict rule**: if current-cycle journal contradicts the original Description, **current-cycle wins** — flag the conflict explicitly, do NOT silently reconcile. **Banned**: paraphrasing BA's wording from memory ("BA wants X") without a verbatim cite this turn — that's the recall-not-re-read slip class (QA-246923: agent worked the original Description for full quest while latest-cycle scope was different — manifested as wasted Scout/Recon/Rubric stages). Token bloat is acceptable — bounded ~30-60 lines once per Recon, cheap insurance against scope-drift. **Pairs with**: redmine-sync.js cycle-boundary tagging (parked → next turn) that gives History.txt the `## CURRENT CYCLE` / `## PRIOR CYCLES` sections RCRL reads from.
- **Recon emit** — follow the **📐 Canonical Phase Emit Template**. **Universal Checks emit as a 1-line ✓ checklist** (e.g. `Universal Checks: env ✓ · codebase-root ✓ · blast-radius ✓ · sibling-read ✓ · ind_skrin ✓ · ind_langkah ✓ · pengguna-semasa ✓ · CC-tag ✓ · save-path ✓ · db-probed ✓`) — naming each check is the honesty brake (forces actual check vs silent skip); only expand to a full table-row for the 1-2 checks that surfaced something load-bearing this quest. **Honesty primitive**: mark each as VERIFIED / HYPOTHESIS / BA-Q — never blend states; if you didn't read it, say HYPOTHESIS, not VERIFIED. **Cheapest-falsifier-first (added 2026-07-03, audit E1)**: BEFORE stating ANY hypothesis, enumerate the cheapest disproofs already in hand (git log the pulled delta · one SELECT · one grep · read the failing artifact) and RUN them; every hypothesis emitted after that names the cheapest test that could kill it, run FIRST. **Banned**: any infrastructure/lifecycle theory before ONE complete trace of the observable evidence (QA-262495 ×4 strikes, QA-262004 — hours theorized past evidence already in hand). No Edit before it.
- **Rubric emit** — follow the **📐 Canonical Phase Emit Template**. The table = (a) **blast-radius** row (all tugasan in shared `*_LIST`/`*_MAP` constants that the fix might silently miss — list them, not "and others"); (b) **2-3 sibling file:line** rows for the convention (incl. existing in-file method/branch per the in-file-convention rule + existing constants + existing available methods to reuse — naming `Constant.FOO` / `existingMethod()` you considered reusing); (c) **read-path AND write-path traced** — both rows named, not one; **the write-path row MUST name the `@Column` / DB column the fix writes (not just the Java field) so the column constraints + sibling-on-column-conflict scan is verifiable** (added v1.48 2026-06-01 — collapses §9 Rule 4 chain-must-reach-DB into the Rubric write-path row, no new line); (d) **2-5 candidate fixes** (one marked CHOSEN); (e) **Falsifier + Logger** row — what data shape would prove this fix wrong + the `QA<num>-PROBE:` logger one-liner that would catch it at runtime (mandatory per Ritual 6 — falsifier-as-action, not falsifier-as-thought); (f) **Confidence % + "why this number, not higher / not lower"** — naked percentages drift to 80% as default; force the justification; (g) **BA-Expected Alignment** (NEW 2026-06-01) — VERBATIM quote of BA's "Expected" / "Hasil dijangka" / "Should" / "Patut" / "Sepatutnya" wording from the LATEST cycle (per RCRL Step 0 above) + map EACH candidate fix → which BA-Expected line it satisfies. Unmapped Expected lines = `🚨 scope-drift` flag (the chosen fix doesn't address what BA actually asked for) OR BA-Q candidate. Verdict row: `✓ fully covers BA-Expected` / `⚠ partial — gap: <quote>` / `🚨 scope-drift — fix solves X but BA expected Y`. **Why**: catches the slip class where a clever fix solves *something* but not what BA asked for; fires at end-of-Rubric before Apply, costs <10 lines; (h) **CODE-LOGIC scenario matrix** (added 2026-07-03, audit E4, QA-268273) — for any fix that adds/changes a branch, flag, gate, or session/state write: a `state × trigger × outcome` table walking EVERY runtime path the change touches, INCLUDING re-entry ("what happens on the SECOND click / reopen / re-save?"). **Why**: QA-268273 fix-2 passed convention + blast-radius yet armed on EVERY click, forcing already-kemaskini'd drafts back to tab 2 — the matrix catches over-/under-firing LOGIC, which style checks cannot; advisory-enforced by `quest-phase-gate` v2. **Honesty primitive**: cite the actual sibling file:line you read for the convention check; if you didn't read a sibling / didn't trace the save path / didn't scan the constant map for sibling tugasan / didn't search for an existing constant or method to reuse — say so; guessing is BANNED. No Edit before it.
- **Logger choice (when the Rubric picks "add a probe logger")** — grep the parent class first. `*Config` subclasses inherit `GenericLogger` from `Config.java:14`; use **String-concat** (`TemplateConfig.java:202`). `*Form` classes use slf4j (`MlkKertasTemplateForm.java:160`). Declaring a child slf4j Logger when parent has `GenericLogger` silently breaks compile (QA-262755).

- **🚨 EXHAUSTIVE-BRANCH LOGGING — one build must answer EVERY candidate, never just the leading hypothesis (HARD RULE, added 2026-07-27 per みや, QA-265537).** Every logger round costs みや a full Maven build + redeploy + manual re-test — often 20-40 minutes of HIS time. Instrumenting only the current favourite means the falsifier sends him round again. **Before adding any probe, enumerate EVERY code path that could produce the observed value — A, B, C, D — and instrument ALL of them in the SAME build**, including the "none of the above" case.
  - **Mandatory emit before the edit** — a **PROBE COVERAGE MATRIX**: `| # | Candidate writer (full address) | Probe placed? | If silent, what it proves |`. Every candidate gets a row; a row with `Probe placed? ✗` needs a written reason.
  - **Enumerate mechanically, not by intuition**: `grep` the setter/field across the module (`setBandarSurat\(` etc.), walk EVERY branch of the enclosing `if/else`, include the **pre-fill/init** path and the **re-entry/second-request** path, and add one probe at the persist boundary so "nothing wrote it" is distinguishable from "something overwrote it".
  - **Cover the negative**: if all probes can be silent, that is a designed outcome only when a probe at the OUTERMOST caller proves the region was entered at all. Otherwise silence is an ambiguous result and the round is wasted.
  - **Banned**: shipping a probe build that can only confirm-or-deny ONE hypothesis · "if this isn't it, I'll add another logger next round" · placing probes only where the value is *read* and not where it is *written*.
  - **Why** (2026-07-27, QA-265537): the `bandar_srt_id` hunt took three build+deploy+test rounds — L2 (form only), then L4 (two service branches only), whose falsifier fired because the real writer was in NEITHER, forcing a third. One exhaustive first pass over every `setBandarSurat` call-site plus the persist boundary would have answered it in one. みや: *"what if after this A, B, C or D. Straight away put loggers for those other possible scenarios & not waste my time."*
- **📐 Predicate Diagram** (replaces v1.x Predicate Box; renamed 2026-05-31 per みや — plain English over jargon) — **before each code Edit while debugging** (Debug Ritual 1), emit a 3-node ASCII flowchart: Assumption → Evidence → either-matches-or-falsifier. **OR** — when no live Edit is happening (audit / archived-ticket walkthrough / compliance simulation), emit the SAME 3-node shape with `[ASSUMPTION placeholder]` / `[EVIDENCE placeholder]` / `[FALSIFIER placeholder]` labels to prove the shape was understood. Skipping the emit because "no Edit" is BANNED — the shape is mandatory; only the content differs. Overlap with Recon/Rubric is INTENTIONAL — it grounds the pre-Edit moment when stakes are highest. Falsifier branch is the unique part: forces you to name a data shape that would prove the fix wrong, then plant a `QA<num>-PROBE:` logger that would catch it (per Rubric row e + Ritual 6). Canonical shape:

```
            ┌──────────────────────────────────────────────────┐
            │  ASSUMPTION                                      │
            │  (TRUE IF: one sentence the fix bets on)         │
            └────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
            ┌──────────────────────────────────────────────────┐
            │  EVIDENCE                                        │
            │  (PROVED BY <file:line> + quoted code)           │
            └─────────┬─────────────────────────┬──────────────┘
                      │                         │
                  matches                  contradicted by
                      │                         │
                      ↓                         ↓
        ┌─────────────────────┐   ┌───────────────────────────┐
        │  APPLY              │   │  FALSIFIER                │
        │  the fix            │   │  (data shape Y would       │
        │                     │   │  break the assumption)     │
        │                     │   │  → STOP, rerun Recon       │
        │                     │   │  on the falsifier branch   │
        └─────────────────────┘   └───────────────────────────┘
```

- **🚨 Per-file sibling-diff EMIT LINE** — **the line IS the rule. Substituting equivalent prose ("checked siblings" / "compared template vs PT" / "scanned the panel") = NOT COMPLIANT.** Before building ANY edited file, emit verbatim ONE line: **`<file:line> ← sibling <working file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓`** (or name the specific divergence in place of ✓). Building/deploying without the literal line is BANNED. Archived-ticket / compliance / audit mode does NOT exempt this — if a file was edited in the cycle being walked, emit the line citing what WAS diffed. (Hardened 2026-06-01 after v1.46 haiku audit found this rule slipped 75% with paraphrase-substitution + false-compliance claims.)
- **📖 Quest Briefing — Layer-1 narrative emit, DRAWN STORY DIAGRAM, NOT A TABLE** (NEW 2026-06-01; **hardened 2026-06-02, QA-259914**). Emit an **ASCII-drawn story diagram** with two spines: LEFT = **BA's story (existing)** — story-beats verbatim/near-verbatim from the LATEST cycle (per RCRL Step 0), each beat its own ASCII box, plain language only; RIGHT = **our root-cause completion (new)** — boxes that continue BA's story with what we found + the fix shape. Spines connect with `─────►` at BA's broken-state beat. Triggers: post-Rubric · every Rubric refresh on rework · `/quest resume <QA>` · *"what was QA-X about / brief me on X / remind me about X"* / bare `QA-X?` · scope-shift moments (mistake mid-quest / new findings overturn prior hypothesis / BA-Q answered with surprise) → re-emit with updated beat boxes. **🚨 BANNED in either spine**: markdown tables · prose paragraphs · bullet lists with no drawn shape · `file:line` · class names · SQL · CC-tag · jargon. Layer 1 stays Layer 1.

  **📐 Canonical drawn shape (the literal template — emit a shape LIKE this, not a markdown table):**

```
   BA'S STORY (existing)                          OUR COMPLETION (new — root cause + fix shape)
   ──────────────────────                          ──────────────────────────────────────────────

   ┌──────────────────────────────┐
   │ Beat 1: <BA's opening — what │
   │ the user/screen/action is>   │
   └──────────────┬───────────────┘
                  │
                  ↓
   ┌──────────────────────────────┐
   │ Beat 2: <what happens / what │
   │ BA sees>                     │
   └──────────────┬───────────────┘
                  │
                  ↓
   ┌──────────────────────────────┐         ┌────────────────────────────────────────────┐
   │ ⚠️ Beat 3: <the broken state │ ──────► │ Because: <plain-language root cause —      │
   │ — BA's complaint>            │         │ what we found, no jargon>                  │
   └──────────────────────────────┘         └────────────────────┬───────────────────────┘
                                                                 │
                                                                 ↓
                                            ┌────────────────────────────────────────────┐
                                            │ Fix shape: <what we'll change, in plain    │
                                            │ everyday language — no class names>        │
                                            └────────────────────────────────────────────┘
```

**Banned**: jumping Scout→Apply; emitting a fix with no Recon/Rubric block this session; "I'll just edit it" without the sibling-citation. **Why this is the cure**: the flow worked pre-trim because each phase forced an inspectable, structured emit (headers, tables, `file:line`) — the structure WAS the discipline. Restore the forced emit and the convention-check can't be skipped. Pairs with the in-file-convention rule (Etanah Non-Negotiables in CLAUDE.md) + the pending quest-phase-gate hook (todo.md) that will enforce this deterministically; until that ships, this boot-loaded rule is the guard.

**📋 Confidence % at server-log review (testing phase, post-fix).** When みや returns with test results + server.log, emit the same Confidence % + "what changed" row — the post-log delta (logger confirmed assumption A · logger contradicted B → fix scope tightened) is a persistent signal みや uses to decide whether to commit/push or rerun.

One straightforward pass covers debugging → implementation. Be as straightforward as possible; don't let the machinery smother it — but the three emits above are the floor, never skipped. Full detail in `quest-protocol.md` (Scout sub-protocol · adversarial Recon :574 · Rubric 2-5 options :675 · Blast radius :808 · sibling-check :1087).

**🔌 Subagent orchestration — superpowers v6.0.3 (added 2026-06-28 per みや, eval `wf_a90c9945`)**: four SDD techniques folded in at **skill/protocol layer, NO new hooks** (promote-on-observed-slip per `system-design` Rule 7) — **#2 model-tiering** (cheap `haiku` familiars for **retrieval ONLY** — raw data, zero judgment; controller verifies before trusting · capable model for Scout-trace/Recon/Rubric) · **#1 bulk file-handoff** (>500-line reads + Phase-1 diffs → scratchpad file, path-only; gated phase-emits NEVER leave context) · **#3 one-dispatch-N-emits** (one fixer carries all findings, still emits per-file sibling-diff) · **#6 ≤1-line narration** (folded into `terse-gate`). **KEEP (non-negotiable)**: adversarial Recon + the #7-reject of superpowers' single-reviewer collapse. Detail: `quest/quest-protocol.md` "Subagent orchestration" subsection + `.claude/skills/familiar/SKILL.md`.

**Protocol file**: `quest/quest-protocol.md` — full workflow body (Phase 0/1/2 phases, Discovery → Recon → Simulate → Rubric → Apply → Verify → Commit → Push → Wrap checkpoints, Quest State Transitions, extended `active.txt` schema, Debug Mode Rituals). Load it when any trigger below fires.

---

### Triggers table + non-negotiable trigger-time rules

**Triggers** (activate Quest / re-engage with a ticket automatically — not just first mention; restored to TABLE form at boot 2026-05-25 after the decomposition lost the bare-ticket-number coverage):

| Trigger phrase pattern | Examples |
|---|---|
| Ticket number mentioned (ANY form — with or without prefix) | `QA #258022`, `FAT-OR #255637`, `UAT-CR #239225`, `262233`, `let's start with 262233`, `the 262233 ticket`, `PTMLK/.../PRZ/2026/X` |
| Continuation / scoping | "continue ticket X", "focus on X", "let's work on X", "let's do X", "let's start with X", "X rework", "back to X", "resume X", "start X" |
| Methodology applied to a ticket | "/appraise on X", "scrutinize X", "review X again" |
| Generic intent | "I have a task / ticket / bug to debug", "Read Redmine", any formal Etanah/Redmine work context |

**Non-negotiable trigger-time rules (restored 2026-05-25 — lost during decomposition; failed this session's QA-262233 cycle-2 quest activation):**

- **🪪 Notes file naming convention (renamed 2026-05-31 per みや)**: the per-ticket test-data log is named `1. <NNN NNN>.txt` (e.g. `1. QA-262762.txt`) — NOT the old `1. Notes.txt`. **Why**: when multiple Task folders are open in tabs / multiple files appear in a grep / `Get-ChildItem` listing, a bare `1. Notes.txt` is non-identifying — every ticket has one with the same name. `1. QA-NNNN.txt` is self-identifying. **Scope of rename**: applies going forward — new Task folders created by `quest/redmine-sync.js` use the new name; existing folders keep their legacy `1. Notes.txt` (renaming them in-place would silently break active.txt cross-refs + diary backlinks). `quest/notes.js` reads either filename (legacy-first) and writes the new one. Wherever this protocol says "Notes file" / "the Notes" / `1. <NNN NNN>.txt`, BOTH the new-named and legacy files are meant.

- **Handoff / Notes / History first** (hard rule, 2026-04-29; broadened 2026-05-25): when a ticket # is mentioned, ALWAYS check `quest/active.txt` for a matching `qa=QA-<num>` block. If found:
  - Read `<task_folder>/1. <NNN NNN>.txt` (or legacy `1. Notes.txt`) if it exists — prior test data + logins (cycle-1 entries are gold for rework cycles)
  - Read `<task_folder>/0. Brief/History.txt` fully — full BA journal (not just tail)
  - If `handoff_file=` field exists in the active.txt entry → read that file too
  - **Failure mode this rule prevents** (2026-05-25 QA-262233 cycle-2): I "discovered" via SQL that `PTMLK/01/L/PRZ/2026/20` + `nor.aini@melaka.gov.my` were valid test data — they were literally Notes file entry #5 from cycle-1, sitting unread the entire session.

- **Re-engagement load before any judgement** (hard rule, 2026-04-30 — re-surfaced to CLAUDE.md 2026-05-25): every time a ticket is referenced via ANY trigger above (initial OR continuation OR rework), Ruri MUST verify Task folder + Notes + History + handoff are loaded in CURRENT session context BEFORE producing any analysis, appraisal, code proposal, or recommendation. Loading once at session start is NOT enough — re-engagement after time-gap or context-shift requires explicit re-verification (a quick read or an emitted "Task folder + Notes + History loaded: ✓" line). Quest re-engagement on an `archived` ticket reopened by BA (Redmine status change) counts as a fresh engagement requiring full re-load + folder reactivation (Archive\ → Tasks\Melaka\<n>\ + create `3. Rework/` subfolder per DE signal #5 + cycle 2/3 convention).

- **Reading ≠ understanding** (hard rule, 2026-04-30): loading files is necessary but not sufficient. Synthesis is mandatory — cross-reference Task folder content with handoff content with current code state before any conclusion. When stating any user/role/data fact about a ticket, cite the source line (`Notes.txt:5 says nor.aini@melaka.gov.my is at PRMMKNPTG on /2026/20`).

- **Phase 0 classification** (added 2026-05-05 per DE signal #5): at ticket re-engagement, classify the entry context — **New / Rework / Addition** — via active.txt status + Redmine sync delta + `3. Rework/` subfolder presence. Folder reactivation Archive\ → Tasks\Melaka\<n>\ is required for Rework/Addition cycles.

- Never commit without `local_test_confirmed=true` in quest state.
- Summon `/familiar` (sub-agent) when reading files >500 lines.

---

### Quest Preparation Verification table + Scope-category reference

**Quest Preparation Verification** (renamed from "Phase 0 mandatory reads" 2026-05-31, refined with module-scope 2026-06-01 per みや). Emit AS A TABLE at quest start, BEFORE Scout fires. Naming each context source is the honesty brake (forces the actual load, not silent skip):

| Context source | Loaded | Filename / path |
|---|---|---|
| **🚨 Git-state check (Phase-0, COMPULSORY — added 2026-06-20, run even if it returns nothing)** | ✓ + GIT-STATE summary | `git status` + `git branch --show-current`; baseline-confirm (`mlk/master` pelupusan · `mlk/master` AWAM — local base, mirrors PLP; stag-env/mlit downstream) + `pull --ff-only`; `git rev-list --count HEAD..origin/<baseline>` (behind-count); existing-fix probe `git branch -a --list "*<#>*"` + `git log --all --grep="#<#>"`. Emit a **GIT-STATE summary** (branch · behind · existing-fix? · ticket-keyword log hits). STOP if existing-fix-by-other / pull-fails / stale base. Enforced by `ticket-gate.js` Row 0. **Why**: QA-260139 stale-base · QA-261986 ~293-behind base · QA-266215 existing-fix-missed — prose git-discipline decayed (prompt-driven). |
| active.txt block for QA-<num> | ✓ / ✗ | located + status read; if archived + reopened, folder reactivation noted |
| **🚨 ADHOC-REGISTER check — MANDATORY (added 2026-07-29 per みや)** | ✓ + verdict | Read `projects/coding-projects/active/etanah-knowledge/melaka/ADHOC-REGISTER.md` and compare THIS ticket against every row whose `Status` is **`OPEN`** or **`LATENT`** (`ANSWERED` / `OWNED-ELSEWHERE` owe us nothing). Emit ONE of: **`ad-hoc register: MATCH row [A<n>] — already concluded, starting from <phase>`** (then **in the same turn** append the ticket number to that row and move its Status on, and fold the row's evidence doc into the quest doc — do NOT re-Scout a solved mechanism) OR **`ad-hoc register: no match`**. `domain/adhoc-register/` injects the still-owed rows at UserPromptSubmit so they are in context before Phase 0 begins; the emit is the honesty brake proving the compare happened. **Banned**: running Scout on a symptom that already has a register row. **Why** (みや 2026-07-29): we diagnose BA-reported issues before a ticket exists; without a forced compare the ticket arrives and the whole investigation is repeated. |
| Task folder + 1. \<NNN NNN\>.txt (or legacy 1. Notes.txt) + 0. Brief/History.txt | ✓ / ✗ | folder path; Notes content cited; History.txt read fully (not just tail) |
| **🚨 LATEST-STATE FIRST — journal-timeline table + OPEN/SOLVED classification** (HARD 2026-07-27 per みや — repeated slip: solving an already-solved issue in a long-conversation ticket, ignoring dates/times/assignee) | ✓ + timeline emitted / ⏭ single-entry thread | BEFORE Scout: from History.txt emit the journal-timeline table — \`\| date \| author \| assignee-change \| issue raised/solved \|\`, one row per journal entry, oldest→newest. Then classify EVERY issue mentioned anywhere in the thread as **OPEN** (valid fix target) or **ALREADY-SOLVED** (a later entry records it fixed/deployed/verified — cite that entry's date); emit the solved set as an explicit **DO-NOT-RESOLVE list**. Fix targets = the LATEST open issues only — if the newest entries narrow/redirect/supersede the Description, the NEWEST wins. **Banned**: scouting an issue whose solving is recorded earlier in the thread · reading Description-only when journals exist · ignoring assignee changes when determining whose issue is live. Enforced by \`ticket-gate.js\` row 1b. |
| **🚨 BA attachments — EXPLICIT per-file open + content emit (HARD 2026-06-03)** | ✓ + per-file emit / ⏭ none | For EVERY file in `0. Brief/` (photos / .pdf / .docx / video — NOT only the ones whose filename matches current theory), MUST Read/view AND emit 1-line per file: `<file>.png — content: <BA-visible state + annotations verbatim>` · `<file>.pdf — N annotations (FreeText/highlights/stickies)` · `<file>.docx — <content summary>`. Filename-based prioritization BANNED. |
| **🚨 PDF annotation extraction — EXPLICIT presence emit per .pdf** (HARD 2026-06-01 S5, みや item 2) | ✓ + count / ⏭ none / ⏭ no-pdf | For EVERY .pdf in 0. Brief/, MUST run `annotations` skill + emit a 1-line statement: `<file>.pdf — N annotations found (FreeText: X, highlights: Y, stickies: Z)` OR `<file>.pdf — no annotations`. Silent skip BANNED — explicit "no annotations" is the only valid empty-state. **Why**: skill exists + CLAUDE.md §8 mandates + pre-action-check-gate fires reminders — yet I still missed BA's annotations once this week. Explicit emit forces the action; absence of the line = audit-visible failure. |
| QA-<num>.md cycle-N section | ✓ / ✗ | path; Scout familiar spawn note if missing |
| etanah-knowledge Always tier (5 files) | ✓ | `Loaded: index.md · DOMAIN-GLOSSARY · MODULE-ARCHITECTURE · BUG-BESTIARY · DEFERRED-CRITICAL-ISSUES` (Read ≥50 lines per file, not Glob-only) |
| etanah-knowledge Conditional (per ticket layer) | ✓ / ⏭ n/a | filenames loaded (DATABASE.md / JSF-WIRING.md / etc.) OR "n/a — layer not touched" |
| **🗄️ DATABASE.md loaded (if DB-touching ticket)** (NEW v1.48 2026-06-01, per sonnet research — 5 documented DB-skip slips in 30d) | ✓ / ⏭ n/a | naming the file forces the read (honesty brake); ⏭ n/a only if ticket is pure UI/template/Flowable with zero DB column touched. See Database & Entity Resolution section above for HOW (spine · prefix · `ind_langkah.nama` symptom→screen navigator). |
| **🚨 BPMN + Scope (module) CONFIRMED before Scout** (HARD 2026-06-01, QA-262755; merged from 2 rows 2026-06-02 per みや item 5 — they asked the same question through different lenses) | ✓ + cite DISAMBIGUATION SOURCE | **Step 1**: `Read` `MLK_PLP_<URUSAN>.bpmn20.xml` + grep the BA-tugasan; classify: `<userTask>` = pelupusan (Scout OK) · `<callActivity calledElement="MLK_TKL_*">` = **etanah-teknikal** (NOT deployed locally — STOP + surface scope) · `<callActivity calledElement="MLK_PLP_SUB_*">` = pelupusan sub-process (Scout OK). **Step 2**: state the module conclusion (PLP / AWAM / etanah-teknikal / etanah-common) + cite the disambiguation source. Sources in priority order: **(a) BPMN classification from Step 1** (MOST authoritative); **(b) Redmine Description URUSAN line + Permohonan ID prefix** (e.g. `PTMLK/01/L/PLPS/2026/X` → URUSAN=PLPS); **(c) screenshot header bar quoted text** (URUSAN/Tugasan label visible on top of page, NOT just visual feel); **(d) Permohonan ID exists** ⇒ AWAM stage passed, likely PLP (heuristic, not lock); **(e) grep BOTH codebases for the BA-highlighted field LABEL text** (label usually unique to one side, quote which codebase matched); **(f) BA-Q + STOP** if (a)-(e) all ambiguous. **Banned**: assuming scope from subject keyword alone · skipping BPMN classification · assuming pelupusan when BPMN says `MLK_TKL_*`. |
| env-switch (`/env-check` skill) | ✓ | UAT/FAT target SWITCHED per ticket Env (etanahv3 config + standalone.xml + repo branch aligned — not just confirmed) |
| LIVE DB pengguna_semasa (canonical task-state SQL) | ✓ | EXECUTED via `mcp__postgres-mlkuat__query` (UAT) / `mcp__postgres-mlkfat__query` (FAT) at end of Recon; result fed to Notes file; doubles as **DB-MCP reachability fail-check** — if query errors (`relation does not exist` / connection / auth), STOP + surface. Stating SQL form without running it does NOT satisfy this step (haiku audit caught all 3 sims skipping with "compliance test" excuse — BANNED for live quests). **Exception**: explicit compliance/simulation context (archived-ticket walk-through, auditor mode) — state SQL form + MCP server name only. |

**Scope-category reference** (the 4 modules + their tells):

| Scope | Codebase | Audience | Tells | Confused-with |
|---|---|---|---|---|
| **PLP** | `etanah-pelupusan` (Apps) | PT/PTG officers | URL `/Apps/`, Mlk*Form classes, BPMN `<userTask>` or `<callActivity MLK_PLP_SUB_*>` | AWAM (same urusan has both sides); etanah-teknikal (JT/CK tugasans share urusan but live in MLK_TKL_* callout) |
| **AWAM** | `etanah-awam` (Pra) | applicant portal | URL `/Pra/` or `/Awam/`, public-facing screens | PLP (BA screenshots sometimes show AWAM expecting PLP fix) |
| **etanah-teknikal** | NOT deployed on local JBoss (`.m2` empty) | JT/charting/CK roles | BPMN `<callActivity calledElement="MLK_TKL_*">`; manifests as 127.0.0.1:8080/etanah-teknikal 404 if Scouted as PLP | PLP (same urusan; CK = Charting Keputusan lives here — caught QA-262755) |
| **etanah-common** | shared base library | both PLP + AWAM | base classes (`BasePelupusanDokumenForm`), shared utilities, populator framework | PLP — but fixes here have CROSS-SCOPE blast radius |

**Harness on the way** (todo.md Q1, `quest/preflight.js <QA>`): the deterministic 3 rows (file existence · BPMN-by-URUSAN find + classify · LIVE DB SQL execute) will auto-run and emit the table with ✓ pre-filled; the read/synthesis rows stay manual. Until then, this table is emitted by hand at quest start.

**Scout step 0** (HARD 2026-06-01): before tracing any class chain, confirm the **Scope row** of Quest Preparation Verification is ✓-cited (not ✓-empty); if ambiguous → run the disambiguation cascade or BA-Q + STOP. Scope-from-subject-keyword alone is BANNED.

---

### Quest trigger-time essentials (etanah-knowledge tiers · Notes.txt format · canonical SQL · Permohonan ID hierarchy · codebase root)

**Quest trigger-time essentials** (restored to boot-load 2026-05-30 — these live fully in `quest/quest-protocol.md` but are summarized here so they're in context during quest *design/discussion*, not only at `/quest start`. The 2026-05-22 decomposition pushed them into the non-boot-loaded protocol → paraphrase errors when discussing quests without a live `/quest start`; redundancy is intentional per みや 2026-05-25):

- **etanah-knowledge tiered load — FULL PATHS** (these files live in the **main repo working tree ONLY** — untracked-confidential, absent from worktrees; ALWAYS point reads at the main-repo path):

  **Base:** `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\etanah-knowledge\melaka\`

  | Tier | Files | When | Notes |
  |---|---|---|---|
  | **Always** (5) | `index.md` · `DOMAIN-GLOSSARY.md` · `MODULE-ARCHITECTURE.md` · `BUG-BESTIARY.md` · `DEFERRED-CRITICAL-ISSUES.md` | every `/quest start` | ~5-7k tokens; foundation refs. **"Load" = `Read` first 50 lines minimum** (not Glob, not header-only) + **emit `Loaded: <file> (≈Nk tokens)` per file as proof**. Globbing without reading does NOT satisfy this tier (haiku audit 2026-05-31 caught this). |
  | **Conditional** | `DATABASE.md`(DB) · `FLOWABLE-WORKFLOWS.md`(workflow) · `JSF-WIRING.md`(UI) · `FLOW-TRACES.md`(deep-debug) · `FRONTEND-PATTERNS.md`(UI-enhance) · `URUSAN-FLOW.md`(cross-urusan) · `PERANAN-MAP.md`(role) | load per `ticket_type` + Description keywords; routing logged in QA-NNN.md Context Loading | `index.md` routes |
  | **On-demand** | `TEST-PERMOHONAN-INDEX.md` · `DEV-TESTING-HACKS.md` | Simulate (test data) / Debug (Flowable trace) | – |
  | **🚨 Conditional → MANDATORY for any tugasan/flow-routing ticket** (promoted 2026-06-01, QA-262755) | BPMN XML for the ticket's urusan: `flowables-bpmn\MLK_PLP_<URUSAN>.bpmn20.xml` | **BEFORE Scout** at Phase 0 — for bug-tugasan scope-determination | Load ONLY the file matching the ticket's URUSAN; grep the bug-tugasan label/kod + check whether it's a **UserTask** (this module — pelupusan) or a **CallActivity calling `MLK_TKL_*`** (etanah-teknikal, separate module, NOT deployed locally). **Banned**: Scout on a tugasan whose module hasn't been verified via the BPMN. |
  | **Archive — REFERENCE ONLY, DO NOT pre-load** | TDD SQL exports at `database-archive\Melaka\MLKUAT\` (`et_main_uat.sql` ~3.9MB / ~900k tokens) | NEVER at Phase 0 — query LIVE DB via MCP | Kept for offline / schema-diff only |

- **`1. <NNN NNN>.txt` (legacy `1. Notes.txt`) canonical format** (protocol:373-403) — 3 lines per entry, NO bloat / env / extra-tugasan / annotations:
  - single: `N) <URUSAN> — <TUGASAN>` / `<PERMOHONAN_ID>` / `<login>`
  - multi-urusan: one 3-line entry per urusan
  - two-entry (BA app past target tugasan): `0) BA — past <target>, currently <state>` / id / pengguna  +  `1) <PLP|AWAM> — <ENV> — <TUGASAN>` / sim-id / pengguna
  - Written right after Redmine retrieval (`node quest/notes.js`), at Scout completion, and on mid-conversation ID mention; login `TBD` if DB-blocked — never defer the whole file.

- **Canonical task-state SQL** (auto-pengguna, protocol:518-541): join `UMM_A_TGSN → IND_TGSN` (tugasan kod/nama) + `UMM_ALIRAN_KERJA` + `PCP_PENGGUNA` (pengguna_semasa login) + `IND_PEJABAT`; filter `FLAG_AKTIF='Y'`. Run at END of Recon via LIVE MCP (`mcp__postgres-mlkuat__query` UAT / `mcp__postgres-mlkfat__query` FAT) → feeds Notes.txt. **Live MCP > TDD SQL dumps** for Phase 0 (real state, row counts, FK validation); TDD reserved for offline/schema-diff only.

- **🪪 Permohonan ID search hierarchy — 4-tier, in order** (RESTORED 2026-06-01 S5, was in pre-trim CLAUDE.md, lost during decomposition; per みや S5 item 1). When picking the test permohonan for a quest, follow this order; only escalate to the next tier when the prior is genuinely unavailable:
  - **Tier 1** — **Use BA-provided permohonan ID IF still applicable.** BA's photo/brief usually names a specific ID (e.g. `PTMLK/01/L/PLPS/2026/X`). If the ID still exists in the env AND is at a tugasan compatible with testing the fix → USE IT. Sometimes BA's permohonan has finished/advanced past the bug-tugasan; in that case it's "not applicable" → fall to Tier 2.
  - **Tier 2** — **Find an existing permohonan that has the data shape needed for testing.** Query `umm_aplikasi` + related tables for an app with the right urusan + tugasan-progress + data conditions (e.g. has hakmilik, has dokumen, has saksi rows — whatever the fix tests). Prefer recent activity (~last 2 months) per `feedback_test_data_recency.md`.
  - **Tier 3** — **Search for permohonan nearest in tugasan, preferring AFTER/ADVANCED tugasans over BEFORE.** If no exact-tugasan match exists, pick one that's PAST the bug-tugasan (in case we need to roll-back via flowable-alter) over one that's BEFORE it (would require advancing through unrelated steps to reach the bug-site).
  - **Tier 4 — VERY VERY LAST option**: use a permohonan ID from SKM (if scope allows) OR create a new permohonan via the awam portal / flowable initiate-case. High effort + may not match real data shape; reserved for when Tiers 1-3 all genuinely fail.

  **Why this order**: BA-provided IDs are the closest reproduction of BA's tested scenario; existing apps with matching data shape are next-fidelity; advanced-tugasan rollback via flowable-alter is faster than forward-stepping; new permohonan creation is slow + data-shape-unreliable, so it's last. **Banned**: jumping straight to Tier 4 ("let's just create one") without exhausting Tiers 1-3 — that's the time-waste shape this rule kills.

- **Codebase root + blast-radius**: pick `etanah-pelupusan` (PLP/APPS) vs `etanah-awam` (AWAM) by ticket subject. **TRG is BANNED from pelupusan blast-radius** (ignore it entirely — codebase-only scope); AWAM = multi-state-aware. Full Recon Universal Checks: `quest-protocol.md` Recon section.

**Quest Phase-0 workflow** (NEW 2026-05-30): `/quest start` auto-invokes the `quest-phase0` Workflow (`.claude/workflows/quest-phase0.js`) — Discovery → etanah-knowledge load → Recon → adversarial Verify (bugs) → Synthesize; writes Notes.txt + QA-NNN.md; `depth=full` for bugs / `quick` otherwise. Validated 2026-05-30 (QA-260508). Caveat: pass `args` such that the script's `JSON.parse(args)` guard fires (the Workflow tool delivers args as a JSON string).

**Skills**: `/quest start|hold|resume` · `/familiar` (sub-agent for >500-line reads) · `/env-check` · `/verify` · `/appraise` · `/checklist`

---

### Phase 1 Closure — Git Sequence

The ordered `pull → checkout -b → stage → commit → push → /verify → checkout mlk/master → pull --ff-only → update active.txt (via quest/active-cli.js — never ask, status=closed at Phase 1, archived at Phase 2 per canonical enum)` close-out sequence — see `quest/quest-protocol.md` → Phase 1 close-out + the **Commit + Push hard rule** + the **branch-at-Apply ban** (line 757 — branch creation is at Commit prep, never at Apply). Runs ONLY after `local_test_confirmed=true`. Durable fix in flight = `/branch-and-push` script (todo.md Q2).

---

**Note on "Core Methodology" heading (CLAUDE.md lines 311-323)**: not reproduced here — this SKILL.md already carries the equivalent engine statement verbatim in its "🎯 Core methodology — the engine" section near the top of the file. Re-absorbing it would be true duplication, not information loss.

**Note on CLAUDE.md's "📦 Phase 2 Closure — Archive Hygiene"**: NOT absorbed here by design. That section's own text states it is deliberately boot-loaded in CLAUDE.md (not protocol-only) BECAUSE living only in `quest/quest-protocol.md` caused it to be silently skipped repeatedly (QA-258004, QA-262039, QA-260302). It stays a `keep-in-core` boot-loaded rule per the linemap disposition; moving it into this JIT-loaded skill file would reintroduce that exact documented failure mode.

