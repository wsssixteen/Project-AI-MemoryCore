# Current Session

**Last Activity**: 2026-10-29 20:05 — worktree `pembatalan-dropdown-popup-251828`, adhoc ADHOC-BPRZ-2026-1 (Penang IT AWAM BPRZ) closed ANSWERED and archived, Domain Expansion.

## Session Recap (2026-10-29, worktree "pembatalan-dropdown-popup-251828", Penang BPRZ adhoc)
- His ask: Penang AWAM BPRZ popup, "Pembatalan dropdown" shows nothing; ticket maybe under Izz. Screen confirmed: tab Maklumat Perizaban > popup Maklumat Plot.
- Finding: the plot popup lists (No. Lot/PT, No Lot Bersebelahan, Tempat) are built from the saved Maklumat Tanah rows (`etanah-awam` PelupusanService.java:4725-4782). IT record 430 has no No Lot Bersebelahan (row 201 mklmt_tmbhn blank), so that list is empty. By design per BA spec 286972. No Izz ticket matches.
- miya: "no, it is okay" → closed ANSWERED, route ANSWER. Register Penang A6 ANSWERED; Task folder 7 → Archive; block → active-archive.txt. Audit 30/30 PASS (agent's run; my own re-run is blocked by the adhoc-brief-first gate).
- Open: nothing for this adhoc. archive-quest needed `--allow-stub` (no Bounty section on an answered adhoc).
**Last Activity**: 2026-10-29 20:05 — worktree `melaka-goal-quest-adhoc-297634`, adhoc ADHOC-PRBB-2026-19 answered + saved, Domain Expansion.

## Session Recap (2026-10-29, worktree "melaka-goal-quest-adhoc-297634", PRBB Tambah Kuantiti adhoc)
- ADHOC-PRBB-2026-19 (A79, Task 333, archived): BA asked where PRBB Tambah Kuantiti Rekod Permohonan is stored. SPOC Rekod Permohonan lists permits only for jenis 6/7, so jenis 8 shows Tiada Rekod (SPOC read from local int-env 2026-10-13, newer work not verified). AWAM Rekod Pembaharuan reads the permit asal tables (ind_permit_lesen, ind_versi_permit_lesen, ind_pemegang_permit_lesen, umm_a_permit_lesen); new permohonan in umm_p_permit_lesen.mklmt_tmbhn. Verified on MLIT C01/2026/9.
- Mistakes corrected by miya: misread BA's question (it was about the SPOC photo); first reply not in his style; said panel rows came from umm_p_permit_lesen.
- miya's WA reply fact-checked (all correct) and rewritten in the list shape; Pena rule c56 (module table) = WhatsApp list: *Label*: value, then each table.column on its own line.
- Save audit 29/29 PASS. Archive needed --allow-stub (no Bounty section in an adhoc qa_doc).
- Open: write SPOC 6/7 rule + AWAM Rekod Pembaharuan sources to etanah-knowledge only if miya asks.
**Last Activity**: 2026-10-29 19:55 — worktree `baseline-wednesday-release-029181` ("Baseline 1.9.0"), BA passed, master MR !9 created, Phase F rebuilt on the GitLab API, Domain Expansion.

## Session Recap (2026-10-29, worktree "baseline-wednesday-release-029181", Baseline Pelupusan 1.9.0 Phase F)
- BAQA passed 1.9.0. `merge-to-master` push refused: GitLab now protects `mlk/master`. Staging caught up from the release (`mlk/stag-env` 876e1cf03b, common 1.10.20-MLK).
- Phase F rebuilt (Fable 5.1 audited the plan): `release-prep.js merge-to-master` never pushes; `--create-mr --reviewer <name> --confirm` creates the MR through the GitLab API (token in git-ignored `servers.local.json`, user ridhwan), reads every field back, records the URL. Description always "Need assistance to merge. Thank you.". Reviewers Aaron @aaronloh · Alex @alexang.
- miya's rules today: only the reviewer pick is asked; after BA pass the MR and the staging catch-up run in the SAME turn (no waiting for master); GitLab pre-fills stay unless a fixed value is set.
- Live: MR !9 http://10.16.63.27/gitlab/etanah/etanah-pelupusan/-/merge_requests/9 (Aaron, 24 commits, all fields ✓). 1.9.0 state `mr-pending`.
- Evals: eval-merge-request 36/36, eval-stag-catchup 33/33, push-gate 51/51; `eval.js` 13/17 fails the same 4 on unchanged code (pre-existing, not from this change).
- Next: Aaron merges → `merge-to-master --release 1.9.0 --check`. His checkout `E:\Projects\Melaka\etanah-pelupusan` sits on `mlk/master` at 585a7bcdad (release tip), was on `mlk/hotfix/285768`.

**Last Activity**: 2026-10-29 18:10 — worktree `sweep-orchestration-audit-39e710`, /sweep 286655 286646 286610 done, then the sweep audit Tool + audit-and-refine step built (system change).

## Session Recap (2026-10-29, worktree "sweep-orchestration-audit-39e710", /sweep audit + refinement)
- Sweep of 286655 · 286646 · 286610: W1-W4 banked in each `QA-<n>/`; W4 changed the fix on 286655 and 286646. Three fix sessions started from the cards, all waiting on miya.
- His ask: audit the sweep for accuracy (first) and speed; give it its own logs; "add a step to always audit and straight away find the proper refinement, fixes".
- Built (system change): `domain/sweep/audit.js` (flag on/off in the MAIN folder; run → one ledger row + defects + refinements + self-audit) · skill Step 8 audit and refine · W3 with W1+W2, W4 per ticket · familiars write to scratch, controller banks · code read via `origin/mlk/master` · W4 reads the commit that introduced each changed line. Evals: contract 23/23, Tool 34/34.
- Found while building: the hand-typed ledger row said 0 suppressions; the Tool counted 96 in the run window (the flag worked). Tokens: 3.1M new spend + cache re-reads apart.
- Next: the next /sweep run is the live proof (watch wmvtdigs8).

**Last Activity**: 2026-10-29 17:35 — worktree `ecstatic-gauss-bdf0d7` ("29/10/2026 - 286315"), Fizah's bold concerns + requirement re-check, Domain Expansion.

## Session Recap (2026-10-29, worktree "ecstatic-gauss-bdf0d7", 286315 concerns)
- 286315 (PPTPB Risalat MMKN section 3 bold): Verified by QA on STAG and `mlk/release/1.9.0`; save-quest WAIT (archive when Redmine Closed). Quest doc saved (2026-10-29 17:30 block).
- Fizah's questions answered: section 3 shows the Ulasan field (273576, BA Anis, PROD 5/8/2026); the bold is 4 fixed phrases in the Ulasan, not the keputusan; any other phrase needs a CR ticket. miya: keep as is.
- Requirement test: 220411 (PDT, spec .docx) is the right requirement but section 3 was superseded by 273576. I first called the fix the wrong approach from the old spec; corrected. requirement-index ranked 220411 7th and does not read .docx attachments. Slips: spec-not-read, requirement-overtrust.
- New adhoc ADHOC-PPTPB-2026-7 (A81, archive hold, Task 337): waits for the CR ticket. ADHOC-PPTPB-2026-6 still open: archive-quest refused at the harvest gate (no Bounty section); needs miya's call (bounty or --allow-stub).
- Open: blank-line Ulasan never tested (262 of 1023 PROD rows); requirement-index improvement (proposal logged).
**Last Activity**: 2026-10-28 13:40 — PymTime phase 2 (self-check engine) DONE: Fable audit, its 3 majors fixed, committed locally as a68c18c (not pushed); next phase 3
