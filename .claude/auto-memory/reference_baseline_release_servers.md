---
name: reference-baseline-release-servers
description: "Baseline (PLP release) build + deploy server endpoints — build 172.16.100.162, deploy 172.30.12.203, ssh user app"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7179d6c0-6b16-4037-9e4f-79cb6608d539
  modified: 2026-07-20T04:35:36.219Z
---

Baseline / `release-mlk-plp` hand-off endpoints (みや runs these; Ruri only emits the card):

| Step | Host | Path | Script |
|---|---|---|---|
| BUILD | `172.16.100.162` | `build-scripts17/` | `./build-pelupusan.sh <branch>` → choose `stag` |
| DEPLOY | `172.30.12.203` | `deployment-scripts/stag/` | `./deploy-pelupusan.sh` |

SSH user is `app` for both. The password is みや's alone — never stored here or anywhere in the repo.

**Why this file exists**: these values live in `domain/release-mlk-plp/servers.local.json`, which is
**gitignored**, so they never sync between みや's machines — at release 1.0.10 (2026-07-20) the card
came out with empty host slots on the Ridhwan laptop and みや had to re-supply values he had already
given once. A gitignored file cannot serve as cross-machine memory. This memory is the durable copy;
re-create the local json from it on any machine where the card renders blank.

Related: [[feedback_uat_fat_environments]]
