# Current Session

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

## Session Recap (2026-10-06 evening, worktree "patch-quest-283532-954012", QA-283532)
- **Ask**: run the patch quest for #283532, retrieve from Redmine, brief the steps. Then: stage Redmine, verify after infra, close quest, save quest, Domain Expansion.
- **Result**: PTMLK/01/L/UPS_PLP/2026/7 (3448936) and PTMLK/01/L/UPS_PLP/2026/10 (3469308) cancelled on PROD; both were held by fatimah.salleh@melaka.gov.my at UPS_PS, no active tugasan now. Infra ran at 17:11; re-read = 2 aplikasi rows Tamat / Batal / Tamat, 2 tugasan rows N / Selesai, 0 dashboard rows. Parent PTMLK/01/L/PT/2026/30 (nurul.izza@melaka.gov.my at SRMMKNPDT) untouched.
- **Script**: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\269. II #283532 - Pelupusan - UPS - Batalkan ID UPS (PROD)\2. Fix\283532.sql`, the #277442 shape (`etanah-knowledge/melaka/DATABASE.md` section 27) with the two ids.
- **Redmine**: form staged through the browser, miya submitted (Resolved, BA Nurul Amirah Nadiah, Root Cause (DEV), 283532.sql). Never went through In Progress. At save time Redmine = Ready in PROD (Amila Qistina Rohizat). `SAVE-QUEST → WAIT`: archive waits for Closed.
- **Quest state**: `status=closed phase=1`, doc `projects/coding-projects/active/QA-283532/QA-283532.md` (copied to the main checkout, the folder is ignored by git).
- **Slip logged**: `ask-back/searchable` (offered "want the code re-read?" for a fact one file read answers).
- **Not verified**: the cancel screen was read from master and has no UPS_PLP handling; it was not run with a UPS_PLP id. The Flowable process of each app stays open in the engine (not readable).
- **Tool gap**: `domain/sql-schema-verify/sql-schema-verify.js emit` pairs subquery columns and `SYSDATE` with the wrong table, so a correct script returned 7 rows and could not be stamped. Proposal logged.
- **Open**: archive #283532 once Redmine shows Closed (`node lib/save-quest.js QA-283532`).

**Last Activity**: 2026-10-06 15:40 — ADHOC-PT-2026-11 (Perak PT, load documents PROD to STAG): 122 `.main` paths listed and checked for infra · ProTime line now `<ENV> - <title>` · Domain Expansion run.
