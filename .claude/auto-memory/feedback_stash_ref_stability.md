---
name: stash-ref-stability
description: "For cross-session persistence, identify git stashes by descriptive-message grep, not stash@{N} position — position drifts every time a new stash lands on top."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 25f0ce70-0098-473f-8ff3-a46e2b5aafbd
---

For any git ref written into cross-session state (`active.txt` block, `QA-NNN.md § Resume Point`, feedback memory), identify **stashes by descriptive-message grep**, NEVER by `stash@{N}` position.

**Why:** 2026-07-13 — I wrote `stash_ref=stash@{0}` into `active.txt` for QA-259112 on 2026-07-08. Five days later on resume, `git stash list` had the QA-259112 entry at `stash@{1}` (a new stash `269918` landed on top while みや was working other tickets). Content untouched, position drifted. If the resume instruction had said "pop stash@{0}" verbatim, we would have popped the wrong stash (269918).

**How to apply:**
- **Write** the stash with a **verbose, self-identifying `-m` message** that includes the QA number, the approach name/version, and the from-branch: `git stash push -m "QA-259112 Approach C WIP — 5 files (populator REVERTED for eSokongan #268637). Stashed FROM mlk/esokongan/268637v2 @ 66c77a313e. Pop onto mlk/master."`.
- **Persist** in `active.txt`: BOTH `stash_ref=stash@{N}` (current position at hold time — audit trail) AND `stash_ref_note=identify by message "<verbatim grep string>"`. The `_ref` is the snapshot; the `_note` is the anchor.
- **Resume instruction** in `QA-NNN.md § Resume Point`: never bare `stash@{0}` — always include the grep pattern: `git stash list | grep "QA-259112 Approach C" → pop that N`.
- **Same principle for `reflog@{N}`, `HEAD~N`, or any other position-indexed git ref.** Only commit SHAs and stable branch names are stable across sessions.

Related: [[feedback_stale_handoff_verify]] (verify handoff state at boot — same family of "written-state-goes-stale" failure mode).
