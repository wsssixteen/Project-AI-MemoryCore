/**
 * boot-load-verification.js — SessionStart hook
 *
 * Injects a context block reminding Ruri to read the 4 boot files
 * (CLAUDE.md, personality.md, master-memory.md, expansion-protocol.md)
 * + claude-md-amendments.md BEFORE any work this session.
 *
 * Per 2026-05-17 boot-load-verification rule.
 */
process.stdout.write([
  '',
  '⚙️  SESSION BOOT — required reads before any work:',
  '',
  '  1. .claude/CLAUDE.md',
  '  2. .claude/personality.md',
  '  3. master-memory.md',
  '  4. Feature/Domain-Expansion/expansion-protocol.md',
  '  5. .claude/claude-md-amendments.md  (auto-loaded amendments)',
  '',
  'Emit "Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · master-memory.md ✓ · expansion-protocol.md ✓ · amendments ✓"',
  'AFTER actually Reading each file. Then deliver Session Briefing.',
  '',
].join('\n'));
process.exit(0);
