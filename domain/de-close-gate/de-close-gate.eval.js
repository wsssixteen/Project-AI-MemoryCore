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
const FRESH_RECON = [JSON.stringify({ ts: new Date().toISOString(), action: 'reconcile-ran', detail: 'open=11' })];
const STALE_RECON = [JSON.stringify({ ts: '2026-08-01T00:00:00Z', action: 'reconcile-ran', detail: 'open=20' })];

function run(overrides) {
  const stdin = JSON.stringify(Object.assign({
    transcript_path: '',
    _testEvents: [
      { kind: 'tool', name: 'Bash', blob: 'git commit -m "Ref QA-276182 fix"' },
      { kind: 'tool', name: 'Edit', blob: '{"file_path":"projects/coding-projects/active/QA-276182/QA-276182.md"}' },
      { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
    ],
    _testActiveText: 'qa=QA-276182\nstatus=active\n',
    _testArchiveText: '',
    _testLogLines: FRESH_LOG,
    _testGateLogLines: FRESH_RECON,
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

// F9 (first-fire replay): ticket id ONLY inside an eval-file write -> fixture, not touched -> pass
r = run({ _testEvents: [
  { kind: 'tool', name: 'Write', blob: '{"file_path":"domain/x/x.eval.js","content":"run(QA-111111) run again QA-111111"}' },
  { kind: 'tool', name: 'Bash', blob: 'node domain/x/x.eval.js QA-111111' },
  { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
], _testActiveText: 'qa=QA-000001\n' });
check('F9 eval-fixture ids ignored -> pass', r.status === 0, 'exit=' + r.status);

// F10 (first-fire replay): single typo'd tool call (QA-276422 class) -> not touched -> pass
r = run({ _testEvents: [
  { kind: 'tool', name: 'Bash', blob: 'node quest/active-cli.js update QA-276422 local_test_confirmed=true' },
  { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
], _testActiveText: 'qa=QA-000001\n' });
check('F10 single tool occurrence ignored -> pass', r.status === 0, 'exit=' + r.status);

// F11 (2026-08-21 replay): redmine-reconcile NEVER ran -> BLOCK (C4) naming the fix command
r = run({ _testGateLogLines: [] });
check('F11 no redmine-reconcile -> BLOCK', r.status === 2 && /C4/.test(r.stderr || '') && /redmine-reconcile/.test(r.stderr || ''), 'exit=' + r.status);

// F12: stale reconcile row (>12h) -> BLOCK (C4)
r = run({ _testGateLogLines: STALE_RECON });
check('F12 stale reconcile -> BLOCK', r.status === 2 && /C4/.test(r.stderr || ''), 'exit=' + r.status);

// F13: gate log holds blocked/passed rows but a fresh reconcile-ran too -> pass (row-type filter)
r = run({ _testGateLogLines: [JSON.stringify({ ts: new Date().toISOString(), action: 'blocked', detail: 'C1' })].concat(FRESH_RECON) });
check('F13 mixed gate log with fresh reconcile -> pass', r.status === 0, 'exit=' + r.status);

// F14/F15 — C5 watch discipline (plan §M M5, 2026-09-06): an Edit on lib/x.js with no watch row → BLOCK; with a watch row → pass
const c5base = {}; // defaults from run(): close banner + fresh logs + trimmed session
const c5events = [
  { kind: 'tool', name: 'Bash', blob: 'git commit -m "Ref QA-276182 fix"' },
  { kind: 'tool', name: 'Edit', blob: '{"file_path":"projects/coding-projects/active/QA-276182/QA-276182.md"}' },
  { kind: 'tool', name: 'Edit', input: { file_path: 'C:/repo/lib/x.js' }, blob: '{"file_path":"C:/repo/lib/x.js"}', ts: '2026-09-06T10:00:00Z' },
  { kind: 'text', role: 'assistant', text: CLOSE_BANNER },
];
r = run({ ...c5base, _testEvents: c5events, _testWatchLines: [], _testSessionStartMs: Date.parse('2026-09-06T09:00:00Z') });
check('F14 system edit without watch row -> BLOCK C5', r.status === 2 && /C5/.test(r.stderr || '') && /lib\/x\.js/.test(r.stderr || ''), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 100));
r = run({ ...c5base, _testEvents: c5events, _testWatchLines: [JSON.stringify({ kind: 'watch', id: 'w1', ts: '2026-09-06T10:05:00Z', target: 'lib/x.js', observe: 'x', sessions_left: 3 })], _testSessionStartMs: Date.parse('2026-09-06T09:00:00Z') });
check('F15 system edit with watch row -> pass', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 100));
r = run({ ...c5base, _testEvents: c5events, _testWatchLines: [JSON.stringify({ kind: 'watch', id: 'w0', ts: '2026-09-01T10:05:00Z', target: 'lib/x.js', observe: 'old', sessions_left: 3 })], _testSessionStartMs: Date.parse('2026-09-06T09:00:00Z') });
check('F16 stale watch row from an older session does not count -> BLOCK', r.status === 2 && /C5/.test(r.stderr || ''), 'exit=' + r.status);

// F14: malformed rows in gate log ignored, fresh row still found -> pass
r = run({ _testGateLogLines: ['not-json', '{broken'].concat(FRESH_RECON) });
check('F14 malformed gate-log rows tolerated -> pass', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nde-close-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
