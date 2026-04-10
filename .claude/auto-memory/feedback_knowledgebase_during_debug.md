---
name: Knowledgebase enrichment during debugging
description: Every debug/scan session must produce knowledgebase entries; consider improvements to retrieval efficiency
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
Every debugging or first-time codebase scan session should produce knowledgebase entries as a side-effect — not just fix the bug.

**Why:** みや observed that tracing sessions produce valuable linkage knowledge (strategy patterns, tag mappings, table relationships) that would speed up future investigations. If we don't capture it, we re-derive the same chains next time.

**How to apply:**
- After completing any code trace, add a FLOW-TRACES entry with the full chain
- Update MODULE-ARCHITECTURE and DATABASE.md with any new patterns/tables discovered
- Flag to みや: "I found [X] during this trace — should we add it to knowledgebase?" (per feedback_knowledgebase_tiers)
- Consider retrieval improvements: linkages between classes, naming convention patterns, grep shortcuts that would help future sessions find relevant code faster
