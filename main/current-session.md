# Current Session

**Last Activity**: 2026-10-06 23:45 — #282966 (AWAM RPPLP, field and buttons vanish after Cari) fixed, on `mlk/internal/282966` @ `5eb85ed938` and `mlk/int-env` @ `ab3b6770ce`, deployed and tested by miya on internal, BA verified PASSED · quest closed at Phase 1 · Domain Expansion run.

## Session Recap (2026-10-06 afternoon to night, worktree "perak-permohonans-doc-paths-c1480c", branch `claude/quest-282966-status-5b5e1e`, QA-282966)
- **READ FIRST**: `projects/coding-projects/active/QA-282966/QA-282966.md` (main checkout copy; the folder is ignored by git).
- **Ask**: start /quest 282966, retrieve from Redmine, see if it was run before. Then: proceed to the end, leave him only the deploy. Then (his /goal): check the Redmine he submitted, learn his writing style, close quest, save quest, Domain Expansion.
- **Finding**: the quest had never been run (no block, no doc, no branch). Started fresh.
- **Root cause**: `etanah-awam\src\main\java\my\gov\etanah\awam\common\web\form\AwamMaklumatLesenTabForm.java` `AwamMaklumatLesenTabForm.onSearchNoLesen():351` calls the flag reset added by #263304 (`a105e11d7d`, 2026-09-02). RPPLP hides the Jenis Permohonan radio, so its ID field, Cari and Isi Semula were switched off after Cari.
- **Fix**: the reset runs only when the radio is shown (+3 −1). PDBB has the same shape and is covered by the same line (code read only, not seen on screen).
- **Git**: `mlk/internal/282966` @ `5eb85ed93862222e7357c406a4e47c5f483a0e98` · `mlk/int-env` @ `ab3b6770ced102748f701cdd965a224ba79db92f`. A cherry-pick onto int-env conflicted on the whole file (line endings differ), so the same 3 lines were applied by hand on int-env's copy. NOT on `mlk/stag-env` or `mlk/master`.
- **Gate**: no local test; commit cleared by his own `[risk-ok: 282966 one-line fix, no local test]`.
- **Test**: miya on internal with PTMLK/03/L/PPTPB/2026/7 (portal login alyaaqilah802@gmail.com); screenshots in the Task folder `2. Fix\`. BA Nurhafizah Hasan: "Verified @ Awam MLIT / Result=PASSED" (20:09).
- **Redmine**: he posted my note and Root cause unchanged. Status now Verified. `SAVE-QUEST → WAIT`: archive waits for Closed.
- **Blocked, not done**: adding his posted note to the speech collection in `.claude/auto-memory/feedback_ticket_writing_style.md`. `memory-write-gate` refused 5 writes saying it saw no RULE-PLACEMENT line although the line was in my reply text each time. The lesson is kept in the quest doc, `main/main-memory.md` and the diary. Proposal logged (A1).
- **Other sessions' gaps seen at close**: `ADHOC-PT-2026-11` quest doc lacks a test login row and has one short path (resume-readiness). Redmine reconcile lists #283550, #278909, #274266, #265691 as assigned-open with no local block.
- **Open**: the fix needs staging and a release branch when the ticket is planned · archive #282966 once Redmine shows Closed (`node lib/save-quest.js QA-282966`).

**Last Activity**: 2026-10-06 23:40 — #244600 rework cycle 2 CLOSED (Phase 1): `mlk/qa/244600v3` @ `7c3b41a2bd`, `mlk/int-env` @ `281d2b0e59`, deployed and tested by miya on MLIT · covers #275043 · Redmine Resolved, archive waits for Closed · subject gate R8 + `memory-write-gate` on main · Domain Expansion run.

## Session Recap (2026-10-05 → 2026-10-06, session "ticket-244600-review-89e02d", #244600 cycle 2 + #275043)
- **READ FIRST**: `projects/coding-projects/active/QA-244600/QA-244600.md` → "2026-10-06: Rework cycle 2 CLOSED" block (commits, test rows, release warning, owed list).
- **Ask**: BA failed cycle 1 on 2026-10-05: first Kemaskini in a tugasan with no change still added a versi. Then: Carian Pintas missing versi, Jana Semula, Peraku, permanent Word logs.
- **Root cause (proven on 3 real MLIT pairs)**: the fill writes size 12 on each run; Word drops it on first save because the style already says 12; the old compare read the direct value only. Compare now reads the real format through the style chain.
- **Shipped (7 commits on `mlk/qa/244600v3`)**: compare by real format · font, alignment, header, footer, picture, comment, shading count as a change · WORDDOC log lines · Kemaskini versi tied to the task so Carian Pintas lists it · previous versi stays active at Jana Semula, at the Surat new-versi save and at Peraku · Aaron's Peraku rise (`3aa68917eb`) applied as the same text.
- **Test by miya (PTMLK/02/L/PLTP/2026/9)**: versi 1 to 8 across Semakan and Perakuan Pentadbir Tanah, every versi listed and opening in Carian Pintas. Surat JT / YB / JPPH NOT clicked (same code).
- **Three Fable audits** changed the work each time: header parts no section uses · my first Carian Pintas insert rejected (utility screens, not idempotent, wrong order) · the not-active mark has no reader (ship).
- **My mistakes (all in `system/slips.jsonl`)**: shipped Jana Semula without Peraku and let him deploy · called Carian Pintas "Common side" without reading our own writer · wrote "Jana Semula adds no versi" against #275043's Expected · formal Malay commit subjects · a memory line as the only fix for a behaviour · result tables that explained where he wanted the number.
- **System work**: subject gate R8 (markers block; mainly-Malay subject blocks at 3 or more Malay words and more than half; eval 54/54) · `domain/memory-write-gate/` (a feedback memory needs one `RULE-PLACEMENT:` line naming its file, workflow, step and enforcing file; eval 102/102). Both live once on main.
- **NOT built, needs his ruling**: (1) "close quest" trigger hook for `domain/save-quest/`: the birth gate refuses a new hook file in an existing Feature folder; three routes logged as proposal A1. (2) Per-part save rules for Domain Expansion (each of the six kinds declares a `save:` line, a script checks the parts touched): proposal A1, his idea of 2026-10-06.
- **Open**: Redmine notes for #244600 and #275043 drafted in his frame (Result cell = versi number only), he posts · tell Ammar his ticket is covered · Surat JT click test · one blank line in `PelupusanPenyediaanDokumenVO` differs from master by tabs · Jana Semula at Perakuan stored versi 7 as a normal file (`LAIN-`), not secret · master still has the Jana Semula copy step, so the release must carry the whole branch · `mlk/review/244600` can be deleted after release.

**Last Activity**: 2026-10-06 23:15 — #283286 (Ammar's fix, `getPtgLogo` → `getLogoPTG`) reviewed · quest saved and Phase 1 closed (review only, no commit of ours) · Domain Expansion run.

## Session Recap (2026-10-06 night, worktree "ticket-283286-review-bab0c9", #283286 colleague review)
- **Ask**: double check the fixes for #283286. Then (his /goal): check if Ammar updated his branch, save quest, close quest, Domain Expansion.
- **Ticket**: Internal Issue, BA Anis Nabilah. Common renamed the logo method (#279620, from common 1.7.8-MLK). Pelupusan must call the new name. One call site: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanReportMethodConstant.java` `PelupusanReportMethodConstant.populateImagePath():558`.
- **Ammar's branch `mlk/internal/283286`**: `c6296fa681` (16:41, the rename) + `2b6d37206a` (17:10, common version in `pom.xml` 1.7.5-MLK → 1.9.2-MLK.beta.patch4). Both are on `mlk/int-env`. On `mlk/stag-env` he merged the rename then put the old line back (`3db4027e7d`), so staging is unchanged in effect.
- **Verdict**: fix complete and consistent on internal. Common `825794699d` (1.9.2-MLK.beta.patch4) has `getLogoPTG()`.
- **My two misses**: (1) I called the common version in `pom.xml` "the pin"; he could not follow and said so hard. (2) My first verdict ("incomplete, builds should fail") came from the local tracking ref; Ammar had already pushed the missing half. Slips `reask/invented-label`, `verify/stale-local-ref`.
- **Watch points** (in the quest doc): a later re-merge of the branch into staging brings only the common version, not the rename (git sees it as merged) → revert `3db4027e7d` in the same merge · a release must point at a released common (1.7.8-MLK or newer), not the beta.
- **Not verified**: the internal build result and the rendered Slip Akuan Penerimaan.
- **State**: `QA-283286` status=closed, Redmine = Resolved (with BA), archive waits for Redmine Closed. Quest doc `projects/coding-projects/active/QA-283286/QA-283286.md` (main + worktree copies identical). No etanah repo touched, no Redmine write.
**Last Activity**: 2026-10-06 23:15 — #283532 (PROD, batal two UPS_PLP) patched through infra, verified on PROD, Redmine submitted by miya, quest closed at Phase 1 · Domain Expansion run.
