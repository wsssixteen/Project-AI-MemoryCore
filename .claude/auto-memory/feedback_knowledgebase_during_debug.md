---
name: Knowledgebase enrichment during debugging
description: Every debug/scan session must produce knowledgebase entries; consider improvements to retrieval efficiency
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
Every debugging or first-time codebase scan session should produce knowledgebase entries as a side-effect — not just fix the bug.

**Why:** みや observed that tracing sessions produce valuable linkage knowledge (strategy patterns, tag mappings, table relationships) that would speed up future investigations. If we don't capture it, we re-derive the same chains next time.

**Canonical destination by entry shape** (2026-05-15 refinement, after QA-260302 NonUniqueResultException debug session):

| Entry shape | Destination file |
|---|---|
| Debug recipe (SYMPTOM → DIAGNOSTIC → ROOT-CAUSE) — e.g. exception classes, dirty data state, dispatch ambiguity | `projects/coding-projects/active/etanah-knowledge/melaka/BUG-BESTIARY.md` (canonical name; created 2026-04-14) |
| Deferred code issue (known bug, fix postponed) | `projects/coding-projects/active/etanah-knowledge/melaka/DEFERRED-CRITICAL-ISSUES.md` |
| Schema reference (table column, JPA mapping, prefix convention) | `projects/coding-projects/active/etanah-knowledge/melaka/DATABASE.md` |
| Package / Bean-type / Layer Map | `projects/coding-projects/active/etanah-knowledge/melaka/MODULE-ARCHITECTURE.md` |
| JSF composite wiring trap | `projects/coding-projects/active/etanah-knowledge/melaka/JSF-WIRING.md` |
| Domain vocabulary (urusan codes, tugasan kod patterns) | `projects/coding-projects/active/etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` |

Note: the word "bestiary" appears as a generic concept in other memory entries — same idea (categorical pattern collection). DEBUGGING-PLAYBOOK is the implementation for the debug-recipe slice.

**How to apply:**
- After completing any code trace, add a FLOW-TRACES entry with the full chain
- Update MODULE-ARCHITECTURE and DATABASE.md with any new patterns/tables discovered
- Flag to みや: "I found [X] during this trace — should we add it to knowledgebase?" (per feedback_knowledgebase_tiers)
- Consider retrieval improvements: linkages between classes, naming convention patterns, grep shortcuts that would help future sessions find relevant code faster
