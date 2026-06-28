# Power: terse-gate

**Stop hook.** Blocks a PROSE-WALL reply — ≥ 6 long prose lines (> 150 chars) that aren't table rows / diagram lines. Forces tables / diagrams / short bullets.

- **Closes:** 2026-06-24 — "you're still blabbering stupidly."
- **Sibling of `show-gate`** (fires on change/finding signals); terse-gate fires on general verbosity.
- **Exempt:** < 800 chars · DE/closing/personal · `[skip-terse: <reason>]`.
- **Inter-tool narration (superpowers v6 #6, 2026-06-28):** ≤1 line between tool calls — the ledger (`active.txt` / `QA-NNNN.md`) + tool results carry the record. This is the home for the narration-discipline; it is NOT a separate rule. Gated audit emits (Scout/Recon/Rubric via `═══`, SD via box chars) + §2 explanation-flow are EXEMPT by construction (the hook already skips `═══` banners + box/table lines).
- **Contract:** see `terse-gate.discipline.hook.js` header. **Log:** `log.jsonl`.
- **Eval (2026-06-24):** blabber fixture → blocked; table fixture → allowed.
