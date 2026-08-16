# CODE-CHECK Grand Audit — Synthesis (wf_097d9bae, 13 agents, 10 angles, 163+20 fix census)

Raw: AUDIT-2026-08-16-raw.txt · full per-angle: AUDIT-2026-08-16-journal.jsonl (both in this folder).

## The 7 concrete defects found (each evidence-cited in the journal)

| # | Defect | Fix |
|---|---|---|
| 1 | Extension blind spot: trigger regex gates ONLY .java/.xhtml/.docx — config-json, sql(.sql), bpmn(.xml), images pass ungated (live case c38bc07a90/266039) | widen trigger extension set OR document the deliberate carve-outs inline |
| 2 | docx-template (31 fixes = 19%) forced through 22 flow-rows incl. 13 evidence checks that don't apply (no state machine/roles) → structurally invites fabricated-but-passing evidence | TYPE-GATE the row list: docx keeps {kod-resolution, BA-expected, full-address, sibling-diff, necessity, prior-fix, name-by-purpose}; flow rows get explicit "N/A — template change" |
| 3 | java-constant-populator (7 fixes) — same mismatch, .java side | same type-gate list as #2 |
| 4 | sql-patch governance island: 0 sql in git BY DESIGN (scripts handed unqualified) — governed by patch-script-gate family, but the 22-row list never SAYS so | one line in the hook header: "sql → patch-script-gate family" |
| 5 | PHASE-TIMING: flowable-contract fires at Edit-time but CLAUDE.md's own BPMN rule demands it BEFORE Scout (QA-262755); prior-fix re-demanded EVERY Edit with no per-ticket memoization | move module-scope to intake-gate; Edit-row cites the settled evidence; memoize prior-fix per ticket |
| 6 | sibling + sibling-diff NOT in EVIDENCE_CHECKS — bare ✓ passes; the EXACT 259112 failure (wrong-shape analog cited, miya caught wrong wiring) | move both into EVIDENCE_CHECKS + analog evidence must name the operation SHAPE (root vs array-scoped) |
| 7 | Dead branch: trigger regex includes etanah-teknikal — module never checked out locally | drop or comment the dead alternation |

## The self-checking system (miya item 4 — "auditing CODE-CHECK is a KNOWN thing")

`domain/pre-code-check/audit.js` (to build next) verifies mechanically, on battery cadence:
1. PURPOSE: every REQUIRED check name maps to ≥1 slip-category or census change-type (no orphan rows)
2. THEATRE: every judgment-bearing row is in EVIDENCE_CHECKS (bare-✓-passable rows listed as defects)
3. TYPE-FIT: a change-type × row applicability table exists and covers every census type
4. TRIGGER: extension set in the regex == the documented coverage list (no silent blind spots)
5. LIVENESS: fire-log shows rows actually firing (dead rows flagged)
Green = CODE-CHECK is coherent; any red names the exact row and why. Runs inside eval-battery.
