---
name: rework-commit-on-existing-ticket-branch
description: 🚨 A rework/corrected fix commits ON TOP of the existing ticket branch (replace the wrong fix), never a new branch
metadata:
  type: feedback
---

🚨 A rework or corrected fix commits **ON TOP of the SAME existing ticket branch** (`mlk/esokongan/<num>`, `mlk/internal/<num>`, etc.), replacing the earlier wrong fix in that branch's history — **NEVER a fresh branch** (no `vN` / `v2` / `mlk/qa/<num>` split). Then merge that one branch into internal and staging.

**Why:** 2026-09-22, みや. One ticket = one branch keeps branch management and releases clean — a release train picks up the single ticket branch and gets ALL of its fixes (original + every rework) with zero risk of a fix being stranded on a `vN` branch nobody merges.

**How to apply:** rework → checkout the existing ticket branch → apply the corrected fix (remove/replace the wrong lines) → commit on top → merge to `mlk/int-env` + `mlk/stag-env` (per [[deploy-staging-implies-internal]]). Supersedes the old "new `vN` branch per rework" habit. Pairs with the commit-deploy-runbook.
