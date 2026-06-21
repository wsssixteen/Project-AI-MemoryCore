/**
 * known-bug-surfacer.hook.js — PreToolUse Read|Edit|Write hook (scan Power).
 *
 * When a Read/Edit/Write targets an etanah `.java` file that has recorded known
 * bugs in `domain/scan/known-bugs.jsonl` (status != "fixed"), surface them NOW —
 * so a pre-existing defect in the area being touched is in front of you, not
 * discovered hours later. This is the "load known bugs every time we work the
 * area" wiring (per みや): /scan --record writes the store, this reads it.
 *
 * Advisory only (additionalContext). Fail-OPEN — a surfacer must never block a read.
 * Log: domain/scan/log.jsonl
 */
'use strict';
const fs = require('fs');
const path = require('path');
const KNOWN = path.join(__dirname, 'known-bugs.jsonl');
const LOG = path.join(__dirname, 'log.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const ti = data.tool_input || {};
    const fp = ti.file_path || ti.path || '';
    if (!/\.java$/i.test(fp)) process.exit(0);
    if (!fs.existsSync(KNOWN)) process.exit(0);
    const base = path.basename(fp);
    const rows = fs.readFileSync(KNOWN, 'utf8').split(/\r?\n/).filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
    const hits = rows.filter(r => r.file === base && r.status !== 'fixed');
    if (!hits.length) process.exit(0);
    const lines = ['', '⚠️  /scan KNOWN BUGS in ' + base + ' — ' + hits.length + ' recorded (domain/scan/known-bugs.jsonl):'];
    for (const h of hits.slice(0, 8)) lines.push('   ' + base + ':' + h.line + '  [' + h.tool + ' ' + h.rule + ']  ' + String(h.msg || '').slice(0, 72));
    lines.push('   → if your change is near these, address or confirm them; mark status:"fixed" when resolved.');
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), surfacer: base, hits: hits.length }) + '\n'); } catch (_) {}
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: lines.join('\n') } }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
