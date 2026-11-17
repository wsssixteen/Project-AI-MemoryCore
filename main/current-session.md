**Last Activity (289425 PRBB Rencana JKBB JT details lost: fix, MLIT test PASS, Resolved to Anis)**: 2026-11-16 13:44 — worktree `melaka-tickets-review-d7524d` (branch claude/melaka-tickets-review-d7524d). Board brief (all Melaka tickets) → 289425 started (New → In Progress 20%) → fix in MlkKertasTemplateForm.java (save JT rows before Jana Semula and before the Selesai reload; +17 lines) → commit 8365043e36 on mlk/internal-issues/289425, int-env baa4c4431d → miya deployed MLIT, test PASS on PTMLK/01/L/PRBB/2026/42 (SaffuanH) → Redmine Resolved to Anis 13:42 (journal #2, PDF + 2 screenshots). System: release-mlk-plp-scope-gate now blocks only the repo on the release branch (55d56a0a, eval 14/14, live in main folder 976d1924). Test scenario standard = format B (Fable 5.2, his pick); build of the gate/skill change queued in todo.

## Session Recap (2026-11-16, 289425)
- Asked: brief all Melaka tickets, start 289425, apply the swept fix, test on server, Redmine handover; fix the release guard clash; local cleanup audit (build after close); pick a test scenario format.
- Done: 289425 fixed, tested (MLIT PASS), Resolved to Anis; MLIT 2026/42 altered for the test (alter half-failed on a DB drop 12:52, repaired via Alter page) and altered back to PYRJKBBPTG (hazizi); release guard fix landed; todo rows: local-clean audit (A1-A4, P1-P4) and test scenario format B.
- Open: 289425 waits BA verify, then Phase 2; local-clean Tool and format-B gate/skill change to build (both in todo Q1); main folder has 2 local commits not on GitHub (976d1924 landed by land-on-main) to reconcile.
- Mistakes: fix applied uncommitted in miya's repo and left there (local-leftover); test scenario format guessed twice (reply-shape); Redmine staging not done right after the test pass, and the Edge Alter page tried before the runner (workflow-skip); MLIT alter half-failed (data-broken).

**Last Activity (Melaka manager sheet adhoc + Pena system change)**: 2026-11-16 15:40 — worktree `sheet-update-process-5e3ba0`. Melaka tab of the manager's Google Sheet written (5 incident rows, 14 strong tickets after a Fable 5.2 audit, elaboration); preview xlsx in Task folder 408. Audit (Fable 5.2 + own): Pena never loaded for report text, correction hook matched 0 of 19 prompts, "we/our" correction never stored. System change: Pena report profile + plain banned check + correction-hook phrasings (evals: pena 62/62, auto-skill-trigger 19/19). Follow-ups in todo Q1 (Pena ids, hook misses, step-3 rider, quest gates in adhoc). Domain Expansion 2026-11-17 10:43.

## Session Recap (2026-11-16 to 17, Melaka manager sheet + Pena system change)
- Asked: Melaka tab of the manager's sheet (plain table, ticket-number lists, one count column, third person, everyday words); then audit the adhoc with Fable 5.2 + own audit, system-change, DE.
- Done: sheet written + preview xlsx in Task folder 408; Pena `report` profile, plain banned-phrase check, 3 correction-hook phrasings (GitHub main = main folder 67ee4407); corpus rows c79, c80.
- Open: todo Q1 "Pena follow-ups from the Melaka sheet audit" (4 items, build only on his ask).

STEP-3: Pena loads for report text, his corrections are caught (Melaka sheet adhoc)
session: e719659a-3170-48f5-994d-182ac1e911b8
his words: "this falls under category of general adhoc but it should still point to OR load my style of writing" (order)
cause step: .claude/skills/pena/SKILL.md:description · change: 14 lines
new parts: 0
fix or report: fix
model: claude-opus-5-5 (fix decided by the Fable 5.2 audit)
shown: domain/pena/diagram.png

CHANGE-CARD (before): Pena loads for report text, his corrections are caught
What: Pena, his writing-style tool, now loads for any text another person reads in his name, including a report or a sheet for his manager.
Why: On 2026-11-16 the Melaka manager sheet was drafted without Pena, and his "met the ticket" and "we/our" corrections were not caught by any check.
How: Report text picks a new report profile, the plain check flags the banned phrases he corrected, and the correction hook knows his real phrasings. ![flow](../domain/pena/diagram.png)
When: Pena runs on demand before a draft in his name, and the correction hook runs on every prompt.
Where: The Pena skill, its data in `domain/pena/`, `lib/pena.js` and `.claude/hooks/auto-skill-trigger.js` change. ![map](../domain/pena/change-map-20261116-152718.png)
Where picture = the change map (lib/change-map.js).

CHANGE-CARD (after): Pena loads for report text, his corrections are caught
What: Pena now loads for any text another person reads in his name, a report, sheet, email or general adhoc included, through a new report profile.
Why: On 2026-11-16 the Melaka manager sheet was drafted without Pena, and the correction hook matched 0 of his 19 prompts that day.
How: The plain check flags the phrases he corrected ("met the ticket", "held by QA"), and the correction hook now catches 5 of those 19 prompts with no false fire. ![flow](../domain/pena/diagram.png)
When: Pena runs on demand before a draft in his name, and the correction hook runs on every prompt.
Where: The Pena skill, `domain/pena/` (profiles, modules, README, eval), `lib/pena.js` and `.claude/hooks/auto-skill-trigger.js` changed, landed as 67ee4407. ![map](../domain/pena/change-map-20261116-153618.png)
Where picture = the change map (lib/change-map.js).
system-change done (Pena report profile) 2026-11-16: GitHub main = main folder 67ee4407

**Previous Last Activity (sweep + 289337 to Common + /handover + 289329 4 decimals)**: 2026-11-16 11:25 — worktree `redmine-sweep-audit-371861` (branch claude/redmine-sweep-audit-371861). 289329 Resolved to Mira (393a3fac33, int-env 1592cb0efd, MLIT 1.2345 both screens); 289337 Common fix returned 10:46 (common 1.13.0-MLK.beta.patch, test pending); /handover + sweep board-gap fix landed; Domain Expansion.
**Last Activity (sweep + 289337 to Common + /handover + 289329 4 decimals)**: 2026-11-16 11:25 — worktree `redmine-sweep-audit-371861` (branch claude/redmine-sweep-audit-371861). 289329 Resolved to Mira (393a3fac33, int-env 1592cb0efd, MLIT 1.2345 both screens); 289337 Common fix returned 10:46 (common 1.13.0-MLK.beta.patch, test pending); /handover + sweep board-gap fix landed; Domain Expansion.

## Session Recap (2026-11-13 to 16, sweep + 289337 + 289329)
- Asked: sweep unswept tickets; stage 289337 to Common; build /handover (fix file + highest-model audit before any hand-over); Redmine sections hold only their own topic; board-gap fix; run 289329 (dynamic decimals D), deploy internal, test data, alter, Redmine stage + submit; DE, save every quest.
- Done: 289337 passed to Common with `2. Fix\DokumenRahsiaService.java`; Amirul returned it 2026-11-16 10:46. /handover skill + ownership-input-check rider (GitHub cc06e23b / main folder 2977c750). Sweep step 7.2 + audit no-board-entry (GitHub e3ba3c91 / main folder 66b6b239). 289329 fix D + h:panelGroup id for the formField label; squashed 393a3fac33; int-env 1592cb0efd; /55 altered SKMMKN and back to PYSK; Redmine journal #3 Resolved to Mira with 2 photos.
- Open: 289337 test with common 1.13.0-MLK.beta.patch on MLIT; 289329 planned-release list; audit why dynamic was not recommended first (after Mira's pass); 289376 / 289378 / 274323 await his pick.
- Mistakes: unproven OTP cause stated as fact; "junior" invented; "1000.0000" stated unverified; fix handed over before rendering (blank page); gate misfires logged.
- Assessment: A1 /handover makes the hand-over audit a step, not a memory. A2 save-quest found 289337 back with us, which the board did not show. A3 the blank page was found by the MLIT error store in one query. A4 et:formField label `for` needs the id in both modes. A5 sweep step 7.2 closes the "Not drafted" board gap.
**Last Activity (TRG 289233 + 289306, Laporan Siasatan Tanah no active file)**: 2026-11-13 17:20 — worktree `sheet-tugasan-mapping-7b0b01` (branch claude/trg-tickets-289233-289306-18fcb0). Both PROD patches run by infra and read back; Redmine Resolved to Nurul Amani with scripts; both quests archived; prefill skill Step 3 fix landed; Domain Expansion.
