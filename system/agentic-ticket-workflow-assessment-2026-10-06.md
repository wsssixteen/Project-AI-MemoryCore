# Agentic ticket workflow assessment — 2026-10-06 (session: ADHOC-PT-2026-11, Perak document paths PROD to STG)

| Axis | What this session showed (instance) |
|---|---|
| A1 agentic system | The ProTime title rule he had given ("starts with PROD - ...") was in no loaded file; both adhoc skills said "no env". I searched memory, skills, diary and other sessions' transcripts and found no record, so the rule was lost at the moment he first said it. Also: `lib/adhoc-save-audit.js` defaults to the Melaka register and flagged a Terengganu block as a clash on the Perak row. |
| A2 quest workflow | `patch-mlk-doc` is the only document-locator skill and it is Melaka + Postgres + generated documents only. A Perak ask needed the Oracle schemas and a second branch for uploaded documents (`umm_a_dok_kmskn`), both worked out by hand. |
| A3 debugging accuracy | Three avoidable round trips: `k.dok_id` guessed on `umm_a_dok_kmskn`; the medan kod guessed as `UMM_A_DOK_KMSKN` (real `UMM_A_DOK_KEMSKAN`); `skg_dok.a_dok_kmskn_id` assumed to be the link (0 rows). Then the proof SELECT was handed unqualified, as the db-claim-proof text asks, and failed on Perak PROD with ORA-00942 because login `ET_READ` owns no tables. |
| A4 etanah issue-solving | Reusable fact banked in `etanah-knowledge/perak/STATE-FACTS.md`: the Perak document locator (two branches, schema names per env, the kod spelling, 122 of 122 proof). |
| A5 sweep / file sweep | The list handed to infra was changed three times on his word (wildcard, then `.pdf` lines, then removed). I chose the wildcard and the `.pdf` lines myself with no stored format for a PROD to STG copy. His own file was then checked mechanically: 122 matched, 0 missing, 0 extra. |

## Forward ideas (logged as proposals)

| Axis | Idea | Eval case |
|---|---|---|
| A1 | `adhoc-save-audit` reads the state from the block's `state=` key, not the Melaka default | a Perak block audited with no `--state` reads the Perak register and passes |
| A1 | Repair the 5 stale fixtures in `lib/adhoc-save-audit.eval.js` (19/24 on main before this session) | eval prints 24/24 |
| A2 | Make the document locator state-aware: schema names from `system/states.json`, plus the uploaded-document branch | locator for `PTPK/18/E/PT/2024/19` returns 82 paths |
| A3 | db-claim-proof wording: a SELECT handed to miya for a state whose login owns no tables is schema-qualified | a Perak proof SELECT without `et_main.` is flagged; a Melaka one stays unqualified |
| A5 | Store an infra message format for "copy files PROD to STG": exact `.main` paths only, no wildcard, no `.pdf` | the stored block is copied word for word next time |

## Session: the document simulator (`/doc-sim`), 2026-10-05 to 2026-10-06, main checkout

| Axis | What this session showed | Instance |
|---|---|---|
| A1 agentic system | No fan-out was used; the work was one long serial build. Two sessions worked the same ticket's code without knowing of each other | The #244600 session rewrote the compare into `PelupusanWordLogUtil` while this session's build lifted the old methods by name; the build broke twice |
| A2 quest workflow | A falsifier that needs JBoss does not get run. The ledger rule existed since 2026-10-04 and still had no cheap test for document claims | #244600 cycle 1 shipped on a compare that never met a freshly filled paper; the offline run found the cause in one pass |
| A3 debugging | Ten boot rounds at 2 to 3 minutes each, one missing piece per round. Each error was read and fixed singly instead of listing what JBoss supplies first | JNDI name, version map, DMS client, jar without directory entries, JSF implementation jar: five separate reruns |
| A4 etanah issue-solving | The app's beans can be booted outside JBoss, read-only. Nothing in the knowledge base said so before | `DEV-TESTING-HACKS.md` last section, written this session |
| A5 sweep | ⏭ no ticket sweep this session | none |

Noise seen: the loop detector fired on 20 of about 60 tool calls with no real loop (parallel reads of one file, successive PowerShell calls). The audit shows it at 11110 s over 7 days with 0 blocks.

## Night session — #283286 colleague review (worktree "ticket-283286-review-bab0c9")

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | ⏭ no delegation; a one-line review, done inline | — |
| A2 quest workflow | A colleague-review intake has no "ask the server first" step. The verdict was built on a local tracking ref 30 minutes behind | local `c6296fa681` vs remote `2b6d37206a`; Ammar's common version commit at 17:10 was missed until miya asked |
| A3 debugging accuracy | A PowerShell line that read `$LASTEXITCODE` after a second git call inside the same string printed True for every row; caught only because an earlier grep disagreed | `merge-base --is-ancestor` loop, 1.7.6-MLK shown True then False |
| A4 etanah issue-solving | A ticket branch merged to an env branch and then reverted there is a trap for the next merge; nothing flags it | `mlk/stag-env`: `f4ceda293b` merge, `3db4027e7d` revert |
| A5 sweep | ⏭ single ticket, no brief files beyond Description and History | — |

Reply shape: the finding was right and unreadable. An invented word ("the pin") for the common version line in `pom.xml` cost one angry round trip. Slip `reask/invented-label`.

Proposals logged: A2 (ls-remote first at colleague-review intake) · A4 (reverted-merge check before an env merge).
## Session: #283532 PROD cancel of two UPS permohonan, 2026-10-06 evening, worktree

| Axis | What this session showed | Instance |
|---|---|---|
| A1 agentic system | ⏭ no fan-out, a single-thread patch ticket | none |
| A2 quest workflow | The patch path worked from banked knowledge in one pass. Two close checks do not fit a patch ticket | `falsifier-ran-check` printed "(no quest doc)" and "local_test_confirmed=false" for a PROD data patch whose doc sat in the worktree |
| A3 debugging | ⏭ no debugging; the precedent script was reused | none |
| A4 etanah issue-solving | Knowledge-first paid: DATABASE.md section 27 gave the three statements and the end state; the only new work was reading the two rows | The first PROD query failed on a guessed column (`trkh_mohon`); the error was read and the query corrected |
| A5 sweep | The catalog check tool cannot stamp a correct script that uses a subquery | `sql-schema-verify emit` on 283532.sql returned 7 rows, all mis-paired columns or `SYSDATE` |

Proposals logged: A2 (schema-verify parser scope) · A4 (falsifier check reads the worktree doc) · A2 (patch tickets cleared by the after-run re-read).
