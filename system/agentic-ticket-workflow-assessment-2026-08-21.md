# Agentic workflow assessment — 2026-08-21 (DE step 7.5)

| Axis | Finding (with instance) |
|---|---|
| A1 agentic system | **Self-disarm bug class**: 9 gates whole-transcript-scanned their bypass tokens; design-consult-gate log showed `bypassed: skip-design-consult` on 2026-08-20 16:27 with no token ever typed — its own help text disarmed it. Fixed via `lib/bypass-scope.js` (current-turn assistant text only), 54 fixtures green. Lesson: any predicate over the RAW transcript is poisoned by hook/help echoes — predicates must be role- and turn-scoped. |
| A1 agentic system | **Estate observability was asserted, not measured**: no census existed, so "everything observable" was unverifiable (miya called it a lie — correct). `lib/feature-census.js` now regenerates `system/feature-census.md` (234 components · 0 ghosts · gap debt visible). DE 12.5 runs it every close. |
| A2 quest workflow | **Blockless-ticket hole closed mechanically**: QA-276182 was worked a full session with no active.txt block — invisible to step 2b (memory) AND 12.6 (iterates blocks only). `de-close-gate` C1 now derives touched tickets from the transcript's tool calls, not memory. |
| A3 debugging | **Shell-escaped regex tests lie**: a bash `node -e` test "proved" the guard regex didn't match backslash paths — false; a file-based test showed it matched. Rule reinforced: regex/JSON fixtures go in FILES, never through shell quoting. Same night, malformed echo-JSON made a gate fail-open and mimic the ghost hypothesis. |
| A4 etanah issue-solving | ⏭ no etanah code touched this session (pure MemoryCore audit night). |
| A5 sweep / file sweep | ⏭ no multi-ticket sweep ran; census is the new estate-sweep primitive. |

Proposals logged tonight (see slip-dashboard 💡): census-debt weekly burn-down (65 no-eval · 40 no-README · 36 unobservable scripts) · stop-point-summary goal-aware re-registration.

---

## Improvement Sweep — session ticket-276436 (evening, 2026-08-21)

Forward-looking, 5 axes. Each claim carries one concrete instance from THIS session.

| Axis | Assessment (concrete instance) | Proposal (eval case) |
|---|---|---|
| **A1 agentic system** | `convention-check-gate.gate.hook.js:81` fires on `/\bUPDATE\s+\w+/` — false-matched `node quest/active-cli.js update QA-X status=closed` (3× this DE) AND the literal word "UPDATE" inside a `--evidence` string. Pure noise on non-SQL commands. | Narrow predicate: skip when command matches `active-cli.js`/`notes.js`, or the token after UPDATE is a `QA-\d+`. Eval: active-cli update → no fire; `UPDATE et_main_stg2.foo SET` → fires. **Logged (proposal A1).** |
| **A2 quest workflow** | `didnt-trace-ui-screenshot` + `wrong-module-from-keyword-grep` recurred — I grepped a keyword, matched a plausible SPOC tab, concluded the wrong module twice. `feedback_watch_video_url_first` is a memory with NO gate. | quest-phase-gate advisory: a Recon that names a fix-module must first echo `screen: <xhtml> (from URL bar)`. Eval: qa_doc Recon citing a module without the screen-from-URL echo → advisory. **Logged (proposal A2).** |
| **A3 debugging accuracy** | Module ownership flip-flopped SPOC→pelupusan→SPOC because I concluded before DB-proving the writer/reader gap. The DB discriminator (PRBB payload has `tujuanPermohonan`, PPTPB does not) settled it in one query — I just ran it last, not first. | Advisory: Recon text asserting "belongs to module X"/"SPOC-side" without a cited DB discriminator query → advisory. Eval: fixture Recon "fix is SPOC-side" + no `SELECT ->>` → fires. **Logged (proposal A3).** |
| **A4 etanah issue-solving** | SPOC counter mechanism cost multiple sessions to trace; now banked in `etanah-knowledge/melaka/SPOC-COUNTER.md`. Gap: not yet in the knowledge `index.md`, so the next PPTPB/counter ticket won't route to it. | Fold into Gap Sweep (step 7) this DE — add a SPOC-COUNTER row to `index.md`. Mechanical, done inline (no proposal needed). |
| **A5 sweep / file sweep** | active.txt had rotted to 17 "open" with 0 actually assigned to miya; boot PRINTS the divergence but reconcile was fully manual (7 hand-closes this DE). | `redmine-board.js --reconcile`: emit ready close commands for blocks whose Redmine state is terminal. Eval: fixture block + mocked Redmine Closed → emits the `active-cli update … status=closed` line. **Logged (proposal A5).** |

All four proposals live in `slip-dashboard.md` under 💡 Open proposals for the weekly BUILD/DROP/DEFER audit.
