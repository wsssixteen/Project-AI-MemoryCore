---
name: feedback_stash_naming_convention
description: "Git stash messages use \"stash <ticket-number>\" — simple, greppable, one ticket per stash"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 602618d2-c616-4882-9e6c-74eafcd0cb52
  modified: 2026-08-04T04:35:46.857Z
---

Every `git stash push` carries the message **`stash <ticket-number>`** — e.g. `git stash push -m "stash 273294"`. Nothing else: no dates, no WIP prose, no file lists, no branch names.

**Why:** みや asked for this on 2026-08-04 after a session where fixes had to be parked while he tested a different ticket in a parallel session. The existing stash list had drifted into 20 entries with no shared shape — `2/6/26`, `bugfix`, `WIP on mlk/master: 37587a365a ...`, `239386 MPT — 22 files (Java+xhtml) + L1 override protected/common/; incl. L3 plot-gate eq URS_PT; parked 2026-07-20 ...`. His words: *"We should probably have a stash naming convention as well. Something simple like stash and ticket number is enough."* A stash you cannot identify at a glance is a stash you will not restore.

**How to apply:**
- Push: `git stash push -m "stash <ticket>"` — one ticket per stash, never bundle two tickets' work.
- Find it by **message grep**, never by `stash@{N}` — positions drift every time a new stash lands on top (see [[feedback_stash_ref_stability]]): `git stash list | grep "stash 273294"`.
- If a ticket genuinely needs two stashes, suffix minimally: `stash 273294 b`.
- Context, reasoning and file inventories go in the quest MD (`projects/coding-projects/active/QA-<n>/QA-<n>.md`), never in the stash message — same discipline as [[feedback_my_files_minimal]].
- Record the stash in the quest's `active.txt` block so a cold resume can find it.

Related: [[feedback_stash_ref_stability]] · [[feedback_folder_vocabulary]]
