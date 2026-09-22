# Session audit — 2026-09-22 → 23 (board rewrite · redmine-sync v11 · reassigned-ticket learning · 280895 quest)

> Written per みや's explicit instruction (item 8 of the third /goal): *"document and save the audit
> in FULL CONTEXT into slip log and or todo list. MAKE SURE BE ELABORATIVE, OVER EXPLAIN OR OVER
> INCLUDE CONTEXT TO AVOID THE AUDIT MISUNDERSTANDING WHAT YOU FOUND, WHAT I WANTED, WHAT I ORIGINALLY
> ASKED AND QUESTIONED."* This doc is deliberately verbose. It is the source of truth for the weekly
> audit; the todo.md row + slip rows point here.

---

## 0. What みや ORIGINALLY ASKED (three /goal rounds, in order)

**Round 1 (/goal):** (1) close #280614; (2) retrieve tickets from Redmine and update our quests, run
close for those already Resolved in Redmine; (3) brief the tickets we have.

**Round 2 (after the brief):** *"no, you need to fix your ticket listing on session boot. Show 3
categories of tickets based on priority."* — (1) Table 1 = the patching tickets typically named
"Internal… (PROD)" where we patch dokumens / patch data / alter flowable; (2) Table 2 = the eSOKONGAN
TRACKER tickets, ordered by SEVERITY first then nearest DUE DATE; (3) Table 3 = internal fixes + other
types. Then re-brief. *"make sure to straight away commit and push that fix for session boot."*

**Round 3 (/goal, nine items):**
1. Remove the Due-date column — the real SLA is now HOURS (split across Dev/BA/TSO/users), so days-count
   is enough to gauge. **He then reconsidered in item 5**: due date IS important because a ticket sent
   late can be near its due date and must still be prioritized. NET: keep Due date.
2. Check whether "second-time Rework creates a new `X. Rework` folder" works — he SAW me reuse the same
   folder instead of making a new one.
3. On rework, dump the BA's new attachments into a SUBFOLDER, not directly into `X. Rework` — that
   folder is where HE saves his fixes / info to upload to Redmine, and it is a mess now.
4. The numbering is wrong — it creates Brief & Fix folders but not according to the Task-folder numbers.
5. `Days` should be days since HE RECEIVED the ticket (the true number). (Plus the due-date reconsideration.)
6. Update the reassigned tickets, BUT learn from them by tracing the fixes and run Phase 1 close / Phase 2
   archive on them.
7. Run the full quest until Rubric for 280895 (eSokongan → priority tomorrow) and save the quest.
8. Document + save this audit in FULL CONTEXT (this file).
9. Perform Domain Expansion so work can continue in separate sessions.

## 1. What みや QUESTIONED / the complaints (so the audit understands the WHY)

- **The boot ticket listing was wrong / unhelpful.** He wanted three priority tables, not one flat list.
  Implicit in this: the board had NOT been surfacing his work usefully. (We then discovered it was
  literally showing ZERO of his tickets — see §2 B1.)
- **The rework-folder handling made a mess.** New BA attachments were being dumped loose into the
  `X. Rework` folder (his upload workspace), and a second rework reused the same folder instead of a new one.
- **The "Days" number was misleading.** A ticket created months ago but only just reassigned to him showed
  a huge age (180 days), when the true "how long has this been on MY desk" number was ~0.

## 2. What I found — the BUGS (with evidence)

| # | Finding | Evidence | Severity |
|---|---|---|---|
| B1 | The boot board classified ALL 14 of his open tickets as "others" → `mine = 0` → **empty board**. Redmine appended a role suffix so the assignee is `"Ahmad Ridhwan Anuar (Dev PLP)"`, but `redmine-board.js` matched exact `ME = 'Ahmad Ridhwan Anuar'`. | `--json` showed `mine 0 / others 14`, others incl. `"Ahmad Ridhwan Anuar (Dev PLP)"` | the whole board was blank/wrong |
| B2 | 4 real Melaka tickets (265109, 264355, 246923, 244600) were dropped as "outside Melaka" because `MELAKA_PROJECTS` only knew `'eSOKONGAN MELAKA'`, not `'MLK_03_Pelupusan'` (his Internal-Issue project). | board printed `Assigned to you OUTSIDE Melaka (4)` with all four in `[MLK_03_Pelupusan]` | hid his own tickets |
| B3 | `redmine-sync.js` v10 decided "new rework folder?" by comparing journal-time to the folder's **birthtime**. OneDrive rewrites folder mtimes on sync, so the 2nd reopen of #278699 was MISSED and both cycles piled into one `3. Rework`. This is exactly what みや saw. | v10 comment admits the #278699 double-reopen; OneDrive-mtime family (same class as the 213-folder worktree death) | rework cycles lost |
| B4 | Rework folders had no `0. Brief` / `2. Fix` substructure; BA attachments dumped loose. | `189. ES #278699…/3. Rework/` held loose Issue*.png + his numbered files mixed | the mess he named |
| B5 | 280895 diagnosis in the block pointed at the `mlkMaklumatTanahV3` sempadan guard (`:239 !isMCL`). The BA VIDEO corrected it: the blank is the WHOLE `MlkMaklumatPermohonanPembatalanForm` page after Seterusnya, and L8's missing-getter is already fixed (getIsTambahKuantiti present :937). Root = the FORM param set (`:32-45`) missing `isMCL` among 9 urusan flags. | video `klik seterusnya blank_batal untuk urusan MCL.mp4` frame 7 = blank `…/MlkMaklumatPerm…` | wrong-fix avoided by watching the video |

## 3. What I CHANGED (with commits — all on MemoryCore main)

- **`43086a54`** (first board rewrite): 3 priority tables by tracker_id (Patching-PROD 63/64/71 · eSOKONGAN 51 severity→due · Internal-fixes+other); fixed B1 (isMe strips the role suffix) + B2 (added MLK_03_Pelupusan); `domain/list-redmine/eval.js` → 3-table contract 16/16.
- **`88c6be68`**: board `Days` = days since received (assignment-to-me journal date, fixes the 180→0 problem) — Due date KEPT; `redmine-sync` **v11** — genuine-reopen count (fixes B3, OneDrive-proof) + `0. Brief`/`2. Fix` inside each `N. Rework` with attachments routed to that `0. Brief` (fixes B4); `redmine-sync.eval` rewritten to v11 count-logic + structure asserts 17/17; `redmine-write-gate` matcher recognizes the offline `.eval.js` variant.
- **Board maintenance**: archived 280614 (Phase 2); closed 278580 + QA-280176 (Redmine-resolved reconcile); retrieved #264355 + #244600 (were missing from active.txt).
- **Item 6 (reassigned tickets — learned then closed):** 280029 = Ammar's Surat Ulangan JT fix; traced his diff, banked the pattern in BUG-BESTIARY (CC bare-RPr renders document-default font Calibri 11; `rPrOrSdtPrFallback` restores RFonts+Sz from the CC's own sdtPr; commits `01c501634c` + `6a74597c85`). 278909 (New, no commit) and 280166 (cross-module flowable/uam, no pelupusan commit) closed as delegated-to-Ammar with the trace result in the close_note.
- **Item 7 (280895 quest → Rubric + saved):** qa_doc `projects/coding-projects/active/QA-280895/QA-280895.md`; ad-hoc register A4 → TICKETED; wrong-fix row B5 logged.

## 4. What is STILL OPEN (residuals — do NOT lose these)

1. **280895 Apply (next session, priority).** Root cause 90%, complete-fix 60%. Residual = read staging
   `server.log` (or repro on mlk/master) to NAME which negative-list panel (`:58/:64/:72/:79/:108`)
   throws for MCL, then add the `isMCL` param + exclude MCL / add the MCL branch + thread into
   `mlkMaklumatTanahV3`. Analog: `MlkMaklumatTanahPemberimilikanForm.xhtml:84`. Test PTMLK/03/L/UPP/2026/2
   @ masirah stg2 apl 3436001.
2. **Received-days sanity** (low): 244600 + 264355 both show 0 — that is the assignment-to-me journal being
   dated today (they were freshly reassigned to him). Correct by design, but if a future ticket shows an
   unexpected 0, confirm its assign-to-me journal date rather than assuming a bug.
3. **The v11 rework fix is FORWARD-only.** Existing messy rework folders (e.g. #278699's `3. Rework`) are
   left as-is per his "fix this for future" (item 4). If he later wants the old ones reorganized, that is
   a separate one-time sweep.

## 5. Five-axis assessment (DE Step 7.5)

- **A1 Agentic system** — no fan-out this session; all single-loop. No waste. Largely N/A.
- **A2 Quest workflow** — the ad-hoc-register + latent-bugs hooks WORKED: 280895 matched A4, so I started
  from Recon not Scout, and the L8 check ruled out the missing-getter fast. The video-frames step is what
  turned a 60%-wrong Recon into a correct one — the "watch the BA video before naming a render-side panel"
  lesson is now a wrong-fix row + belongs in the Recon discipline.
- **A3 Debugging efficiency** — the board B1/B2 bugs were invisible until `mine` populated; the lesson is
  that a "0 results" board should have been suspicious on its own (an empty board for a working dev is a
  smell, like the OneDrive-worktree silent-success). Consider a board self-check: if `mine==0` but
  `others>0` and any other row is assigned to a name that STARTS WITH ME, print a warning.
- **A4 Etanah issue-solving** — the Utiliti-Pembatalan isMCL gap (A4/280895) is a whole FAMILY: the form
  enumerates urusan flags and any urusan not in the list falls through. Worth a knowledge note: "any
  UtilitiPembatalan/MaklumatPembatalan blank/error for an unusual urusan → check the form's `<ui:param>`
  flag set includes that urusan."
- **A5 Sweep / file discipline** — the redmine-sync folder rules (items 2/3/4) are the file-sweep axis;
  fixed. The recursive dedup (collectFilesRecursive) is the reusable bit.

## 6. Brainstorm — proposals logged for the weekly audit (each has an eval case)

Logged via `core/slips.js --type proposal` (see slip-dashboard "Open proposals"):
- **P1 (A3):** board self-check — warn when `mine==0 && others>0 && any other assignee startsWith(ME)`.
  Eval: inject an `(Dev PLP)`-suffixed assignee → the warning fires. Would have caught B1 at boot.
- **P2 (A2):** promote "watch the BA video before naming the render-side panel" to a Recon row when a
  `0. Brief/*.mp4` exists AND the symptom is "blank/kosong". Eval: 280895 — the pre-video Recon named the
  wrong panel; the rule forces the video first.
- **P3 (A4):** knowledge note "UtilitiPembatalan urusan-flag falls-through" family in URUSAN-FLOW /
  BUG-BESTIARY. Eval: a future non-MCL unusual-urusan Pembatalan blank matches the note.
