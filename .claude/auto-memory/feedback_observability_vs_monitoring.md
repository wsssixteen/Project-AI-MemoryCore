---
name: feedback_observability_vs_monitoring
description: "🚨 miya's two-layer vocabulary: OBSERVABILITY = liveness (did it fire/block/how long); MONITORING = context (why, which quest/phase, true-or-false block, turn cost, his reaction). Answer BOTH when he asks about 'observe & monitor'; monitoring = the turn-ledger design (plan §M), not built until 2026-09."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 635ba30c-d87e-4c8b-a6c3-ee14e70a512b
  modified: 2026-09-04T09:44:31.983Z
---

**The distinction (miya, 2026-09-04)**: when he says *"our observe & monitor feature"*, that is TWO layers:

| Layer | Question it answers | What exists |
|---|---|---|
| Observability | did component X fire · did it block · how long · is anything silent | `system/telemetry/hook-fires.jsonl` (75k rows) · `domain/*/log.jsonl` · `lib/liveness-report.js` · `lib/feature-census.js` — collecting fine |
| Monitoring | WHY did it block · on which quest/phase · was the block true or a false positive · what did the turn cost (tool calls, hook ms) · how did miya react (reask / correction / nod) | **never built** as a layer — `lib/watch.js` was used 6× on 2026-08-16 then abandoned; `reply-log.js` logs rhythm only. Design = `system/speed-optimization-plan-2026-09-04.md §M` (`turn-ledger`) |

**Why**: 2026-09-04 I answered "observability is collecting" and stopped; he replied *"You still haven't answered on the monitoring part. You only answered the observability part."* Slip `reask/buried-answer`. He expected a separate, related, context-gathering log beyond liveness.

**How to apply**: any status question about "observe & monitor" / "is it collecting data" gets two sections, one per layer, each with numbers. Never call the estate "observed" when only liveness is proven. When §M ships, the monitoring answer = `lib/turn-report.js` output (true_blocks yield, cost per phase, reask rate).

Related: [[feedback_verify_before_claim]] · [[feedback_no_on_the_fly_artifacts]] (the design refines existing writers, no new folder shapes) · plan file `system/speed-optimization-plan-2026-09-04.md`.
