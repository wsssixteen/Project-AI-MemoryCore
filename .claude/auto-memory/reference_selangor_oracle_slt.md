---
name: reference_selangor_oracle_slt
description: Selangor Etanah DB is Oracle (service SLIT) reached via the oracle-slt MCP — not Postgres like Melaka; how it is wired + its gotchas
metadata:
  type: reference
---

Selangor Etanah runs on **Oracle 19.3** (Melaka/other states are Postgres). Query it via the `oracle-slt` MCP — tools `mcp__oracle-slt__query_database` · `get_schema_info` · `list_tables`. I run the queries myself (same as [[feedback_never_hand_miya_a_query]]); only writes/unreachable get handed over.

**Connection**: host `172.16.93.32:1521` · service **SLIT** · schema **ET_MAIN_DEV** · user `et_main_dev` / `etanah123` (same password convention as Melaka states).

**Where it lives** (all outside the git repo): server `C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py` (+ venv beside it) · registered in `C:\Users\Ridhwan\.claude.json` mcpServers as `oracle-slt` · pre-add backup `.claude.json.bak_pre_oracle_slt_add_2026-08-18`. Built 2026-08-18.

**Stack + gotchas**:
- `python-oracledb` **THIN mode** — no Oracle Instant Client needed.
- Pinned `mcp<2` — mcp 2.0.0 removed `mcp.server.fastmcp` (FastMCP). Any future Python MCP server here must pin `<2` or migrate to the standalone `fastmcp` package.
- Oracle SQL, not Postgres: schema-qualify as `ET_MAIN_DEV.<table>`; catalog is `all_tables` / `all_tab_columns`; string funcs differ. Same etanah table names as Melaka (`pcp_pengguna`, etc.) but Oracle dialect.

**Selangor code checkout**: `E:\Projects\Selangor\etanah-pelupusan` — branch `master`, remote `ssh://git@172.16.93.167/etanah-pelupusan`, pelupusan only (no common/awam checked out). Trunk base = plain `master`, NOT `mlk/master` (Melaka convention) — the branch-guard hook false-positives here. codegraph / codemap / etanah-knowledge are all **Melaka-only** — grep/read the Selangor tree directly.

**CAS login note**: active internal users in `pcp_pengguna` (`flag_aktif='Y' AND flag_capaian_dalaman='Y'`, login col `NAMA_PENGGUNA`); `admin` account exists. No shared default password — each `kata_laluan2` hash is unique, so a username can be retrieved but not a password.
