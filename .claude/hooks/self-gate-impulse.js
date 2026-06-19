// meta-layer-audit: skip-ghost-check — RETIRED 2026-06-18 (superseded by design-consult-gate + convention-check-gate v1.2); file kept as historical reference, intentionally NOT registered in settings.json. The skip-marker stops the boot audit re-flagging it as a ghost every session.
/**
 * self-gate-impulse.js — PreToolUse hook (matcher: Edit|Write)
 *
 * Blocks system-tier file edits unless a Refine Block / Design Memo
 * marker was written to a session-state file by Ruri BEFORE the edit.
 * The state-file flag is set via a separate `set-self-gate` Bash command;
 * Ruri must explicitly assert "I've emitted the design doc" before editing.
 *
 * v1: WARN only (writes to stderr, allows edit). v1.1: BLOCK with exit 2
 * once trigger reliability is observed. みや's discipline change 2026-05-20.
 *
 * System-tier file patterns blocked (note: glob patterns described in plain text to avoid breaking JSDoc):
 *   .claude/CLAUDE.md, .claude/personality.md, .claude/claude-md-amendments.md
 *   .claude/skills/[X]/SKILL.md, .claude/hooks/[X].js
 *   quest/quest-protocol.md, quest/notes.js, quest/redmine-sync.js
 *   Feature/[X]/SKILL.md, Feature/[X]/[Y]-protocol.md
 *   main/main-memory.md, master-memory.md
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const failureLog = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'self-gate-log.jsonl');

const SYSTEM_PATTERNS = [
  /\.claude\/CLAUDE\.md$/, /\.claude\/personality\.md$/, /\.claude\/claude-md-amendments\.md$/,
  /\.claude\/skills\/[^/]+\/SKILL\.md$/, /\.claude\/hooks\/[^/]+\.js$/,
  /\.claude\/settings\.local\.json$/,
  /quest\/quest-protocol\.md$/, /quest\/notes\.js$/, /quest\/redmine-sync\.js$/,
  /Feature\/[^/]+\/[A-Za-z0-9-]+-protocol\.md$/, /Feature\/[^/]+\/SKILL\.md$/,
  /main\/main-memory\.md$/, /master-memory\.md$/,
  /Feature\/Domain-Expansion\/expansion-protocol\.md$/,
];

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool_name || data.tool || '';
    if (tool !== 'Edit' && tool !== 'Write') process.exit(0);
    const filePath = (data.tool_input && (data.tool_input.file_path || data.tool_input.path)) || '';
    const rel = filePath.replace(/\\/g, '/').replace(/.*?(\/\.claude\/|\/quest\/|\/Feature\/|\/main\/|\/master-memory)/, '$1').replace(/^\//, '');
    const isSystem = SYSTEM_PATTERNS.some(p => p.test(rel));
    if (!isSystem) process.exit(0);

    // System file edit detected — emit warning + log
    const entry = { ts: new Date().toISOString(), tool, file: filePath, action: 'warn-only-v1' };
    try { fs.appendFileSync(failureLog, JSON.stringify(entry) + '\n'); } catch (_) {}
    process.stderr.write(`\n⚠️  self-gate: editing system file ${rel}. Per A8 rule, this should have been preceded by a Refine Block / Design Memo + みや's nod. v1=warn-only; v1.1 will block.\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
