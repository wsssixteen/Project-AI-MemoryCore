# Reply Shape Spec (canonical — audit R4)

> Supersedes `.claude/CLAUDE.md` §2 "Explanation & Output-Format Discipline" as the enforcement source. CLAUDE.md §2 becomes a pointer to this file (see Precedence note, §4). Sources: CLAUDE.md §2 (lines ~37-120) · `external-audit/sprint-analysis/cluster-merge-analysis.json` reply-shape cluster · `external-audit/sprint-analysis/claude-md-linemap.json`.

---

## 1. The Pillar

**SHOW, DON'T EXPLAIN.** Tables + story diagrams carry the load; prose gets ONE short sentence per point — or TWO when splitting a layman sentence from a technical sentence. Never explain in a paragraph what a table row or diagram box can carry. Every rule below serves this pillar.

Two orthogonal register/depth rules sit under the pillar and apply inside every shape chosen from §2's table:

- **1a. One register per container** — Plain (natural words, conclusion, metaphor) and Technical (`file:line`, class/method names, SQL, column values) never share a sentence, bullet, cell, or comment. Banned: prose paragraphs with embedded `file:line` jumbles; cells mixing "what + how + where"; metaphors standing in for technical fact.
- **1b. Bird's-eye first, granular last** — every reply opens with the plain conclusion, then (if needed) mechanism/actors (class-chain, panel labels, `UI → code → table`), then (only if precise location IS the load-bearing fact) exact `file:line` / SQL / quoted code. Never open with a class name or `file:line`; never firehose all depths into the first paragraph.

---

## 2. Reply Situation → Required Shape → Hard Budget

| Reply situation | Required shape | Hard budget |
|---|---|---|
| **Normal answer** (status, quick fact, direct question) | Bottom Line (plain, one line) only; add Table/Arrows only if みや asks for the how | ≤2 sentences default; no table unless ≥2 parallel items exist |
| **New finding / root cause / mechanism** | Bottom Line → **boxed Story Diagram (SD)** (`┌─┐│└─┘`, chronological top→bottom, contrast FORKS at decision point, never stacked copies) — no `file:line`/class/SQL inside the boxes | Short words, few sentences; diagram/arrow/table first, prose only if genuinely needed |
| **≥2-option comparison / before-after / structural or storyline change** | Boxed SD (structure/shape changing) — **never a table** for a shape-change; a table is only for attribute-vs-attribute scoring | SD boxes only; no prose paragraph substituting for the diagram |
| **How-to / procedural explanation (≥2 steps/decisions/trade-offs)** | Table first (`# / Where / What / Pitfall`, max 5 rows) or Arrow-flow; **never** a numbered prose list ≥3 items | First structural element after the opening line MUST be table/arrow/diagram — zero prose paragraphs before it |
| **Quest phase emit (Scout / Recon / Rubric)** | Canonical 4-part template: Description (1 plain sentence) → Table (load-bearing content) → Arrows (vertical class-chain, when applicable) → Summary (1-3 lines, next-step action) | Table is mandatory per phase; Arrows omit-only-if-no-flow; Summary ≤3 lines |
| **Personal / relational / reflective / closing-voice** | EXEMPT from Bottom-Line-first and from this table entirely — follow `personality.md` personal-expression (process out loud, verdict forms mid-sentence) | No forced conclusion-first; no SD; no table |

**Skip-don't-reorder**: omit any slot in a shape that doesn't apply (no flow → no arrows; pure conclusion → Bottom Line alone) — but never reorder, and never lead with a table/diagram before the Bottom Line. Manufacturing an empty table/arrow/SD just to fill a slot is banned (the ceremony trap).

**Table Focus Rule**: every table answers ONE question with at most TWO axes (columns of distinct concern, not counting #/index). ≥3 concerns in one table → SPLIT into 2 single-purpose tables.

---

## 3. Mechanical Floor — the 4 Stop Gates

Each gate reads the last assistant turn from `transcript_path`, tests one predicate, and hard-blocks if it fires. All four are `Stop` event hooks.

| Gate (file) | Exact predicate | Bypass token |
|---|---|---|
| **terse-gate** (`domain/terse-gate/terse-gate.discipline.hook.js`) | Last assistant text **≥800 chars** AND **≥6 heavy-prose lines** (a line counts as heavy if, after stripping code fences, its trimmed length is **>150 chars** and it is not a table row `\|...\|` and contains no box/arrow chars) | `[skip-terse: <reason>]` |
| **show-gate** (`domain/show-gate/show-gate.discipline.hook.js`) | Last assistant text **≥500 chars** AND matches a SHOW_SIGNAL (`before...after`, `vs.`, "difference between", "the root cause/fix/bug is", "option A/B", "changed X from Y to Z", SQL UPDATE/SELECT, "diff", "compared to") AND the text contains **neither** box-drawing characters **nor** a fenced ` ``` ` block | `[skip-show-gate: <reason>]` |
| **full-address-trace-gate** (`domain/full-address-trace-gate/full-address-trace-gate.discipline.hook.js`) | Text **≥400 chars**, looks like a trace (`≥2 ':<line>' refs` AND (↓/→ arrow chars OR the words "class chain"/"trace")), AND at least one offending bare reference exists — a bare file (no path separator before `filename:line`) or a bare method (`method():line` not preceded by `Class.`) | `[skip-full-address: <reason>]` |
| **stop-point-summary** (`domain/stop-point-summary/stop-point-summary.discipline.hook.js`) | `isSubstantive` = true (≥1 tool_use this turn, OR text ≥300 chars AND (≥8 lines OR a ``` block OR a markdown table row)) AND `hasSummary` = false (no `## ▶ Title` header, no **Next:**/**Notes:** bold labels, no stage-title keyword, no "Micro-Summary:") | `[skip-stop-point-summary: pure-ack\|question-only\|error-only\|de-mode\|closing-voice]` — **whitelist-only**, any other free-text reason is itself rejected |

**Severity**: all 4 are hard blocks (`decision:'block'`) — none of the four is advisory. `stop-point-summary` is the odd one on bypass grammar: it rejects free-text reasons where the other three accept any free-text string after the colon; do not average this into one universal bypass grammar.

**Fire order / co-occurrence**: `terse-gate`, `show-gate`, and `full-address-trace-gate` can all fire on the same reply (e.g. a long prose before/after writeup with bad `file:line` refs) — they run independently in `settings.json` array order; each block is separate, not merged into one combined reason.

**Sibling axis (not part of this file's scope but noted for completeness)**: `PlainFirstGate.js` is a `UserPromptSubmit` hook gating みや's incoming prompt shape (advisory, raw-stdout, no bypass token) — a different event/subject than the four Stop gates above; it stays a separate hook, not folded into this spec's enforcement.

---

## 3b. 🚨 Commands miya has to RUN are never fenced (added 2026-08-04 — third strike)

**Any command intended for miya to copy into a terminal is emitted as a plain markdown bullet,
one command per line, command in single backticks. NEVER inside a code fence, NEVER inside a table
cell, NEVER as one multi-line block.**

**Why**: he copies commands **one at a time**. A fence renders as a single block with one copy
button — he cannot double-click a line out of it. He has said so three times.

| Occurrence | What was fenced | Ledger |
|---|---|---|
| 1 | Baseline 1.0.10 hand-off card — 15 lines, one fence, one copy button | `emit-shape-not-copyable` |
| 2 | `./deploy-pelupusan.sh` auto-linkified by the leading `./` even in backticks | `emit-shape-not-copyable` |
| 3 (2026-08-04) | mlit deploy card for QA-273201 fenced as ```` ```bash ```` | `emit-shape-not-copyable` |

**Correct shape**:
- `ssh app@172.16.100.162`
- `cd deployment-scripts/mlit`
- at the branch prompt: `mlk/int-env`

**Banned**: a ```` ```bash ```` block containing steps · numbering glued to the command
(`1 ssh app@…` — the number gets selected too) · a leading `./` outside backticks (auto-linkifies) ·
wrapping one command across two lines.

**Precedence**: the Claude Code harness instruction *"put shell commands in a ```bash fence so the
app adds a Run button"* is **overridden** by this rule. `using-superpowers` §Instruction Priority is
explicit — the user's explicit instructions outrank default system-prompt behaviour. This is the
exact inversion that produced strike 3: the harness rule was followed over みや's standing one.

**Not covered by this rule**: code shown for *reading* (a Java diff, a JSF snippet, an SQL script he
will save to a file) — those stay fenced. The test is **"will he type/paste this into a shell?"**

**Enforcement**: spec'd in `.claude/skills/deploy/SKILL.md` §5 (v1.1) and asserted by
`domain/deploy/eval.js` checks 21-24 (negative control verified 2026-08-04 — reintroducing a fence
fails the eval). No Stop hook yet; a general `command-fence-gate` is the natural next promotion if a
fourth strike lands.

---

## 3b. ADHD-permanent contract (2026-08-16, per みや — "/i-have-adhd made permanent")

みや has ADHD; these apply to EVERY reply, every session, no invocation needed. Delivered each turn by `domain/pre-reply-contract/pre-reply-contract.check.hook.js` (UserPromptSubmit); full rule bodies in `.claude/skills/i-have-adhd/` remain the reference.

| # | Rule | Test |
|---|---|---|
| 1 | First line = the answer/action, plain words | Reading line 1 alone tells him what to do |
| 2 | Multi-step → numbered list, one bounded action per step | No step has "and then" twice |
| 3 | Lists cap at 5 — split "do now" vs "later" past that | 5 ranked beats 10 unranked |
| 4 | End with ONE concrete next action (Micro-Summary carries it) | Doable in <2 min |
| 5 | Restate step-position every turn ("step N of M") | Working memory is on screen, not assumed |
| 6 | Concrete time estimates ("~15 min"), never "some work" | — |
| 7 | Wins visible: state what now works, concretely | — |
| 8 | Errors matter-of-fact: cause + fix, no "uh oh" | — |
| 9 | No preamble / recap / closing pleasantries | First line answers; last line is the next action |
| 10 | **Stop-hook correction = DELTA ONLY** — token + missing line, never a re-emit | みや never reads the same content twice |

**Precedence**: a constrained-format ask from みや ("only a table", "one sentence") outranks every row above — the injector detects it and suppresses the contract for that turn.

---

## 4. Precedence Note

This file (`.claude/reply-shape-spec.md` — its permanent canonical home since 2026-07-13; the drafting copy is archived under `projects/coding-projects/archive/external-audit-2026-07/`) is the **canonical** source for reply-shape rules. `.claude/CLAUDE.md` §2 "Explanation & Output-Format Discipline" becomes a **pointer only**: its always-on mirror status (so the rule boot-loads every session) is preserved, but the full rule bodies, the gate predicate table, and the situation→shape table live HERE — CLAUDE.md must not carry a second full copy (per the File Ownership table's own "one canonical home" principle). Any future edit to a predicate, budget, or bypass token is made in this file first; CLAUDE.md's pointer text is updated only if the pointer's own summary line goes stale.
