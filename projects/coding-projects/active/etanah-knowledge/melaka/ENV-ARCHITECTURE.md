# ENV-ARCHITECTURE — Melaka server map (our modules only)

> **Source**: `ETANAH ARCHITECTURE - MLK` Google Sheet, tabs `MLK PROD` · `MLK TRN` · `MLK STG` ·
> `MLKIT` · `ENV DENDA`. Read 2026-08-06 (view-only). Link held by みや.
> **Scope**: this file records ONLY what touches our work — Pelupusan (`Pembangunan & Pelupusan`),
> Awam, the shared services we hit, the deploy/build VMs, and the DB endpoints. The sheet's full
> inventory (Pendaftaran, SPOC, Consent, Strata, Lelong, GIS, LDAP …) is deliberately NOT copied.
> **Naming**: hostnames are per-environment themed — TRN uses footballers (Eto, Zanetti), MLKIT
> uses desserts (Fudge, Mirage), STG uses aircraft parts (Radome, Avionic), PROD uses stadiums
> (wanda, wembley). The theme is the environment's fingerprint.

---

## 1. The one-line answer per environment

| Env | Our app server(s) | Build | Deploy VM | Public URL |
|---|---|---|---|---|
| **MLKIT** (internal/mlit) | Fudge1 `172.16.100.49` | Mirage1 `172.16.100.162` | same box — `deployment-scripts/mlit` | `mlit.melaka.gov.my` |
| **TRAINING** | Eto1/2/3 `172.30.12.126-128` | Mirage1 `172.16.100.162` | **Reus1 `172.30.12.152`** ⚠️ see §3 | `etanah-apptrn.melaka.gov.my` |
| **STAGING** | Radome1/2/3 `172.30.12.176-178` | Mirage1 `172.16.100.162` | `172.30.12.203` — `deployment-scripts/stag` | `etanah-appstg.melaka.gov.my` |
| **PROD** | wanda1/2 `172.30.11.105-106` | — | — | (never ours to deploy) |

All app nodes: port `8080`, JBoss 7.4 & JDK 17.

---

## 2. MLKIT (internal / mlit)

| Role | Host | IP | Port | Note |
|---|---|---|---|---|
| Awam Apache | Cocoa1 | `172.16.100.40` | 80 | `etanahmlit.melaka.gov.my` |
| Appsmlit Apache | Bliss1 | `172.16.100.41` | 80 | `mlit.melaka.gov.my` |
| Internal Apache | Mocha1 | `172.16.100.42` | 80 | |
| **Pembangunan & Pelupusan** | **Fudge1** | **`172.16.100.49`** | 8080 | 🎯 our WAR lands here |
| Awam & Portal Support | Truffle1 | `172.16.100.45` | 8080 | |
| UAM & Maintenance | Charm2 | `172.16.100.202` | 8080 | shares `etanah-common` — `mlit.melaka.gov.my/etanah-common` |
| Unit Teknikal | Hazelnut1 | `172.16.100.152` | 8080 | the module BPMN `MLK_TKL_*` CallActivities route to |
| DMS | Cascade1 | `172.16.100.154` | 8080 | |
| Flowable | Swirl1 | `172.16.100.156` | — | Tomcat9 & Flowable_6.8.1 |
| Report Server | Glimmer1 | `172.16.100.158` | 8080 | JBoss 7.3 + PostgreSQL |
| **Deployment & Build Server** | **Mirage1** | **`172.16.100.162`** | — | `/home/app/deployment-scripts/mlit` |
| Deployment (All site) | Perwira | `172.16.100.129` | 8080 | `http://172.16.100.129:8080/etanah-deployment/Deployment.xhtml` · ant 1.9.7 · maven 3.3.9 (kl/prk/sel/trg java11) · maven 3.8.8 (trg java17) · jdk 11.0.17+8 / 1.8.0_131 / 17.0.11+9 · jboss-eap-6.4 |

**Database** — Twist1/2/3 `172.16.100.191` / `.192` / `.193` (3 = witness). **EDB VIP `172.16.100.197`**.

```
jdbc:edb://172.16.100.197:5444/mkit?currentSchema=et_main_dev
jdbc:edb://172.16.100.197:5444/mkit?currentSchema=et_sistem_mlit
jdbc:edb://172.16.100.197:5444/mkit?currentSchema=et_dms_mlit
jdbc:edb://172.16.100.197:5444/mkit?currentSchema=et_flowable_mlit
user et_main_mlit
```

Matches the long-standing note that `172.16.100.197:5444` is the mlit DB and never an ssh target.

---

## 3. TRAINING

| Role | Host | IP | Port | Note |
|---|---|---|---|---|
| Awam Apache | Zanetti1 | `172.30.12.110` | 80 | `etanah-trn.melaka.gov.my` |
| Application Apache | Zanetti2 | `172.30.12.111` | 80 | `etanah-apptrn.melaka.gov.my` |
| Internal Apache | Zanetti3 | `172.30.12.112` | 80 | |
| **Pembangunan & Pelupusan 1/2/3** | **Eto1 / Eto2 / Eto3** | **`172.30.12.126` / `.127` / `.128`** | 8080 | 🎯 3 nodes, not 1 |
| Awam 1 & Portal Support | Giggs1 | `172.30.12.115` | 8080 | |
| Awam 2 & Portal Support | Giggs2 | `172.30.12.116` | 8080 | |
| Teknikal | Rivaldo | `172.30.12.134` | 8080 | |
| DMS | Cannavaro1 | `172.30.12.142` | 8080 | |
| Flowable | Zico1 | `172.30.12.146` | 8080 | Tomcat9, Flowable_6.8.1 |
| Report Server | Cafu1 | `172.30.12.147` | 8080 | `etanah-apptrn.melaka.gov.my/reportserver/` |
| **Utility (Deployment VM)** | **Reus1** | **`172.30.12.152`** | 8080 | 🎯 the analog of stag's `172.30.12.203` |

**Database** — Dohari1 `172.30.12.151` port 1521 (EDB).

```
jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_main_trn
jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_sistem_trn
jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_dms_trn
jdbc:postgresql://172.30.12.202:5444/mlkstg?currentSchema=et_flowable17_trn
user et_main_trn
```

⚠️ Training schemas live on the **same DB host as staging** (`172.30.12.202:5444`, database `mlkstg`)
— they are separated by `currentSchema`, not by server. Reading `et_main_stg1` vs `et_main_trn` is a
one-word difference on the same connection; get it wrong and you are looking at the wrong env.

⚠️ **`172.30.12.152` is the deployment VM per the sheet — we have not yet run a deploy against it.**
Aaron's instruction was *"build in 172.16.100.162, then deploy in another IP"*; this row is the
strongest candidate for that IP, and the deploy-script folder name is still unknown. Confirm with
him before treating the card as proven.

---

## 4. STAGING

| Role | Host | IP | Port | Note |
|---|---|---|---|---|
| Awam Apache | Avionic1 | `172.30.12.160` | 80 | `etanah-stg.melaka.gov.my` |
| Application Apache | Avionic2 | `172.30.12.161` | 80 | `etanah-appstg.melaka.gov.my` |
| Internal Apache | Avionic3 | `172.30.12.162` | 80 | |
| **Pembangunan & Pelupusan 1/2/3** | **Radome1/2/3** | **`172.30.12.176` / `.177` / `.178`** | 8080 | |
| Awam 1 & 2 & Portal Support | Canard1 / Canard2 | `172.30.12.165` / `.166` | 8080 | |
| Common | Valve1 | `172.30.12.184` | 8080 | `etanah-common` |
| Teknikal | Torque1 | `172.30.12.185` | 8080 | |
| DMS | Tinker1 | `172.30.12.193` | 8080 | |
| DMS Encrypt | Tinker2 | `172.30.12.207` | 8080 | JDK 18 |
| Integration | Damper1 | `172.30.12.195` | 80 / 8080 | `etanah-kom1.melaka.gov.my` |
| Flowable | Impeller1 | `172.30.12.197` | 8080 | Tomcat9 · **221 diagrams at `/home/ftpuser/files/flowable-diagrams/Melaka/2026-08-01`** |
| Report Server | Relay1 | `172.30.12.198` | 8080 | `https://etanah-appstg.melaka.gov.my/reportserver/` |
| Office Conversion | Flywheel1 | `172.30.12.196` | 8080 | JBoss 7.4, JDK 17, Word 2021 |
| Deploy VM (from our practice, not read on this tab) | — | `172.30.12.203` | — | `deployment-scripts/stag` |

The flowable-diagrams path is directly useful — it is the BPMN source we normally read from the
repo, published per-date on the staging Flowable box.

---

## 5. PROD (reference only — we never deploy here)

| Role | Host | IP |
|---|---|---|
| **Pelupusan 1 / 2** | wanda1 / wanda2 | `172.30.11.105` / `.106` |
| Pembangunan 1 / 2 | fenway1 / fenway2 | `172.30.11.107` / `.108` |
| Awam 1–7 | wembley1–7 | `172.30.11.170`–`.174`, `.195`, `.196` |
| Portal Support | hunky | `172.30.11.182` |

Zone is `Application Active-Active` — PROD Pelupusan runs 2 nodes behind the Apache tier.

---

## 6. What this corrects in our older notes

| Old claim | Corrected |
|---|---|
| "only 2 IPs exist" (`.162` build, `.203` stag deploy) | **wrong** — each env has its own app tier + deploy VM; `.162` is only the *build*/mlit box |
| `172.16.100.49` unnamed, guessed from a deploy log | confirmed: **Fudge1, Pembangunan & Pelupusan, MLKIT** |
| training deploys from `deployment-scripts/mltg` on `.162` | **refuted** — training deploys from its own VM, `172.30.12.152` per the sheet |
| training DB unknown | `172.30.12.202:5444/mlkstg?currentSchema=et_main_trn` — same host as staging |

---

## 7. Not captured

The sheet's rows below the visible fold on `MLK STG` (its Database + Utility rows) and the whole
`ENV DENDA` tab were not read — the sheet is view-only and the grid would not scroll under
automation. If a staging DB endpoint is ever needed from the sheet rather than from the MCP
config, that is the gap to close.

---

*Created 2026-08-06 · source: ETANAH ARCHITECTURE - MLK sheet, read via browser · pairs with
[[BRANCH-AND-DEPLOY]] (which owns the branch/merge/pipeline rules; this file owns the hosts).*
