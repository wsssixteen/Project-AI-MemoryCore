/**
 * operational-follow-through.js — Stop hook
 *
 * Scans Ruri's reply for "Next operational step ⬜ pending:" patterns
 * (per A9 rule). If a pending action is named that could have been
 * executed in-turn (e.g. a shell command, file read, grep), emit
 * warning to stderr.
 *
 * v1: warn-only. v1.1: block stop (exit 2) once trigger reliability
 * confirmed AND we have a safe loop-limit.
 *
 * Cure for Hermes-style "never end a turn with a promise of future action"
 * — see research findings 2026-05-20.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'follow-through-log.jsonl');

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    // Stop hook may give last assistant message in different shapes
    const text = JSON.stringify(data);

    // Look for unresolved pending markers
    const pendingMatch = text.match(/Next operational step\s*⬜\s*pending\s*:?\s*([^"\\]+?)(?:\\n|"|$)/i);
    if (!pendingMatch) process.exit(0);

    const pending = pendingMatch[1].trim().substring(0, 200);

    // Determine if pending looks executable (heuristic: starts with verb / command-shape)
    const isExecutable = /^(run|tail|grep|read|check|verify|test|fetch|query|git |node |python |bash )/i.test(pending);

    const entry = {
      ts: new Date().toISOString(),
      pending: pending,
      executable_hint: isExecutable,
      action: 'warn-only-v1',
    };
    try { fs.appendFileSync(logPath, JSON.stringify(entry) + '\n'); } catch (_) {}

    process.stderr.write(`\n⚠️  follow-through: reply ends with pending action — ${pending.substring(0, 100)}${pending.length > 100 ? '...' : ''}\n`);
    if (isExecutable) {
      process.stderr.write(`   Looks executable — Ruri should have run it this turn (Hermes rule: never end a turn with a promise of future action).\n`);
    }
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
