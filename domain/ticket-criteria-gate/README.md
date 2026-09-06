goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote ticket-criteria-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: ticket-criteria-gate.discipline.hook.js — Stop hook Power: domain/ticket-criteria-gate/ PURPOSE (per みや 2026-06-20, QA-261986 close — "much more critical than the
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: ticket-criteria-gate

The most critical Stop gate (per みや 2026-06-20, QA-261986 close — "much more critical than the test stop hook"): I cannot declare a ticket **done / closed / ready-to-test** without showing that **every BA criterion** is addressed-with-evidence — not a bogus self-asserted ✓. Kills the `knowledge-transfer-incompleteness` slip class (the Tolak-deferred-incomplete-close + the cycle-2 bogus CC-tag list).

## Pieces
| File | Role |
|---|---|
| `ticket-criteria-gate.discipline.hook.js` | Stop back-gate — both checks |
| `log.jsonl` | fire log (per /system-rules R5) |
| `eval.workflow.js` | **DEFERRED** — eval-vs-past-tickets, a later phase per みや |

## What fires when
| Check | When | Action |
|---|---|---|
| **A. Completeness** | reply makes a done/close/ready-to-test claim + a ticket ref, not hedged | **HARD-BLOCK** unless a `CRITERIA COVERAGE` table + ≥1 evidence token are present |
| **B. Checklist-quality** | reply emits an `Issue Checklist` with zero BA-source citation | **ADVISORY** (v1) — remind each item must cite Description / journal / photo / PDF |

## The table Check A looks for
```
| BA criterion (verbatim, latest cycle) | Addressed? | Evidence (file:line / test / DB read-back / みや-confirmed) |
```
A bare ✓ with no evidence token, or a missing table, blocks. A criterion that could NOT be met must be written openly ("not reproduced") — never silently dropped.

## CAN / CANNOT (honest — same split as quest-phase-gate / veritas)
- **CAN (shape ~100%):** a coverage table + evidence tokens EXIST before a done-claim.
- **CANNOT (judgment):** that the evidence is valid · the criteria list is exhaustive · an unknown bug was found.
- **Guarantee:** no SILENT done-claim. **Never** discovery.

## Rework
Same gate; the criteria are the **latest-cycle** BA asks (per RCRL), not the original Description.

## Relationship to siblings
- `veritas-claim-gate` = per-claim TRUTH (one behavioural claim has runtime evidence).
- `ticket-criteria-gate` = full COVERAGE (every criterion addressed). Complementary, not duplicate.
- `show-gate` = FORMAT (box/diagram shown). `/verify` Checklist C = git mechanics. `scout-completeness-gate` = investigation completeness. None covered done-time criteria coverage — this fills that gap.

## Safety / bypass
`stop_hook_active` anti-loop (line 1) · fail-OPEN on parse error · EXEMPT token + hedge/closing frames abstain · bypass `[skip-criteria-gate: <reason>]`.

## Registration
`.claude/settings.json` Stop array, MAIN-repo absolute path. Built in worktree `zen-napier-4471cc` 2026-06-20 — goes **LIVE on merge to main** (pending-merge until the file lands at the main path; the system-audit flag until then is expected).

## Lifecycle
- **v1 (now)**: Check A blocking · Check B advisory.
- **v1.1**: Check B flips to block on evidence; row-level evidence-token parsing (per-criterion, not reply-wide).
- **later**: `eval.workflow.js` scores the gate against past tickets (per みや — evals come after the gate exists).
