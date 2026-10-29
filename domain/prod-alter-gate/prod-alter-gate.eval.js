#!/usr/bin/env node
// prod-alter-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-21 goal: Ruri runs PROD Alter tickets herself; each run needs miya's chat approval of its plan code.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'prod-alter-gate.check.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pag-eval-'));
const ENV = { ...process.env, PROD_ALTER_GATE_LOG: path.join(TMP, 'log.jsonl') };
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// transcript lines: {u:'text'} user text · {popup:{q:'a'}} AskUserQuestion answer · {tool:'x'} plain tool_result · {meta:'x'} harness line · {a:'x'} assistant
let tn = 0;
function transcript(entries) {
  const f = path.join(TMP, `t${tn++}.jsonl`);
  const rows = entries.map(e => {
    if (e.u !== undefined) return { type: 'user', message: { role: 'user', content: e.u } };
    if (e.meta !== undefined) return { type: 'user', isMeta: true, message: { role: 'user', content: e.meta } };
    if (e.popup) return { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'Your questions have been answered: ' + Object.entries(e.popup).map(([q, a]) => `"${q}"="${a}"`).join(', ') }] } };
    if (e.tool !== undefined) return { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: e.tool }] } };
    return { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: e.a }] } };
  });
  fs.writeFileSync(f, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  return f;
}
function run(command, entries, tool = 'Bash') {
  const input = JSON.stringify({ tool_name: tool, tool_input: { command }, transcript_path: entries ? transcript(entries) : undefined });
  const r = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', timeout: 30000, env: ENV });
  return { blocked: r.status === 2, status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const PROD = 'node alter.js --env prod --action alter-flow --id PTMLK/02/L/PLPS/2026/2 --target SJTLT';
const GOOD = [{ a: 'Plan ... APPROVAL CODE: 3F9A-2C11' }, { u: 'approve 3F9A-2C11' }];

// F1 clean input
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: ENV });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// Replay: PROD real run with no approval at all → blocked, message names the dry-run route
r = run(PROD, [{ u: 'please alter it to SJTLT' }]);
check('F2 replay: PROD run with no --approve is blocked', r.blocked && /--dry-run/.test(r.out), r.out);

// ═══ ADVERSARIAL SCENARIOS (system-design Rule 12) — each is a fixture
const S = [
  ['S1 approved code in his last message → allowed', run(PROD + ' --approve 3F9A-2C11', GOOD), x => !x.blocked],
  ['S2 code without dash in command and message → allowed', run(PROD + ' --approve 3F9A2C11', [{ u: 'approved 3f9a2c11' }]), x => !x.blocked],
  ['S3 different code approved than the one run → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'approve 1111-2222' }]), x => x.blocked],
  ['S4 approval was in an OLDER message, last one is a new topic → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'approve 3F9A-2C11' }, { a: 'ok' }, { u: 'what about the PRBB ticket' }]), x => x.blocked],
  ['S5 code only echoed by the assistant, never by him → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'do the alter' }, { a: 'approve 3F9A-2C11' }]), x => x.blocked],
  ['S6 negation: "do not approve 3F9A-2C11" → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'do not approve 3F9A-2C11 yet' }]), x => x.blocked],
  ['S7 question about the code → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'what does 3F9A-2C11 approve?' }]), x => x.blocked],
  ['S8 code pasted with no approval word → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: '3F9A-2C11' }]), x => x.blocked],
  ['S9 approval popup answer carrying the code → allowed', run(PROD + ' --approve 3F9A-2C11', [{ popup: { 'Run this PROD alter?': 'Approve 3F9A-2C11' } }]), x => !x.blocked],
  ['S10 popup answered "Not now" → blocked', run(PROD + ' --approve 3F9A-2C11', [{ popup: { 'Run this PROD alter? (3F9A-2C11)': 'Not now' } }]), x => x.blocked],
  ['S11 harness meta line after his approval is skipped → allowed', run(PROD + ' --approve 3F9A-2C11', [...GOOD, { meta: 'Caveat: hook output' }]), x => !x.blocked],
  ['S11b his approval then an injected skill line as last user line → allowed', run(PROD + ' --approve 3F9A-2C11', [...GOOD, { meta: 'Base directory for this skill: x' }, { u: 'Base directory for this skill: y' }]), x => !x.blocked],
  ['S12 plain tool_result after his approval (no new user text) → still approved: tool output is never his message (Rule 8, 2026-10-29; was: blocked)', run(PROD + ' --approve 3F9A-2C11', [...GOOD, { tool: 'some output' }]), x => !x.blocked],
  ['S13 dry-run on PROD is never blocked', run(PROD + ' --dry-run', [{ u: 'hi' }]), x => !x.blocked],
  ['S14 --login on PROD is never blocked', run('node alter.js --env prod --login', [{ u: 'hi' }]), x => !x.blocked],
  ['S15 MLIT real run is not this gate\'s business', run('node alter.js --env mlit --action alter-flow --id X --target SJTLT --yes', [{ u: 'hi' }]), x => !x.blocked],
  ['S16 dry-run chained with an unapproved real run → blocked', run(PROD + ' --dry-run; ' + PROD + ' --approve 3F9A-2C11', [{ u: 'go' }]), x => x.blocked],
  ['S17 --env=prod spelling → still gated', run('node alter.js --env=prod --action alter-flow --id X --target SJTLT', [{ u: 'go' }]), x => x.blocked],
  ['S18 node -e wrapper passing prod args → still gated', run(`node -e "process.argv.push('--env','prod');require('E:/Dev/scripts/FlowableAlter/alter.js')"`, [{ u: 'go' }]), x => x.blocked],
  ['S19 PowerShell tool, full path → still gated', run('cd E:\\Dev\\scripts\\FlowableAlter; node E:\\Dev\\scripts\\FlowableAlter\\alter.js --env prod --action init-alter --id X --reset no --target SKM', [{ u: 'go' }], 'PowerShell'), x => x.blocked],
  ['S20 alter-links.js on prod (read-only tool) is not gated', run('node lib/alter-links.js PTMLK/02/L/PLPS/2026/2 --env prod', [{ u: 'hi' }]), x => !x.blocked],
  ['S21 a word containing "prod" (production-notes) does not count as prod', run('node alter.js --env mlit --action alter-flow --id X --target SJTLT --ids-file production-notes.txt --yes', [{ u: 'hi' }]), x => !x.blocked],
  ['S22 missing transcript path → blocked (fail closed for PROD)', run(PROD + ' --approve 3F9A-2C11', null), x => x.blocked],
  ['S23 malformed transcript lines are skipped, approval still found', (() => { const f = transcript(GOOD); fs.appendFileSync(f, '{not json\n'); const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: PROD + ' --approve 3F9A-2C11' }, transcript_path: f }); const x = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', env: ENV }); return { blocked: x.status === 2 }; })(), x => !x.blocked],
  ['S24 approve code that is a prefix of a longer hex string → blocked', run(PROD + ' --approve 3F9A-2C11', [{ u: 'approve 3F9A-2C11FF' }]), x => x.blocked],
  ['S25 Malay approval "lulus 3F9A-2C11" → allowed', run(PROD + ' --approve 3F9A-2C11', [{ u: 'ok lulus 3F9A-2C11' }]), x => !x.blocked],
  ['S26 echo of the word alter.js without node → not gated', run('echo "run alter.js --env prod later"', [{ u: 'hi' }]), x => !x.blocked],
  ['S27 huge transcript (2 MB of noise before the approval) → allowed', (() => { const f = transcript([]); fs.writeFileSync(f, (JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'x'.repeat(1000) }] } }) + '\n').repeat(2000) + JSON.stringify({ type: 'user', message: { content: 'approve 3F9A-2C11' } }) + '\n'); const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: PROD + ' --approve 3F9A-2C11' }, transcript_path: f }); const x = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', env: ENV }); return { blocked: x.status === 2 }; })(), x => !x.blocked],
];
for (const [n, res, pred] of S) check(n, pred(res), res.out || JSON.stringify(res));

// effect check: the block reason reaches stderr (what the model sees)
r = run(PROD + ' --approve 3F9A-2C11', [{ u: 'approve 1111-2222' }]);
check('E1 block reason names the code and quotes his last message', /3F9A-2C11/.test(r.out) && /approve 1111-2222/.test(r.out), r.out);
// log row written
const rows = fs.existsSync(ENV.PROD_ALTER_GATE_LOG) ? fs.readFileSync(ENV.PROD_ALTER_GATE_LOG, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
check('E2 every decision is logged with an outcome', rows.some(x => x.outcome === 'allowed') && rows.some(x => x.outcome === 'blocked'), rows.length + ' rows');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + String(x.d).slice(0, 400))); }
console.log('\nprod-alter-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* leave */ }
process.exit(failed ? 1 : 0);
