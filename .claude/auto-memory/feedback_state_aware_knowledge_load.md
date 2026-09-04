---
name: feedback_state_aware_knowledge_load
description: "At quest start, detect STATE from the permohonan-ID prefix and load etanah-knowledge/<state>/ FIRST — the quest hard-codes melaka/"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-09-04T08:35:24.505Z
---

🚨 The quest workflow hard-codes `etanah-knowledge/melaka/`. For a **non-Melaka** ticket this loads the WRONG knowledge and the state's own knowledge base is skipped.

**Rule**: at quest Phase 0, read the permohonan-ID prefix and load the matching knowledge dir FIRST, before any Melaka file:

| Prefix | State | Knowledge dir | DB |
|---|---|---|---|
| `PTMLK` | Melaka | `etanah-knowledge/melaka/` | Postgres (mlit/stg1/stg2/prod) |
| `PTPK` | Perak | `etanah-knowledge/perak/` (STATE-FACTS.md · DATABASE.md · index.md) | Oracle (oracle-prk-dev/denda/prod) |
| `PTSGR` | Selangor | (oracle-slt) | Oracle |
| `PTTRG` | Terengganu | `etanah-knowledge/terengganu/` | — |

**Why** (2026-08-28, #277439/#277115): started two Perak PT tickets and never loaded `etanah-knowledge/perak/` — it existed since 2026-08-26 (Oracle MCP map, repo topology, `prk/internal/<num>` + `prk/stag-env` branch convention). Improvised all of it, and used `internal/<num>` instead of the documented `prk/internal/<num>`. A state-prefix check at Phase 0 would have loaded it in seconds.

**Deterministic since 2026-09-04 (multi-state audit)**: `system/states.json` is THE registry (6 states: melaka · perak · wp · selangor · kedah · terengganu=excluded) and `lib/states.js` resolves it — `node lib/states.js resolve "<Task folder | permohonan id>"` / `show <key>`. `ticket-gate`, `knowledge-first-gate`, `branch-guard`, `alter-ticket-gate`, `adhoc-register`, `latent-bugs-gate`, `adhoc-lifecycle`, `awam-no-resit-gate`, `test-data-db`, `bug-db` route through it; the cascade is active.txt `state=` → Task folder `1. Tasks\<State>` → repo path `E:\Projects\<State>` → `PT<STATE>/` prefix → UNKNOWN (never a silent melaka). Remaining literals: `node lib/states.js check` (boot audit counts them). The table above is now a view of the registry — edit the registry, not this file.

Related: [[reference_perak_codev_scope]] · [[reference_perak_deploy_flow]] · [[feedback_stay_in_module]]
