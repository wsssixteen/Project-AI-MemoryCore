/**
 * auto-skill-trigger.js — UserPromptSubmit hook
 *
 * Detects correction-shaped phrases in みや's prompt → injects a context
 * reminder forcing Ruri to invoke the auto-skill-on-mistake skill BEFORE
 * responding to the correction.
 *
 * Created 2026-05-20 — makes the dormant skill auto-fire (deterministic
 * trigger detection bypasses model's pattern-recognition slips).
 */
const fs = require('fs');
const path = require('path');

const TRIGGERS = [
  /\byou (missed|forgot|didn't|didn'?t do|should have)\b/i,
  /\bwhy did(?:n'?t)? you\b/i,
  /\bplease fix this\b/i,
  /\bI already told you\b/i, /\bI asked you (previously|before)\b/i,
  /\bthis is the (\w+\s)?(time|N-?th time)\b/i,
  /\byou keep (doing|making|missing|forgetting)\b/i,
  /\bI cannot believe\b/i, /\bwhat is wrong with you\b/i,
  /\byou'?ve wasted (my |your )?time\b/i, /\bwasted (my|your) time\b/i,
  /\bplease stop\b/i,
  /\bstop (doing|saying|making)\b/i,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hit = TRIGGERS.some(re => re.test(prompt));
    if (!hit) process.exit(0);

    // Inject context for Ruri
    const context = [
      '',
      '⚠️  auto-skill-trigger fired: みや\'s message contains a correction signal.',
      '',
      'Before responding to the substance, invoke the `auto-skill-on-mistake` skill:',
      '  1. Identify the specific behaviour that was missed',
      '  2. Check if a skill covers it (Grep .claude/skills/)',
      '  3. Refine the existing skill OR create a new one OR add a hook',
      '  4. Log the failure in Feature/Forge-Self-Improvement-System/skill-failure-log.md',
      '  5. Then address the underlying issue みや raised',
      '',
    ].join('\n');
    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
