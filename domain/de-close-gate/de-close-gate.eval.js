#!/usr/bin/env node
// de-close-gate.eval.js — replay eval (born WITH the component).
// Replay: 2026-08-20 QA-276182 — touched all session, no active.txt block, invisible to 12.6.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'de-close-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const CLOSE_BANNER = '═══ [ Domain Expansion — closed ] ═══\nBarrier settles. Quest threads are at rest.';
const FRESH_LOG = [JSON.stringify({ ts: new Date().toISOString(), via: 'resume-readiness', checked: 2, gaps: 0 })];
const STALE_LOG = [JSON.stringify({ ts: '2026-08-01T00:00:00Z', via: 'resume-readiness', checked: 2, gaps: 0 })];

function run(overrides) {
  const stdin = JSON.stringify(Object.assign({
    transcript_path: '',
    _testEvents: [
      { kind: 'tool', name: 'Bash', blob: 'git commit -m "Ref QA-276182 fix"' },
      { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
    ],
    _testActiveText: 'qa=QA-276182\nstatus=active\n',
    _testArchiveText: '',
    _testLogLines: FRESH_LOG,
    _testSessionLineCount: 56,
  }, overrides));
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}

// F1: non-DE turn -> silent
let r = run({ _testEvents: [{ kind: 'text', role: 'assistant', text: 'normal reply, no banner' }] });
check('F1 non-DE turn -> silent', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: ticket touched via tool call, NO block anywhere -> BLOCK naming the id
r = run({ _testActiveText: 'qa=QA-111111\n', _testArchiveText: '' });
check('F2 blockless touched ticket -> BLOCK', r.status === 2 && /QA-276182/.test(r.stderr || ''), 'exit=' + r.status);

// F3: all conditions hold -> pass (exit 0)
r = run({});
check('F3 all conditions hold -> pass', r.status === 0, 'exit=' + r.status);

// F4: bypass token -> silent
r = run({ _testEvents: [
  { kind: 'tool', name: 'Bash', blob: 'git commit -m "Ref QA-276182 fix"' },
  { kind: 'text', role: 'assistant', text: CLOSE_BANNER + '\n[skip-de-close-gate: test]' },
], _testActiveText: '' });
check('F4 bypass -> silent', r.status === 0, 'exit=' + r.status);

// F5: resume-readiness stale -> BLOCK (C2)
r = run({ _testLogLines: STALE_LOG });
check('F5 stale resume-readiness -> BLOCK', r.status === 2 && /C2/.test(r.stderr || ''), 'exit=' + r.status);

// F6: session file over 500 lines -> BLOCK (C3)
r = run({ _testSessionLineCount: 1665 });
check('F6 untrimmed session file -> BLOCK', r.status === 2 && /C3/.test(r.stderr || ''), 'exit=' + r.status);

// F7: mention-only below floor (passing reference) -> NOT counted as touched -> pass
r = run({ _testEvents: [
  { kind: 'text', role: 'assistant', text: 'colleague ticket QA-999998 mentioned once' },
  { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
], _testActiveText: 'qa=QA-000001\n' });
check('F7 passing mention -> not touched -> pass', r.status === 0, 'exit=' + r.status);

// F8: archived ticket (block in active-archive.txt) -> pass
r = run({ _testActiveText: '', _testArchiveText: 'qa=QA-276182\nstatus=closed\n' });
check('F8 archived block counts -> pass', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nde-close-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
