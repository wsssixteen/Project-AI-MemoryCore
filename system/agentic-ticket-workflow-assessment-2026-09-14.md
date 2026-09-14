# Agentic / Ticket-Workflow Assessment — 2026-09-14 (from QA-278930)

Instance-per-claim across the five axes.

## A1 — agentic system
- **Instance**: compile-gate blocked a docx-only commit twice; deploy-guard blocked the binary-conflict resolve. Both bypass tokens are read from miya's message, not my command — so miya saying "just push" without the literal token could not unblock me, costing round-trips.
- **Forward**: auto-pass compile-gate when zero `.java` staged (proposal A1 logged). Keeps the Java-build guard, drops the docx/config false-positive.

## A2 — quest workflow
- **Instance**: the quest sat at `int-env-deployed-awaiting-BA-test` on the strength of a push SHA, but the WAR was never rebuilt — a fresh gen rendered the old template. "Deployed" was asserted from a push.
- **Forward**: deploy-proof-gate should demand a build/deploy-run id or a rendered-doc check before a phase says "deployed" (proposal A2 logged).

## A3 — debugging efficiency + accuracy
- **Instance**: two over-claims I retracted myself — tajuk = `tujuanPermohonan` (wrong; it's a 4-CC construct → `tajukRisalat`), and "images never render in headers" (refuted by page-1 logos). Both came from inferring structure from the qa_doc/memory instead of opening the docx XML first.
- **Forward**: for any template/render claim, unzip + read the actual `word/*.xml` BEFORE asserting a CC/font/header fact. Largely covered by render-verify gate; the miss was stating structure before the render-verify. Discipline note, not a new hook.

## A4 — etanah issue-solving
- **Instance**: stale-WAR render class — branch carried #255170 + routing correct, yet a fresh `a_dok_keluaran 8512540` (12:18) rendered `CON_SRT_JT`. Root cause = deployed WAR predated the fix (push != deploy), not a code gap.
- **Forward**: bank the discriminator to melaka knowledge (proposal A4 logged): fresh-gen-old-template + branch-contains-fix => redeploy, don't re-trace code.

## A5 — sweep / file sweep
- SKIPPED — no multi-ticket sweep or file sweep run this session (single-quest resume + deploy).
