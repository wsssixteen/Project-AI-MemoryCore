---
name: feedback_probe_builds_local_only
description: "🚨 PROBE / logger builds are tested on miya's LOCAL JBoss only — never merged or pushed to int-env / stag-env / master / release; enforced by domain/probe-local-only-gate (PreToolUse Bash+PowerShell). Rule stands 'for now', may change later."
metadata:
  node_type: memory
  type: feedback
---

🚨 When a diagnosis needs runtime loggers (a `QA<num>-PROBE` build), the probe is tested **locally** on みや's JBoss (`E:\Dev\jboss-7.4-plp-melaka`, local `etanahDS` → `et_main_stg2`, so the same staging data works). It is NEVER merged or pushed to `mlk/int-env`, `mlk/stag-env`, `mlk/master`, `mlk/release/*`, `mlk/mlit` or `prk/*`.

**Why** (2026-09-23, #280176 Issue B): on 2026-09-22 the probe commit `3ba0dd4985` went into stag-env + int-env and needed a revert merge. みや: *"do we need loggers? If yes, please add a rule we will be testing locally. That is a new rule or stopgate from now on. The only reason we will be testing locally for now and will change in the future if any."*

**How to apply**:
- Write the probe on the ticket branch in the work clone (`E:\Dev\etanah-work\etanah-pelupusan`), compile there, export a patch (`E:\Dev\etanah-work\<ticket>-local.patch`) and apply it to みや's local `mlk/master` working tree, uncommitted.
- He builds + reproduces; read `E:\Dev\jboss-7.4-plp-melaka\standalone\log\server.log` for the `QA…-PROBE` lines.
- The fix commit that follows carries NO probe lines. `domain/probe-local-only-gate` blocks any merge/push of a marker-carrying ref into a protected branch; bypass `[skip-probe-gate: <reason>]` only on みや's explicit word.
- "For now": if みや later moves probe testing back to an env, retire the gate and this rule together.

Related: [[feedback_etanah_git_separate_clone]] (write-side git in the clone, never his tree), [[reference_compile_gate_local_build]].
