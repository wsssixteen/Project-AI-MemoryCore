/**
 * claude-md-edit-guard.js — PreToolUse Edit|Write hook
 *
 * PURPOSE: detect HARD-RULE-block-bloat pattern + /system-rules ↔
 * /system-design content duplication BEFORE the edit lands.
 *
 * Fires on edits to:
 *   - .claude/CLAUDE.md
 *   - .claude/skills/system-rules/SKILL.md
 *   - .claude/skills/system-design/SKILL.md
 *
 * Created 2026-06-02 per みや — pattern: bloat keeps regrowing via
 * Why/How/Banned/Cross-ref scaffolding around the actual rule clause.
 * Enforces /system-rules Rule 2 (merge in place) at edit-time.
 */
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'claude-md-edit-guard.log.jsonl');

const TARGET_PATHS = [
  /CLAUDE\.md$/,
  /skills[\\\/]system-rules[\\\/]SKILL\.md$/,
  /skills[\\\/]system-design[\\\/]SKILL\.md$/,
];

const BLOAT_PATTERNS = [
  { name: 'HARD-RULE block opener', re: /🚨 .{5,80}HARD RULE/i },
  { name: 'Why+QA-NNN narrative paragraph', re: /\*\*Why\*\*[^.]{0,40}\(QA-?\d+/i },
  { name: 'Cross-ref scaffolding (pairs with)', re: /\bpairs with\b[\s\S]{0,200}(rule|hook|skill|gate)/i },
  { name: 'How to apply restating the rule', re: /\*\*How to apply\*\*:/i },
  { name: 'みや verbatim quote inside rule body', re: /みや:?\s*\*?\"[\s\S]{20,400}\*?\"/i },
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || '';
    const newContent = data.tool_input?.new_string || data.tool_input?.content || '';

    const isTarget = TARGET_PATHS.some(re => re.test(filePath));
    if (!isTarget) process.exit(0);

    const flags = [];
    BLOAT_PATTERNS.forEach(p => {
      if (p.re.test(newContent)) flags.push(p.name);
    });

    if (flags.length === 0) process.exit(0);

    try {
      fs.appendFileSync(LOG, JSON.stringify({
        ts: new Date().toISOString(),
        file: filePath,
        flags,
      }) + '\n');
    } catch {}

    const warning = [
      '',
      '⚠️  claude-md-edit-guard: bloat pattern(s) detected in this edit',
      '',
      ...flags.map(f => `   • ${f}`),
      '',
      'Per /system-rules Rule 2 (merge in place): keep the rule clause +',
      'concrete example + Banned. Drop Why/Cross-ref/quote scaffolding.',
      'Per /system-design Bloat-prevention default: invoke merge-in-place',
      'discipline before sending the edit.',
      '',
      'Self-check: if removing the flagged section doesn\'t change behavior,',
      'it\'s scaffolding — drop it.',
      '',
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: warning },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
