---
name: Test data selection filters
description: When harvesting test data from DB (FAT/UAT) — apply a ~2-month recency filter AND prefer active gov-email user accounts over @gmail (often inactive for pelupusan)
type: feedback
originSessionId: 73ec3d28-197f-4770-9287-c497d3422d8f
---
Two filters apply whenever picking test data (an app / permohonan / user) from any environment DB.

## Filter 1 — Recency (~2 months)

When writing SQL to harvest test data, add a date filter for the **last ~2 months** by default (e.g. `AND trkh_resit >= CURRENT_DATE - INTERVAL '2 months'`).

**Exception**: When the ticket references a specific identifier from QA notes (e.g. `PTMLK/02/L/PLTP/2026/7`), query for that exact record — no date filter needed.

**Why:** Old rows carry schema drift, closed/archived states, migrated IDs, and stale FK chains. Recent rows mirror current behavior and are safer for testing.

**How to apply:** Add the date filter to `ORDER BY ... DESC LIMIT N` queries. Use the table's natural date column (`trkh_resit`, `created_date`, etc.). Present the filter in generated SQL — don't leave it for みや to add.

## Filter 2 — Prefer active gov-email user accounts (pelupusan / PLP)

When a test-data query returns a candidate's `nama_pengguna`, **prefer a proper government email** (`@melaka.gov.my`, `@*.gov.my`) over a `@gmail.com` (or other public-email) account.

**Why:** For pelupusan, accounts whose `nama_pengguna` is a personal `@gmail` address are often **inactive** — みや can't log in to test with them. Gov-email accounts are the real staff accounts and are reliably active.

**How to apply:** In test-data queries, prefer gov-email users — e.g. `ORDER BY (nama_pengguna LIKE '%.gov.my') DESC`, or surface the gov-email candidate as the *recommended* one. If only `@gmail` candidates exist, still surface them but flag "account may be inactive — verify login first". Never recommend a `@gmail` user as the primary test target when a gov-email candidate exists.

**Origin:** 2026-05-19 QA-262039 — I recommended `PTMLK/03/L/PSBS/2025/4` (user `zuezura12@gmail.com`); みや fell back to `PTMLK/02/L/PSBS/2025/2` (user `nazli@melaka.gov.my`) because the gmail account's activity wasn't reliable.
