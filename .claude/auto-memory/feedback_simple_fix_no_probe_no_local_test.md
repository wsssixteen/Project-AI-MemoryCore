---
name: simple-fix-no-probe-no-local-test
description: "🚨 A simple, high-confidence (80%+) additive fix goes straight to commit + deploy after miya agrees; no probe loggers, no local-test ask"
metadata:
  type: feedback
---

When miya agrees to a fix that is small, additive and 80%+ confident (path fully read, compile green), the next step is commit, push, merge to the env branches and the deploy card. Do NOT add QA-PROBE loggers and do NOT hand him a local test scenario first. He tests on the deployed env or BA does.

**Why:** 2026-10-04, #282924 (8-line PRBB one-hakmilik check). After his "I agree with your fix" I handed back a 6-row local test and then added 3 probe loggers because a Stop hook demanded a probe matrix. miya: "isn't this a simple fix, why do you need to test locally? Why are you putting loggers? ... I thought I was only left to deploy." A gate asking for more than he asked is answered with its skip token, not by doing the extra work.

**How to apply:** probes and a local test are for a diagnosis that is still uncertain (runtime-only residue, confidence under 80%, or he asks). Otherwise use `[skip-probe-matrix: <real reason>]`, set `local_test_confirmed=true` with a "waived by miya" note only after he says so, and go to commit + deploy. Related [[feedback_commit_deploy_runbook]] · [[probe-builds-local-only]].