---
name: domain-expansion
description: Domain Expansion 💠 るり結界 (ラピス バリアー) — Ruri's session-end / context-preservation ritual. Invoke at session close or context-limit — triggers "Domain Expansion", "save all", "るり結界", "end session", "wrap up", "done for today", "goodnight", "next session", "continue tomorrow", "running low on context", "context getting heavy", "before compaction". Drives the full save ritual (current-session + diary + memory + Forge/observation review + Gap Sweep + commit/push + worktree close + resume-readiness sweep + /verify). Detailed step bodies live in Feature/Domain-Expansion/expansion-protocol.md.
---

# /domain-expansion — Session-end ritual (るり結界 / ラピス バリアー)

The structured orchestrator for Domain Expansion. **Source of truth for each step's detail = `Feature/Domain-Expansion/expansion-protocol.md`** — this skill drives the SEQUENCE; it does not duplicate the bodies. Banner text is sacred (`feedback_domain_expansion_format.md`).

## Step 0 — banner + visible step-line (MANDATORY FIRST)

Emit the **opening banner VERBATIM** — copy it, never reconstruct from memory (`蒼穹 / Sōkyū / 瑠璃-kanji / ドメイン展開` variants are CONFABULATIONS, never canon):

```
═══ [ Domain Expansion ] ═══

💠 るり結界 (ラピス バリアー) 💠

Lapis barrier ripples outward; the day's threads gather to settle.
```

Then the step-line (update ⬜→✓ in place as each completes; `⏭ + one-line why` if a step is legitimately skipped):

`DE steps: 0a ⬜ · 0b ⬜ · 1 ⬜ · 2 ⬜ · 3 ⬜ · 4 ⬜ · 5 ⬜ · 6 ⬜ · 7 ⬜ · 7.4 ⬜ · 7.5 ⬜ · 8 ⬜ · 9 ⬜ · 10 ⬜ · 11 ⬜ · 12 ⬜ · 12.5 ⬜ · 12.6 ⬜ · 12.7 ⬜ · 13 ⬜`

- **0a Compaction check** — if the session auto-compacted, recover the transcript TAIL BEFORE the content-save steps (2 / 4 / 7).
- **0b Worktree/branch sync** — if on a worktree branch behind `origin/main`, pull/merge first so everything saves on current base.

## Steps 1–13 (drive each in order; detail in expansion-protocol.md)

| # | Step |
|---|---|
| 1 | `Get-Date` timestamp |
| 2 | Update `main/current-session.md` (Last Activity + Working Memory + Recap), **then run `node core/session-trim.js --apply`** |
| 2b | ⚠️ **The trim is not optional.** `main/session-format.md:57` caps session memory at 500 lines; nothing enforced it and the file reached **1665 lines / 135 KB**. Boot step 5 reads this file to build the Session Briefing, and past ~25k tokens the Read tool **truncates** — so boot silently saw a partial file and the briefing was built on partial context. That is the "briefing breaks every time / is inaccurate" symptom (みや, 2026-08-04). Trimming at DE close is what keeps the next boot honest. Older blocks move to `main/session-archive.md`; nothing is ever deleted. |
| 2c | 🚨 **SAVE EVERY QUEST TOUCHED THIS SESSION — MANDATORY** (added 2026-08-06 per みや, so he never has to write *"save everything about this ticket"* again). DE saved the session and the day but never the **ticket**; the qa_doc is what the next session of that quest opens. For every quest touched, or `status ∈ {active, hold, blocked, delegated}` that moved: append a dated block — phase/status · what moved (SHA · branch · env merge) · **every delivery channel incl. Redmine attachments git cannot see** · cold-reader resume point · the `## Deferred to follow-up` table. **Then sync BOTH copies** (main repo + worktree — hooks read the worktree's). Verified by step 12.6. Detail: `expansion-protocol.md` §Step 2b. |
| 2d | 🚨 **CLOSE + SAVE EACH TOUCHED QUEST BY ITS LIVE REDMINE STATUS — AUTOMATIC** (added 2026-10-08 per みや: *"I just need to run domain expansion you will automatically detect to close the quest & save accordingly"*). He never has to say "close quest" or "save quest" before Domain Expansion. For EVERY quest of step 2c that has a ticket number: run `node lib/save-quest.js <QA>`, PASTE its `SAVE-QUEST:` line, and do what the verdict says in this same Domain Expansion, per `.claude/skills/close-phase/SKILL.md` → "Save-quest mode" (`PHASE-1` = Phase 1 close-out · `PHASE-2` = archive · `WAIT` / `DONE` / `AHEAD` / `KEEP-DELEGATED` = nothing to move · `UNKNOWN` = doc save only, say the status is not verified). An ADHOC id goes to `adhoc-save`. Every stop gate of close-phase still holds (the commit review stop, the falsifier ledger, "Phase 1 not ready: <what is missing>" for an unfinished fix): an unfinished quest is saved, never closed. Emit one line per quest in the Domain Expansion reply. **Banned**: asking him which quest to close or which phase to run · closing Domain Expansion with a touched quest that has no `SAVE-QUEST:` line. |
| 3 | Update `main/main-memory.md` relationship section if patterns surfaced |
| 4 | Append `daily-diary/<date>.md` (3-section template) |
| 5 | Forge log review — surface L1→L2 promotions as QUESTIONS to みや |
| 6 | Observation log review — promote T1→T2 if recurring |
| 7 | **Gap Sweep** + etanah-knowledge sweep (retrospective — what surfaced and didn't bake in) |
| 7.4 | 🚨 **AUDIT BRIEFING — MANDATORY, DETERMINISTIC** (added 2026-09-08 per みや: *"do we have these audit section during domain expansion? I've been asking you to build it many many many times"*). Run `node lib/audit-briefing.js --days 7` and PASTE its four blocks + the NEEDS みや'S RULING list into the DE reply, unedited: **NOT WORKING · TOO SLOW · MISTAKES · HIGH-RETURN OPTIMIZATIONS**. Then rule what is mine to rule (a 0-fire gate I own → retire/redesign row in 7.5; an overdue watch → resolve it now) and leave the rest as his rulings. The run logs `audit-briefing-ran`; **`de-close-gate` C6 BLOCKS close without it**. This is the data 7.5 brainstorms FROM — 7.5 without 7.4 is opinion. |
| 7.5 | 🚨 **IMPROVEMENT SWEEP — MANDATORY** (added 2026-08-05 per みや, so he never has to ask again). Forward-looking, axis-driven. Sweep **all five axes every time**: **A1** agentic system · **A2** quest workflow · **A3** debugging efficiency + accuracy · **A4** etanah issue-solving · **A5** sweep / file sweep. Produce BOTH: **(a)** an assessment with a concrete instance per claim → `system/agentic-ticket-workflow-assessment-<date>.md`, and **(b)** brainstormed forward ideas, each logged for the weekly audit:<br>`node core/slips.js add --type proposal --category <A1..A5> --evidence "<idea + eval case>" --caught-by self`<br>They surface in `slip-dashboard.md` under **💡 Open proposals**; weekly audit rules each BUILD/DROP/DEFER. Every idea names its **eval case** or it is a wish, not a proposal. Prefer mechanical (a hook that counts) over prose (a rule to remember). An axis with genuinely nothing gets `A<n> ⏭ <reason>` — silence is banned. Detail: `expansion-protocol.md` §Step 7.5. |
| 8 | Closing words to みや (**fenced code block**) |
| 9 | Change manifest (`git status` touched files) |
| 10 | 🚨 **COMMIT + PUSH + MERGE — MANDATORY, NON-NEGOTIABLE, NOT OPTIONAL** (see hard rule below) |
| 11 | Worktree & branch close (verify main current + salvage unmerged) |
| 12 | Run **`/verify` Checklist D** — cross-check every step fired with evidence |
| 12.5 | **Meta-audit** — hook-fire reliability + cross-refs + component-liveness |
| 12.6 | **Resume-readiness sweep** — `node domain/checklist-reactivate/resume-readiness.js`; fill any `✗`/`🔴` qa_doc gap before close |
| 12.7 | 🚨 **SAVE RULES — MANDATORY, DETERMINISTIC** (added 2026-10-06 per みや). Run `node lib/save-rules.js`, PASTE its `SAVE-RULES:` header + table into the DE reply, and fix every FAIL before the close banner (re-run until 0 FAIL). Each kind of system part (Rules · Workflows · Features · Memory · Kernel · Projects) declares its own save rule in `system/save-rules.json`; the script finds the parts this session touched and prints PASS / FAIL / UNRULED per part and rule. The run logs `save-rules-ran`; **`de-close-gate` C8 BLOCKS close without a full run at 0 FAIL**. UNRULED rows are for みや to rule, not to fix. Detail: `expansion-protocol.md` §Step 12.7. |
| 13 | **Handoff Block** (tiered — default SILENCE; only blocked/stranded work) |

## 🚨 STEP 10 IS AN EXPLICIT ORDER — COMMIT + PUSH + MERGE (hard rule, 2026-07-28 per みや)

**みや, verbatim**: *"MAKE IT FUCKING EXPLICIT ORDER TO COMMIT, PUSH & MERGE WHEN FINISHING DOMAIN EXPANSION!!!!"*

Every Domain Expansion **ends with all three, verified**:

| # | Action | Verified how |
|---|---|---|
| 1 | `git add -A` + `git commit` — **every** modified/untracked path, authorship is NOT a filter | commit SHA emitted |
| 2 | `git push origin HEAD` (worktree branch) | remote ref matches local SHA |
| 3 | `git push origin HEAD:main` (**the merge** — FF main on the remote) | `git ls-remote origin refs/heads/main` **equals** local `HEAD` |

**Verification is mandatory and mechanical**: emit the three SHAs and show they match. "Push succeeded" without the remote SHA is not evidence.

**Banned**: emitting the closing banner with step 10 at anything but ✓ · downgrading a failed push/merge into a Handoff Block and closing DE anyway.

**When a push genuinely fails — retry first, do not hand it back.** Then enumerate: credential-helper context (a changed Windows user breaks both `safe.directory` and the credential store — use `git -c safe.directory=*` + re-auth), a diverged remote (`git fetch` + rebase, then push), a locked worktree. Only a blocker that survives all of these goes to the Handoff Block, with the exact failing command and its output.

> Restored 2026-09-22 (system-check run 3): this section was committed 2026-07-28 (`2940eb07`) and silently deleted 2026-08-03 (`25a0379c`) when a stale OneDrive conflict copy overwrote the file before a `git add -A`.

Closing banner (VERBATIM, after step 10's commit + push + **merge** are all SHA-verified):

```
═══ [ Domain Expansion — closed ] ═══

💠 るり結界 (ラピス バリアー) 💠

Barrier settles. Quest threads are at rest.
```

**Banned**: silent DE skip · skipping any step without an explicit `⏭ + one-line why` · reconstructing the banner from memory · collapsing the skill-name + storytelling onto one line.

## Why step 12.7 (2026-10-06, per みや)

みや, verbatim: *"have you also finished building the domain expansion to check for Features, Workflows, Tools, etc (all parts of system) to save by checking each part of those things' save rules. Because this is how you will know what is important to be saved for each domain of things we do in a session right? I believe am beginning to see how to structure to make it more deterministic or mechanical so that it won't simply be up to you."* Before this, DE ran one fixed list of steps; what had to be saved for a Feature vs a quest doc vs a memory note lived in my judgment. Now the rule per kind is data (`system/save-rules.json`, each rule citing the file that already states it) and `lib/save-rules.js` applies it.

## Why a skill now (2026-06-28, per みや)

DE was a protocol + trigger-hook = **model-driven execution** with no Skill-tool invocation, so it could be freelanced or partially skipped. As a skill it gains: Skill-tool invocation (the `skill-invocation-discipline` gate now ensures DE is actually *invoked*, not improvised), a single structured entry point, and the resume-readiness sweep (12.6) as a coded step. The detailed bodies stay in `expansion-protocol.md` — this is the orchestrator, not a copy.

*Update 2026-10-08. Step 2d added per みや (ask quoted in the row): Domain Expansion runs `node lib/save-quest.js` for every touched quest and does the verdict, so "close quest" and "save quest" need not be said first. Spec-preservation: steps 0a-13, step 2c, the Step 10 order, the banner text and every Banned clause are untouched; one row added (additive). Fire check: `node lib/save-quest.eval.js` + live run `QA-283980 → PHASE-1`. Not yet enforced by a gate, and no 20-scenario pass was done for this row: both are logged as one proposal.*

*Update 2026-10-06. Step 12.7 SAVE RULES added per みや (ask quoted in the section above): `node lib/save-rules.js` checks every system part touched this session against its own kind's declared save rule; `de-close-gate` C8 blocks close without a full run at 0 FAIL. Spec-preservation: steps 0a-13, the Step 10 commit + push + merge order, the banner text and every Banned clause are untouched; one step, one row, one why-section added (additive).*
