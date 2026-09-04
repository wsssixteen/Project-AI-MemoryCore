---
name: reference_perak_codev_scope
description: "We are co-developer for Perak Etanah too (not only Melaka); Perak env, code path, DB, trunk branch"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-08-28T02:12:56.264Z
---

🚨 We handle **Melaka AND Perak** (co-developer). Perak tickets are in-scope — run the full quest on them, do not hand back as out-of-scope.

**Perak env facts:**
- Ticket env label: **ESOKONGAN**; permohonan IDs are `PTPK/...`; users `@perak.gov.my` / `@perak.etanah.com.my`.
- PROD app URL host: `appspk.perak.gov.my` (etanah-pelupusan). common version `1.51.39-PRK`, domain/db `1.1.133/1.1.138`.
- Code checkout: `E:\Projects\Perak\` (etanah-awam · etanah-common · etanah-pelupusan · etanah-spoc-hasil). **Trunk = `master`** (NOT `mlk/master` — Melaka guards/branch-guard must be bypassed or Perak-aware).
- DB = **Oracle** (Melaka is Postgres). MCP: `oracle-prk-dev` (ET_MAIN_PERAK_DEV, 93.150/etanahprk), `oracle-prk-denda` (etstagnp, 19.100), `oracle-prk-prod`.
- Melaka-tuned tooling (Postgres MCP, mlk/master branch-guard, etanah-knowledge/melaka, objective-locks) does NOT auto-apply to Perak — patch/bypass per-ticket.

Related: [[reference_perak_oracle]] · [[feedback_stay_in_module]]
