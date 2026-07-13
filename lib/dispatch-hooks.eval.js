#!/usr/bin/env node
// lib/dispatch-hooks.eval.js — fixtures: block-wins · advisory-merge · deny-priority ·
// stdin-forwarding · fail-open on broken manifest/missing child.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const DISPATCH = path.join(__dirname, 'dispatch-hooks.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-eval-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function child(name, body) { const p = path.join(TMP, name); fs.writeFileSync(p, body); return p; }
function manifest(children) {
  const p = path.join(TMP, 'm' + results.length + '.json');
  fs.writeFileSync(p, JSON.stringify({ name: 'test-bundle', children }));
  return p;
}
function run(mf, stdin) {
  return spawnSync(process.execPath, [DISPATCH, '--manifest', mf, '--event', 'Stop'], { input: stdin || '{}', encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: TMP } });
}

const advisory = child('advisory.js', 'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"Stop",additionalContext:"ADV-ONE"}}));');
const rawText = child('raw.js', 'process.stdout.write("RAW-TWO");');
const blocker = child('blocker.js', 'process.stdout.write(JSON.stringify({decision:"block",reason:["BLOCK-REASON-X"]}));');
const exit2er = child('exit2.js', 'process.stderr.write("EXIT2-REASON"); process.exit(2);');
const denier = child('denier.js', 'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"DENY-Y"}}));');
const echoStdin = child('echo-stdin.js', 'const d=require("fs").readFileSync(0,"utf8"); process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"Stop",additionalContext:"GOT:"+d.length}}));');

// F1 advisory merge (json + raw text) → one envelope holding both
let r = run(manifest([advisory, rawText]));
let j = JSON.parse(r.stdout);
check('F1 exit 0', r.status === 0, 'exit=' + r.status);
check('F1 both advisories merged', /ADV-ONE/.test(j.hookSpecificOutput.additionalContext) && /RAW-TWO/.test(j.hookSpecificOutput.additionalContext), r.stdout.slice(0, 200));

// F2 block wins over advisory
r = run(manifest([advisory, blocker]));
j = JSON.parse(r.stdout);
check('F2 block wins', j.decision === 'block' && /BLOCK-REASON-X/.test(j.reason), r.stdout.slice(0, 200));

// F3 exit-2 child → dispatcher exit 2 + stderr forwarded
r = run(manifest([advisory, exit2er]));
check('F3 exit 2 forwarded', r.status === 2, 'exit=' + r.status);
check('F3 stderr forwarded', /EXIT2-REASON/.test(r.stderr), r.stderr.slice(0, 120));

// F4 deny envelope priority
r = run(manifest([advisory, denier]));
j = JSON.parse(r.stdout);
check('F4 deny wins', j.hookSpecificOutput.permissionDecision === 'deny' && /DENY-Y/.test(j.hookSpecificOutput.permissionDecisionReason), r.stdout.slice(0, 200));

// F5 stdin forwarded to children
r = run(manifest([echoStdin]), '{"transcript_path":"abc"}');
j = JSON.parse(r.stdout);
check('F5 stdin forwarded', /GOT:25/.test(j.hookSpecificOutput.additionalContext), r.stdout.slice(0, 120));

// F6 fail-open: broken manifest + missing child
r = spawnSync(process.execPath, [DISPATCH, '--manifest', path.join(TMP, 'nope.json'), '--event', 'Stop'], { input: '{}', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: TMP } });
check('F6 broken manifest fail-open exit 0', r.status === 0, 'exit=' + r.status);
r = run(manifest([path.join(TMP, 'ghost-child.js'), advisory]));
check('F6 missing child fail-open (advisory still emitted)', r.status === 0 && /ADV-ONE/.test(r.stdout), 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\ndispatch-hooks.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
