# feature-creation — "create/update/refine FEATURE" keyword trigger

**Why (miya 2026-08-19)**: *"'create/update/refine FEATURE' should be a keyword phrase to invoke proper feature creation."* The proper pipeline existed (system-rules → system-design → forge) but had no deterministic keyword entry — this hook is that entry.

## Pieces (hook-only primitive — Rule 7: the procedure already lives in the two skills + forge; this only injects the routing)

| Piece | Role |
|---|---|
| `feature-creation.check.hook.js` | UserPromptSubmit — predicate `create|update|refine … feature` (article/one-modifier tolerated between; punctuation breaks it). Injects the 9-step pipeline diagram. Never blocks. |
| `feature-creation.eval.js` | 5 fixtures (clean · create-fires · refine-fires · no-verb-silent · punctuation-silent) — 5/5 green 2026-08-19. |
| Fire log | `system/telemetry/hook-fires.jsonl` (via hook-runtime). |

## The injected pipeline (what feature-creation invokes, in order)

system-rules (inventory first) → system-design (primitive + trigger moment, Rules 6-10) → best-practices freshness → inventory/collision scan → `node core/forge.js new …` (never hand-made files) → implement + real eval fixtures → eval green + smoke → README + NUKE-MARKER → REQUIREMENTS table + version-stamp. Update/refine of an existing feature → `node core/forge.js refine <name> --nod "…"`.

**Overlap note (inventory finding)**: `best-practices-consult-gate` fires on broad design-signal wording (advisory reminder); this hook is the narrow, keyword-contracted FULL-pipeline injection. Different contracts, both kept; merge candidate if the broad gate's fire-rate audit says redundant.

*Born 2026-08-19 via core/forge.js (registry row `feature-creation`).*
