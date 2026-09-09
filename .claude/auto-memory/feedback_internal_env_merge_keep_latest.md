---
name: internal-env-merge-keep-latest
description: "🚨 When \"updating\" internal env (mlk/int-env) by merging a ticket branch and it CONFLICTS, always keep internal's own side — its common version AND its code — via git merge -X ours; int-env is the latest-accumulating test env with no backflow to master"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8d89ff76-c886-4707-8249-712ba278da6f
  modified: 2026-09-09T07:55:08.000Z
---

🚨 Global rule for **"updating" the internal env** (`mlk/int-env`): on a merge conflict, ALWAYS retain internal's own side — never the incoming branch's side.

**Why:** int-env is the integration/test env that accumulates every ticket's work, so it is routinely AHEAD of a single ticket branch (and even ahead of `mlk/master` on `etanah.common.version` + on other tickets' code — e.g. #263304 Tambah Kuantiti, PDBB CC tags). Taking the incoming side would REGRESS int-env's common version and DROP other tickets' work. It has no backflow to `mlk/master`, so favoring int-env is safe.

**How to apply — the two concrete rules みや set (2026-09-09, #276997):**
1. **Common version** — keep int-env's `<etanah.common.version>` (the ahead/latest one); never let the incoming branch downgrade it.
2. **Code changes** — keep int-env's code on any conflicting hunk.

**Mechanism:** `git merge --no-ff -X ours origin/mlk/<tracker>/<num>` — `-X ours` auto-resolves every conflict in favor of int-env (HEAD) while STILL absorbing the incoming branch's non-conflicting changes (so the ticket's actual fix, which is non-conflicting, still lands). This is the sanctioned exception to the deploy skill's "merge conflict → STOP, never auto-resolve" rule, and ONLY for `mlk/int-env`. For `mlk/stag-env` / `mlk/master` the STOP-and-surface rule still holds.

Pairs with [[fix-dont-reroute]] and the `deploy` skill §4. Applies to `mlk/int-env` only.
