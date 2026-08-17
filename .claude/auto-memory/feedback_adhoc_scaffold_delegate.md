---
name: feedback_adhoc_scaffold_delegate
description: "An adhoc that carries real investigation (a PTMLK permohonan-ID, \"check adhoc\", a live error) = scaffold it as a quest (Task folder + active.txt block) and DELEGATE the mechanical setup to a subagent; never inline-diagnose without scaffolding"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4b05b4f9-502c-4b50-9276-ddeda0b723dd
  modified: 2026-08-17T02:44:33.804Z
---

When an adhoc arrives that involves a real investigation — it names a `PTMLK/…` permohonan-ID, says "check adhoc", or shows a live error/screenshot — treat it as a first-class quest, not a throwaway question. Scaffold it: create the Task folder + an `active.txt` block (`ADHOC-<URUSAN>-YYYY-N`), and **delegate the mechanical folder/setup work to a subagent** while the main thread diagnoses.

**Why:** みや tracks adhocs as first-class work items on the board (existing: ADHOC-PPTPB-2026-1/-2, ADHOC-PRBB-2026-1, ADHOC-MLPS-2026-1). An un-scaffolded adhoc has no folder and no board presence, so it gets lost and there is nowhere to park the deliverable. He corrected this on the PPTPB Hantar-error adhoc (2026-08-17): I went straight to inline diagnosis with no Task folder and no delegation.

**How to apply:** on adhoc intake, invoke `/quest` (or delegate a general-purpose subagent) to create the Task folder + `active.txt` block BEFORE or in parallel with the diagnosis. Root gap: the quest `ticket-gate` force-injects on Redmine QA numbers but NOT on bare `PTMLK/…` permohonan-IDs or the word "adhoc" — so the trigger did not fire on its own. Related: [[feedback_agent_execute_in_quest]].
