# adhoc-paste-detector

**Primitive**: hook-only (UserPromptSubmit). **Lifecycle**: created 2026-08-13 · **WIDENED 2026-08-26** (per miya — PDTJ jabatan-teknikal intake answered inline for a dozen turns with no scaffold).

**state-scoped: yes — permohonan-id shape + office codes (PDTJ/PDTAG/PDTMT) are Melaka's; a second state adds its own office-code list + id shape.**

## Contract

When miya opens with a BA-relayed screen issue — **labelled fields** (`Urusan:` / `Tugasan:` / `Id: <PTMLK/.../>` / `User:`) **or a freeform relay** (office code `PDTJ`/`PDTAG`/`PDTMT` and/or a permohonan-id + issue words) — with **no OWNING Redmine ticket number**, this is an ADHOC that must be scaffolded like a Redmine retrieval, not answered inline (the answer is otherwise lost to chat and re-investigated when a ticket number arrives later).

## Fires when (either path, plus the two guards)

- **Labelled path**: ≥3 of the 4 field labels (`Urusan:` `Tugasan:` `Id:` `User:`/`Pengguna:`) + a permohonan-id shape
- **Freeform path** (2026-08-26): a permohonan-id shape (`PTMLK/02/L/PT/2026/1`) + an issue-description word (isu/mohon semak/papar/sepatutnya/ralat/error/expected/missing/…). Office code alone (no id) does NOT fire — nothing to scaffold.
- Guard 1: **no OWNING Redmine ticket signal** — a ticket number preceded by a related-marker (`related`/`rujuk`/`ref`/`berkaitan`) does NOT abort (the 2026-08-26 miss: "related tiket eSOKONGAN #274318" killed the fire)
- Guard 2: no `[skip-adhoc-paste: <reason>]` bypass

## Injects

The mandatory ADHOC scaffold procedure: (1) Task folder + `0. Brief/` + `quest/notes.js`, (2) `quest/active-cli.js start ADHOC-<URUSAN>-<year>-<n>`, (3) `ADHOC-REGISTER.md` row, (4) `projects/.../ADHOC-<slug>/…md` qa_doc.

## Complements (not duplicates)

`adhoc-register.check.hook.js` — surfaces **existing** register rows when a **ticket** is mentioned. This hook detects the **paste with no ticket** and triggers **creation** of a new ADHOC. Different trigger, different action.

## Eval

`node domain/adhoc-paste-detector/adhoc-paste-detector.eval.js` — 11 fixtures (P1 labelled fires; P2 owning-ticket silent; P3 prose silent; P4 too-few-labels silent; P5 non-permohonan-id silent; P6 bypass; P7 clean-exit-0; P8 freeform PDTJ relay fires despite related-ticket mention — the 2026-08-26 slip replay; P9 office-code-alone silent; P10 freeform with owning ticket silent; P11 id+issue-words fires). Last run 2026-08-26: 11/11 green × 5 consecutive loops.

## Bypass

`[skip-adhoc-paste: <reason>]`
