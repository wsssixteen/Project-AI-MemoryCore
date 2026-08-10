---
name: feedback_no_name_in_branches
description: "🚨 BANNED — never put my name (\"ruri\" or any form) in a git ref (branch OR tag), even for local-only safety/checkpoint refs"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b36b075d-5080-40f6-aef4-2649e5631270
  modified: 2026-08-10T01:56:11.060Z
---

🚨 **BANNED**: never create a git ref — **branch OR tag** — whose name contains "ruri" (or my name in any form) — not on remote, not even as a local-only safety/pre-merge checkpoint.

**Why**: みや caught `ruri/pre-master-merge-1.3.1` in his Eclipse (2026-08-11). Hunting it revealed I'd been stamping my name on pre-merge safety checkpoints as **tags** (`refs/tags/ruri/pre-master-merge-1.3.1` · `-1.1.0` · `pre-internal-271985`) AND a leftover branch (`ruri/internalmerge-271985`). All local-only, all deleted. I made them as personal safety nets before master merges — but git's reflog already preserves the old ref, so a named checkpoint is redundant AND stamping my name on it is the violation. Refs are shared vocabulary; my identity does not belong in the repo's ref namespace, branch or tag.

**How to apply**:
- Need a safety net before a risky merge? Rely on the reflog / the existing branch ref — do NOT cut a `ruri/...` branch. If a real checkpoint branch is genuinely needed, name it by PURPOSE with no personal prefix (e.g. `mlk/pre-merge-1.3.1`), and prefer asking みや first.
- All working branches follow the established convention: `mlk/<tracker>/<num>` (see [[feedback_stash_naming_convention]] family / BRANCH-AND-DEPLOY.md).
- Clean up any stray `ruri/*` local branches when found.
