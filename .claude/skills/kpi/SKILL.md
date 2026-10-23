---
name: kpi
description: Record an appraisal (KPI) moment the day it happens, tagged by competency, with evidence. ALWAYS invoke inside a quest or adhoc the moment one of these happens - a colleague's commit found as the cause, a fix found never shipped / missing from a release, a wrong patch or wrong script caught, cross-team or cross-module help, a latent bug found before any ticket, a PROD root cause proven, our own fix coming back (rework, honest row). Also on "/kpi", "kpi this", "log this for my appraisal", "add to my KPI", "appraisal moment", "for my increment", and at Phase 2 close (close-phase step 2). Writes with domain/kpi/kpi.js, which self-audits every run.
---

# kpi — appraisal moments, recorded when they happen

Feature home: `domain/kpi/` (README, eval, rules). Ledger `main/kpi-moments.jsonl` · page `main/kpi-tracker.md` (generated).

## When (the moment, not later)

| Moment | Usual code |
|---|---|
| A colleague's commit found as the cause of the bug | C2 |
| A fix found never shipped / missing from a release | B4 |
| A wrong patch, wrong script or bad merge caught before harm | B2 or B4 |
| Reviewed or took over a colleague's fix; help to another team or module | B6 |
| Latent bug found before any ticket | B4 |
| PROD root cause proven with runtime evidence | C2 |
| Domain finding others had not made (template, Flowable, DB engine) | B1 |
| Clear hand-over that unblocked BA / infra / another team | B5 |
| Release or planning work that carried the team's tickets | B3 |
| Small, analog-first, minimal diff that prevented a regression | C1 |
| Our own fix came back (rework): honest row | B2 |

Codes: `node domain/kpi/kpi.js competencies`. One moment can earn two rows with different codes (e.g. #265109: C2 + B6).

## Steps

1. Write ONE sentence of what happened, in plain words. Colleagues by role only ("a colleague", "the BA", "Reports team"): the script refuses a full name from the Redmine roster.
2. Pick the evidence pointer a reviewer can check: commit SHA · `#ticket journal` · `et_<schema>.<table> rows …` · `.sql` file · `File.java:line` · path · URL. Never a claim with no pointer.
3. Run:

```bash
node domain/kpi/kpi.js add --ticket "#NNNNNN" --competency B4 --what "<one sentence>" --evidence "<pointer>"
```

4. **Self-audit (system-design Rule 16)**: the command ends with `kpi self-audit: PASS|FAIL`. On `REFUSED` or `FAIL`, apply the fix the line names and re-run until PASS, before the reply. A WARN about competencies with no recent row is a hint for the next quest, not a blocker.
5. In the reply: one line `KPI: <code> recorded — <ticket>`. Nothing more.

## Pending rows (counts only if a later condition holds)

Use when the moment only counts once something happens later, e.g. a change we made on our own initiative that the BA must accept (#262027: Tuan to Datuk, counts if the BA verifies with no mention of it).

```bash
node domain/kpi/kpi.js pending add --ticket "#NNNNNN" --competency B4 --what "<one sentence>" --evidence "<pointer>" --until "<the condition>"
```

- Every session start prints each open pending row (`domain/kpi-pending/` SessionStart hook) until it is settled.
- Settle it only after reading the live Redmine journal yourself: condition held → `node domain/kpi/kpi.js confirm <id> --evidence "#NNNNNN journal <date>"`; condition failed or the BA objected → `node domain/kpi/kpi.js drop <id> --why "<reason>"`.
- A pending row older than 30 days raises a WARN in the self-audit.

## Phase 2 (close-phase step 2)

`node domain/kpi/kpi.js list --ticket <n>` (pending rows show as PENDING: settle them if the BA verdict is in). A moment from this quest that is not there gets added now. None: `KPI: skip — no moment on this quest`.

## Banned

- Waiting for Phase 2 or Domain Expansion to record a moment (the reason this Feature exists).
- Editing `main/kpi-tracker.md` by hand (the audit fails; run `render`).
- Skipping an honest rework row because it looks bad.
- A full colleague name, citizen data or a permohonan holder's name in a row.

symptom: 2026-10-23 miya: 'if we detect someone breaking something, or doing a wrong patch, etc, we can add into that as an initiative ... take note anything that might help with our KPI or assessment for an increment' (appraisal evidence had to be mined after the fact)
goal: every appraisal-worthy moment is on record the day it happens, tagged by competency, with evidence a reviewer can check
goal_signal: node domain/kpi/kpi.js add exits 0 (row read back + view in sync + audit PASS) in the same turn the moment happens
retention: keep
footprint: on-demand: 1 node process per call, under 1 second, nothing running otherwise
