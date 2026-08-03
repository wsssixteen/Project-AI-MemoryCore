/**
 * best-practices-consult-gate.js — UserPromptSubmit hook
 *
 * Catches the "best-practices-not-consulted" slip category (4 occurrences
 * in 14-day baseline — designed without checking Anthropic-recommended
 * patterns, ended up with wrong shape).
 *
 * Detects design-decision signals in みや's prompt → injects reminder to
 * consult library-items/agent-architecture/claude-code-best-practices.md
 * BEFORE proposing any architecture/skill/hook design.
 *
 * Created 2026-05-23 — Phase 2 of system-layer build.
 * Source: deep-research saved 2026-05-23; this gate ensures the reference
 * gets consulted instead of designs being invented from intuition.
 */
const TRIGGERS = [
  /\bhow should we (design|build|structure|approach)\b/i,
  /\bwhat'?s the right (shape|approach|design|way to)\b/i,
  /\bAnthropic[- ]recommend(ed|ation)\b/i,
  /\bbest practice(s)? (for|on|to)\b/i,
  /\bdesign (a|an|the|our)\b.*\b(skill|hook|system|architecture|pattern)\b/i,
  /\barchitect(ure|ing) (for|on|the)\b/i,
  /\bbuild (a|an|our|the) new (skill|hook|system|architecture|component)\b/i,
  // みや 2026-06-22: "add a feature" ALWAYS means consult /system-rules + /system-design first.
  /\b(add|create|build|implement|make)\b[^.\n]{0,25}\b(feature|power|capability)\b/i,
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
      '⚙️  best-practices-consult-gate: design-decision signal detected',
      '',
      'If this is an "add a feature / build a Power" ask → invoke /system-rules + /system-design',
      'FIRST. `domain/design-consult-gate/design-consult-gate.gate.hook.js` HARD-BLOCKS',
      'edits to skills/hooks/CLAUDE.md/personality.md/system/quest-protocol/settings.json',
      'until both skills have run this session (v1.2 2026-07-06 — extended paths + eval rider).',
      '',
      'Before proposing architecture / skill / hook / pattern design:',
      '  1. Read library-items/agent-architecture/claude-code-best-practices.md',
      '     → Skim relevant section (A=Skills, B=Hooks, C=CLAUDE.md memory, D=MCP, E=Subagents, F=Settings, H=Recommendations)',
      '  2. Check freshness — "Last researched:" date. If >60 days old, trigger evolution-check first (Stage 6)',
      '  3. Apply the decision criteria from system/INDEX.md:',
      '     MUST fire → hook · Conditional → skill · Judgment → CLAUDE.md/personality.md',
      '  4. Pressure-test the design (System-Design Discipline ≥3 past tickets check)',
      '',
      'Do NOT design from intuition or memory alone when a reference exists.',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
