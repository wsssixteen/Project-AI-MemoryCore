---
name: no-on-the-fly-artifacts
description: "🚨 BANNED — creating new files/folders in MemoryCore outside a component's DESIGNED home without みや's nod; on-the-fly artifact shapes bloat the project"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b7adab82-50d9-4567-bef6-aa285ea8b892
  modified: 2026-08-16T10:58:58.306Z
---

🚨 Every artifact I create in Project-AI-MemoryCore must land in a home the system already DESIGNED for it (qa_doc, log.jsonl, knowledge file, todo, diary, current-session). Inventing a new folder/file shape mid-task ("runs/", "-findings", "bundles of results", per-topic parking files) is BANNED without みや's explicit nod — even when the content is good.

**Why:** 2026-08-16 — bulk-bounty run created `domain/quest-bounty/runs/2026-08-16-bulk.md` on the fly; the designed shape was per-quest bounty via close-phase → qa_doc + log.jsonl. みや: "did you create it on the fly or is it part of a deterministic hardly shaped system? … This type of things starts bloating the project folder." (frustrated) Same family as the Task-folder rule (#239386, 13-file bloat) — this extends it to MY OWN repo.

2026-10-28 — a rule that itself prescribes a dated file is the same slip in a protocol: DE step 7.5 said "append to `system/agentic-ticket-workflow-assessment-<date>.md`" and 62 such files grew in 12 weeks, 3 clobbered by a second session the same day, read by nothing. みや: "Would you find a single note file inside Windows Systems folder? No, right?" `system/` = constitution + ledgers only; `system-edit-gate` v1.4 now denies a Write that would create a file there.

**How to apply:** (1) Before any Write to a NEW path: does a designed home exist? Use it. (2) No designed home → that IS a design decision → ask or route through system-design, never improvise. (3) Bulk operations write to the same per-item homes the single operation uses — bulk ≠ new artifact shape. (4) A per-run or dated note never lands under `system/`: session finding → recap or diary · forward idea → `core/slips.js add --type proposal` · a part's finding → that part's own doc. Links: [[Tasks folder file format]], [[feedback_inventory_first]].
