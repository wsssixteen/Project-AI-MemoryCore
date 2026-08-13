# adhoc-paste-detector

**Primitive**: hook-only (UserPromptSubmit). **Lifecycle**: created 2026-08-13.

## Contract

When miya pastes a BA-relayed screen issue as **labelled fields** — `Urusan:` / `Tugasan:` / `Id: <PTMLK/.../>` / `User:` — with **no Redmine ticket number**, this is an ADHOC that must be scaffolded like a Redmine retrieval, not answered inline (the answer is otherwise lost to chat and re-investigated when a ticket number arrives later).

## Fires when (all true)

- ≥3 of the 4 field labels present (`Urusan:` `Tugasan:` `Id:` `User:`/`Pengguna:`)
- the `Id:` value matches a permohonan-id shape (`PTMLK/03/L/PPTPB/2026/4`)
- **no** Redmine ticket signal in the prompt (a ticket number → the normal quest/retrieval flow owns it)
- no `[skip-adhoc-paste: <reason>]` bypass

## Injects

The mandatory ADHOC scaffold procedure: (1) Task folder + `0. Brief/` + `quest/notes.js`, (2) `quest/active-cli.js start ADHOC-<URUSAN>-<year>-<n>`, (3) `ADHOC-REGISTER.md` row, (4) `projects/.../ADHOC-<slug>/…md` qa_doc.

## Complements (not duplicates)

`adhoc-register.check.hook.js` — surfaces **existing** register rows when a **ticket** is mentioned. This hook detects the **paste with no ticket** and triggers **creation** of a new ADHOC. Different trigger, different action.

## Eval

`node domain/adhoc-paste-detector/adhoc-paste-detector.eval.js` — 7 fixtures (P1 fires+injects; P2 ticket-number silent; P3 prose silent; P4 too-few-labels silent; P5 non-permohonan-id silent; P6 bypass; P7 clean-exit-0).

## Bypass

`[skip-adhoc-paste: <reason>]`
