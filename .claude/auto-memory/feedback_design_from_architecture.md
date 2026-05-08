---
name: Design rules from system architecture, not from last slip
description: Recurring design failure pattern — retrofitting rituals to last failure makes them brittle and overfit; design from layer matrix instead
type: feedback
originSessionId: 901afbc5-32f7-4e54-80fd-cf27bb8cc7da
---
When designing a new rule/ritual/protocol — especially Phase 0 / debugging / quality rituals — DO NOT design reactively from the latest slip. That produces brittle rituals overfit to one ticket shape that become dead weight on others.

**Why:** みや 2026-05-08 (after QA-260154 ritual scrutinize): "Why do you always design poorly and not take into account those things when I was literally talking about build something for this project? We've already done so many tickets and create many things and you kept making poor designs." Concrete example: the original 8-step Phase 0 ritual (baked 2026-05-07) included "Composite/XHTML wiring read" + "Ralat-message + scope match" as universal steps — both layer-specific (only fit JSF UI tickets with validator+ralat shape). Would have force-fit JSF reads on .docx tickets (#259318, #259759), force-fit ralat-match on Flowable bugs (#259534) and config bugs (#258022). Recurring pattern across multiple system-design attempts.

**How to apply:**
- **Design from system architecture first.** For etanah work, the canonical decomposition is the framework-layer matrix: Java validators/services, JSF XHTML/composite/PrimeFaces, Java config (Template Method overrides), .docx + Word CC, config.json (tindakan/template/flowable), SQL/Hibernate entities, Spring DI, Flowable BPMN. New rules sit on top of this matrix.
- **Pressure-test new rules against ≥3 past tickets BEFORE baking.** Mentally walk through the rule against past closed tickets across different layers. If the rule helps <50% of them, it's Tier 2 (layer-specific extension), not Tier 1 (universal core).
- **State explicitly which past tickets the rule would have helped vs hurt.** Forces evidence-based design instead of plausible-sounding-but-overfit additions.
- **2-tier shape is the default.** Universal core (always applies) + per-layer extensions (apply only when that layer is involved). Skipping a layer extension is EXPLICIT (with one-line reason), not silent.
- **Avoid additive piles.** Each new rule should either (a) extend an existing universal core, (b) add a new layer to the per-layer matrix, or (c) replace an old rule that's been superseded — NOT just stack onto a growing checklist.

**Past tickets to test against** (representative spread across layers):
- QA-258022 (config + Spring service)
- QA-258418 (XHTML composite + Java config flag)
- QA-259318 (.docx + Java populator + Word CC)
- QA-259534 (Flowable BPMN + SQL/Hibernate)
- QA-259759 (.docx + new populator + JSON store)

If a new rule doesn't help at least 3 of these (across different layers), it doesn't belong in the universal core.
