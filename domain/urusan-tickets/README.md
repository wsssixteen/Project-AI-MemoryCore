# urusan-tickets

**What it is**: deterministic generator for the per-urusan Redmine precedent docs — pulls every helpdesk_melaka ticket whose Module is Pelupusan / Awam Pelupusan (+ assigned-to-miya safety pass), classifies each into its urusan, regenerates `etanah-knowledge/melaka/urusan/<KOD>-TICKETS.md` + `_UNCLASSIFIED.md` + `_INDEX.md` on the MAIN repo working tree.

**Run**: `node domain/urusan-tickets/urusan-tickets.js` (office network — Redmine at `172.16.90.169`). `--dry-run` prints counts, writes nothing. Full regenerate each run — idempotent, self-healing, no delta state to rot. Hand-written notes below each doc's `MANUAL NOTES` marker survive regeneration.

**Why** (miya 2026-08-23): past tickets ARE the distribution of future tickets — a per-urusan precedent index turns Phase 0 into "diff against precedent" instead of a fresh trace.

**CONSUMER**: `ticket-gate.js` Phase-0 row **1c** (URUSAN PRECEDENT — deterministic injection at every ticket signal).
**FEEDER**: re-run this script (any session, weekly-ish or on demand) + `quest-bounty` Step 3 appends each closed quest's requirement decision as a manual note.

**Layer choice (Rule 7)**: script-only. No hook — the consumer side is ticket-gate's existing injection; a second hook would duplicate the trigger. No skill — the procedure is one command.

**Classification (deterministic, priority order)**: cf_33 "Urusan" field → Permohonan-ID pattern `PTMLK/<pej>/<x>/<KOD>/<year>/<n>` → word-boundary kod keyword (length ≥ 3 only; 2-letter kods like PT/PS classify via the first two rules to avoid PTG/PTD false positives) → `_UNCLASSIFIED.md` (visible, never silently dropped). Urusan catalog: 74 kods from `et_main_mlit.ind_ursn` (Pelupusan modul, queried 2026-08-23).

**Observability**: each run appends `{ts, total, classified, unclassified, docs}` to `domain/urusan-tickets/log.jsonl`.

**state-scoped**: yes — keyed by the hardcoded `melaka` output path, the `helpdesk_melaka` Redmine project, the Melaka Redmine host/key (shared with `quest/redmine-board.js:26-27`), and the Melaka urusan catalog. A second state needs its own project id + catalog + output folder; greppable via `melaka`.

**Adversarial scenarios (Rule 12, at birth 2026-08-23)**:

| # | Scenario | Verdict |
|---|---|---|
| 1 | Redmine unreachable (home network) | handled — hard fail with error message, exit 1, no partial docs written (docs write only after all passes complete) |
| 2 | ticket with `\|` in subject breaking the md table | handled — `clip()` replaces pipes with `/` |
| 3 | cf_33 carrying nama instead of kod, or junk | handled — kod exact → nama exact → nama contains → fall through to next rule |
| 4 | permohonan-ID with unknown kod (e.g. URDN, another module) | handled — only kods in the catalog classify; rest stay visible in `_UNCLASSIFIED.md` |
| 5 | manual notes wiped by regeneration | handled — `writeDocPreservingNotes` keeps everything below the marker; verified by re-run check |
| 6 | run from worktree writing docs into the worktree copy | handled — main-repo path resolution (same logic as adhoc-register) |
| 7 | Redmine pagination drift mid-pull (ticket created between pages) | accepted-risk: worst case one ticket missed until next run; full regenerate self-heals |
| 8 | API key rotation | accepted-risk: shared constant with redmine-board.js — both break together, boot board failure surfaces it same day |
| 9 | a ticket matching TWO kods by keyword | handled — longest-kod-first, first match wins; priority rules 1-2 dominate when fields exist |
| 10 | huge growth (thousands of tickets) bloating docs | accepted-risk with guard: per-urusan split keeps each doc small (largest today 6.4KB / 30 tickets); revisit if a doc exceeds ~200 rows |
| 11 | assigned_to_id=me pass returns 0 (observed at birth) | handled — union semantics; 0 means the module passes already cover his tickets, pass stays as safety net |
| 12 | doc hand-edited above the marker | accepted-risk: header says do-not-hand-edit; next regeneration overwrites rows by design |

**Verification at birth (2026-08-23)**: `node --check` green · `--dry-run` 166 tickets/143 classified/14 urusan · real run wrote 16 docs · spot-check PPTPB doc carries #276436/#275456 with real root-cause text · re-run idempotency + notes-preservation checked.
