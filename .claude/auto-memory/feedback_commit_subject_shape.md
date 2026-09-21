---
name: feedback_commit_subject_shape
description: "🚨 etanah commit subject = what CHANGED only, verbs from staged status letters (A add, D remove, R rename), no \";\" no dash inside description, ≤100 chars, never a non-change word (keep/leave/untouched), a redraft is SHORTER never longer; miya's exemplar \"Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk\""
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 79150d3c-ec21-4039-a81a-4d9884aa986f
  modified: 2026-09-02T09:24:59.945Z
---

An etanah commit subject describes the staged diff and nothing else. Verbs map to the status letters: A → add, D → remove, R → rename (never "move"), M → fix or change. Files that were not touched are not in the diff, so words like keep, leave, untouched, unchanged, retain, remain, still are banned. No `;`, no dash inside the description, no arrows, at most 100 characters, clauses joined with `,` or `and` or `&`. When miya asks for better words the rewrite gets shorter, never longer.


**🚨 NO internal code-symbol jargon in the subject (2026-09-21, #280029).** Banned: method/class/variable identifiers (rPrOrSdtPrFallback, populateTarafMilikHakmilik), framework/library internals (docx4j rPr, sdtPr, RPr), camelCase code names. Say what changed in plain technical English / domain terms a reader who never saw the code understands - e.g. "filled fields now use the template font instead of the default", NOT "rPrOrSdtPrFallback restores CC sdtPr font/size". miya, angry: not using word's rPrOrSdtPrFallback / sdtwhatever, use simple technical english. Same spirit as domain-term naming - describe behaviour/effect, not the implementation symbol.
**Why:** 2026-09-02, QA-277697. Five drafts of one subject, each longer than the last, carrying `;`, dashes and "keep 3 trg pages" (a non-change), until miya wrote it himself: `Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk`. miya: *"the 'keep' word doesn't explain you renamed something"*, *"why is your sentence getting longer"*, *"not ';' or dashes, like I said"*.

**How to apply:** before showing a subject, read `git diff --cached --name-status`, pick one verb per status letter present, write one line under 100 chars, run it against the six rules in `.claude/commit-conventions.md` §Subject shape. Enforced by `domain/commit-subject-gate/` at draft time and `.claude/hooks/commit-gate.js` Check 0 at commit time. Related: [[feedback_shortest_alternative_default]] · [[feedback_redmine_rootcause_format]] · [[feedback_ticket_writing_style]].
