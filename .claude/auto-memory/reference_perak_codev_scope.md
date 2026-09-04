---
name: reference_perak_codev_scope
description: "We are co-developer for Perak Etanah too (not only Melaka); Perak env, code path, DB, trunk branch"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-09-04T08:35:29.097Z
---

🚨 We handle **Melaka AND Perak** (co-developer). Perak tickets are in-scope — run the full quest on them, do not hand back as out-of-scope.

**Perak env facts:**
- Ticket env label: **ESOKONGAN**; permohonan IDs are `PTPK/...`; users `@perak.gov.my` / `@perak.etanah.com.my`.
- PROD app URL host: `appspk.perak.gov.my` (etanah-pelupusan). common version `1.51.39-PRK`, domain/db `1.1.133/1.1.138`.
- Code checkout: `E:\Projects\Perak\` (etanah-awam · etanah-common · etanah-pelupusan · etanah-spoc-hasil). **Trunk = `master`** (NOT `mlk/master` — Melaka guards/branch-guard must be bypassed or Perak-aware).
- DB = **Oracle** (Melaka is Postgres). MCP: `oracle-prk-dev` (ET_MAIN_PERAK_DEV, 93.150/etanahprk), `oracle-prk-denda` (etstagnp, 19.100), `oracle-prk-prod`.
- Melaka-tuned tooling does NOT auto-apply to Perak. Since 2026-09-04 the registry `system/states.json` (via `lib/states.js`) carries Perak's trunk (`master`), Task folder (`1. Tasks\Perak`), knowledge dir, Oracle MCPs and `prk/internal/<num>` branch shape — `branch-guard`, `ticket-gate`, `knowledge-first-gate` now read it; tools still listed by `node lib/states.js check` as UNROUTED (release-mlk-plp, deploy, env-check, …) are Melaka-only by design.

Related: [[reference_perak_oracle]] · [[feedback_stay_in_module]]
