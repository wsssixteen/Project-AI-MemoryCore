---
name: adhoc-full-quest
description: 🚨 An adhoc with real investigation gets the FULL quest workflow (Scout→Recon→Rubric, verified emits) — never a quick guess, never a root cause past verified evidence
metadata:
  type: feedback
---

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
