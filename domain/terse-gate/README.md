goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote terse-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: terse-gate.discipline.hook.js — Stop hook Power: domain/terse-gate/ PURPOSE (みや 2026-06-24, "you're still blabbering stupidly"): block a reply that is
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: terse-gate

**Stop hook.** Blocks a PROSE-WALL reply — ≥ 6 long prose lines (> 150 chars) that aren't table rows / diagram lines. Forces tables / diagrams / short bullets.

- **Closes:** 2026-06-24 — "you're still blabbering stupidly."
- **Sibling of `show-gate`** (fires on change/finding signals); terse-gate fires on general verbosity.
- **Exempt:** < 800 chars · DE/closing/personal · `[skip-terse: <reason>]`.
- **Inter-tool narration (superpowers v6 #6, 2026-06-28):** ≤1 line between tool calls — the ledger (`active.txt` / `QA-NNNN.md`) + tool results carry the record. This is the home for the narration-discipline; it is NOT a separate rule. Gated audit emits (Scout/Recon/Rubric via `═══`, SD via box chars) + §2 explanation-flow are EXEMPT by construction (the hook already skips `═══` banners + box/table lines).
- **Signal 2, short question → short answer (2026-10-06 per みや, #268173: "too long, I just wanted the answer"):** his last message is ≤ 300 chars, is a question, and does not itself ask for a list / table / steps / detail / code → a reply over 15 non-empty lines (outside code fences) is BLOCKED. Tables do not exempt it: a whole investigation moved into tables passed signal 1 all day. Rule it enforces: `.claude/reply-shape-spec.md` §3c "the investigation is never shown". Eval 12/12 (F5-F11 cover it). Rollback: `git checkout e6f0d4ad15 -- domain/terse-gate/terse-gate.discipline.hook.js`.
- **Contract:** see `terse-gate.discipline.hook.js` header. **Log:** `log.jsonl`.
- **Eval (2026-06-24):** blabber fixture → blocked; table fixture → allowed.
