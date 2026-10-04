---
name: feedback_adhoc_scaffold_delegate
description: "scaffold as a quest, full workflow; pin ENV from URL host first; triage via ADHOC-TRIAGE.md; reread once it has a Redmine number"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4b05b4f9-502c-4b50-9276-ddeda0b723dd
  modified: 2026-08-17T02:44:33.804Z
---

When an adhoc arrives that involves a real investigation — it names a `PTMLK/…` permohonan-ID, says "check adhoc", or shows a live error/screenshot — treat it as a first-class quest, not a throwaway question. Scaffold it: create the Task folder + an `active.txt` block (`ADHOC-<URUSAN>-YYYY-N`), and **delegate the mechanical folder/setup work to a subagent** while the main thread diagnoses.

**Why:** みや tracks adhocs as first-class work items on the board (existing: ADHOC-PPTPB-2026-1/-2, ADHOC-PRBB-2026-1, ADHOC-MLPS-2026-1). An un-scaffolded adhoc has no folder and no board presence, so it gets lost and there is nowhere to park the deliverable. He corrected this on the PPTPB Hantar-error adhoc (2026-08-17): I went straight to inline diagnosis with no Task folder and no delegation.

**Every save round (2026-09-25, みや):** invoke the `adhoc-save` skill → write/update all 4 save-set parts → `node lib/adhoc-save-audit.js <ADHOC-ID>` → fix every FAIL (and the tool that caused it) → re-run until green, in the same turn. AWAM relays anchor on hakmilik id / No Resit, not a PTMLK id.

**How to apply:** on adhoc intake, invoke `/quest` (or delegate a general-purpose subagent) to create the Task folder + `active.txt` block BEFORE or in parallel with the diagnosis. Root gap: the quest `ticket-gate` force-injects on Redmine QA numbers but NOT on bare `PTMLK/…` permohonan-IDs or the word "adhoc" — so the trigger did not fire on its own. Related: [[feedback_do_dont_ask_answer_literal]].

---

## Merged 2026-10-04: feedback_adhoc_note_env_first (was feedback_adhoc_note_env_first.md)

> At adhoc START, FIRST determine + NOTE the ENV from the error-page URL host (etanah-app=PROD vs etanah-appstg/etanah-stg=staging); a release-branch/version line does NOT identify env; verify the permohonan on THAT env's DB and flag PROD loudly

🚨 **The FIRST thing at any adhoc intake = pin the ENVIRONMENT, and NOTE it explicitly.** Do not diagnose data until the env is fixed.

**How to read the env (in priority order):**
0. **Office-identifier signal (2026-08-27, per みや)**: the relay carries a real-office identifier — a `PDT*` fail/ref number (PDTJ / PDTMT / PDTAG — Pejabat Daerah dan Tanah), `PTG*`, an `NNNNNNPMNNNNNNNN` fail number, or a real officer @melaka.gov.my login — ⇒ a REAL user is asking ⇒ **default env = PROD; query PROD FIRST**, other envs only as comparison.
1. Error-page **URL host** / `Application:` line — this is ground truth:
   - `etanah-app.melaka.gov.my` → **PROD**
   - `etanah-appstg` / `etanah-stg` → **STAGING** (see [[feedback_awam_test_scenario_entry_key]])
   - `mlit.melaka.gov.my` → **mlit**
2. **Git Branch / Domain / Module version alone does NOT identify env** — PROD can run a `mlk/release/x.y.z` build. Never infer "staging" from a `release/` branch line.
3. Then verify the permohonan on **that env's DB** (`mcp__postgres-mlkprod-pg` = PROD `et_main`; stg2/stg1/mlit for the rest).

**If PROD — flag it loudly in the notes + active block (`env=PROD`) and remember:**
- Any data patch → **infra handoff**, never a direct write ([[feedback_prod_patch_infra_handoff]], [[feedback_readable_safe_script]]).
- The code fix ships via **release**, not a direct edit.
- Read-only SELECTs on PROD are fine for diagnosis.

**Why (2026-08-27, PRBB Borang 4Ce NPE, `PTMLK/02/L/PRBB/2026/12`)**: the error page said `Git Branch: mlk/release/1.4.0`, so I labelled it staging and verified on stg1/stg2. みや corrected: it was **PROD** (host `etanah-app.melaka.gov.my`, apl 3440281). The mechanism (kuantitiDisyor null → NPE) was right, but a wrong env label wastes verification and hides the correct patch path (PROD = infra handoff). One glance at the URL host would have pinned it. Pairs with [[Knowledgebase enrichment during debugging]].

enforcement: hook-pending: adhoc-paste-detector env-pin row (P3)

## 🚨 ADDED 2026-09-03 (miya: "next time use your logic properly") — NO URL? INFER ENV FROM WHO + PHASE, NEVER DEFAULT TO PROD
Baseline 1.4.1 night: BA messaged miya at 22:00 "there was an issue" with no detail. I went to PROD first (PROD columns, PROD capaian, PROD permits) and only later checked staging. **BAQA during a baseline tests on STAGING** — that is the env by definition; PROD had not even been released at 22:00 (Fatin's "Released in PROD" journal = 02:16). Rule: when a report carries no URL/footer, pin the env from the REPORTER + PHASE table below BEFORE any query, and say the inference out loud in the first line:
| Reporter / phase | Env |
|---|---|
| BAQA (Mira/Fizah/Anis) during baseline | staging (et_main_stg2) |
| BA "please test in internal" / Verified MLIT | MLIT |
| PDT/PTG officer via BA relay, or "Ready in PROD, please verify with user" | PROD |
Then check that env's DB + the ticket journals in the SAME window (what changed between the last pass and the report time). Slip: `env-inference/default-to-prod` 2026-09-03.

---

## Merged 2026-10-04: feedback_adhoc_to_ticket_reread (was feedback_adhoc_to_ticket_reread.md)

> 🚨 A chat-paste adhoc is NOT the ticket — the moment it has a Redmine number, redmine-sync + READ the full official 0. Brief (Description + every History journal line + every attachment) before treating it done; the BA's real ask often lives in the journal, not the paste

🚨 A BA chat paste is the SYMPTOM, not the ticket. The moment an adhoc gets (or is found to have) a Redmine number, **STOP and pull the official ticket**: `node quest/redmine-sync.js <n> --create`, then READ, in the official Task folder's `0. Brief/`:
1. `Description.txt` — the raised issue.
2. `History.txt` — **EVERY journal line**. The BA's actual question is frequently a later journal note, NOT the initial paste (the paste only carries the error page).
3. **EVERY attachment** — screenshots (open the image · multi-dim-evidence), videos (extract frames · watch-video-url-first), PDFs (annotations skill). One line per file.

**Why (2026-09-07, #278580, per みや)**: PT `PTMLK/02/L/PT/2026/3` came as a chat paste of the NonUnique error page. I built the adhoc from the paste, fixed the crash (3 duplicate Minit Bebas docs), and archived it. But the official ticket #278580 folder (created later) carried a History journal line from the BA (Nurhafizah): *"kenapa id pergi ke Penyediaan Surat Tangguh? Supposed selepas Pengesahan Minit Bebas ke Penyediaan Surat Tolak"* + *"Related #274510"* — the REAL question, plus a screenshot and a WhatsApp video, all unread. I even retrieved the ticket number via redmine-sync and confirmed it, but never read the Brief. The crash was only half the ticket.

**How to apply**: adhoc→ticketed is a hard checkpoint. Before declaring ANY ticketed adhoc resolved, emit a Brief-read ledger: `Description ✓ · History N journals ✓ · <each attachment> ✓`. A ticket is done only when EVERY BA-stated ask (paste AND journal) is answered — [[feedback_show_evidence_script_or_code]], objective-lock anchor #1 (BA words are ground truth). Pairs with [[Knowledgebase enrichment during debugging]] + the annotations/multi-dim-evidence gates.

**Related**: when the permohonan has been Alter-ed, routing/populated data may be stale — see FLOWABLE-KNOWLEDGE.md §Altered-permohonan-staleness.

---

## Merged 2026-10-04: adhoc-full-quest (was feedback_adhoc_full_quest.md)

> 🚨 An adhoc with real investigation gets the FULL quest workflow (Scout→Recon→Rubric, verified emits) — never a quick guess, never a root cause past verified evidence

🚨 Any adhoc that needs real investigation (code trace / DB / reproduction) runs the **full quest workflow** — invoke `/quest`, run Scout → Recon → Rubric with the forced structured emits, and verify EVERY claim before stating it.

**Why**: 2026-09-14, the OMLPS "tujuan permohonan tak keluar pilihan" adhoc — I gave THREE root-cause claims in a row without running the quest discipline, and each was refuted by みや's next screenshot:
1. "migration didn't carry the data" → refuted (registry `ind_mklmt_tnh_permit_lesen` had it all).
2. "key PDTJ.600-2/9/79 instead" → refuted (live test threw two errors).
3. "key 2027" → tujuan dropdowns STILL empty (the real bug survived every guess).
みや: *"run full /quest ... so that you do not give bullshit and lying"*. The premature guesses wasted his time and burned trust; the quest loop (adversarial Recon + verify-before-claim) exists precisely to stop this.

**How to apply**:
- Adhoc with a reproducible symptom + any code/DB dig → treat it like a ticket: `/quest start` (or run the Scout→Recon→Rubric emits by hand if no ticket number).
- NEVER declare a root cause past VERIFIED evidence (a DB row I read, a code line I read, a screenshot みや confirmed). Mid-investigation ≠ done.
- A live test that contradicts my claim is GROUND TRUTH — re-anchor to it immediately, do not defend the prior claim.
- Elimination is a legitimate output: "not data / not X / narrowed to a runtime fact needing a probe" beats a confident wrong root cause.

Related: [[do-dont-ask-answer-literal]] · [[verify-before-claim]] · [[show-evidence-script-or-code]]

---

## Merged 2026-10-04: reference_adhoc_triage_and_id_pengenalan (was reference_adhoc_triage_and_id_pengenalan.md)

> Adhoc/BA-relay intake → classify via ADHOC-TRIAGE.md first; BA-quoted permohonan ref (PTMLK/../) resolves to aplikasi_id via umm_aplikasi.id_pengenalan

Two intake facts, born from the 2026-08-26 PDTJ jabatan-teknikal adhoc (a simple DATA-QUESTION mishandled as a code trace):

1. **Classify before touching** — every adhoc/BA-relay ask goes through `projects/coding-projects/active/etanah-knowledge/melaka/ADHOC-TRIAGE.md` FIRST: DATA-QUESTION / DATA-PATCH / DIAGNOSIS / CODE-CHECK / FLOW-RECOVERY / ENV-VERSION / CAPABILITY / ACCESS / TEST-DATA / DEPLOY-VERIFY / TEMPLATE — each with a FIRST action + tool order. A relay can carry several asks; triage EACH. Auto-injected by `domain/adhoc-paste-detector` (widened 2026-08-26 to fire on freeform office-code/permohonan-id relays, not only labelled fields).

2. **BA reference → aplikasi_id** — the `PTMLK/02/L/PT/2026/1` string a BA quotes lives in **`umm_aplikasi.id_pengenalan`** (one query: `WHERE id_pengenalan = '<ref>'`). NOT `umm_p_aplikasi.no_rujukan_permohonan` (empty for PT — carries only stray KPM/KPG rows) and NOT the applicant IC. Recipe + trap table now in DATABASE.md §4.1. Before concluding a ref "doesn't exist on this env", test the column against a KNOWN-positive app.

Pairs with [[Verify before claiming during code tracing]] (data question → DB-first) and [[feedback_readable_safe_script]] (I run the SELECT).
