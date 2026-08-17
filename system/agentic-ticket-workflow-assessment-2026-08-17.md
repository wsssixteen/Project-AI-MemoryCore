# Agentic / Ticket-Workflow Assessment — 2026-08-17 (Session 2, QA-274914)

> Improvement Sweep (DE Step 7.5). Five fixed axes; each claim carries its concrete instance.

## A1 — Agentic system
⏭ Mostly no fan-out this session (single-ticket, main-loop only). One data point: the BPMN multi-urusan sweep ran as inline PowerShell XML-parsing, not a subagent — correct call, the work-list was 4 files and a regex, cheaper inline than a fleet. No delegation waste.

## A2 — Quest workflow
**Finding — file-level instance-count OVER-REPORTS blast radius; per-instance flow-trace is the real check.** Instance: my first PPTPB multi-urusan scan counted every `MLK_TKL_ST` callActivity missing the `pembetulanPP` out-map and flagged PLTP (3), PRZ (4), BPRZ (8) as "same-class suspects." A proper per-instance trace (BFS 4 hops from each missing instance to any `pembetulanPP`-reading gateway) cleared ALL of them — only the instance feeding the gateway matters, and each urusan's operative instance already had the map. A file-level count would have sent us editing 3 innocent models. The blind re-derivation (resume rule 1b) is what forced the recheck.

**Worked well**: resume-rule-1b blind re-derivation confirmed the sweep doc's 95% without anchoring to it; live `act_hi_varinst` query settled child-vs-parent in one shot.

## A3 — Debugging efficiency + accuracy
Efficient: root cause re-confirmed with 1 BPMN read + 2 engine queries; zero build cycles (BPMN model change, no compile). No falsifier round-trips cost miya time. The fix's correctness for BOTH jenis was provable from the gateway conditions + the live KM/PLPP split before any deploy.

## A4 — Etanah issue-solving
**Knowledge gap worth banking**: the "callActivity in/out parameter propagation" as a Flowable bug-class — a value set inside a `MLK_TKL_*` child that a parent gateway reads must have a matching `<flowable:out>` on the parent callActivity, or the parent reads a stale value. Not currently in FLOWABLE-KNOWLEDGE.md. Deferred to a knowledge-write (not mid-quest per the distill-at-close rule; this quest is not closed, so it waits until close).

## A5 — Sweep / file-sweep
Relied on the 08-13 sweep's prior video reads (URL-bar screen identity) rather than re-extracting frames — acceptable since the fix layer (BPMN routing) didn't hinge on the video, and the URL identity was already banked. BA images C3/C4 re-read this session (task-history + Lot 167 charting) to confirm criteria coverage. No gap.

## Proposals logged (weekly-audit feed)
1. A2 — per-instance-flow-trace gate for "apply to all urusan" scope claims (eval: 274914 file-count over-flag).
2. A4 — bank BPMN callActivity in/out-param propagation bug-class to FLOWABLE-KNOWLEDGE.md at 274914 close (eval: next flowable routing bug checks out-param propagation first).
