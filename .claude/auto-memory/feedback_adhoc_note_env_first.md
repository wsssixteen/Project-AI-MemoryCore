---
name: feedback_adhoc_note_env_first
description: "At adhoc START, FIRST determine + NOTE the ENV from the error-page URL host (etanah-app=PROD vs etanah-appstg/etanah-stg=staging); a release-branch/version line does NOT identify env; verify the permohonan on THAT env's DB and flag PROD loudly"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6617a39-e51c-4896-939d-62e88a55fe11
  modified: 2026-08-27T04:22:00.860Z
---

🚨 **The FIRST thing at any adhoc intake = pin the ENVIRONMENT, and NOTE it explicitly.** Do not diagnose data until the env is fixed.

**How to read the env (in priority order):**
0. **Office-identifier signal (2026-08-27, per みや)**: the relay carries a real-office identifier — a `PDT*` fail/ref number (PDTJ / PDTMT / PDTAG — Pejabat Daerah dan Tanah), `PTG*`, an `NNNNNNPMNNNNNNNN` fail number, or a real officer @melaka.gov.my login — ⇒ a REAL user is asking ⇒ **default env = PROD; query PROD FIRST**, other envs only as comparison.
1. Error-page **URL host** / `Application:` line — this is ground truth:
   - `etanah-app.melaka.gov.my` → **PROD**
   - `etanah-appstg` / `etanah-stg` → **STAGING** (see [[feedback_url_host_identifies_war]])
   - `mlit.melaka.gov.my` → **mlit**
2. **Git Branch / Domain / Module version alone does NOT identify env** — PROD can run a `mlk/release/x.y.z` build. Never infer "staging" from a `release/` branch line.
3. Then verify the permohonan on **that env's DB** (`mcp__postgres-mlkprod-pg` = PROD `et_main`; stg2/stg1/mlit for the rest).

**If PROD — flag it loudly in the notes + active block (`env=PROD`) and remember:**
- Any data patch → **infra handoff**, never a direct write ([[feedback_prod_patch_infra_handoff]], [[feedback_readable_safe_script]]).
- The code fix ships via **release**, not a direct edit.
- Read-only SELECTs on PROD are fine for diagnosis.

**Why (2026-08-27, PRBB Borang 4Ce NPE, `PTMLK/02/L/PRBB/2026/12`)**: the error page said `Git Branch: mlk/release/1.4.0`, so I labelled it staging and verified on stg1/stg2. みや corrected: it was **PROD** (host `etanah-app.melaka.gov.my`, apl 3440281). The mechanism (kuantitiDisyor null → NPE) was right, but a wrong env label wastes verification and hides the correct patch path (PROD = infra handoff). One glance at the URL host would have pinned it. Pairs with [[feedback_watch_video_url_first]].

enforcement: hook-pending: adhoc-paste-detector env-pin row (P3)

## 🚨 ADDED 2026-09-03 (miya: "next time use your logic properly") — NO URL? INFER ENV FROM WHO + PHASE, NEVER DEFAULT TO PROD
Baseline 1.4.1 night: BA messaged miya at 22:00 "there was an issue" with no detail. I went to PROD first (PROD columns, PROD capaian, PROD permits) and only later checked staging. **BAQA during a baseline tests on STAGING** — that is the env by definition; PROD had not even been released at 22:00 (Fatin's "Released in PROD" journal = 02:16). Rule: when a report carries no URL/footer, pin the env from the REPORTER + PHASE table below BEFORE any query, and say the inference out loud in the first line:
| Reporter / phase | Env |
|---|---|
| BAQA (Mira/Fizah/Anis) during baseline | staging (et_main_stg2) |
| BA "please test in internal" / Verified MLIT | MLIT |
| PDT/PTG officer via BA relay, or "Ready in PROD, please verify with user" | PROD |
Then check that env's DB + the ticket journals in the SAME window (what changed between the last pass and the report time). Slip: `env-inference/default-to-prod` 2026-09-03.
