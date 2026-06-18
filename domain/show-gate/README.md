# show-gate (hook)

**Contract:** a reply that DISCUSSES a change / comparison / diff / finding / root-cause MUST **show** it — a drawn box-diagram OR the actual code/SQL/diff in a fenced block — not describe it in prose. The Stop hook hard-blocks the turn end otherwise.

| Piece | File | Role |
|---|---|---|
| Hook (discipline) | `show-gate.discipline.hook.js` | Stop — `{"decision":"block"}` when a show-worthy reply shows nothing |
| Log | `log.jsonl` | one line per fire: `passed` / `blocked` |
| Skill / Eval | — | none (hook-only) |

**Fires when:** last assistant text matches a strong change/compare/finding signal (`before…after`, `vs`, `difference between`, `the root cause/fix is`, `option A/B`, `changed from…to`, `UPDATE…SET`, `SELECT…FROM`, `diff`, `compared to`) **AND** has no box-drawing char **AND** no ``` fence.

**Exempt (never blocks):**
- bypass token `[skip-show-gate: <reason>]`
- Domain-Expansion / hand-back / closing turns (`═══` banner · `るり結界` · `Domain Expansion`)
- short replies (< 500 chars)
- `stop_hook_active` (no re-block loop)

**Fail-open:** any parse/read error → allow stop.

**False-positive cost:** a work reply discussing a change with no diagram is blocked until a box/code-block is added or the bypass used. みや chose **hard-block** over warn-only knowingly (2026-06-18) — show-don't-tell is the bar.

**History:**
- 2026-06-18 — created per みや ("make a stop hook, to SHOW — the utmost, highest, perfect, absolute criteria"). Makes CLAUDE.md §2's diagram-mandatory rule deterministic instead of prose-dependent. Routed through system-design + system-rules.
