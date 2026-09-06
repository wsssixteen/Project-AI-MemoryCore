goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote template-cc-preflight)
symptom: 2026-08-19 BA: ralat sbb maklumat tak lengkap on PROD - preflighting CC tags vs the app rows would have surfaced patchable gaps before testing
goal: advisory: demand the CC-data preflight (all template CC tags checked against the test permohonan data; patchable gaps named) before the scenario is handed
goal_signal: the Stop fire produced: advisory: demand the CC-data preflight (all template CC tags checked against the
retention: rotate monthly
# template-cc-preflight — CC-data preflight before template-ticket test scenarios

**Why (miya 2026-08-19)**: BA hit "ralat sbb maklumat tak lengkap" on a PROD doc — a generated document renders "-"/blank wherever the test permohonan lacks the data a content control pulls. From now on, a template-ticket test scenario is handed only AFTER checking every CC tag against the test app's data, with patchable gaps named.

## Pieces (Feature trinity — hook + script; no skill file)

| Piece | Role |
|---|---|
| `preflight.js` | CLI: lists every CC tag in a template .docx (dependency-free zip reader), maps each to its populator in `PelupusanWordCCMethodConstant.java` (TAG_ constants AND string-literal `put("tag", …)` keys), flags UNMAPPED tags. Prints the `CC-PREFLIGHT:` line to fill. |
| `template-cc-preflight.check.hook.js` | Stop, **ADVISORY v1** — fires when a hand-back (`▶ YOUR MOVE` / `Test Scenario`) mentions template/.docx and carries no `CC-PREFLIGHT:` line. Bypass `[skip-cc-preflight: <reason>]`. Promote to BLOCK only on observed slip. |
| `template-cc-preflight.eval.js` | 5 fixtures (clean · fires · satisfied · non-template · bypass) — 5/5 green 2026-08-19. |
| `log.jsonl` | one row per preflight run (ts · template · tag counts · unmapped). Hook fires log to `system/telemetry/hook-fires.jsonl`. |

## Operator flow (the contract)

1. Template ticket reaches test-scenario prep → run:
   `node domain/template-cc-preflight/preflight.js --template "<template .docx>"`
2. For each mapped tag, check the TEST PERMOHONAN's rows for the data the populator reads (DB step — operator judgment, the script is the checklist).
3. Emit in the hand-back: `CC-PREFLIGHT: <n> tags · <m> unmapped · data-gaps: <tag=missing-source,…|none>` + a patch proposal per patchable gap.

**Known limit v1**: reads `word/document.xml` only (headers/footers not scanned); populator map parsed from the MLK constant file only. Data-presence per tag stays a judgment step — the script cannot know which DB rows each populator dereferences.

*Born 2026-08-19 via core/forge.js (registry row `template-cc-preflight`). First live find: its own parser gap — 4 tags reported unmapped because the map also uses string-literal keys (`PelupusanWordCCMethodConstant.java:935-945`) — fixed same session.*
