---
name: perak-flowable-alter-page
description: "🚨 Perak flowable ALTER page (pelupusan only): https://<host>/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml — PROD host appspk.perak.gov.my · STAGING appspkstg.perak.gov.my (swap only the host); login nurhafizah@ptsb.puncaktegap.com.my (password in etanah-knowledge/perak/FLOWABLE-ALTER.md, untracked)"
metadata:
  node_type: memory
  type: reference
  originSessionId: 1a5cfb41-faa9-46b2-ab49-480d7b5a5489
  modified: 2026-09-04T02:28:08.591Z
---

**Perak flowable alter page (per みや 2026-09-04, #275847)** — "Pelupusan Flowable Utility Page", pelupusan module ONLY:

| Env | URL |
|---|---|
| PROD | `https://appspk.perak.gov.my/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml` |
| STAGING | `https://appspkstg.perak.gov.my/etanah-pelupusan/protected/flowable/InitiateBPMFlowableForm.xhtml` |

- Only the HOST changes between environments; path is identical.
- Login: `nurhafizah@ptsb.puncaktegap.com.my` — password lives in the untracked-confidential
  `projects/coding-projects/active/etanah-knowledge/perak/FLOWABLE-ALTER.md` (never in a git-pushed file).
- Path differs from Melaka (`/protected/internal/InitiateBPMFlowableForm.xhtml`, "Pelupusan Flowable Alter Page"):
  Perak's bean lives in `web/form/flowable/`, page title "Pelupusan Flowable Utility Page", actions =
  Initiate Flowable · On-Submit (Move Process) · Alter Flow Flowable · Migrate BPM to Flowable (password-gated
  bulk init+alter) · Migrate Flowable Version. NO single-ID "Initiate & Alter in one click" (Melaka has it).
- Full mechanics + the deterministic alter-ticket runbook/reply format: `etanah-knowledge/perak/FLOWABLE-ALTER.md`
  (see [[perak-oracle]], [[perak-codev-scope]], [[flowable-node-edge-trace]]).
