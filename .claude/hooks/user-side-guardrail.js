/**
 * user-side-guardrail.js — UserPromptSubmit hook
 *
 * The USER-SIDE counterpart to prose-default-gate.js (which targets Ruri's
 * response shape). This hook targets みや's prompt patterns that would
 * push Ruri into clunky designs — and surfaces "are you sure this triggers
 * a design pass?" + offers shape options to みや BEFORE Ruri acts.
 *
 * Created 2026-05-23 — Phase 5 of meta-layer build.
 * Origin: みや's Stage 3d insight — meta-layer needs guardrails on HOW
 * he uses Ruri, not just guardrails on Ruri's behavior.
 *
 * Pattern: detect intent (new-structure / lock-rule / direct-instruction),
 * inject GUIDANCE for みや (not just for Ruri) suggesting alternatives.
 */
const TRIGGERS = [
  // New-structure intent
  { re: /\blet'?s (add|create|make) (a |an |the )?(new )?(folder|file|skill|hook|directory|module|structure)\b/i, kind: 'new-structure' },
  { re: /\bI want (a |an |the )?(new )?(folder|file|skill|hook|module)\b/i, kind: 'new-structure' },
  { re: /\bcan you (add|create|make) (a |an )?(new )?(folder|file)\b/i, kind: 'new-structure' },
  // Lock-rule intent
  { re: /\bhardcode (it|this|that)\b/i, kind: 'lock-rule' },
  { re: /\bmake (it|this|that) a (hard )?rule\b/i, kind: 'lock-rule' },
  { re: /\bnever miss (this|it|that) again\b/i, kind: 'lock-rule' },
  { re: /\block (this|it|that) in\b/i, kind: 'lock-rule' },
  // Direct-prose intent (most likely to slip)
  { re: /\badd (it|this) to CLAUDE\.md\b/i, kind: 'direct-prose' },
  { re: /\bput (it|this) in personality\.md\b/i, kind: 'direct-prose' },
  { re: /\bcreate (a )?feedback (file|entry|md)\b/i, kind: 'direct-prose' },
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';
    const hits = TRIGGERS.filter(t => t.re.test(prompt));
    if (hits.length === 0) process.exit(0);

    const kinds = [...new Set(hits.map(h => h.kind))];

    const lines = [
      '',
      '⚙️  user-side-guardrail: design-intent detected in みや\'s prompt',
      `   Kind(s): ${kinds.join(', ')}`,
      '',
      'GUIDANCE for みや (not for Ruri) — alternatives to consider before proceeding:',
      '',
    ];

    if (kinds.includes('new-structure')) {
      lines.push('  📁 NEW STRUCTURE intent:');
      lines.push('     - Have you checked meta/INDEX.md for an existing layer that could cover this?');
      lines.push('     - Could an existing component be EXTENDED instead of CREATED?');
      lines.push('     - inventory-first principle: merge > proliferate');
      lines.push('');
    }
    if (kinds.includes('lock-rule')) {
      lines.push('  🔒 LOCK-RULE intent:');
      lines.push('     - This will route through meta-design-router (skill or hook decision)');
      lines.push('     - Decision criteria: MUST fire → hook · Conditional → skill · Judgment → CLAUDE.md/personality.md');
      lines.push('     - Cite the slip evidence so the gate fires for a real pattern, not a single observation');
      lines.push('');
    }
    if (kinds.includes('direct-prose')) {
      lines.push('  ⚠️ DIRECT-PROSE intent (highest-risk):');
      lines.push('     - "Add to CLAUDE.md / personality.md / new feedback file" = the prose-doesn\'t-fire trap');
      lines.push('     - Default-to-prose path is BANNED unless the rule is genuinely judgment/style only');
      lines.push('     - Route through meta-design-router instead — Ruri will propose the right shape');
      lines.push('');
    }

    lines.push('See MIYA-NOTEBOOK.md for the full usage guide.');
    lines.push('');

    process.stdout.write(lines.join('\n'));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
