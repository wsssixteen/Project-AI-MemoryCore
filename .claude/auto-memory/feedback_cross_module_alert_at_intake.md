---
name: feedback_cross_module_alert_at_intake
description: "🚨 At ticket RETRIEVAL and Phase 0, scan Description+History for CROSS-MODULE (etanah-common / other-team) + PRIORITY signals and flag them LOUDLY as the FIRST line of the quest MD; never conclude module ownership before confirming the screen's actual repo"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-12T14:49:38.095Z
---

🚨 **The moment a ticket is retrieved / read / a quest MD is started, SCAN the Description + History for two things and surface them LOUDER than anything else — before any investigation.**

**1. CROSS-MODULE signal → 🚨 flag + investigate ownership FIRST.** If ANY of these appear, the ticket may not be ours to fix — the fastest win is handing it to the owning team, so surface it at intake, not after days of pelupusan tracing:
- BA phrases: *"our issue or Common"*, *"issue from Common"*, *"pass this tic / pass to <team>"*, *"not our domain"*, *"boleh pass"*, *"Common issue"*, any "which module / whose" question.
- Shape signals: a **utiliti** screen (sidebar maintenance tools are frequently **etanah-common** `protected/<area>/Utiliti*Form`), a shared screen name (Kemaskini Ulasan, JPPH, common dialogs), module-ambiguous urusan.
- **Rule**: when a cross-module signal fires, the FIRST thing to confirm is **which repo owns the screen** — locate the `.xhtml` (Glob across etanah-pelupusan / etanah-common / etanah-awam; a `target/…/overlays/etanah-common-*.war/` hit = common) BEFORE deep-tracing any one module. **Banned**: writing "ownable-<module>" in the quest MD before the screen's repo is confirmed by file location.

**2. PRIORITY signal → flag at the top.** "PROD" / "urgent" / "segera" / "ASAP" / near due-date / "priority" → mark it in the ticket list + quest MD so the important one isn't buried.

**Emit shape**: the quest MD's FIRST line (and the ticket-list row) carries `🚨 CROSS-MODULE? <signal quoted>` and/or `⏫ PRIORITY <reason>` — or an explicit `module: <confirmed-repo> · priority: normal` when the scan is clean. Silence is banned; an explicit "clean" is the only valid empty.

**Why** (QA-274318, cost days): the BA note said verbatim *"Please help to check first if this is our issue or Common issue, if this is issue from Common, can pass this tic to them."* I ignored the signal, wrote "ownable-pelupusan" in the quest MD, and traced three pelupusan forms before discovering the real screen (`UtilitiKemaskiniUlasanJPPHForm`) is **etanah-common**. We handed to COMMON far too late. Distinct from the Scout-time BPMN module-scope check (pelupusan vs teknikal) and from [[feedback_cross_module_handoff_artifact]] (the handoff deliverable) — this is the INTAKE-time detection that must fire before either. Deterministic upgrade (a `ticket-gate.js` keyword scan) proposed for the weekly audit.
