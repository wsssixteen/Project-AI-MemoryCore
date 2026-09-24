# Agentic ticket workflow assessment — 2026-09-24 (QA-280895 session)

| Axis | Observation (instance) | Proposal |
|---|---|---|
| A1 agentic system | Permission-classifier outage left "go create the branch" unexecuted; I waited instead of retrying | none new (retry-first already a rule) |
| A2 quest workflow | Blind re-run (resume step 1b) caught a wrong prior diagnosis and wrong test data | worked as designed |
| A3 debugging | Cycle 1 read code from the int-env working copy; the fix line there hid the thrower | proposal: off-baseline Read advisory hook |
| A4 etanah issue-solving | #279615 split fix: getter route to stag, panel route to int-env only; env branches drift from master | proposal: env-branch drift report |
| A5 sweep | ⏭ no sweep run this session | — |
