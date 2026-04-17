---
name: Test data recency filter
description: When harvesting test data from DB (FAT/UAT), always filter to last ~2 months unless tracking a specific QA-referenced identifier
type: feedback
originSessionId: 73ec3d28-197f-4770-9287-c497d3422d8f
---
When writing SQL to harvest test data from any environment (FAT/UAT/int-env), always add a date filter for the **last ~2 months** by default (e.g. `AND trkh_resit >= CURRENT_DATE - INTERVAL '2 months'`).

**Exception**: When the ticket references a specific identifier from QA notes (e.g. `PTMLK/02/L/PLTP/2026/7`), query for that exact record — no date filter needed.

**Why:** Old rows carry schema drift, closed/archived states, migrated IDs, and stale FK chains. A no_resit from months ago might join cleanly but trigger downstream code paths that assume long-retired flags. Recent rows mirror current behavior and are safer for testing.

**How to apply:** Add the date filter to `ORDER BY ... DESC LIMIT N` queries. Use the table's natural date column (`trkh_resit`, `created_date`, etc.). Always present the filter in generated SQL — don't leave it for みや to add manually.
