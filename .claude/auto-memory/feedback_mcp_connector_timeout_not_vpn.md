---
name: mcp-connector-timeout-not-vpn
description: "A postgres-mlk* MCP CONNECT_TIMEOUT means the connector failed to start at session boot, NOT a VPN/network problem — reconnect via fresh session or /mcp; on office wifi the DB is reachable"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 500be529-8d61-43c6-b3a3-39cd27f231ae
  modified: 2026-09-08T07:51:58.816Z
---

When a `postgres-mlkstg-pg` / `postgres-mlkstg1-pg` / `postgres-mlkprod-pg` MCP tool reports `CONNECT_TIMEOUT` (connection timed out after 30000ms) and the tool will not even load, that is the **MCP connector process failing to initialise at session boot** — it is NOT a VPN or network fault.

**Why:** 2026-09-08 (QA-278699) I repeatedly told miya the stg2 outage was a "VPN action on your host" and looped on it. He was on the office wifi and the DB was reachable; `postgres-mlit-pg` connected fine in the same session, proving DB capability was live and only the stg2/stg1 *connectors* were down. My "VPN" framing was wrong and wasted ~10 turns.

**How to apply:**
- On a `CONNECT_TIMEOUT`, say plainly: the connector didn't start at boot; fix = **restart it in a fresh session or `/mcp` reconnect** (mid-session it will not re-initialise). Never blame VPN/network unless a real network probe fails.
- Confirm scope with a live probe on a connector that IS up (e.g. `postgres-mlit-pg`) before declaring anything blocked — capability vs endpoint are different.
- If a task depends on the down endpoint but other work is doable, **pivot to the doable work immediately**; state the one blocker once, don't loop. See [[attempt-before-claiming-blocked]].
