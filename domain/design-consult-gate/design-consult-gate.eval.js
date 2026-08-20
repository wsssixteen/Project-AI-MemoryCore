#!/usr/bin/env node
// design-consult-gate.eval.js — fixture eval (added 2026-08-21 with the self-disarm fix).
// Replay: 2026-08-20/21 — the gate's own help text ("Add [skip-design-consult: <reason>]")
// in an earlier block message auto-bypassed every later fire for the whole session.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'design-consult-gate.gate.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function transcript(entries) {
  const p = path.join(os.tmpdir(), 'dcg-eval-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, entries.map(e => JSON.stringify({ type: e.role, message: { role: e.role, content: [{ type: 'text', text: e.text }] } })).join('\n') + '\n');
  return p;
}
function run(filePath, entries) {
  const stdin = JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath, content: 'x' }, transcript_path: transcript(entries) });
  const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
  let deny = false, out = r.stdout || '';
  try { const o = JSON.parse(out); deny = o.hookSpecificOutput && o.hookSpecificOutput.permissionDecision === 'deny'; } catch (_) {}
  return { deny, out, status: r.status };
}

const GUARDED_PATH = 'C:\\repo\\domain\\some-gate\\some-gate.check.hook.js';
// A guarded path whose file EXISTS on disk — bypasses the new-file eval rider so
// T2/T4 test the consult branch alone.
const EXISTING_GUARDED = path.join(__dirname, 'design-consult-gate.gate.hook.js');
const HELP_TEXT = 'blocked: Add [skip-design-consult: <reason>] to your message.';

// T1 REPLAY: token only inside an OLD hook-feedback (user-role) message -> still BLOCKS
let r = run(GUARDED_PATH, [
  { role: 'user', text: HELP_TEXT },
  { role: 'assistant', text: 'working on it' },
  { role: 'user', text: 'continue' },
]);
check('T1 help-text echo does NOT disarm -> BLOCK', r.deny === true, JSON.stringify(r).slice(0, 80));

// T2: token deliberately written in CURRENT-turn assistant text -> bypass (no deny)
r = run(EXISTING_GUARDED, [
  { role: 'user', text: 'do the trivial edit' },
  { role: 'assistant', text: 'trivial rename only [skip-design-consult: comment-only edit]' },
]);
check('T2 current-turn assistant token -> bypass', r.deny === false, JSON.stringify(r).slice(0, 80));

// T3: no consult, no token -> BLOCK
r = run(GUARDED_PATH, [{ role: 'user', text: 'build it' }]);
check('T3 no consult -> BLOCK', r.deny === true, r.out.slice(0, 60));

// T4: both skills invoked earlier in session -> allowed
r = run(EXISTING_GUARDED, [
  { role: 'user', text: 'design it properly' },
  { role: 'assistant', text: 'Launching skill: system-rules' },
  { role: 'assistant', text: 'Launching skill: system-design' },
  { role: 'user', text: 'now build' },
]);
check('T4 both consults present -> allowed', r.deny === false, r.out.slice(0, 60));

// T5: unguarded path -> silent allow
r = run('C:\\repo\\some\\random.txt', [{ role: 'user', text: 'x' }]);
check('T5 unguarded path -> silent', r.deny === false && r.status === 0, 'exit=' + r.status);

// T6: token in an OLD assistant turn (before the last user message) -> still BLOCKS
r = run(GUARDED_PATH, [
  { role: 'assistant', text: 'earlier turn [skip-design-consult: old reason]' },
  { role: 'user', text: 'new ask, new turn' },
]);
check('T6 stale assistant token -> BLOCK', r.deny === true, r.out.slice(0, 60));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\ndesign-consult-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
