# kpi — appraisal moments, recorded when they happen

symptom: 2026-10-23 miya: "if we detect someone breaking something, or doing a wrong patch, etc, we can add into that as an initiative ... The goal behind having this is to take note anything that might help with our KPI or assessment for an increment." The Appraisal-2026 evidence had to be mined after the fact from git, Redmine, the slip ledger and the diary; in-the-moment wins were the hardest to find.
goal: every appraisal-worthy moment is on record the day it happens, tagged by competency, with evidence a reviewer can check
goal_signal: `node domain/kpi/kpi.js add` exits 0 (row read back from disk + page in sync + audit PASS) in the same turn the moment happens
retention: keep (`main/kpi-moments.jsonl`, append-only, `merge=union`) · `main/kpi-tracker.md` = regenerate · `domain/kpi/log.jsonl` = rotate yearly
footprint: on-demand: 1 node process per call, about 0.2 s, nothing running otherwise
self_audit: every writing command (`add`, `render`) ends with `audit`: rows read back from disk and checked against the goal (fields · competency code · one sentence · evidence pointer shape · no full colleague name from the Redmine roster · no duplicate · page in sync with the ledger · the row just added is on disk); WARN when a competency has no row in 90 days. FAIL = exit 1 with the fix; the skill runs the fix loop before the reply. Every run writes a log row (outcome · goal_met · dur_ms).
state-scoped: no — one ledger per person; tickets from every state (the ticket id carries the state)

| Part | File |
|---|---|
| Skill (when + how) | `.claude/skills/kpi/SKILL.md` |
| Script (write · list · render · audit) | `domain/kpi/kpi.js` |
| Rules (8 competencies, evidence shapes, limits) | `domain/kpi/rules.json` |
| Ledger (truth, machines) | `main/kpi-moments.jsonl` |
| Page (generated, people) | `main/kpi-tracker.md` |
| Eval | `domain/kpi/kpi.eval.js` |
| Log | `domain/kpi/log.jsonl` |
| Quest step | `.claude/skills/quest/SKILL.md` Workflow runner table, row "Any phase, the moment a KPI moment happens" · `close-phase` Phase 2 Step 2 · `quest/quest-protocol.md` Phase 2 Step 2 · `verify` Checklist E2 |

A row: `{ date, ticket, competency, what, evidence }`. Competencies (Pymsoft appraisal form 2026): B1 Technical & Domain Knowledge · B2 Quality of Work · B3 Delivery & Planning · B4 Ownership & Initiative · B5 Communication · B6 Teamwork & Collaboration · C1 Code Quality & Engineering Practice · C2 Problem Solving & Production Support. Honest rows count (own rework under B2).

## Absorbs `main/kpi-tracker.md` (2026-10-23, miya's pick by popup: "Absorb it")

| Spec of the old tracker | Where it lives now |
|---|---|
| A KPI file at `main/kpi-tracker.md` that readers grep | same path, now generated from the ledger |
| Phase 2 Step 2 writes the KPI | Phase 2 Step 2 runs the skill: list this ticket's rows, add any missed one |
| `KPI: skip` line when nothing stands out | kept: `KPI: skip — no moment on this quest` |
| Grep-able identifiers (ticket) + plain English | ticket column + one-sentence `what` |
| The 4 hand-written highlights (QA-269437, QA-259702, QA-253053, QA-275092) | 4 rows; their long bodies are in git history (`git log -- main/kpi-tracker.md`, last hand version at `8e5ef28a`) |
| **Dropped, named**: "default SKIP, rare-by-design, banner moments only" | replaced by "any appraisal moment with evidence" (his ask: note anything that might help the assessment) |
| **Dropped, named**: Time / Business logic learned / Skills built / Slip entries sub-fields | those live in the QA doc, the knowledge files and `system/slips.jsonl`; the row points at its evidence |

## Requirements (system-design Rule 10)

| Requirement | Where found | Encoded |
|---|---|---|
| Record KPI moments while quests run | his message 2026-10-23 | skill + quest phase-table row |
| A simple step in the Quest Workflow invokes a skill inside the Feature | his message | `→ Skill: kpi` row (eval 29) |
| Detecting someone breaking something / a wrong patch = an initiative row | his message | skill "When" table (B4/C2/B2) |
| Self-audit every run, checked back against the goal, refine on a miss | his message + popup answer | `audit()` at the end of add/render; system-design Rule 16 |
| Tag by the 8 appraisal competencies | appraisal form; parent brief | `rules.json`, refused otherwise (eval 06) |
| Row = date, ticket, competency, one sentence, evidence pointer | parent brief | `rowProblems()` (eval 05-10) |
| Honest rows count (own rework, B2) | parent brief | skill "When" table + Banned |
| Colleagues named by role, not by name | Appraisal-2026 START.md rule 4 | roster full-name check (eval 11-12) |
| A person reads a page, files are for machines | Appraisal-2026 project card design rule | ledger jsonl + generated page |
| No new file shapes beyond what the design needs | parent brief | one ledger + the existing page path; rules inside the Feature |
| Absorb vs keep the old tracker | popup 2026-10-23 | absorbed (table above) |

## Adversarial scenarios (system-design Rule 12)

| # | Scenario outside the spec | Verdict |
|---|---|---|
| 1 | Two sessions append rows the same day, git merge | handled: `merge=union` in `.gitattributes` (eval 27); page drift caught by audit (eval 18) |
| 2 | Someone hand-edits the page | fixture-added: audit FAIL naming `render` (eval 16-17) |
| 3 | Merge leaves a conflict marker in the ledger | fixture-added: FAIL naming the line (eval 19) |
| 4 | Ledger saved with CRLF by a Windows editor | fixture-added: parsed (eval 20) |
| 5 | Hand-written row with a bad competency | fixture-added: audit FAIL (eval 20) |
| 6 | Fresh checkout, no page yet | fixture-added: FAIL → render → PASS (eval 21-22) |
| 7 | Same moment recorded twice | fixture-added: refused (eval 04) |
| 8 | Ticket typed as QA-123456 vs #123456 | fixture-added: normalised; list finds either (eval 02, 23) |
| 9 | Ticket typo (#1) | fixture-added: refused (eval 05) |
| 10 | Two sentences crammed into `what` | fixture-added: refused (eval 07); "e.g." not counted (eval 13) |
| 11 | Evidence is a claim with no pointer | fixture-added: refused (eval 08) |
| 12 | Evidence is an English word made of hex letters ("defaced") | fixture-added: refused, a SHA needs a digit (eval 09) |
| 13 | Future date (typo 2062) | fixture-added: refused (eval 10) |
| 14 | Colleague named in full | fixture-added: refused (eval 11) |
| 15 | His own name in the row | fixture-added: allowed (eval 12) |
| 16 | Colleague named by first name only ("Ammar's commit") | accepted-risk: first names collide across 600+ roster rows; the skill says "by role" and the page is private |
| 17 | Roster file missing on a new machine | handled: WARN, names check skipped, rest of the audit runs |
| 18 | A pipe character in evidence breaks the table | fixture-added: escaped, page in sync (eval 15) |
| 19 | Run from a worktree vs the main folder | handled: ledger is under the session's root (CLAUDE_PROJECT_DIR), lands on main by commit like `system/slips.jsonl` |
| 20 | Eval writes into the real ledger or log | handled: every fixture uses a temp `--root` and `KPI_LOG` |
| 21 | The moment is forgotten mid-quest | handled: Phase 2 Step 2 lists the ticket's rows and asks for any missed one; verify E2 checks it |
| 22 | Citizen data / permohonan holder name in a row | accepted-risk: not in the Redmine roster, so not caught by script; the skill bans it, rows are one sentence about our work |
| 23 | A competency never gets rows (the appraisal needs all 8) | handled: coverage WARN per competency (eval 25), the "refine" input |
| 24 | The Feature dies silently (script deleted, skill not invoked) | handled: eval 28-29 check skill + quest wiring; log rows stop, visible in the observatory |
| 25 | User says "add the fixes to master" style reversal: "log this as B4" for a wrong code | accepted-risk: the code is his call; the script only refuses codes outside the 8 |
| 26 | Unknown command / no args | fixture-added: exit 2 with usage (eval 26) |

## Change log

- 2026-10-23 born (forge `new skill kpi`, registry row). Eval 30/30.
