/**
 * file-list-after-refine.js — Stop hook
 *
 * Per A7 rule: every Refine Block / Design Memo / multi-file edit pass
 * MUST be followed by a file-list table emitted in the same turn.
 *
 * This hook scans the reply for those triggers + checks for a matching
 * file-list table. Logs mismatch + emits stderr warning.
 *
 * v1: warn-only. v1.1: block stop if mismatch.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const logPath = path.join(projectRoot, 'Feature', 'Forge-Self-Improvement-System', 'file-list-log.jsonl');

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const text = JSON.stringify(data);

    const refineHit = /═══\s*REFINE\b/i.test(text) || /═══\s*DESIGN MEMO\b/i.test(text);
    const fileListHit = /\|\s*File\s*\|\s*Change\s*\|/i.test(text) || /file-?list/i.test(text);

    if (!refineHit) process.exit(0);
    if (refineHit && fileListHit) process.exit(0); // both present, good

    const entry = {
      ts: new Date().toISOString(),
      refine_block: refineHit,
      file_list: fileListHit,
      action: 'warn-only-v1',
    };
    try { fs.appendFileSync(logPath, JSON.stringify(entry) + '\n'); } catch (_) {}

    process.stderr.write(`\n⚠️  file-list: Refine Block / Design Memo emitted without paired file-list table (per A7).\n`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
