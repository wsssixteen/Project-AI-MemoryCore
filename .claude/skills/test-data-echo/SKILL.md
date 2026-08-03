---
name: test-data-echo
description: At Quest hand-back (Stop-Point Action Summary) — read the active Task folder's Notes.txt and emit a structured test-data table with permohonan ID + pengguna semasa + tugasan kod + login + role-of-test + discriminator note. Reusable from any workflow that hands work back to みや for testing. Triggers — "test data", "permohonan ID", "pengguna semasa", "what do I test", "hand-back", "stop-point summary", "show me the test app", "test-data-echo". Built Phase 4 (2026-05-23) atomic Honesty primitive — promoted from quest-internal Pre-emit gate per Scenario 1/2 of plan validation.
metadata:
  type: honesty-primitive
  sub-layer: honesty
  meta-layer-INDEX: meta/honesty-INDEX.md
---

# test-data-echo — Structured test-data emit at hand-back

## When this fires

- Quest hand-back / Stop-Point Action Summary
- Any "▶ YOUR MOVE" emit that involves みや testing on an env
- Mid-Quest when みや asks "what do I test"
- Recon emit when test data is part of the deliverable

## Steps

0. **🚨 SOURCE GATE (v1.1, 2026-08-03, miya — 4 wrong-env/wrong-id test-data emits in ONE day, QA-272867/272943):**
   Test data may ONLY be emitted after BOTH anchors, run THIS turn (or cited from earlier THIS session):
   - **(a) History-first**: re-read the ticket's LATEST journal in `0. Brief\History.txt` — if the BA
     named a Permohonan ID / env / steps there, THAT is the test data; a doc-pack or memory record
     NEVER overrides it (2026-08-03: BA's journal gave `PTMLK/02/L/PLTP/2026/5` @ Staging; I emitted
     `/2026/2` from the execution pack anyway — 4th blunder of the day).
   - **(b) Live-env anchor**: name the CURRENT live schema (stg1/stg2/mlit — ask or read, never default;
     `feedback_staging_schema_stg2.md` pointer rule) AND verify the ID exists there with one
     `umm_aplikasi` read + its `umm_a_tgsn` state, echoed as `<ID> = aplikasi_id <n> · <tugasan> <status> @ <login>`.
   - **(c) Record-readiness (added same day — the pemohon-2 crash)**: the test record must be able to
     TRAVERSE the code path the test exercises — query the child rows the screen's init needs and check
     the links/FKs are non-null (2026-08-03 QA-272867: BA's stub pemohon had `pihak_bkptg_id` NULL →
     `PelupusanMaklumatPemohonHelper.initPemohon()` address build crashed the whole test; one SELECT
     would have caught it before miya's build). Emit what was checked: `record-readiness ✓(<rows/links read>)`.
   **BANNED**: emitting any Permohonan ID whose env-existence + task-state was not read live this session.
1. **Read** the active Task folder's `1. <NNN NNN>.txt` (legacy `1. Notes.txt`) — locked 3-line format per `feedback_task_folder_ownership.md`
2. **Parse** the verified test data — permohonan ID + login email + tugasan code
3. **Add context** — pengguna semasa (the login user's display name if recallable), tugasan name, peranan, env target (UAT/FAT/mkit)
4. **Add role-of-test** — `[FIX VERIFICATION]` / `[REGRESSION SANITY]` / `[BLAST RADIUS]`
5. **Add discriminator note** — which app's result actually distinguishes "fix deployed" from "fix not deployed"
6. **Emit table** BEFORE handing back

## Output format (mandatory)

```
═══ TEST DATA ═══

| Field | Value |
|---|---|
| Permohonan ID | <ID from Notes.txt> |
| Pengguna semasa (login) | <email> |
| Pengguna semasa (name) | <display name if known> |
| Tugasan | <code + nama> |
| Peranan | <peranan_semasa> |
| Env | <UAT mlkuat / FAT mlkfat / AWAM mkit> |
| Role of test | <[FIX VERIFICATION] / [REGRESSION SANITY] / [BLAST RADIUS]> |
| Discriminator | <how to know fix vs no-fix from result> |

═════════════════
```

## Why this is a primitive (not Quest-internal)

Originally proposed as Quest Pre-emit gate extension. During plan validation (Scenario 1/2) we recognized: test-data echo is a reusable discipline applicable to ANY workflow that hands work back to みや (not just Quest). Promoted to atomic primitive — callable from any future workflow.

When みや refines (Scenario 2 — "also show pengguna semasa"), the change happens in THIS skill's SKILL.md; every workflow that calls it gets the refined output automatically (Java-class-call equivalent).

## Source slips

- `skill-failure-log.md` — Notes.txt missing post-Scout / hand-back: 4 occurrences in 14-day window
- `improvement-audit-log.md` 2026-05-06 — "Test-app delivery checklist" rule (prose) — now elevated to skill

## Cross-references

- `meta/honesty-INDEX.md`
- `feedback_task_folder_ownership.md` — Notes.txt locked 3-line format
- `silent-claim-drift-gate.js` (Phase 2 hook) — Stop hook will check this skill fired at hand-back
- `notes-on-test-data.js` (existing hook) — Stop hook that already partially enforces; this skill is the visible-emit counterpart

---

*Atomic Honesty primitive. Built Phase 4 (2026-05-23). Promoted to primitive per plan validation Scenario 1/2.*
