# commit-subject-gate

**What fires when**: Stop — the reply carries an etanah commit subject: a fenced block whose only line matches `^(QA|Ref) #NNN - `, or a `git commit -m "…"` string inside a fenced block.

**Contract**: BLOCK (exit 2) when the subject breaks any of six deterministic rules:

| Rule | Check |
|---|---|
| R1 | no `;` |
| R2 | no en/em dash; at most 3 spaced ` - ` separators (prefix, URUSAN, TUGASAN, description); none inside the description; intra-word hyphens (int-env, e-Doket) allowed |
| R3 | no arrows (`->`, `=>`, `→`) or pipes |
| R4 | no non-change word in the description: keep, kept, keeping, leave, leaving, left, untouched, unchanged, retain(ed), remain(s), still |
| R5 | subject ≤ 100 characters |
| R6 | a redraft for the same ticket is never longer than the previous draft in this transcript |

Bypass: `[skip-commit-subject: <reason>]` in the same reply.

**Why**: QA-277697, 2026-09-02. Five drafts of one subject, each longer than the last, carrying `;`, dashes and "keep 3 trg pages" (a non-change), until miya wrote the message himself. The prose rule in `.claude/commit-conventions.md` and the commit-time Check 0 in `.claude/hooks/commit-gate.js` both existed; neither fires at DRAFT time, which is when the damage is done.

**Layer choice (Rule 7)**: hook-only. Every rule is a string check; no judgment step needs a skill. The prose rule already existed and was skipped five times in one hour.

**Trigger moment (Rule 8)**: Stop, gated on a fenced subject being present in the LAST assistant message. It does not fire on prose, on SQL blocks, or on replies without a subject. Firing at commit time (commit-gate) is too late: miya has already read and rejected the draft.

**Pair**: `.claude/hooks/commit-gate.js` Check 0 (commit-time, same R1–R5 plus verb-vs-staged-diff consistency) is the second line; this gate is the first.

**Observability**: every fire appends to `domain/commit-subject-gate/log.jsonl` via `lib/hook-runtime.js`: `ts`, `event`, `fired`, `blocked`, `bypassed`, `dur_ms`.

**state-scoped**: no, state-agnostic (subject shape is the same for every state's repo).

**Eval**: `node domain/commit-subject-gate/commit-subject-gate.eval.js` — 24 fixtures including the replay.

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | own block text quoted in prose contains "keep" and " - " | handled, only fenced subjects are parsed (F19) |
| 2 | malformed JSON stdin | handled, exit 0 (F1) |
| 3 | plain-text transcript | handled, exit 0 (F17) |
| 4 | missing transcript path | handled, exit 0 (F18) |
| 5 | worktree vs main repo path | handled, ROOT from CLAUDE_PROJECT_DIR with __dirname fallback |
| 6 | eval sandbox copy of the hook without lib adjacent | accepted-risk, same as every forge-born check |
| 7 | bundle dispatch vs direct registration | handled, runHook emits standard JSON |
| 8 | bypass token in an OLD turn | handled, only the last assistant text is checked for the token (F12 is same-turn) |
| 9 | huge transcript | accepted-risk, linear parse, same as sibling gates |
| 10 | subject inside a bash block as `git commit -m` | fixture-added (F13) |
| 11 | subject inside a SQL block or other fence | handled, non-subject fences ignored (F14) |
| 12 | lowercase `ref #` | fixture-added, case-insensitive (F20) |
| 13 | CRLF and trailing spaces in the fence | fixture-added (F21) |
| 14 | a real change word that is also a non-change word ("left panel") | accepted false positive, bypass exists (F22) |
| 15 | two subjects in one reply, one bad | fixture-added, the bad one is named (F24) |
| 16 | longer redraft for a DIFFERENT ticket | handled, comparison is per ticket (F11) |
| 17 | shorter redraft | handled, passes (F10) |
| 18 | the approved 2026-09-02 message | passes (F3) |
| 19 | canonical 3-separator subject | passes (F5) |
| 20 | intra-word hyphen | passes (F16) |
| 21 | arrows and pipes | blocked (F15) |
| 22 | a `-m` with single quotes | handled by the quote-agnostic regex |
| 23 | user-instruction reversal: miya dictates the exact wording that breaks a rule | bypass token with reason, never silent |
| 24 | subject drafted in prose, not fenced | accepted-risk, the convention says subjects are shown in a fence |
