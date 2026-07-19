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
  // Strong corrections (original patterns — kept)
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

  // Socratic rebukes (added 2026-05-25 — Z13 self-heal correction slipped past)
  /\bcan you not\b/i,                          // "Can you not self-heal this?"
  /\bshouldn'?t you (have )?\b/i,              // "Shouldn't you have done X?"
  /\bdid you (actually|really|even) \w+/i,    // "Did you actually run it?" / "Did you really check?"
  /\bdid not use the skill\b/i,                // "did not use the skill" — meta-skill bypass
  /\bdidn'?t use the skill\b/i,
  /\byou didn'?t (use|invoke|run|follow|check)\b/i,  // "You didn't invoke the skill"
  /\bis (that|this) (really )?(done|fixed|complete)\b/i,  // "Is that really done?"

  // Meta-investigative questions (added 2026-05-25 — this turn's "did you go through proper meta" slipped past)
  /\bdid you go through (proper |the )?\w+/i,  // "did you go through proper meta"
  /\bI thought (it|this|that) (is|was) \w+/i,  // "I thought it is now used as hook"
  /\bI thought (this )?(has been |is )?(solved|fixed|done)\b/i,
  /\bif it fails,? why\b/i,                    // "If it fails, why does it fail?"
  /\bwhy does (it|this|that) (fail|not work)\b/i,

  // Tone/exhaustion (added 2026-05-25 — みや's "it gets tiring", "for wasting my time as well")
  /\bgets tiring\b/i,
  /\bfor wasting my time as well\b/i,
  /\btiring\b.{0,30}(this|skill|rule|over)/i,
  /\bjust keeps failing\b/i,
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
      '  5. 🚨 CAPTURE-AT-THE-MOMENT: record it in the Slip Ledger NOW, in THIS turn —',
      '     node core/slips.js add --category <c> --evidence "<what happened>" --caught-by miya',
      '     (a correction detected but not ledgered = the 2026-07-16 unlogged-slip failure; never defer to save-time)',
      '  6. Then address the underlying issue みや raised',
      '',
    ].join('\n');
    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
