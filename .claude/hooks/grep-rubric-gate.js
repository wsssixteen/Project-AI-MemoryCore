/**
 * grep-rubric-gate.js — PostToolUse hook (matcher: Grep)
 *
 * WHY: unscoped content-mode greps are the #1 single-tool token spike
 *   (cost-efficiency v2). A Grep with output_mode="content" and no
 *   path/glob/type narrowing dumps every matching line repo-wide —
 *   often the largest single tool-result in a session.
 *
 * WHAT: reads tool_input from stdin. If output_mode is "content" AND
 *   neither `path`, `glob`, nor `type` was supplied to narrow the search,
 *   emits a <=2-line advisory suggesting files_with_matches first, then
 *   narrow with path/glob/type. Silent otherwise (files_with_matches /
 *   count modes, or any narrowing present).
 *
 * CAN: advise via stdout.
 * CANNOT: block or modify the tool call — advisory only, fail-open.
 *
 * Bypass: none needed — advisory never blocks.
 */
const fs = require('fs');

function readStdin() {
  try { return fs.readFileSync(0, 'utf-8'); } catch { return ''; }
}

function main() {
  const raw = readStdin();
  if (!raw) return;

  let payload;
  try { payload = JSON.parse(raw); } catch { return; }

  const input = payload.tool_input || {};
  const outputMode = input.output_mode || 'files_with_matches'; // Grep tool default
  if (outputMode !== 'content') return;

  const narrowed = !!(input.path || input.glob || input.type);
  if (narrowed) return;

  console.log('⚠️  grep-rubric-gate: unscoped content-mode grep (no path/glob/type).');
  console.log('   Prefer files_with_matches first, then narrow with path/glob/type before content mode.');
}

try { main(); } catch (e) {
  process.stderr.write(`grep-rubric-gate error: ${e.message}\n`);
}
