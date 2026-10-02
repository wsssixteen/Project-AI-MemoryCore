# Agentic ticket workflow assessment — 2026-10-02 (worktree melaka-pembatalan-ralat-f283f4, Baseline 1.8.0)

| Axis | Assessment (concrete instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | Push gate v3 let a self-typed `RELEASE_GATE_BYPASS` through, so 8cf46735d4 reached AWAM mlk/release/1.11.1 without miya's nod. v4 now needs his own message + a foreign-merge-check report for the exact HEAD sha (25/25 eval). | Extend the same "his own words" rule to every bypass token on outward-facing gates (redmine-write, prod-db). Eval: bypass token present only in assistant text → BLOCK. |
| A2 quest workflow | #274461 lived only on int-env; nothing in the release pipeline read the todo row that said "include next time". carry-over.json + verify gate now block. | `discover` should auto-propose a carry-over row when a BA-reported env diff traces to an int-env-only ticket. Eval: 1.8.0 fixture with #274461 → proposal printed. |
| A3 debugging | Server log asked from infra while `et_sistem_stg2.pt_application_ex_entity` already held the full stack trace with URL, host and build time. | Error-store-first: an infra log request draft is blocked unless the turn queried pt_application_ex_entity. Eval: draft "hi Infra … server log" with no prior query → BLOCK. |
| A4 etanah issue-solving | `getJawatanUtama()` release vs int-env diff (`!= null` vs `== null`) explained the blank semak sign in one diff; banked as carry-over reason. | Bank the peranan-utama vs task-peranan rule in etanah-knowledge (sign populators + isValidUser allow-list). Eval: knowledge grep "isValidUser" returns the allow-list. |
| A5 sweep | `--no-merges` sweep missed the int-env merge resolution that carried P_ADALAH_INDIVIDU; foreign-merge-check.js now walks merges with first-parent diff. | Retrofit the same merge-inclusive walk into `audit-ticket.js` env-tested check. Eval: fixture where the ticket's line only exists in a merge commit → reported. |
## Session 2 (main, Farah review #264355 + #274266)

| Axis | Assessment (concrete instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | `ticket-close-block --ba` printed miya's template but leaked `fatal: ambiguous argument 'mlk/qa/264355v2'` for a remote-only branch (watch wmumjs1t1 → anomaly). | Resolve `--branch` via `origin/<branch>` and print without `origin/`. Eval: remote-only branch → no fatal line, Branch = mlk/qa/264355v2. |
| A2 quest workflow | The `quest` skill never fired; saves and closes ran by hand until miya set a /goal. Spawned task_ae2dbe14 (tool-use start detector + DE workflows check). | Colleague-ticket review starts with `git log --all --grep=<ticket>` in every repo. Eval: #264355 → surfaces pelupusan 2736c9a0be with awam 7544d52688. |
| A3 debugging | Told miya to upload `#274266.txt`; the Task-folder `274266.sql` was a stale 14-row partial patch never opened (slip `script-file-type`). | Hand-off file gate: block `.txt` script names and unread Task-folder files in a reply. Eval: "upload #274266.txt" → block. |
| A4 etanah issue-solving | PROD MLK_PLP_PT v13 already routes PT Tangguh to 28.1 while PROD has no PT ind_tgsn rows → every PT Tangguh fails ("tugasan not found", BpmCallbackService.java:777-779). Proven via admin model-json ids = stg2 XML ids. Banked FLOWABLE-KNOWLEDGE §16. | New-userTask release check across envs (BPMN has kod vs rows exist). Eval: 274266 snapshot → PROD flagged. |
| A5 sweep | `sql-schema-verify emit` crosses every identifier with every table (~70 false refs on 274266.sql); I ran an exact per-table query instead before stamping. | Per-statement refs. Eval: 274266.sql → 0 false rows. |

## Session 3 (worktree 282198, #282198 PT Minit Bebas PROD document patch)
| Axis | Assessment (instance) |
|---|---|
| A1 agentic system | Gates misfired on a DMS document patch: fix-photo (no UI change) and codemap UI-path (Word doc root cause) both needed skip tokens. fix-photo goal-lens met-rate 0% over 5 runs agrees. |
| A2 quest workflow | Phase 0 was skipped: sync went straight into patch-mlk-doc, ticket_type=patch set after the deliverable. Stored infra shapes never loaded. Fixed: quest 6c. |
| A3 debugging | No debugging. The correctness check that worked was rendering the docx through Word and viewing both pages. |
| A4 etanah issue-solving | The DMS document patch now has a fixed end state: `<num>.sql` + renamed `.main`, linted by deliverable-check.js. Open question: saiz_fail_byte stays old after an infra replace. |
| A5 sweep | ⏭ no sweep this session. |

## Session 4 addendum (17:22, ADHOC-PRBB-2026-10)
| Axis | Assessment (instance) | Proposal |
|---|---|---|
| A1 agentic system | ⏭ no agent fan-out this session | — |
| A2 quest workflow | adhoc-save audit caught block↔register status mismatch (delegated vs OWNED-ELSEWHERE) in-turn; fixed to OPEN cell. | other-team draft tone check (logged A2) |
| A3 debugging | error store → commit diff → 20/20 census in 6 queries; module attribution by user+time join worked (5 exact). | ⏭ worked as designed |
| A4 etanah issue-solving | unqualified error-store SQL failed for miya twice (42P01, 42501). | et_sistem_ prefix lint (logged A4) |
| A5 sweep | ⏭ no sweep | — |

## Session: #282587 review (worktree review-282587-quest-4e465d)
- A1: junior hint 'compare ind_langkah' did not produce a data patch; fix shipped half (code only). Proposal logged.
- A2: takeover review checked code first and data only after; D1 missing found in the same pass via DB query. Proposal logged.
- A3: sql-schema-verify emit returned 12 false rows (cross product); stamped by hand. Proposal logged.
- A4: BA pass note shape wrong twice (greeting, colleague commit block) despite memory example 2b; fixed in ticket-close-block.js. Write runner re-written ad hoc; proposal logged.
- A5: no sweep this session.

## Session 6 (permit-c02-2026-3-query, ADHOC-PRBB-2026-11)
- **A4 env-blind answer**: BA asked about a permit; I answered from PROD. Her screenshot (4 rows) was from internal MLIT. The mismatch cost one round-trip and a wrong guess ("maybe urusan lain"). Instance: reply listing HT16/CRHM/GD/PMT for aplikasi ids that only exist as PRBB-family rows on MLIT.
- **A4 knowledge-first miss**: guessed `ind_kod_rujukan_tmp`, then 3 information_schema probes, before DATABASE.md line 285 named `rjk_senarai_ahli_kumpulan`. Fixed by an index.md quick-link.
- A1 ⏭ no agents spawned · A2 ⏭ adhoc only, no quest phases · A3 ⏭ no debugging · A5 ⏭ no Brief reading beyond 2 screenshots.

---

## Session 7 addendum — #277706 SPOC Tambah Kuantiti (lucid-lalande, 18:14)

| Axis | Instance this session | Verdict |
|---|---|---|
| A1 agentic system | `fix-photo` Stop hook fired 3× on turns with no screen change (a data-location answer, a yes/no, a memory save) because BA screenshots existed; `predicate-box` blocked once claiming an etanah file was edited when only `git grep`/`git show` ran | 2 false-positive gates → proposals |
| A2 quest workflow | close-phase Phase 1 has no answer-only branch (no code, no git); steps were marked n/a by hand | proposal: answer-only close branch |
| A3 debugging | no debugging; knowledge-first (SPOC-COUNTER §4b) gave the jenis value map in one read | ⏭ nothing to improve |
| A4 issue-solving | pra-table lookup by `id_transaksi` took ~10 queries (schema, FK, rjk decode, 2 cross-checks) | proposal: one lookup script |
| A5 sweep | no sweep this session | ⏭ |
