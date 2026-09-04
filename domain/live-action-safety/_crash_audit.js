'use strict';
// _crash_audit.js — a GLOBAL hook must NEVER crash: any exit code other than
// 0 (allow) or 2 (deliberate block) would break real commands. Feed hostile
// inputs and assert only {0,2} ever come back, fast.
const { spawnSync } = require('child_process');
const path = require('path');
const HOOK = path.join(__dirname, 'live-action-safety.check.hook.js');

const INPUTS = [
  '',                                   // empty stdin
  'not json at all',                    // garbage
  '{',                                  // truncated json
  '[]',                                 // wrong shape (array)
  'null',                               // null
  '{"tool_name":123}',                  // wrong type
  '{"tool_name":"Bash"}',               // missing tool_input
  '{"tool_name":"Bash","tool_input":null}',
  '{"tool_name":"Bash","tool_input":{"command":null}}',
  '{"tool_name":"Bash","tool_input":{"command":12345}}',
  '{"tool_name":"Bash","tool_input":{"command":"' + 'x'.repeat(200000) + '"}}', // huge
  '{"tool_name":"Read","tool_input":{"command":"whatever"}}',
  '{"tool_name":"","tool_input":{"command":"node run.js"}}',
  '{"tool_name":"Bash","tool_input":{"command":"ls"}}',
  JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'echo 日本語' } }),
  '{"weird":"keys","only":true}'
];

let bad = 0, maxMs = 0;
for (const inp of INPUTS) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [HOOK], { input: inp, encoding: 'utf8', timeout: 20000, env: process.env });
  const ms = Date.now() - t; if (ms > maxMs) maxMs = ms;
  const ok = r.status === 0 || r.status === 2;
  if (!ok) { bad++; console.log(`CRASH exit=${r.status} on input=${JSON.stringify(inp).slice(0, 40)} stderr=${(r.stderr || '').slice(0, 80)}`); }
}
console.log(`inputs tested        : ${INPUTS.length}`);
console.log(`crashed (exit not 0/2): ${bad}`);
console.log(`slowest single call  : ${maxMs}ms`);
console.log(bad === 0 ? 'RESULT: hook never crashes ✅' : 'RESULT: HOOK CRASHES 🚨');
process.exit(bad === 0 ? 0 : 1);
