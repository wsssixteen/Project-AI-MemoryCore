---
name: locator-single-cell
description: "file:line / class:line locators belong in ONE cell, never split into separate \"File\" + \"Line\" columns. Same rule for checklist tables, qa_doc tables, xlsx tabs."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c1704434-7e73-4ad1-a4b5-cc9739ef4037
---

When emitting a tabular checklist / inventory / matrix that references a code location, the locator MUST be ONE cell: `MlkBorang4AeForm.xhtml:495`, `BasePelupusanForm.java:111-116`.

**BANNED**: separate "File" column + "Line" column. みや 2026-06-30: *"I already told you TO NOT CREATE A FUCKING NEW COLUMN FOR THE FUCKING LINE"*.

**Why**: he reads the locator as a single click-target (file:line opens an editor jump in one go). Splitting it forces him to mentally rejoin two cells. Wastes time.

**How to apply**: every table with code references (xlsx tabs, markdown tables in chat, qa_doc rows, project doc tables) — collapse `File` + `Line(s)` into one `Class:Line` / `file:line` column. Comma-separate multiple line numbers in the same cell (`98-103, 105`).

**Also banned (same turn)**: padding cells with parenthetical explanations like "PLPS (any urusan reaches L3)". A "Reach via" cell holds the urusan code only — `PLPS` — not the explanation of why. Explanations bloat the table; the column header IS the explanation.

**Cross-ref**: [[feedback_my_files_minimal]] (no bloat in his files), [[feedback_investigation_style]] (table-first, no inline prose).
