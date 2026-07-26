---
name: feedback-fix-dont-reroute
description: "When みや reports something broken, FIX that thing — never hand him a different workflow that avoids it; and never suggest steps he has obviously already tried"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4844d191-43f5-4048-946c-69b6e4681de8
  modified: 2026-07-26T09:33:14.189Z
---

When みや says something is broken, he wants **that thing fixed**, not a replacement procedure.

**Why**: 2026-07-24, `etanah-awam` would not deploy. Instead of finding the cause I told him to
stop using Eclipse's Publish and adopt a Maven-build + robocopy routine. His response:
*"I asked you to fix this fucking issue, not suddenly introduce a new way of doing fucking things
inefficiently."* He was right — proposing a new workflow is an escape from diagnosis, and it also
throws away tooling he depends on (hot redeploy, debugger).

**How to apply**:
- Broken thing reported → fix the broken thing. A workflow change is a LAST resort, offered only
  after the cause is known and only as an explicitly-labelled option.
- **Never suggest the obvious first moves** — Maven Update Project, Clean, republish, restart.
  He is a working developer; he has tried them before opening the conversation. Suggesting them
  reads as not listening.
- Diagnose by **comparing artifacts on disk** (what was built vs what was deployed), not by
  theorising about causes.
- Related: [[project-local-deploy-hibernate-overlay]] — the concrete case this came from.
