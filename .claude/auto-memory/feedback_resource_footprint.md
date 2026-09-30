---
name: feedback_resource_footprint
description: "🚨 miya asks why the laptop is slow / what those node, python, console processes are / RAM → measure LIVE first (sessions, helpers per session, commit vs limit, db-gateway), trace every process to its parent, answer with numbers; monitoring must be MECHANICAL, never a UI; system-rules Rule 7"
metadata:
  type: feedback
---

When みや asks about laptop slowness, RAM, or "what are all these node / python / console processes", **measure live and trace before answering**: count open sessions, helper processes per session, commit charge vs commit limit (not RAM %), and `db_gateway.py status`, then name what started each process (parent tree). Never answer from memory, and never say a process "can't be traced". Every process is traceable by parent PID.

**Why**: 2026-09-22→29 incident. The laptop hung at 93-96% RAM (60 GB commit). Every session started all 21 database MCP servers, and 233 finished sessions were never archived. My first answers were vague ("orphans", "can't trace") and wrong until live parent-tree checks proved every process belonged to an open session. He had to screen-record Task Manager three times.

**How to apply**:
- The fix and its ops live in [[project_db_gateway]]. The research and audit are in `library-items/agent-architecture/agent-resource-footprint-2026.md`. The follow-ups are in `main/todo.md` Q1 "Resource footprint follow-ups".
- Any new component states its cost: system-rules **Rule 7** (`footprint:` line; shared + on-demand over per-session copies; per-prompt checks join a bundle). This is enforced by `core/forge.js --footprint` and `component-birth-gate`.
- Monitoring he accepts is MECHANICAL: it fires on its own and acts (notifies, restarts, lists archive-safe sessions). "Put it in the observatory" alone is the thing he rejected ("a beautiful UI but useless").
- Cleanup of sessions uses the 14-gate safety check (work in main, no unmerged branch, no uncommitted files, no stash, no open quest, not recent, not pinned or remote-control). The rule is archive, not delete.
- Remaining per-session cost after the gateway is codegraph + the pdf-viewer plugin (a claude.ai account plugin that only he can turn off) + ~60-70 hook node spawns per prompt.
