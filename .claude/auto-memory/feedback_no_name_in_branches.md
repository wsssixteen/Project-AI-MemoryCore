---
name: feedback_no_name_in_branches
description: "🚨 BANNED — never put my name (\"ruri\" or any form) in a git ref (branch OR tag), even for local-only safety/checkpoint refs"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b36b075d-5080-40f6-aef4-2649e5631270
  modified: 2026-08-20T13:38:20.261Z
---

🚨 **BANNED**: never create a git ref — **branch OR tag** — whose name contains "ruri" (or my name in any form) — not on remote, not even as a local-only safety/pre-merge checkpoint.

**Why**: みや caught `ruri/pre-master-merge-1.3.1` in his Eclipse (2026-08-11). Hunting it revealed I'd been stamping my name on pre-merge safety checkpoints as **tags** (`refs/tags/ruri/pre-master-merge-1.3.1` · `-1.1.0` · `pre-internal-271985`) AND a leftover branch (`ruri/internalmerge-271985`). All local-only, all deleted. I made them as personal safety nets before master merges — but git's reflog already preserves the old ref, so a named checkpoint is redundant AND stamping my name on it is the violation. Refs are shared vocabulary; my identity does not belong in the repo's ref namespace, branch or tag.

**How to apply**:
- Need a safety net before a risky merge? Rely on the reflog / the existing branch ref — do NOT cut a `ruri/...` branch. If a real checkpoint branch is genuinely needed, name it by PURPOSE with no personal prefix (e.g. `mlk/pre-merge-1.3.1`), and prefer asking みや first.
- All working branches follow the established convention: `mlk/<tracker>/<num>` (see [[feedback_stash_naming_convention]] family / BRANCH-AND-DEPLOY.md).
- Clean up any stray `ruri/*` local branches when found.

🚨 **Branch NAME = the exact tracker-derived name, NOTHING added** (2026-08-20, #276504 — miya furious twice). The `<tracker>` for an **INTERNAL ISSUE** ticket is **`internal`**, so the branch is **`mlk/internal/<num>`** — NOT `mlk/internal-issue/<num>`. **Never invent a suffix or an abbreviation**: I created `mlk/internal/276504-permfix` (made-up `-permfix` suffix AND a made-up "permanent fix"→"permfix" abbreviation) to avoid clobbering a colleague's same-named remote branch. Both are banned — invented abbreviations violate the no-fake-savings rule, and a suffix is not the convention. If a colleague already owns `mlk/<tracker>/<num>`, **build on top of his commit** (branch off his SHA, add your commit) — do NOT replace his fix, do NOT rename around it. When a colleague's fix is already on a diverged env branch, **cherry-pick your delta onto the env branch** rather than a full merge (a master-based branch merged into a long-diverged `mlk/int-env` drags the whole divergence into conflict).
