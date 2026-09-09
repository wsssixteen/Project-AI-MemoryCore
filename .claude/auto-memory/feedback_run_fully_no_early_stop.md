---
name: run-fully-no-early-stop
description: "🚨 \"run the quest fully / to Rubric / don't stop / find all root causes / 100%\" = drive EVERY issue to verified root cause+solution in one run; a multi-issue ticket is not a fork; never hand back for a scope decision before investigating"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 26264fba-e043-4e94-9512-fca00c33fe9b
  modified: 2026-09-09T13:07:37.263Z
---

When みや says **run the quest fully / until Rubric / don't stop / find ALL the root causes / 100% confidence** (or hands a multi-issue ticket with no explicit "stop after X"): pursue EVERY reported issue to a VERIFIED root cause + solution + confidence in ONE continuous run — DB + code + summoned agents — before any hand-back.

**Why:** QA-278930 (2026-09-09) — I reached Rubric on issue A then handed back three times asking "A / B / C — which scope?" instead of driving B and C to root cause. みや had to force continuation twice, furious ("who asked you to stop"). Wasted his time.

**How to apply:**
- A multi-issue ticket is NOT a fork. Investigate all; the objective-lock rule forbids DROPPING an issue, never investigating it. Present scope as a finding AFTER the full dig, never as a gate before it.
- A tool-answerable question (DB query / grep / code read / agent) is DONE, never asked (Disposition Rule 3, no-asking-back).
- Valid stop points ONLY: destructive op · external info only みや has · a manual UI step I cannot perform (local build/deploy, BA input). A connector being down is NOT a stop — retry / pivot to code-tractable parts and finish them.
- Summon familiars/agents to parallelize independent issues.

Enforced by the quest skill rule "RUN-FULLY MEANS RUN FULLY" (`.claude/skills/quest/SKILL.md`) + slip `quest-early-stop`. Related: [[attempt-before-claiming-blocked]] · [[agent-execute-in-quest]] · [[status-ask-ultra-concise]].
