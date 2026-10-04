---
name: no-new-destructive-call-without-analog
description: 🚨 a fix never adds a delete / remove / cleanup call the system does not already make in that situation; prove the analog first, and never offer an option I already know is wrong
metadata:
  type: feedback
---

A fix must not introduce a NEW destructive or side-effect call (delete a file, delete a row in another module, clean up, purge) unless the system already does that same thing in the same situation.

Before writing such a line, two checks, both shown:
1. **Who else calls it**: grep the callers of that exact method across the module. Zero or one caller = the system does not work that way.
2. **What the data shows today**: query whether the system already leaves such things behind (unreferenced files, old rows). If it does, leaving them IS the convention; do not "tidy".

If both say the system does not do it: do not add the call. Mention the leftover in the hand-back as a fact, not as a job.

And: **once the evidence shows an option is wrong, it is not offered again.** State the one right action and do it. A "keep it / remove it" pair after I already know the answer reads as not knowing, or as hiding the mistake.

**Why:** #244600. My fix (2026-10-02, commit `d61fc2e611`) removed a discarded Word draft row and ALSO called `DocumentManagementSystemClient.delete()` on its file. I never checked whether Pelupusan deletes store files at all. It does not: the same Risalat had 3 unreferenced files from normal page-load saves, and only one other place in the module calls that delete. On internal the call failed 3 of 3 (NullPointerException inside etanah-dms). Two audits reviewed the delete's ORDER and error handling; none asked whether it should exist. After the data showed all this I still gave miya "keep the delete and raise it with the DMS owner" as an option. His words: "Why are you trying to delete it in the first place", "you're still suggesting to keep the delete when you know you're wrong. Either you're wrong or you don't know how to explain it."

**How to apply:** this is the working-analog rule ([[simplify-and-reference]]) applied to side effects, the place where it matters most. In the Rubric, every new call that changes or removes something outside the row being fixed gets a line: `ANALOG: <existing caller file:line> · DATA: <what the system leaves today>`. No analog, no call. Related: [[verify-before-claim]] · [[logger-three-layers]]
