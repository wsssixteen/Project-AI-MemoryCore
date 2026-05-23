/**
 * evolution-check-trigger.js — SessionStart hook
 *
 * Phase 7 of meta-layer build (2026-05-23). v1 minimum: emits a reminder
 * about evolution-check status at boot. v2 will do actual date-math +
 * model-ID change detection.
 *
 * Reads meta/evolution-protocol.md state for last-evolution-check date.
 * If >30 days elapsed, surfaces flag. Else emits silent confirmation.
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PROTOCOL_FILE = path.join(PROJECT_ROOT, 'meta', 'evolution-protocol.md');

try {
  if (!fs.existsSync(PROTOCOL_FILE)) {
    process.exit(0);  // meta-layer not yet built; silent
  }

  const content = fs.readFileSync(PROTOCOL_FILE, 'utf8');

  // Extract last-evolution-check date
  const dateMatch = content.match(/last-evolution-check:\s*(\d{4}-\d{2}-\d{2})/);
  const dueMatch = content.match(/next-elapsed-check-due:\s*(\d{4}-\d{2}-\d{2})/);

  if (!dateMatch) {
    process.exit(0);  // No date; silent
  }

  const lastCheck = new Date(dateMatch[1]);
  const now = new Date();
  const elapsedDays = Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24));

  if (elapsedDays >= 30) {
    const lines = [
      '',
      `⚙️  evolution-check-trigger: ⚠️ ${elapsedDays} days since last evolution check`,
      `   Last check: ${dateMatch[1]} · Next due: ${dueMatch ? dueMatch[1] : 'overdue'}`,
      '',
      'Anthropic may have shipped new features (hooks / skills / tools) since.',
      'Invoke evolution-check skill manually: "check Anthropic updates" / "evolution check"',
      'See meta/evolution-protocol.md',
      '',
    ];
    process.stdout.write(lines.join('\n'));
  } else {
    // Silent — within window
  }

  process.exit(0);
} catch (e) {
  process.exit(0);
}
