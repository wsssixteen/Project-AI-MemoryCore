---
name: reference_melaka_env_deploy_paths
description: Melaka env-deploy routes — internal/mlit = one function on 172.16.100.162 deployment-scripts/mlit; staging = build on .162 then deploy on 172.30.12.203 deployment-scripts/stag. Only 2 IPs exist. Use the /deploy skill.
metadata: 
  node_type: memory
  type: reference
  originSessionId: b044020e-b62d-4004-89f2-1f5a1a7a7cfc
  modified: 2026-07-27T12:41:15.844Z
---

Two IPs, and that is all — `172.16.100.162` (alias `mirage1`, holds BOTH `build-scripts17/` and
`deployment-scripts/`) and `172.30.12.203` (holds `deployment-scripts/stag/`). ssh user `app`.

| Env | Branch | Route |
|---|---|---|
| internal / mlit | `mlk/int-env` | `172.16.100.162` → `deployment-scripts/mlit/` → `./deploy-<module>.sh` → branch prompt. **Build + deploy is ONE function.** |
| staging | `mlk/stag-env` | build `172.16.100.162` → `build-scripts17/` → `./build-<module>.sh <branch>` → env prompt `stag`; then deploy `172.30.12.203` → `deployment-scripts/stag/` → `./deploy-<module>.sh` |

`deployment-scripts/` on mirage1: `common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles` — no `stag`
folder there, which is why staging deploy lives on the other box.

The build script's env menu is `pat/uat/stag/train/prod/hotfix` — **there is no `int`/`mlit`
option**, because internal never uses the build script at all.

`172.16.100.197:5444` is the mlit **database** (`mkit` / `et_main_mlit`) — never an ssh target.
See [[feedback_uat_fat_environments]].

Use the `/deploy <env> <module> <ticket>` skill rather than re-deriving this.
Env branches never reach `mlk/master` — shipping still needs the Redmine planned-release list.

Source: colleague 2026-07-27 — *"Same IP as building staging, just different folder, also for
internal. Build and deploy is 1 function."* Confirmed against mirage1 `ls` output same day.
