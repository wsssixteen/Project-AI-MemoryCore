# arabic-nudge

**What fires when**: SessionStart — every session boot. Prints nothing unless `projects/learning-projects/active/arabic/data/words.json` exists.

**Contract**: print ONE line — `📖 Arabic: N/5 reviews this week · not yet today` | `· done today` | `📖 Arabic: new week · not yet today` | `📖 Arabic: not started · /arabic`. Never a word list. Advisory; never blocks.

**Layer choice (Rule 7)**: hook-only for the nudge; the procedure lives in the `arabic` skill. A prose flag (the diary-missing analog in CLAUDE.md) is not deterministic; a hook is.

**Trigger moment (Rule 8)**: SessionStart is the moment みや decides what to do first in a session; the nudge exists only to make "do the 2-minute review now" visible at that moment. One line, no data when the folder is absent. A narrower trigger (UserPromptSubmit) would fire every turn = worse.

**Observability**: every fire appends to `domain/arabic-nudge/log.jsonl` — `{ts, line}`; an empty run (no data) appends nothing.

**state-scoped**: no, state-agnostic (personal, non-etanah).

**Engine**: `.claude/skills/arabic/arabic.js nudge` (same code path as `/arabic status`). Spec: `projects/learning-projects/active/arabic/SPEC.md` §7.
