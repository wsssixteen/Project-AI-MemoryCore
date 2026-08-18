---
name: feedback_ba_test_deploy_int_env
description: Closing a ticket for BA to test → branch off mlk/master then merge to mlk/int-env (internal); NEVER STG for a BA-test deploy
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 49658ef5-6528-4f5a-a714-bd6cbc1c7402
  modified: 2026-08-18T04:01:47.717Z
---

🚨 When closing an Etanah ticket **for BA to test**, the deploy target is **`mlk/int-env` (internal)** — NEVER STG/staging.

Flow (both repos): branch the fix off **`mlk/master`** → merge that ticket branch into **`mlk/int-env`** → deploy internal (`deployment-scripts/mlit` on `172.16.100.162`) → BA tests on mlit. STG (`mlk/stag-env`, `172.30.12.203`) is a separate downstream target, NOT where BA tests a closing ticket.

**Why:** 2026-08-18, QA-275152 — I wrote "deploy to STG" in the commit plan from memory without consulting the `/deploy` skill's env-resolution; みや had to stop me twice (*"why STG, it should be internal. mlk/int-env"* → then *"branch off from mlk/master then mlk/int-env for BA to test"*) and set a `/goal` to force it. Slip: deploy-target defaulted from memory instead of the deploy skill.

**How to apply:** at any ticket close / "deploy for BA to test" → target is int-env; run `/deploy internal <module> <ticket>`. Never say STG for a BA-test deploy. See [[reference_melaka_env_deploy_paths]] + the `deploy` skill env table.
