---
name: pengguna_semasa always paired with Permohonan ID
description: Every Permohonan ID reference must include the current pengguna_semasa (email/login). Never mention an ID alone.
type: feedback
originSessionId: ff4b3697-529c-4cc4-a23f-67b9bfa172d6
---
**Rule**: Every time a Permohonan ID is mentioned in chat (e.g. `PTMLK/01/L/PPJK/2026/11`), ALSO mention the current `pengguna_semasa` of the active tugasan attached to that aplikasi — typically the email/login (e.g. `nurulaini@melaka.gov.my`). The ID alone is incomplete; the pengguna is required for testing.

**Why** (みや 2026-05-15 on QA-260302): I proposed `PTMLK/02/L/PPJK/2026/11` as alternate test data without naming the active pengguna. みや: *"From now on, make it mandatory every time you mention a Permohonan ID to always mention who the person it is attached to currently."* Without the pengguna, みや has to context-switch to a separate DB lookup before testing — costs round-trips + breaks momentum.

**How to apply**:

| Where the ID appears | Format |
|---|---|
| Inline prose | `PTMLK/01/L/PPJK/2026/11 (as nurulaini@melaka.gov.my)` |
| Notes.txt entries | Already follows this — `<ID>` line + `<email>` line |
| Recon Test Data row | `[ <ID> — <email> — <Tugasan> ]` — already canonical per CLAUDE.md Recon rules |
| Tables in chat | Column for `Pengguna_semasa` alongside ID column |
| Audit-log + post-mortem entries citing IDs | Same pairing |

**Special case — no active tugasan**: if the aplikasi has no active tugasan (e.g. closed-state or pre-creation), state explicitly: `<ID> (no active tugasan — closed/pre-creation)`.

**Source for pengguna_semasa** (the canonical task-state query, already in CLAUDE.md): join `umm_a_tgsn` ← `pcp_pengguna` via `pengguna_semasa_id`, filter `flag_aktif='Y'`. The `nama_pengguna` column on `pcp_pengguna` holds the email-style login.

**Failure modes if dropped**: みや tests with ID alone → "tiada dalam Senarai Tugasan Pengguna ini" error → round-trip to ask "as who?" → cycle wasted. Same root cause as the BA-prep-id-priority rule (2026-05-12) — test data without the login isn't actionable test data.
