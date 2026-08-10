---
name: feedback_no_name_in_branches
description: "🚨 BANNED — never put my name (\"ruri\" or any form) in a git branch name, even for local-only safety/checkpoint branches"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b36b075d-5080-40f6-aef4-2649e5631270
  modified: 2026-08-10T01:23:27.390Z
---

🚨 **BANNED**: never create a git branch whose name contains "ruri" (or my name in any form) — not on remote, not even as a local-only safety/pre-merge checkpoint.

**Why**: みや caught `ruri/pre-master-merge-1.3.1` and `ruri/internalmerge-271985` sitting as local branches (2026-08-11). I had made them as personal safety nets before a master merge — but git's reflog already preserves the old ref, so a named checkpoint branch is redundant AND stamping my name on it is the violation. Branch names are shared vocabulary; my identity does not belong in the repo's ref namespace.

**How to apply**:
- Need a safety net before a risky merge? Rely on the reflog / the existing branch ref — do NOT cut a `ruri/...` branch. If a real checkpoint branch is genuinely needed, name it by PURPOSE with no personal prefix (e.g. `mlk/pre-merge-1.3.1`), and prefer asking みや first.
- All working branches follow the established convention: `mlk/<tracker>/<num>` (see [[feedback_stash_naming_convention]] family / BRANCH-AND-DEPLOY.md).
- Clean up any stray `ruri/*` local branches when found.
