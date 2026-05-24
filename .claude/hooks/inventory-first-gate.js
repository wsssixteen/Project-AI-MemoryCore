/**
 * inventory-first-gate.js — UserPromptSubmit hook
 *
 * Catches the "inventory-first-miss" slip category (7 occurrences in
 * 14-day baseline — proposed new folders/files/skills without checking
 * existing layers first). Detects new-structure-proposal phrases in
 * みや's prompt → injects reminder to inventory existing meta/INDEX
 * before proposing anything new.
 *
 * Created 2026-05-23 — Phase 2 of meta-layer build.
 * Source slip: 2026-05-23 — proposed `references/` folder when library-items/
 * already had the saved-knowledge pattern. The feedback_inventory_first.md
 * rule existed (auto-loaded) but didn't fire.
 */
const TRIGGERS = [
  /\blet'?s add (a |the )?(folder|file|skill|hook|directory|module)\b/i,
  /\bnew (folder|file|skill|hook|directory|module) for\b/i,
  /\bcreate (a |the )?(new )?(folder|file|skill|hook|directory|module)\b/i,
  /\bwe should (make|have|create|add) (a |an )?(folder|file|skill|hook|module|new)\b/i,
  /\bI want (a |an |the )?(new )?(folder|file|skill|hook|module|structure)\b/i,
  /\badd (a |an )?(new )?(folder|file|skill|hook)\b/i,
  /\bmake (a |an )?(new )?(folder|file|skill|hook)\b/i,
  /\bset up (a |an |the )?(folder|structure|skill|hook)\b/i,
  // Added 2026-05-24 per Audit 2 finding + AGENT_STATE.md miss (Task #21)
  /\blet'?s formalize\b/i,
  /\bformalize (X |this )?as (a |new |the )?(file|pattern|doc|skill|rule|policy|standard)\b/i,
  /\bcodify (X |this |it )?as\b/i,
  /\badopt (X |this )?as (a |the |new )?(pattern|standard|rule|policy|file)\b/i,
  /\bshould we have a (new )?(file|pattern|doc|skill|standard)\b/i,
  /\bwe need a (new )?(file|pattern|doc|skill|policy)\b/i,
  /\blet'?s add (a |an )?[A-Z][A-Z_]+\.md\b/,  // catches "let's add AGENT_STATE.md" style
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
      '⚙️  inventory-first-gate: new-structure proposal detected',
      '',
      'Before designing or proposing new structure (folder / file / skill / hook):',
      '  1. Read meta/INDEX.md + relevant sub-INDEX (discipline/honesty/enforcement/user-side)',
      '  2. Read existing nearby files in the candidate target layer',
      '  3. Ask: does an existing component cover this? Can it be EXTENDED instead of CREATED?',
      '  4. Only propose new if inventory genuinely returns "no fit"',
      '',
      'Rule: feedback_inventory_first.md — "Merge > proliferate. Read > assume."',
      'Recursion: this same loop applies to NEW skills/hooks (inventory existing primitives first).',
      '',
    ].join('\n');

    process.stdout.write(context);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
