---
name: feedback_url_host_identifies_war
description: "URL host prefix (etanah-stg AWAM vs etanah-appstg apps) identifies the deployed WAR; a field on one surface but not the other for the same DB row = version skew between two separate WARs, not data loss"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6c801109-3e12-4d10-8f28-a1f6e4abe121
  modified: 2026-08-12T11:58:49.800Z
---

🚨 The AWAM portal (`etanah-awam`; STG host `etanah-stg`, MLKIT host `etanahmlit`) and the apps/internal pelupusan-staff app (`etanah-pelupusan`; STG host `etanah-appstg`) are **SEPARATE WARs on SEPARATE hosts with INDEPENDENT `mlk/release/x.y.z` baselines**. The URL **host prefix** identifies the WAR; the `.xhtml` path only identifies the form.

**Why:** 2026-08-12 (ad-hoc A12) — "pengalaman kerja disappeared after baseline" was data-intact: the field rendered on the pelupusan staff app (`etanah-appstg`, release/1.6.0) but NOT the AWAM portal (`etanah-stg`) for the same `umm_a_pengalaman_kerja` rows. Root cause bounded to version skew between the two WARs. I burned time conflating the two hosts and tracing AWAM code as if it were one deployment.

**How to apply:**
1. Phase 0 — read the URL **host**, not only the `.xhtml` path. Two screenshots from different hosts = different deployables; never assume one baseline covers both.
2. Field shows on one surface but not the other for the SAME DB row → suspect **deployed-version skew FIRST**; capture EACH surface's own version panel (`Domain / DB / Common / Module Version` + `Git Branch`).
3. DB timing forensics settle data-loss-vs-display in ONE query: `created_by` (SYSTEM auto vs staff `@melaka.gov.my` vs applicant `@gmail`) + `created_date` + `version` — `version=0`, unchanged on deploy day = display/read issue, not data loss.

See [[feedback_watch_video_url_first]]; full env map in etanah-knowledge `ENV-ARCHITECTURE.md §1`.
