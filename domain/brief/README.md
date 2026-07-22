# brief (skill-only Feature)

**Contract:** when みや is about to START a work item, emit a 6-block orientation brief — bottom line · where-he-sees-it table · story diagram with full addresses · fix table (one row per site in the bug CLASS) · what-could-bite bullets with a confidence % · first move. Story diagrams, tables, and short-sentence bullets only.

| Piece | File | Role |
|---|---|---|
| Skill | `.claude/skills/brief/SKILL.md` | THE PROCEDURE (the 6 blocks + rules) |
| Eval | `eval.js` | 10 contract checks · 3 fixtures |
| Log | `log.jsonl` | one line per eval run / brief scored |
| Nuke marker | `NUKE-MARKER.md` | rollback recipe (retire 2026-08-21) |
| Hooks | — | **none by design** — see below |

**Fires when:** description-matched on `/brief`, "brief me on X", "orient me", "what am I walking into", or any moment みや picks up a ticket he has not been holding in his head.

**Why no hook:** the format law みや specified is *already* deterministically enforced by two registered Stop hooks — `domain/show-gate` (blocks a findings reply with no diagram/code block) and `domain/terse-gate` (blocks ≥6 long prose lines). A third gate would duplicate them and double-block the same turn. This Feature supplies only what those gates cannot: the CONTENT contract. Per system-rules Rule 1 + system-design Rule 7.

**Siblings — do not confuse:**

| Skill | Moment |
|---|---|
| `brief` | **before** work starts — orientation |
| `stop-point-summary` | **after** work pauses — where we are |
| `kowalski` | mid-work — architecture of the code area |
| Session Briefing | boot — all quests, whole session |

**Verify:**
```
node domain/brief/eval.js              # 3 fixtures, expect 3/3
node domain/brief/eval.js <brief.md>   # score a real brief against 10 checks
```

**Eval result at ship (2026-07-22):** 3/3 fixtures behaved as expected. The run caught a real defect in the good-brief fixture (bare `Sub01.jrxml:800` in the diagram) — fixture corrected to full addresses rather than weakening the check.

**History:**
- 2026-07-22 — created per みや `/goal` item 2. Born via `core/forge.js new skill brief`. First live use: ESOKONGAN #271721.
