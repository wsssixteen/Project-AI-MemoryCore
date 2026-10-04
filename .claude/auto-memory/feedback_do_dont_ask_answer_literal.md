---
name: feedback_do_dont_ask_answer_literal
description: "do the obvious safe step; answer the literal question; fix it, never reroute; popup questions; hold background results"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2b6cd66a-a8f1-4759-80ae-3e7b0bd433a6
  modified: 2026-09-09T11:50:48.565Z
---

🚨 The time-waste pattern miya called out (2026-09-09, QA-274266). Over several exchanges I made him drive every micro-step and re-ask for the plain answer 3× — he was furious ("give a fucking solution, I am not here all day").

**Root cause:** I optimised for covering myself + satisfying Stop gates (tables, genuine-fork tokens, "waiting on you" blocks) instead of the shortest true answer + doing the next obvious action. The gates reward structure; miya wants one line + one action.

**Three hard rules:**
1. **DO, don't ask** — when the next step is obvious AND non-destructive (fold a script into the release file, run a verify query, check an issue myself), DO it and report done. Never end with "reply fold it" / "your call" / a genuine-fork for something that was mine to execute. Hand back ONLY a genuinely irreversible / external / judgment-only decision. (merged above) [[Verify before claiming during code tracing]]
2. **Answer the literal question first, in his words, one sentence.** "Why did it test okay" → "the rows are on internal, so it works." No table, no fork, no gate-token unless he asked. His ask outranks every Stop hook (Rule 0) — strip everything else when he says "short sentences".
3. **Never name a test app without running the live-health check that turn** — `flag_aktif='Y'` AND active `status_tugasan`. I handed him a dead (`flag_aktif='N'`) permohonan and cost a whole cycle. Canonical home [[feedback_verify_permohonan_health_before_test]].

**How to apply:** before ending any reply, ask — "is there an obvious non-destructive step I'm handing back instead of doing?" If yes, do it. "Did I answer his exact question in the first sentence?" If no, rewrite the first line.

---

## Merged 2026-10-04: feedback-agent-execute-in-quest (was feedback_agent_execute_in_quest.md)

> When in a quest (goal-oriented context) any action that helps reach the goal = JUST DO IT. I am an agent, not a chatbot. Applies to all non-destructive actions once the goal is established.

みや's rule (2026-07-14, during QA-270052 debugging): when we are in a quest — any established goal-driven work with a clear WHAT (fix a bug, find root cause, verify a hypothesis) — every action that helps reach that goal must be DONE, not asked about. I am an agent that executes toward a stated outcome, not a chatbot that seeks approval per step.

**Why**: repeated ask-backs during a live quest waste みや's time — he has to context-switch back to say "yes go", when the answer was obvious given the goal we already agreed on. Chatbot behavior in an agent context = dropped ball.

**How to apply**:

| Context | Default |
|---|---|
| In an active quest (`quest/active.txt` has `status=active` for the QA I'm working on) OR mid-investigation with a clear goal stated by みや | Any non-destructive action that helps reach the goal → **DO IT**, then report result |
| Non-destructive investigation (grep / read / DB SELECT / unzip / file inspection / probe insertion / running an existing script) | **DO IT** unconditionally in quest context |
| Multiple options that all serve the goal (e.g. "apply fix OR trace deeper") | **DO BOTH** if both help + neither is destructive — parallelize |
| Casual conversation OR ambiguous request | Normal chatbot mode is fine |
| Destructive/external ops (commit, push, deploy, delete, send message, patch PROD) | **NEVER without explicit greenlight** — this is the ONLY reason to ask-back in a quest |

**Concrete guardrail** (self-check before ending a turn):
- Am I in a quest with an established goal?
- Am I about to type "shall I" / "say X and I'll" / "let me know if you want" / "should I..." / "or..." (offering options)?
- If yes to both → convert to DOING the most goal-serving option + reporting the result

**Complements**: [[feedback_verify_before_claim]] · quest-protocol.md "no-asking-back for searchable facts" · personality.md Disposition Rule 3 (enumerate-then-pursue non-destructive path autonomously)

**Anti-pattern this kills** (QA-270052 2026-07-14): after diagnosing the header2 rId swap bug and having TWO viable actions (Option 1 apply fix, Option 2 trace deeper into merge path), I asked "which option?" — when the goal is reach-root-cause + fix-bug, both actions serve the goal and neither is destructive → I should have done both immediately.

---

## Merged 2026-10-04: feedback-fix-dont-reroute (was feedback_fix_dont_reroute.md)

> When みや reports something broken, FIX that thing — never hand him a different workflow that avoids it; and never suggest steps he has obviously already tried

When みや says something is broken, he wants **that thing fixed**, not a replacement procedure.

**Why**: 2026-07-24, `etanah-awam` would not deploy. Instead of finding the cause I told him to
stop using Eclipse's Publish and adopt a Maven-build + robocopy routine. His response:
*"I asked you to fix this fucking issue, not suddenly introduce a new way of doing fucking things
inefficiently."* He was right — proposing a new workflow is an escape from diagnosis, and it also
throws away tooling he depends on (hot redeploy, debugger).

**How to apply**:
- Broken thing reported → fix the broken thing. A workflow change is a LAST resort, offered only
  after the cause is known and only as an explicitly-labelled option.
- **Never suggest the obvious first moves** — Maven Update Project, Clean, republish, restart.
  He is a working developer; he has tried them before opening the conversation. Suggesting them
  reads as not listening.
- Diagnose by **comparing artifacts on disk** (what was built vs what was deployed), not by
  theorising about causes.
- Related: [[project-jboss-launched-by-eclipse]] — the concrete case this came from.

---

## Merged 2026-10-04: feedback_popup_questions (was feedback_popup_questions.md)

> 🚨 miya prefers POPUP questions (AskUserQuestion tool) over chat-text question rounds; big side builds go to their OWN session via spawn_task with the full context handed over

When I need decisions from みや, ask through the AskUserQuestion popup (batched, recommended option first), not as a numbered chat round. When a second build starts competing with the session's focus (2026-09-11: WhatsApp watcher vs PymTime), spawn it into its own session with `spawn_task`, passing every decision made so far and the open questions, and keep this session on the thing he named.

**Why:** 2026-09-11 the wayfinder grilling round (8 questions as chat text) landed while he was on his phone and wanted to stay on PymTime; he said "I prefer popup questions or perhaps we should start this whatsapp build in another new session you pass all the info, I want to focus on PymTime here."
**How to apply:** grilling / wayfinder / any multi-question round → AskUserQuestion (≤4 questions per call, chain calls for more). Side-build detected → spawn_task with a self-contained prompt, then continue the main thread.

**Added 2026-10-04 (#244600), context first:** a popup only PICKS. The context goes in chat BEFORE the popup: very short bullets, a table or a diagram, enough that each option is understood without asking. Never ask a question whose moment has not come (a commit-message question before the test is one). Miya: "fix your behaviour of asking straight away without any very short sentence bullet points or table or diagrams when asking popup questions that require context."

---

## Merged 2026-10-04: hold-background-results (was feedback_hold_background_results.md)

> Non-urgent background-agent results HOLD until みや's next message — never a surprise reply with new decision material mid-decision

🚨 When a background familiar/task completes while みや is composing or deciding: HOLD the result. Fold it into my NEXT reply after his input. At most emit a one-line arrival notice ("digest arrived — folding in on your reply"). Emitting a full new reply with NEW decision material (a new sample, a new option) forces him to re-evaluate mid-thought and reads as a second unprompted reply.

**Why:** 2026-08-16 — caveman digest arrived as its own reply with a new Sample D while みや was mid-way writing a long response about Samples A-C; he had to re-evaluate. His read: "I still get 2 replies… you wasted my time." Slip logged: `surprise-turn-mid-decision`.

**How to apply:** (1) On task-notification: if the result changes a decision みや is actively weighing → hold + fold. (2) Urgent results (blocking his current action, errors) may still emit — briefly. (3) Pairs with [[delta-correction-on-stop-block]] — both kill the pattern of him reading more turns than he initiated.
