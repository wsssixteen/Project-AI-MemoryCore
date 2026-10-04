---
name: feedback_state_aware_knowledge_load
description: "state from lib/states.js; same knowledge file names per state; Selangor = Oracle via oracle-slt"
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
| `PTTRG` | Terengganu (ACTIVE since 2026-10-03) | `etanah-knowledge/terengganu/` (index.md · STATE-FACTS.md) | Postgres (`postgres-trgstg2-pg` default · `postgres-trgstg1-pg` = only Flowable reader) |

**Why** (2026-08-28, #277439/#277115): started two Perak PT tickets and never loaded `etanah-knowledge/perak/` — it existed since 2026-08-26 (Oracle MCP map, repo topology, `prk/internal/<num>` + `prk/stag-env` branch convention). Improvised all of it, and used `internal/<num>` instead of the documented `prk/internal/<num>`. A state-prefix check at Phase 0 would have loaded it in seconds.

**Deterministic since 2026-09-04 (multi-state audit)**: `system/states.json` is THE registry (6 states: melaka · perak · wp · selangor · kedah · terengganu; no state is `excluded` since 2026-10-03, see [[project-terengganu-active]]) and `lib/states.js` resolves it — `node lib/states.js resolve "<Task folder | permohonan id>"` / `show <key>`. `ticket-gate`, `knowledge-first-gate`, `branch-guard`, `alter-ticket-gate`, `adhoc-register`, `latent-bugs-gate`, `adhoc-lifecycle`, `awam-no-resit-gate`, `test-data-db`, `bug-db` route through it; the cascade is active.txt `state=` → Task folder `1. Tasks\<State>` → repo path `E:\Projects\<State>` → `PT<STATE>/` prefix → UNKNOWN (never a silent melaka). Remaining literals: `node lib/states.js check` (boot audit counts them). The table above is now a view of the registry — edit the registry, not this file.

Related: [[reference_perak_codev_scope]] · [[reference_perak_codev_scope]] · [[feedback_module_edit_boundary]]

---

## Merged 2026-10-04: feedback_knowledge_schema_parity (was feedback_knowledge_schema_parity.md)

> 🚨 Every etanah-knowledge/<state>/ folder uses the SAME file names + layout (KNOWLEDGE-SCHEMA.json); the quest workflow resolves knowledge by exact name, so a differently-named file is invisible. Boot audit + write-time hook enforce it; scaffold new states with the knowledge-schema-audit CLI

**Rule (みや /goal 2026-09-04)**: the folder structure and MD file names under `projects/coding-projects/active/etanah-knowledge/<state>/` are IDENTICAL across states (melaka · perak · kedah · selangor · terengganu · wp). Canonical set = `etanah-knowledge/KNOWLEDGE-SCHEMA.json` — 14 required files (`index.md`, `STATE-FACTS.md`, `DATABASE.md`, `TEST-PERMOHONAN-INDEX.md`, `ADHOC-REGISTER.md`, `ADHOC-TRIAGE.md`, `BUG-BESTIARY.md`, `DEV-TESTING-HACKS.md`, `ENV-ARCHITECTURE.md`, `BRANCH-AND-DEPLOY.md`, `GIT-REPO-HYGIENE.md`, `DOMAIN-GLOSSARY.md`, `PERANAN-MAP.md`, `FLOWABLE-KNOWLEDGE.md`) + dirs `flowables-bpmn/` (PLP at root, other modules in `<MODULE>/`, `CONSENT/` not `CON/`) and `urusan/`. State facts go in `STATE-FACTS.md` — never `<STATE>-FACTS.md`; a new topic file keeps `UPPER-KEBAB.md` and is listed in that state's `index.md`.

**Why**: `ticket-gate.js`, `lib/test-data-db.js`, `adhoc-lifecycle`, `bpmn-check`, `learn-from-fix`, `pre-code-check` … all read knowledge by exact file name. On 2026-09-04 perak had `PERAK-FACTS.md`, wp had `TEST-DATA-AND-ACCESS.md` + `PROJECT-LOG.md`, kedah had no `index.md`, selangor/terengganu only `DATABASE.md` — none of it reachable by the workflow, and I had not noticed.

**How to apply**: the memory is MECHANICAL, not this note — `domain/knowledge-schema-audit/` fires at every boot (one advisory line per drifting state) and on every Edit|Write under `etanah-knowledge/<state>/` (warns on a legacy/non-canonical name or a bad flowables placement). Commands: `node domain/knowledge-schema-audit/knowledge-schema-audit.js audit [--state s]` · `… scaffold --state s` (skeletons under `⚠️ UNVERIFIED-FOR-<STATE>`, never overwrites). When a new state appears: add it to `KNOWLEDGE-SCHEMA.json` `states` (code · permohonan prefix · Task folder · aliases), then scaffold. Related: [[feedback_state_aware_knowledge_load]] · [[flowable-node-edge-trace]].

---

## Merged 2026-10-04: reference_selangor_oracle_slt (was reference_selangor_oracle_slt.md)

> Selangor Etanah DB is Oracle (service SLIT) reached via the oracle-slt MCP — not Postgres like Melaka; how it is wired + its gotchas

Selangor Etanah runs on **Oracle 19.3** (Melaka/other states are Postgres). Query it via the `oracle-slt` MCP — tools `mcp__oracle-slt__query_database` · `get_schema_info` · `list_tables`. I run the queries myself (same as [[feedback_readable_safe_script]]); only writes/unreachable get handed over.

**Connection**: host `172.16.93.32:1521` · service **SLIT** · schema **ET_MAIN_DEV** · user `et_main_dev` / `etanah123` (same password convention as Melaka states).

**Where it lives** (all outside the git repo): server `C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py` (+ venv beside it) · registered in `C:\Users\Ridhwan\.claude.json` mcpServers as `oracle-slt` · pre-add backup `.claude.json.bak_pre_oracle_slt_add_2026-08-18`. Built 2026-08-18.

**Stack + gotchas**:
- `python-oracledb` **THIN mode** — no Oracle Instant Client needed.
- Pinned `mcp<2` — mcp 2.0.0 removed `mcp.server.fastmcp` (FastMCP). Any future Python MCP server here must pin `<2` or migrate to the standalone `fastmcp` package.
- Oracle SQL, not Postgres: schema-qualify as `ET_MAIN_DEV.<table>`; catalog is `all_tables` / `all_tab_columns`; string funcs differ. Same etanah table names as Melaka (`pcp_pengguna`, etc.) but Oracle dialect.

**Selangor code checkout**: `E:\Projects\Selangor\etanah-pelupusan` — branch `master`, remote `ssh://git@172.16.93.167/etanah-pelupusan`, pelupusan only (no common/awam checked out). Trunk base = plain `master`, NOT `mlk/master` (Melaka convention) — the branch-guard hook false-positives here. codegraph / codemap / etanah-knowledge are all **Melaka-only** — grep/read the Selangor tree directly.

**CAS login note**: active internal users in `pcp_pengguna` (`flag_aktif='Y' AND flag_capaian_dalaman='Y'`, login col `NAMA_PENGGUNA`); `admin` account exists. No shared default password — each `kata_laluan2` hash is unique, so a username can be retrieved but not a password.
