---
name: feedback-recheck-at-last-checkpoint
description: "🚨 A one-shot Phase-0 audit is NOT prevention — completeness checks (rework siblings, reverts, dropped files) must RE-RUN and BLOCK at the last checkpoint before an irreversible step (push/deploy), because the world changes between audit and push"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 01c61f21-b748-4ef7-bac5-882f6b0ae7a0
  modified: 2026-08-24T07:56:50.488Z
---

Release 1.3.6 (2026-08-24): `audit-ticket.js` (built 2026-08-13 for exactly this) enumerated rework branches at Phase 0, saw only `mlk/training/275539`, and its verdict was trusted through push. `mlk/training/275539v2` — the complete, MLIT-verified fix (+`PelupusanExcelReaderHelper.java`) — reached origin after the audit. みや caught it after the push; second incident of the incomplete-footprint class (#273461 was the first).

**Why:** an advisory tool that runs once protects only the moment it ran. Anything that can change on origin (new branches, reverts, force-pushes) must be re-checked at the LAST gate before the irreversible step, and the check must FAIL the pipeline, not print a warning.

**How to apply:** for any pipeline (release, deploy, patch): identify the irreversible step, and make every completeness/freshness check a blocking gate immediately before it. Shipped form: `domain/release-mlk-plp/release-prep.js` `verify` sibling-sweep + revert-scan + per-file drop-scan + pom asserts (commits `9767b87`, `71b50cb`, tests in `sibling-sweep.test.js`). Related: [[feedback-verify-before-claim]], [[feedback-attempt-before-claiming-blocked]].
