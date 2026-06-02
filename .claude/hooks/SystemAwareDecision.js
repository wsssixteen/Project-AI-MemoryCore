/**
 * route-consult-gate.js — UserPromptSubmit hook
 *
 * The "always consult skill/hook registry before acting" meta-trigger.
 * Fires on every substantive prompt (>50 chars to skip trivial) and
 * injects a reminder to scan the registry for matching skills/hooks
 * BEFORE responding.
 *
 * Created 2026-05-24 — みや's frontier-pattern proposal. Industry has
 * NO equivalent (Audit 5 confirmed); we're pioneering active-consult.
 *
 * Pairs with the response-marker convention: every response should
 * declare its route at top (which skills/hooks routed this response).
 *
 * Trifecta:
 *   Goal:       Force registry consultation before any substantive emission
 *   Guardrails: Filter by prompt length (>50 chars); inject brief reminder,
 *               not full registry dump; advisory, not blocking
 *   Grounded:   .claude/skills/ + .claude/hooks/ + meta/INDEX.md
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';

    // Filter: skip trivial prompts (greetings, single-word, "ok", etc.)
    if (prompt.length < 50) process.exit(0);
    // Filter: skip pure-meta prompts about the hook itself (avoid recursion noise)
    if (/route-consult-gate|registry consult/i.test(prompt)) process.exit(0);

    // v1.1 (2026-06-02 per みや — "Route is bloat, takes too much space"): consult
    // remains MANDATORY but the visible Route emission is RETIRED. Do the registry
    // scan internally — do NOT emit a visible "Route: ..." line at top of response.
    // If a skill genuinely needs invocation, invoke it via Skill tool (visible).
    // If a hook fires, its effect is visible via its own injection — no marker needed.
    const context = [
      '',
      '⚙️  route-consult-gate v1.1 (silent): substantive prompt detected.',
      '',
      'INTERNAL consult before responding (do NOT emit a visible "Route:" line):',
      '  - .claude/skills/  for skills whose description-triggers match this prompt',
      '  - .claude/hooks/ + settings.local.json  for hooks that should fire',
      '  - meta/INDEX.md  for relevant meta-layer components',
      '',
      'If a skill applies, INVOKE it via Skill tool (that is the visible signal).',
      'If "direct" (no skill/hook applies): proceed silently — no marker.',
      '',
      'Banned: emitting a literal "Route: ..." line at top of response (retired 2026-06-02).',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
