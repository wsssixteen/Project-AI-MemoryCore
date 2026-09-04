---
name: perak-oracle
description: "Perak Etanah Oracle MCP servers — oracle-prk-dev (172.16.93.150/etanahprk, schema ET_MAIN_PERAK_DEV) + oracle-prk-denda (192.168.19.100/etstagnp, ET_MAIN_PERAK_DENDA)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d3f5afb2-4fb3-4a56-8cbb-ee8ff4d48520
  modified: 2026-08-26T07:06:15.772Z
---

Perak Etanah runs on **Oracle** (like [[selangor-oracle-slt]], unlike Melaka's Postgres/pgEdge). Two MCP servers added 2026-08-26 per みや (`~/.claude.json`, backup `.bak-perak-2026-08-26`):

| Server | Host | Service | Schema/user | Tables (verified live 2026-08-26) |
|---|---|---|---|---|
| `oracle-prk-dev` | 172.16.93.150:1521 | `etanahprk` | `et_main_perak_dev` | 793 |
| `oracle-prk-denda` | 192.168.19.100:1521 | `etstagnp` | `et_main_perak_denda` | 799 |

- Password = the shared Melaka one (same as mlit/stg1/stg2/Selangor `et_main_dev`); PROD `et_read` differs.
- Same python-oracledb thin server as oracle-slt (`C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py`).
- Also seen in みや's DBeaver: `etprdpk` 192.168.15.104:1521 user `et_read` = **Perak PROD** — NOT added (no ask).
- First Perak ticket: #275092 [eSOKONGAN PERAK] — resolved by みや 2026-08-26 (alter `PTPK/07/E/PT/2023/154` → Semakan Permohonan HKGHS at PROD); retrieved into `1. Tasks\Perak\` for the audit; latent remoting root cause unfixed (bounce-back plausible).
- Knowledge folder ESTABLISHED 2026-08-26: `projects/coding-projects/active/etanah-knowledge/perak/` — read `index.md` + `STATE-FACTS.md` first; migration ledger in `MIGRATION-PLAN.md` (strategy: skeleton-first, verify-per-item; generic method in `../STATE-MIGRATION-PLAYBOOK.md`).
- Codebase: SAME remotes as Melaka (`172.16.93.167`), branch prefix `prk/*`, NO `prk/master` (baseline unconfirmed — plan Q1); `E:\Projects\Perak` is an empty placeholder. Task folders route by state via `quest/redmine-sync.js` v9+ (`node quest/redmine-sync.js <num>` = by-ID retrieval).
