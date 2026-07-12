/**
 * boot-load-verification.js — SessionStart hook
 *
 * Injects a context block reminding Ruri to read the 4 boot files
 * (CLAUDE.md, personality.md, main/main-memory.md, expansion-protocol.md)
 * BEFORE any work this session.
 *
 * Per 2026-05-17 boot-load-verification rule.
 * 2026-07-12 (external-audit P0.3): master-memory.md → main/main-memory.md
 * (master-memory tombstoned from boot; boot loads identity directly).
 * Same pass: claude-md-amendments.md dropped from the list — sanctioned
 * pending edit since 2026-06-02 (file emptied, boot-load removed per みや).
 */
process.stdout.write([
  '',
  '⚙️  SESSION BOOT — required reads before any work:',
  '',
  '  1. .claude/CLAUDE.md',
  '  2. .claude/personality.md',
  '  3. main/main-memory.md',
  '  4. Feature/Domain-Expansion/expansion-protocol.md',
  '',
  'Emit "Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓"',
  'AFTER actually Reading each file. Then deliver Session Briefing.',
  '',
].join('\n'));
process.exit(0);
