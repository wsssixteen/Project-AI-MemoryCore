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
