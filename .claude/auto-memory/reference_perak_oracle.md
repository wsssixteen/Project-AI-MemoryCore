---
name: perak-oracle
description: "Perak Etanah Oracle MCP servers — oracle-prk-dev (172.16.93.150/etanahprk, schema ET_MAIN_PERAK_DEV) + oracle-prk-denda (192.168.19.100/etstagnp, ET_MAIN_PERAK_DENDA)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d3f5afb2-4fb3-4a56-8cbb-ee8ff4d48520
  modified: 2026-08-26T06:17:57.090Z
---

Perak Etanah runs on **Oracle** (like [[selangor-oracle-slt]], unlike Melaka's Postgres/pgEdge). Two MCP servers added 2026-08-26 per みや (`~/.claude.json`, backup `.bak-perak-2026-08-26`):

| Server | Host | Service | Schema/user | Tables (verified live 2026-08-26) |
|---|---|---|---|---|
| `oracle-prk-dev` | 172.16.93.150:1521 | `etanahprk` | `et_main_perak_dev` | 793 |
| `oracle-prk-denda` | 192.168.19.100:1521 | `etstagnp` | `et_main_perak_denda` | 799 |

- Password = the shared Melaka one (same as mlit/stg1/stg2/Selangor `et_main_dev`); PROD `et_read` differs.
- Same python-oracledb thin server as oracle-slt (`C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py`).
- Also seen in みや's DBeaver: `etprdpk` 192.168.15.104:1521 user `et_read` = **Perak PROD** — NOT added (no ask).
- First Perak ticket: #275092 [eSOKONGAN PERAK] "PT - Skrin Papar Ralat Apabila User Click Button Seterusnya" (assigned, due 2026-08-27).
- Perak codebase location + knowledge folder (`etanah-knowledge/perak/`) not yet established — set up at first Perak quest.
