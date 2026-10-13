---
name: workflow-name-runs-stale-copy
description: "Workflow tool - `name:` runs the copy registered when the session began; after editing a workflow file in the session, launch it with `scriptPath`"
metadata:
  node_type: memory
  type: feedback
  originSessionId: be5b16b4-6a21-45ba-abb5-f619d46b57d4
  modified: 2026-10-10T20:50:25.970Z
---

Launching a saved workflow with `Workflow({ name: "<x>" })` runs the copy that was registered when the session started, not the file as it stands now. After any in-session edit of `.claude/workflows/<x>.js`, launch with `Workflow({ scriptPath: "<full path of the file>", args })`.

**Why:** 2026-10-11, Mizan repair run. I had just added a `repair` stage to `.claude/workflows/mizan.js` and launched by `name: "mizan"`. The run used the older copy: it logged the stage as unknown, skipped both repairs, and went on to the reader, the translator and the judges on the unrepaired record. I caught it from the part files (no `…-reply`/`…-counter` part appeared), stopped it, and relaunched by `scriptPath`. Cost: three agents' work for nothing. Proof at the time: the script the harness persisted for that run (`…\workflows\scripts\mizan-wf_8a2cb9d3-30b.js`) had no `const repairing`, while the file did.

**How to apply:** for any workflow file I touched in this session, always `scriptPath`. Right after launch, confirm the first agent's label is the stage I expect (the `*.meta.json` descriptions in the run's transcript folder) before leaving it to run. The persisted script path printed in the launch result shows which copy ran. My own inference, from one case: `name:` may be fine in a session that did not edit the file.
