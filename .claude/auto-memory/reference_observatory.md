---
name: reference-observatory
description: 🚨 First stop to diagnose the system or brief miya on what is wrong: `node lib/observatory.js --brief` (every finding as fact, evidence, context, judgement, action) + the Lapis Lazuli Observatory app (domain/observatory, port 7790)
metadata:
  type: reference
---

Built 2026-09-27 per miya's /goal: the Lapis Lazuli Observatory is the one place that holds every component's health plus the findings layer.

- **Diagnose / brief**: `node lib/observatory.js --brief` (≈4 s, worst first) · `--brief --full` · `--finding <id>` for one in full. Quote its Fact + Evidence when briefing miya; never re-derive by hand.
- **Record an investigation**: `node lib/observatory.js --judge <finding id | component:<id>> --judgement "..." --justification "..." [--context] [--action]` → `domain/observatory/judgements.jsonl`. A note goes STALE when that finding's evidence set changes.
- **App**: `node domain/observatory/server.js` → http://127.0.0.1:7790 (or the `observatory` entry in `.claude/launch.json`). Overview fits one screen; Findings tab = Fact · Context · Judgement.
- **Trust its counts over the older reports**: hook telemetry files overlap (146k repeated rows on 2026-09-27); the observatory de-duplicates, `lib/turn-report.js` / `lib/audit-briefing.js` / `lib/liveness-report.js` still sum files until fixed.
- Purpose pillar: a component with no declared goal is a gap, never healthy.

Related: [[feedback_observability_vs_monitoring]] · [[project_onedrive_worktrees]] · [[project-name-lapis-lazuli]].
