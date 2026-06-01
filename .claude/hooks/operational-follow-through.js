/**
 * operational-follow-through.js — Stop hook
 *
 * PURPOSE: Catch the slip "ending a turn with a promise of future action
 * Ruri could have done THIS turn." A9 rule says every emit gets a
 * `Next operational step ✓ done / ⬜ pending: <action>` line; this hook
 * warns when ⬜ pending is named with an action that looks executable.
 *
 * v1.1 (2026-06-01 S5, per みや Item D): MODE-SCOPED — fires ONLY in
 * Quest-active mode. Outside Quest-active (Discussion / planning / off-quest
 * work) the rule produces noise without value, so this hook silences itself.
 * Mode determined by reading quest/active.txt for ≥1 block with status=active
 * AND NOT (phase=1 AND local_test_confirmed=true). Same predicate as
 * mode-detector.js + quest-active-grounding.js — shared definition.
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
const ACTIVE_TXT = path.join(projectRoot, 'quest', 'active.txt');

// v1.1 mode-scope: shared with mode-detector.js + quest-active-grounding.js
function isQuestActiveMode() {
  let text;
  try { text = fs.readFileSync(ACTIVE_TXT, 'utf-8'); } catch { return false; }
  // Parse blocks: split on blank lines, each block is paragraph of `key=value` lines
  const blocks = [];
  let current = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line === '') { if (current.length) { blocks.push(current); current = []; } }
    else current.push(line);
  }
  if (current.length) blocks.push(current);
  for (const block of blocks) {
    const fieldOf = (k) => {
      for (const ln of block) {
        const s = ln.replace(/^\s+/, '');
        if (s.startsWith(k + '=')) return s.slice(k.length + 1).trim();
      }
      return null;
    };
    if (!block.some(l => /^\s*qa=/.test(l))) continue;
    if (fieldOf('status') !== 'active') continue;
    const phase = fieldOf('phase');
    const ltc = fieldOf('local_test_confirmed');
    if (phase === '1' && (ltc === 'true' || ltc === 'yes')) continue; // past testing
    return true;
  }
  return false;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    // v1.1 mode-scope: silent when outside Quest-active mode (per みや Item D 2026-06-01 S5)
    if (!isQuestActiveMode()) process.exit(0);

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
