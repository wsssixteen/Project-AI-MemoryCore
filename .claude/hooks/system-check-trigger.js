/**
 * system-check-trigger.js — SessionStart hook
 *
 * Mirrors evolution-check-trigger.js pattern for the system-check skill.
 * Reads meta/evolution-protocol.md for `last-system-check` timestamp;
 * if >30 days elapsed, surfaces flag at boot.
 *
 * Created 2026-05-24 — paired with .claude/skills/system-check/SKILL.md.
 * Cadence: 30 days (calibrate over first 3 runs based on observed value).
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PROTOCOL_FILE = path.join(PROJECT_ROOT, 'meta', 'evolution-protocol.md');
const CADENCE_DAYS = 30;

try {
  if (!fs.existsSync(PROTOCOL_FILE)) {
    process.exit(0);  // meta-layer not yet built; silent
  }

  const content = fs.readFileSync(PROTOCOL_FILE, 'utf8');

  // Extract last-system-check date (might not exist yet on first read)
  const dateMatch = content.match(/last-system-check:\s*(\d{4}-\d{2}-\d{2})/);

  if (!dateMatch) {
    // Never run before — flag the absence
    const lines = [
      '',
      '⚙️  system-check-trigger: ⚠️ no `last-system-check` recorded in meta/evolution-protocol.md',
      '',
      'system-check has never been run. Recommend running this session to establish baseline.',
      'Invoke: "/system-check" or "audit the system" or "deep audit"',
      'Skill: .claude/skills/system-check/SKILL.md',
      '',
    ];
    process.stdout.write(lines.join('\n'));
    process.exit(0);
  }

  const lastCheck = new Date(dateMatch[1]);
  const now = new Date();
  const elapsedDays = Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24));

  if (elapsedDays >= CADENCE_DAYS) {
    const lines = [
      '',
      `⚙️  system-check-trigger: ⚠️ ${elapsedDays} days since last system-check (cadence: ${CADENCE_DAYS} days)`,
      `   Last check: ${dateMatch[1]}`,
      '',
      'Architectural drift may have accumulated. Recommend running comprehensive deep-audit.',
      'Invoke: "/system-check" or "audit the system" or "deep audit"',
      'Skill: .claude/skills/system-check/SKILL.md',
      '',
    ];
    process.stdout.write(lines.join('\n'));
  }
  // else silent — within cadence window

  process.exit(0);
} catch (e) {
  process.exit(0);
}
