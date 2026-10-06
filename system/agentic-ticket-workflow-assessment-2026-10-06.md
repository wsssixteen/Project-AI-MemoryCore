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
