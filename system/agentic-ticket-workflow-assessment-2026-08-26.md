# Agentic/ticket-workflow assessment — 2026-08-26 (#273461 deep-audit session)

## A1 Agentic system
- **Instance**: wf_46c7a439-626 — 7 sonnet agents, 975k tokens, 0 errors, uniform-model design so STRUCTURE was the only variable. 7/7 structures caught the 6-table ground truth (incl. bare baseline) once the lifecycle question was in the prompt.
- **Finding**: fleet size added confirmation, not discovery — S3 skeptic spent 149k confirming an already-correct S1. The cheap lever is the QUESTION in the prompt, then ONE narrow lens (lensC lifecycle, 113k, deepest catch at lowest scope).
- **Shipped**: proposal A1 row (question-before-fleet test protocol).

## A2 Quest workflow
- **Instance**: #273461 08-06 audit declared "reference graph verified complete 4/4" via shared-column-name sweep; blind by construction to convention-key links (`sis_no_turutan`) and renamed FKs (`ind_pemegang_permit_lesen.versi_akhir_id`). Recon cited `PelupusanService.runningNumberPessimisticLock():3169-3194` yet never resolved its entity to a table.
- **Shipped**: quest SKILL Recon state-footprint row + patch-script-gate CHECK 6 (eval 27/27) + script-check rule 8. Proposal A2 row: mechanize entity-resolution as a script over entity_table_map.json.

## A3 Debugging efficiency + accuracy
- ⏭ no live debugging this session (audit + simulation only).

## A4 Etanah issue-solving
- **Instance**: fleet surfaced PROD facts our banked knowledge lacked: counter=6, `A01/2026/6` live since 08-21 → reclaim of {2,3,5} permanently impossible; 3 premature registry rows are `SLP_KUATKUASA` with named holders; zero DB-level FK constraints across the permit tables (ordering is author-enforced only); manual counter UPDATE races the app's pessimistic lock.
- **Shipped**: PERMIT-LESEN-RUNNING-NUMBER.md 2026-08-26 block (both copies).

## A5 Sweep / file sweep
- ⏭ no multi-ticket sweep this session.
