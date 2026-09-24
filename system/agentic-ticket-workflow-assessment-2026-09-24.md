# Agentic ticket-workflow assessment — 2026-09-24 (Perak #110506 deploy session)

Scope: one session, one deploy-only Perak quest (review Fatin's CR branch → merge to `prk/int-env` a71c31d97c).

| Axis | Assessment (concrete instance) | Forward idea + eval case (logged as proposal) |
|---|---|---|
| A1 agentic system | compile-gate + deploy-merge-surface only know Melaka repo paths (`domain/compile-gate/compile-check.js` MODULES map). A real green `mvn clean compile` in `E:\Dev\etanah-work\wt-110506` could not write a marker → 3 bypass tokens in one session. `prod-db-confirm` covers only `postgres-mlkprod`; Perak `oracle-prk-prod` has no confirm gate. | `compile-check.js run <module> --path <dir>` writes marker {path, HEAD sha}; deploy-merge-surface accepts a sha-matching marker. Eval: temp-worktree compile → merge passes without bypass; stale sha blocks. · Extend prod-db-confirm to `mcp__oracle-prk-prod__*`. Eval: SELECT via oracle-prk-prod triggers the ask. |
| A2 quest workflow | Deploy-only quest went open → archive in one pass (redmine-sync + active-cli + archive-quest). But redmine-sync set `ticket_type=bug` and `env=<subject text>` for a CR deploy; 12 fields hand-corrected. | redmine-sync: tracker `eSOKONGAN-CR` → `ticket_type=cr`; env from project name (`eSOKONGAN PERAK` → `Perak`), never subject. Eval: CR fixture → ticket_type=cr, env=Perak. |
| A3 debugging efficiency + accuracy | Per-conflict attribution (`git log HEAD..MERGE_HEAD -- <file>` per side) sorted 12 conflicts into 3 CR-owned vs 9 master-owned in one command. The auto-merge double call (`MaklumatTanahPlpForm.initPanelSyorKeputusan()`) was found only by diffing a file the CR never touched. | After an env merge, list files changed vs the env tip that the source branch did not own, diff each, flag a repeated call within one method. Eval: replay #110506 → MaklumatTanahPlpForm flagged. |
| A4 etanah issue-solving | Review found a PROD-urusan regression (PRBB else-if) inside a PPTPB CR; Perak staging DB quantified it (6 rows). Slip `reask/deviated-from-request`: recommended cherry-pick against the explicit whole-branch request. | deploy skill: evaluate the REQUESTED merge shape first; a deviation carries the comparison (precedent merges of the same branch into the env; does the alternative only defer conflicts). Eval: replay #110506 → first recommendation = whole-branch merge. |
| A5 sweep / file sweep | ⏭ no sweep run this session | — |

## Session 2 — #278909 (Risalat MMKN Tolak + ada pemilikan)

| Axis | What happened (instance) | Assessment | Proposal |
|---|---|---|---|
| A1 agentic system | 6 Stop-hook blocks on drafted Redmine text ("belum wujud", "tidak perlu diubah") by attempt-before-blocked-gate; render-verify fired on a delegated template ticket 4× | Gates read fenced draft text as my own capability claims → noise, delta replies cost turns | exclude fenced blocks; skip render-verify when status=delegated |
| A2 quest workflow | "Start to finish" → I built 3 docx; miya wanted junior to build | Quest Apply has no "who builds" branch for template tickets | popup before docx write (memory `template-work-junior-builds` written) |
| A3 debugging | Hypothesis (missing template → load failure) stated before runtime proof; miya's staging photo confirmed `Couldn't load file` | Correctly labelled HYPOTHESIS until proof; good | ⏭ nothing new |
| A4 etanah issue-solving | Ammar's config entries shipped in release/1.6.3 without the docx; no release check caught it | Release recon trusts commit messages; no config→file existence check | release V3 check (`cfg_missing.py`) — also surfaced `TemplateSuratAkuJanjiRoboh.docx` missing since ≤1.6.2 |
| A5 sweep | ⏭ no sweep run this session | — | — |

## Session 3 — #280540 BA data ask (pptpbl-fees-export worktree)

| Axis | Assessment (instance) |
|---|---|
| A1 agentic system | Telemetry gap: `sql-schema-verify` + `attachment-ledger-gate` blocked Stop repeatedly this session yet audit-briefing lists them 0-fire / RETIRE? → proposal logged. |
| A2 quest workflow | `sql-schema-verify` fights the "unqualified scripts for みや" rule → skip token every time → proposal logged. |
| A3 debugging | DB-first answered the real question fast (Per lives on `hsl_fi_pejabat`); the waste was in output shape, not diagnosis. |
| A4 etanah issue-solving | BA data asks need the joined per-child view first time; took 6 rounds → proposal logged; fact written to DATABASE.md §28. |
| A5 sweep | ⏭ no sweep this session. |

## Session 4 — #280895 (UPP Langkah 2 blank for MCL)

| Axis | Observation (instance) | Proposal |
|---|---|---|
| A1 agentic system | Permission-classifier outage left "go create the branch" unexecuted; I waited instead of retrying | none new (retry-first already a rule) |
| A2 quest workflow | Blind re-run (resume step 1b) caught a wrong prior diagnosis and wrong test data | worked as designed |
| A3 debugging | Cycle 1 read code from the int-env working copy; the fix line there hid the thrower | proposal: off-baseline Read advisory hook |
| A4 etanah issue-solving | #279615 split fix: getter route to stag, panel route to int-env only; env branches drift from master | proposal: env-branch drift report |
| A5 sweep | ⏭ no sweep run this session | — |
