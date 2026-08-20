---
name: feedback_board_from_redmine_first
description: "Any \"work/finish the tickets\" request → run redmine-board.js (live truth) FIRST, before presenting any ticket list built from active.txt"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 11fdb797-7e2f-4f4d-a3bb-deb1d8d5cc2d
  modified: 2026-08-20T03:11:52.186Z
---

🚨 On ANY "let's finish the tickets" / "what's in progress" / "work the tickets" request, the FIRST action is `node quest/redmine-board.js` (live Redmine "mine-open") — present the board from THAT, then reconcile active.txt to it. NEVER present a ticket list built from `active.txt` alone.

**Why**: 2026-08-20, session start — miya asked to finish all in-progress tickets. I built the first board from `active.txt` and listed ~14 "open", including 274740 which was Redmine-CLOSED (Shafiq 100%) but kept deliberately-open in active.txt for an owed patch. miya caught it: *"was there a gap in your session boot ticket check? 274740 is already closed."* The real open queue was 7. active.txt over-lists because it holds closed-but-residue rows, pre-ticket adhocs, and delegated items.

**Root cause (miya's own question answered)**: NOT because miya added context instead of just summoning "Ruri" — context is never the disruption. The cause was reading my own derived artifact (active.txt) as the board instead of the live source. Same family as the 07-27 lesson "active.txt rots while Redmine stays true" and [[feedback_never_hand_miya_a_query]] — my ledgers decay, Redmine is truth.

**How to apply**: board request → `redmine-board.js` first → map each active.txt block to a live row → drop rows not in mine-open (closed/handed/reassigned) → only THEN show the list. Pure-adhoc (no Redmine ticket) rows are labeled as such, not counted as open Redmine work.
