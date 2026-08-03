/**
 * route-consult-gate.js — UserPromptSubmit hook (v2.0)
 *
 * The "consult skill/hook registry before acting" meta-trigger.
 * v2.0 (2026-07-03, quest-system-audit E9): renamed from SystemAwareDecision.js
 * (filename≠behavior drift — this header always said route-consult-gate); trigger
 * narrowed per system-design Rule 8 (skip acks/commands/quoted payloads, floor 80);
 * emit trimmed 13 lines → 3 per cost-efficiency v2 per-turn-overhead rule.
 *
 * Trifecta:
 *   Goal:       Force internal registry consultation before substantive emission
 *   Guardrails: floor 80 chars · skip slash-commands, ack-openers, self-referential;
 *               3-line advisory, never blocking
 *   Grounded:   .claude/skills/ + system/INDEX.md
 */
let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();

    if (prompt.length < 80) process.exit(0);
    if (/^\//.test(prompt)) process.exit(0); // slash-command — skill already being invoked
    if (/^(ok|okay|yes|no|nope|proceed|go ahead|commit approved|thanks|thank you)\b/i.test(prompt)) process.exit(0);
    if (/route-consult-gate|registry consult/i.test(prompt)) process.exit(0);

    process.stdout.write([
      '',
      '⚙️  route-consult v2 (silent): match this prompt against .claude/skills/ descriptions + system/INDEX.md BEFORE responding.',
      'If a skill matches → INVOKE via Skill tool (the only visible signal). No literal "Route:" line (retired 2026-06-02).',
      '',
    ].join('\n'));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
