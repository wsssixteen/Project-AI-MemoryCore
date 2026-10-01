# Agentic ticket workflow assessment — 2026-10-01 (worktree pelupusan-template-verify-fe1bef)

| Axis | Instance this session | Assessment | Proposal logged |
|---|---|---|---|
| A1 agentic system | 21 Sep template audit ended with a BA reply and no adhoc save; only transcript search recovered it | Saving is still model-remembered on the session where it matters most | Stop hook: DB queries + BA-reply block with no adhoc/QA id → block |
| A2 quest workflow | `notes.js --reset` wiped 2 of 3 test rows without warning | Destructive flag with silent effect | Refuse --reset when >1 entry unless --force |
| A3 debugging | Code (`MlkPelupusanPenyediaanSuratStrategy.java:44/62`) settled "ulangan" against memory in one read | Knowledge-first then code worked; no gap | A3 ⏭ nothing new |
| A4 etanah issue-solving | Live task state query gave BA logins at the right tugasan | Rule followed; no gap | A4 ⏭ nothing new |
| A5 sweep | adhoc-save writes from worktree cwd went to worktree paths | Skill steps assume main cwd | Main-checkout resolver for the skill steps |

## Second session — (all-day adhoc session, permit-c02 worktree)

| Axis | Assessment (concrete instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | `codemap-recon-consult` + OBJECTIVE LOCK injected ~1.5k lines of other quests' context on EVERY prompt of a pure adhoc session (16-19 open quests); 0 blocks, 515 s / 7 d. Noise, not guidance. | Scope both injections to the quest/adhoc in focus (match permohonan / ADHOC id in the prompt); eval: an adhoc-only prompt gets ≤1 lock block. |
| A2 quest workflow | adhoc save-set held up well: two adhocs, 4 audit rounds, every FAIL fixed in-turn; the new ProTime title + daily-session routing were added mid-day without breaking eval 15/15. | Add an "adhocs today" line to the DE step-2 template generated from active.txt `quest_start=<today> ticket_type=adhoc` (eval: DE recap lists both PRBB-2026-7/-8 without hand-typing). |
| A3 debugging efficiency + accuracy | ADHOC-PRBB-2026-8: "no SK" answered after a constants grep only; the code trace + `rjk_senarai_kumpulan` check came after 3 miya prompts. `verify-before-claim` now 3 in 7 d (escalation). | Mechanical defender: Stop hook blocks a negative existence claim about etanah data ("no SK / not in DB / tiada / doesn't exist") when the turn ran no DB query against the named table family. Eval: today's first SK reply → BLOCK; the reply after the senarai kumpulan SELECT → PASS. |
| A4 etanah issue-solving | PRBB Ganti Hari: one combined no-JOIN SELECT (scalar subqueries for fee name + resit) answered the BA in one screenshot; the duplicate-royalti mechanism (counter by ID hakmilik → new fee row) is now banked in SPOC-COUNTER §4b. | A reusable `fee-status` check SQL template keyed by permohonan id (any urusan), stored with the knowledge §4b; eval: run against PRBB/2026/4 returns the same 6 rows. |
| A5 sweep / file sweep | One side bug found by reading consumers (`== "2"`, LATENT L19); no sweep run. | Sweep for `getDynamicFieldAsString(...) == "` / `!= "` String identity compares across pelupusan + awam; eval: L19 line is among the hits. |

## Session 3 — QA-282587 junior guide (worktree quest-282587-guide)

| Axis | Failure class | Instance |
|---|---|---|
| A1 agentic | none used | no fan-out this session ⏭ |
| A2 quest | handover written before a full panel-switch sweep | Tangguh trio declared data-only; `VIEW_TGSN_FORMULA_PREMIUM_LIST` gap found only on "verify" (R2) |
| A2 quest | BA question drafted without reading the linked ticket | "which env was #261516 verified on" — journal said MLKSTG |
| A3 debugging | last_modified_date read as "never patched" | SPI_SS shows the 2024 date though Aaron's UPDATE ran; plain UPDATEs do not stamp it |
| A4 etanah | shared langkah across parent urusan | SBTM KP_PLPMT used by PSBS and MCL; one screen per row |
| A5 sweep | output overload | guide = 4 sections / 6 tables; BA note 4 trim rounds |
