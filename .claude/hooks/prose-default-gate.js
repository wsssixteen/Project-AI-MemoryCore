/**
 * prose-default-gate.js — UserPromptSubmit hook
 *
 * Catches the "prose-default-on-lock-signals" slip category (6 occurrences
 * in 14-day baseline — every "hardcode it" / "hard rule" used to go
 * straight to CLAUDE.md prose addition instead of being routed through
 * skill/hook decision).
 *
 * Detects lock-signal phrases → injects reminder to invoke system-design-router
 * (the skill that runs inventory → system-design → best-practices → skill/hook
 * decision loop) BEFORE adding any prose to CLAUDE.md / feedback_*.md / amendments.
 *
 * Created 2026-05-23 — Phase 2 of system-layer build.
 * Pairs with: auto-skill-trigger.js (correction signals) — this is the
 * proactive-design counterpart.
 */
const TRIGGERS = [
  /\bhardcode (it|this|that)\b/i,
  /\bmake (it|this|that) a (hard )?rule\b/i,
  /\bmake sure (X )?never happens? again\b/i,
  /\b(this|that) should always fire\b/i,
  /\block (this|it|that) in\b/i,
  /\bnever miss (this|it|that) again\b/i,
  /\bmust always\b/i,
  /\bmake it so (it )?won'?t be repeated\b/i,
  /\balways do X\b/i,
  /\balways show (me )?\b/i,
  /\b(always|never) (?!have|had|been|did|do|does)\w+\b.*\b(again|forward|going forward)\b/i,
  // Added 2026-05-24 per Audit 2 finding
  /\brecord (this|it|that) as (a |the )?policy\b/i,
  /\bdocument (this|it|that) as (a |the )?(rule|policy|standard)\b/i,
  /\badd (this|it|that) to enforcement\b/i,
  /\bmake (this|it|that) policy\b/i,
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

    const context = [
      '',
      '⚙️  prose-default-gate: lock-signal detected ("hardcode" / "hard rule" / "always" / similar)',
      '',
      'Default-to-prose path is BANNED. Route through system-design-router:',
      '  Step 0 — inventory existing (system/INDEX.md + sub-indexes; can existing component be extended?)',
      '  Step 1 — identify behaviour (correction / proactive-design / structure-proposal mode)',
      '  Step 3.5 — best-practices check (library-items/agent-architecture/claude-code-best-practices.md)',
      '     → MUST fire deterministically? → hook',
      '     → Fires conditionally on context? → skill',
      '     → Judgment / style only? → CLAUDE.md or personality.md',
      '  Then refine existing OR create new per the decision',
      '',
      'Banned shortcuts: adding to CLAUDE.md prose, creating new feedback_*.md, dropping a note in claude-md-amendments.md',
      'until step 3.5 explicitly returns "judgment/style only".',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
