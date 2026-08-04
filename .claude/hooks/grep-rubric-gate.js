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
 *
 * v1.1 (2026-08-05) — ZERO-MATCH advisory added, from the QA-273294 bounty.
 *   An empty result set is evidence the PATTERN did not match, NOT evidence the
 *   thing is absent — but it gets reported as a finding. Twice verified:
 *   `setUrusanCode(` missed by a case-sensitive pattern while the setter sat 27
 *   lines away, and `receiveUserTask` missed because the source HTML-escapes it.
 *   Source cluster: `assume-not-verify` (17, largest un-actioned) + the new
 *   `absence-claimed-from-unmatched-pattern`. Fires on 0 matches regardless of
 *   output_mode, and names the case-sensitivity and escaping traps specifically.
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
  const lines = [];

  // v1.1 — ZERO-MATCH check runs FIRST and for every output_mode: a search that
  // found nothing is the one whose result is most often over-read.
  //
  // tool_response is a STRUCTURED OBJECT, not the "No files found" string the
  // transcript shows. Captured live 2026-08-05:
  //   files_with_matches → {mode, filenames:[], numFiles:0, totalFiles:0}
  //   content            → {mode, numFiles:0, filenames:[], content:"", numLines:0, totalLines:0}
  // The first draft of this check regex'd the display string and could never fire —
  // which is the very mistake it exists to catch, so it is written from the captured
  // payload and the string test is kept only as a fallback.
  const resp = payload.tool_response;
  let zero = false;
  if (resp && typeof resp === 'object') {
    if (typeof resp.numFiles === 'number') zero = resp.numFiles === 0;
    else if (Array.isArray(resp.filenames)) zero = resp.filenames.length === 0;
    else if (typeof resp.numLines === 'number') zero = resp.numLines === 0;
  } else if (typeof resp === 'string') {
    zero = /no (matches|files) found/i.test(resp);
  }
  if (zero) {
    const pat = String(input.pattern || '');
    lines.push(`⚠️  grep-rubric-gate: ZERO matches for /${pat}/ — that is not evidence of absence.`);
    lines.push('   An empty result means THIS PATTERN did not match THIS corpus. Before asserting the thing');
    lines.push('   does not exist: run the pattern against a case you KNOW is positive. If it stays dark there,');
    lines.push('   the pattern is wrong, not the codebase. Usual culprits: case (-i), HTML-escaped source,');
    lines.push('   a setter/getter spelling you did not search, or a path/glob that excluded the file.');
  }

  const outputMode = input.output_mode || 'files_with_matches'; // Grep tool default
  const narrowed = !!(input.path || input.glob || input.type);
  if (outputMode === 'content' && !narrowed) {
    lines.push('⚠️  grep-rubric-gate: unscoped content-mode grep (no path/glob/type).');
    lines.push('   Prefer files_with_matches first, then narrow with path/glob/type before content mode.');
  }

  if (!lines.length) return;

  // Bare console.log does NOT reach the model on PostToolUse — it needs the
  // hookSpecificOutput envelope. v1.0 used console.log, so its advisory has never
  // once surfaced: registered, firing, output discarded. (Found 2026-08-05 by
  // running a real zero-match grep and seeing nothing come back.)
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: lines.join('\n') },
  }));
}

try { main(); } catch (e) {
  process.stderr.write(`grep-rubric-gate error: ${e.message}\n`);
}
