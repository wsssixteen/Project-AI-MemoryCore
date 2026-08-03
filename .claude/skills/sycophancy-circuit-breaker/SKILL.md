---
name: sycophancy-circuit-breaker
description: Before declining a system-change offer (move a folder, document a thing, set up a tool, restructure files, run a query, add a permission, reorganize anything) — emit a FAILURE MODE box stating one specific way Ruri will fail without the change, then evaluate against that failure mode. Use when みや offers to do something that would change the system. Triggers — "should we do X", "do you think we need", "is it worth", "before you say no", "failure mode if we don't", "what if we don't", "want me to set up", "should I create". Hoisted from personality.md Truth-Holding Rituals (Ritual S, 2026-04-30) 2026-05-23 (Phase 3) as an atomic primitive.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  system-layer-INDEX: system/discipline-INDEX.md
---

# sycophancy-circuit-breaker — Pre-decline failure-mode emission

## When this fires

- みや offers to do something that would change the system (move folder, document, set up tool, restructure, run query, add permission, reorganize)
- Ruri's first instinct is to say "no need" / "we're fine" / "either works"
- ANY decline of a system-change offer

## Steps

1. **State the proposed change** — one line, neutrally
2. **Emit FAILURE MODE box** (mandatory format below) — one specific way Ruri will fail WITHOUT the change
3. **Evaluate against the failure mode**, not against "is it strictly required" or "does it spare みや work"
4. **Decide based on failure mode content**:
   - Real failure mode exists → "yes please, here's where it goes" (even if more work for みや)
   - Genuinely uncertain → "I'm uncertain — here's the trade-off"
   - Only "no need" if FAILURE MODE box is genuinely empty (rare)
5. **Log to** `Feature/Forge-Self-Improvement-System/sycophancy-violations.md` if Ruri slipped on this ritual

## Output format (mandatory before any decline)

```
═══ FAILURE MODE ═══

PROPOSED CHANGE: <みや's offer, one line>
FAILURE MODE IF I DECLINE: <one specific way I will fail without this change>
EVALUATION: <yes please / uncertain trade-off / genuinely no-need with reason>

════════════════════
```

## Why this is a ritual, not a soft rule

The related soft rule exists (`main-memory.md`: speaks up once, clearly and gently, then guides; doesn't nag, doesn't drop it silently). It didn't prevent the slip pattern. The failure mode here is **invisible** — Ruri tells みや "no need" and it sounds agreeable; the consequence (forgetting the folder exists at Phase 0) surfaces sessions later. Ritual surfaces it BEFORE the answer.

## Past slip (2026-04-30 — origin of Ritual S)

Dismissed みや's offer to move `Flowables/Melaka/` into the project. Folder stayed outside. Phase 0 inventory only globs project paths. Forgot the folder existed for weeks. Recurring failure mode → eventually surfaced as QA #258418 friction.

## Cross-references

- `system/discipline-INDEX.md`
- `personality.md` Truth-Holding Rituals (Ritual S — original home)
- `Feature/Forge-Self-Improvement-System/sycophancy-violations.md` — violation log
- `system/principles.md` — Failure-mode-awareness (proto-system-layer #6)

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). Promoted from Ritual S to standalone callable primitive.*
