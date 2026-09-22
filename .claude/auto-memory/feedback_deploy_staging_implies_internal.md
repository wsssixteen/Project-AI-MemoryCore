---
name: deploy-staging-implies-internal
description: 🚨 Deploy to staging → MUST also deploy to internal; deploy to internal → internal only
metadata:
  type: feedback
---

🚨 When みや says **deploy to staging**, deploy to **BOTH** staging (`mlk/stag-env`) **and** internal (`mlk/int-env`). When he says **deploy to internal**, deploy to **internal ONLY**.

**Why:** 2026-09-22, みや set this as a standing rule during the 279711/280176 reworks. Staging is the wider BA-facing env, so anything reaching staging must also be on internal — internal must never lag behind staging. Internal is the narrower env, so an internal-only request stays internal.

**How to apply:** at every deploy step read the target from みや's exact words. staging → merge/deploy the fix into both env branches. internal → `mlk/int-env` only. The apply/local-test/STOP-review gates still precede any deploy. Pairs with [[feedback_ba_test_deploy_int_env]] and the commit-deploy-runbook.
