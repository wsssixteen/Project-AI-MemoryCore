# pymtime-handover

symptom: 2026-09-28 miya: 'YOU yourself need to be aware of this once I tell you even in a different session' (colleague handover loop for PymTime)
goal: every pasted PymTime handover is diagnosed against the PymTime source and answered with the cause plus a sendable reply to the colleague, in any session
goal_signal: the reply names the first FAIL check or the matched signature and carries a sendable reply block for the colleague
retention: rotate monthly

**What fires when**: UserPromptSubmit — miya pastes a PymTime HANDOVER block (===== PYMTIME HANDOVER v1 ===== ... ===== END PYMTIME HANDOVER =====) relayed from a colleague laptop

**Contract**: inject: invoke the pymtime skill and follow its Handover section before replying

**Layer choice (Rule 7)**: hook+skill. The block is a fixed text signature, so a hook catches it every time in any session; the diagnosis needs judgment and the signature table, which live in `.claude/skills/pymtime/SKILL.md` §Handover (the existing pymtime skill, refined, not a new one).

**Trigger moment (Rule 8)**: UserPromptSubmit guarded by the `=====` marker lines only. Silent on every other prompt; there is no narrower moment, since the paste IS the moment.

**Observability**: every evaluation appends one row to `system/telemetry/hook-fires.jsonl` through `lib/hook-runtime.js` (ts · hook · fired · dur_ms · turn context). The hook writes no file of its own.

**state-scoped**: no, state-agnostic (PymTime is not an eTanah artifact).

**Producer**: `E:\Dev\scripts\PymTime\lib\handover.js` writes the block (BEGIN / END constants). A marker change there must change `BEGIN_RE` / `END_RE` here; the eval replays the exact block shape.

**Eval**: `node domain/pymtime-handover/pymtime-handover.eval.js` (replay + 22 adversarial fixtures + registration + skill-section checks).
