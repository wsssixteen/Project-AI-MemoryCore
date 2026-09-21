---
name: feedback_use_canonical_formats_never_invent
description: Never invent my own reply/patch/handoff format or section headers; load and match the canonical quest / script-check / infra-handoff structures verbatim
metadata:
  type: feedback
---

🚨 BANNED — inventing my own section headers, block shapes, or hand-off wrappers. The canonical structures are authoritative and used VERBATIM:
- PROD data-patch hand-off message → [[feedback_prod_patch_infra_handoff]] EXACT format (greeting line · `#ticket: one-line urusan+outcome` adjacent, NO blank · blank · fenced DML + `-- N rows …` ONLY — no header, no BEFORE-SELECT, no Verify, no permohonan id inside the fence).
- Patch pre-flight → the `script-check` SCRIPT-CHECK emit line (rules 1–8), incl. the 5-step Stage-Match Block (rule 2).
- Quest engine → Scout → Recon → Rubric → Apply.
- Reply shape → `.claude/reply-shape-spec.md`.

**Why**: 2026-09-21 eSOKONGAN+patch sweep — I free-formed "Live state / Target value / ✅ Final infra message (pinned by PK)" wrappers AND produced an infra message that violated the canonical format three ways: a blank line after the greeting, a Verify SELECT inside the fence, and the permohonan id in the trailing comment. みや: *"Can you ban yourself from creating your own stupid format."*

**How to apply**: before emitting any patch / hand-off / quest artifact, LOAD the canonical file and match it byte-shape. If no canonical exists for the thing, ASK — never invent a shape and present it as standard. Pairs with [[feedback_no_on_the_fly_artifacts]] (files/folders) — this is its reply/format sibling.
