goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote terse-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: terse-gate.discipline.hook.js — Stop hook Power: domain/terse-gate/ PURPOSE (みや 2026-06-24, "you're still blabbering stupidly"): block a reply that is
goal_signal: a fire on: its trigger
retention: rotate monthly
footprint: per-turn: runs inside the Stop bundle, no process of its own
self_audit: `node domain/terse-gate/terse-gate.eval.js` replays every signal; each fire writes a `log.jsonl` row with its action
boundary: covers his last message and my last reply text at Stop · never edits a file, never reads app-injected lines as his ask, never blocks twice in one stop · stops at a block naming the line count and the unblock; the short version is mine to send
diagram: `domain/terse-gate/diagram.png`
# Power: terse-gate

**Stop hook.** Blocks a PROSE-WALL reply — ≥ 6 long prose lines (> 150 chars) that aren't table rows / diagram lines. Forces tables / diagrams / short bullets.

- **Closes:** 2026-06-24 — "you're still blabbering stupidly."
- **Sibling of `show-gate`** (fires on change/finding signals); terse-gate fires on general verbosity.
- **Exempt:** < 800 chars · DE/closing/personal · `[skip-terse: <reason>]`.
- **Inter-tool narration (superpowers v6 #6, 2026-06-28):** ≤1 line between tool calls — the ledger (`active.txt` / `QA-NNNN.md`) + tool results carry the record. This is the home for the narration-discipline; it is NOT a separate rule. Gated audit emits (Scout/Recon/Rubric via `═══`, SD via box chars) + §2 explanation-flow are EXEMPT by construction (the hook already skips `═══` banners + box/table lines).
- **Signal 2, short question → short answer (2026-10-06 per みや, #268173: "too long, I just wanted the answer"):** his last message is ≤ 300 chars, is a question, and does not itself ask for a list / table / steps / detail / code → a reply over 15 non-empty lines (outside code fences) is BLOCKED. Tables do not exempt it: a whole investigation moved into tables passed signal 1 all day. Rule it enforces: `.claude/reply-shape-spec.md` §3c "the investigation is never shown". Eval 12/12 (F5-F11 cover it). Rollback: `git checkout e6f0d4ad15 -- domain/terse-gate/terse-gate.discipline.hook.js`.
- **Signal 4, no oversharing before the next step is confirmed (2026-10-31 per みや: "NOT over share things until you've confirmed on the next steps ... Unless I am the one asking for examples ... I have always skipped too long replies"):** any message, question or not: a reply over 20 non-empty lines outside code fences is BLOCKED unless his message asks for more (examples, full details, list, table, steps, scenario, brief, script, code ...) or opens with a confirmation (yes, ok, go, proceed ...). Founding case: the TradingView study reply, 5 sections. Rule: `.claude/reply-shape-spec.md` §3c. Spec-preservation: signals 1 to 3 untouched; additive. Rollback: `git revert <commit>`.
- **Scenarios for signal 4 (system-design Rule 12):**

| # | Scenario | Verdict |
|---|---|---|
| 1 | Founding message + 30 lines | fixture-added F21 |
| 2 | "all" said in passing | fixture-added F22 |
| 3 | Exactly 20 lines | fixture-added F23 |
| 4 | He asks for examples | fixture-added F24 |
| 5 | He confirms the next step | fixture-added F25 |
| 6 | He asks for full details | fixture-added F26 |
| 7 | Bypass token | fixture-added F27 |
| 8 | Long code fence | fixture-added F28 |
| 9 | Quest banner emit | fixture-added F29 |
| 10 | Skill text injected after his message | fixture-added F30 |
| 11 | Missing transcript or bad JSON | handled: fail-open, existing catch |
| 12 | No user message found | handled: `ask` empty, signal skipped |
| 13 | A second stop after the block | handled: `stop_hook_active` exits |
| 14 | Reply under 800 characters but over 20 lines | accepted-risk: lines that short cost him nothing to read |
| 15 | Bypass token quoted in the reply as text | accepted-risk: same exposure as signals 1 and 2 |
| 16 | "ok but stop, that is wrong" opens the message | accepted-risk: a correction reply is short by its own rules |
| 17 | He says "the details" in passing | accepted-risk: the gate lets one long reply through, never blocks a wanted one |
| 18 | Long work report after a system change | handled: he asked for the change; the report fits 20 lines or uses the token |
| 19 | Terse-gate deleted from the bundle | handled: `system-audit` ghost and census checks report it |
| 20 | Run from a worktree | handled: path from `CLAUDE_PROJECT_DIR`, same as signal 2 |

- **Contract:** see `terse-gate.discipline.hook.js` header. **Log:** `log.jsonl`.
- **Eval (2026-06-24):** blabber fixture → blocked; table fixture → allowed.
