---
name: etanah-deploy-console
description: "🚨 Melaka e-Tanah web Deployment Console (172.16.90.169/etanah-deployment) — the browser-driven deploy Ruri can drive herself (alternative to the ssh mlit script); pick State→Application→Environment, branch auto-fills, then Deploy Selected Target"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 9f282c25-7613-4791-9d04-017491d9e4e6
  modified: 2026-09-09T17:00:20.192Z
---

**e-Tanah Deployment Console** — `http://172.16.90.169/etanah-deployment/` (HTTP, "Not secure" is expected on the internal LAN).

Browser-driven deploy UI (shown to Ruri 2026-09-10 by みや) — the deploy method Ruri CAN drive herself via the Chrome/Browser tools, as an alternative to the `ssh app@172.16.100.162` mlit script Ruri has no key for. **Shared console — active deployments are visible to everyone using it.**

**Flow (top of page: State · Application · Environment · Active Runs status cards)**:
1. **Your Name** — free text (put `Ridhwan`); labels the run in Active Deployments.
2. **1. Select Target** — cascading selects, each unlocks the next: **State** → **Application** (loads after state) → **Environment** (depends on application).
3. **2. Verify Branch** — **Branch** auto-fills from deploy config after Environment (e.g. `wp/int-env` for WP; Melaka would be `mlk/int-env`). Toggle **Deploy existing artifact** = ON to skip Git checkout+build and deploy the WAR already in the workspace; OFF (default) = Build then deploy.
4. **3. Review and Deploy** — review card (Operator/State/Application/Environment/Branch/Mode) → **Deploy Selected Target** button opens a confirm dialog.
5. Watch **Deployment Progress** (phase-by-phase) + **Deployment Logs** (Auto-scroll / Export) panels on the right.

**For a deploy-with-proof handback (みや's ask 2026-09-10)**: after the fix is confirmed + committed to branch + merged to `mlk/int-env`, drive this console (Melaka state → the pelupusan app → int-env), screenshot DURING (progress running) and AFTER (success), share both. Header tabs: Deployment Console · Deployment Freeze · History · Config · Maintenance.

Related: [[melaka-env-deploy-paths]] · [[baseline-release-servers]] · [[ba-test-deploy-int-env]].
