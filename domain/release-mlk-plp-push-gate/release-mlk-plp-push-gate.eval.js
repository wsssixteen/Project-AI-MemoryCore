#!/usr/bin/env node
// release-mlk-plp-push-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: manual git push origin mlk/release/1.0.9 attempted before merge-verification passed
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'release-mlk-plp-push-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-gate-eval-'));
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir };
function run(payload) {
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env });
}
function bash(command) { return { tool_name: 'Bash', tool_input: { command } }; }
function writeState(ver, phase) {
  fs.writeFileSync(path.join(stateDir, `release-${ver}.json`), JSON.stringify({ release: ver, phase }));
}

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: push with NO pipeline state → BLOCK (exit 2)
r = run(bash('git push origin mlk/release/1.0.9'));
check('F2 replay: push with no state blocks (exit 2)', r.status === 2 && /no pipeline state/.test(r.stderr), 'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 80));

// F3: state phase=merged (verify not passed) → BLOCK
writeState('1.0.9', 'merged');
r = run(bash('git push -u origin mlk/release/1.0.9'));
check('F3 phase=merged blocks', r.status === 2 && /phase "merged"/.test(r.stderr), 'exit=' + r.status);

// F4: state phase=verified → ALLOW
writeState('1.0.9', 'verified');
r = run(bash('git push -u origin mlk/release/1.0.9'));
check('F4 phase=verified passes', r.status === 0, 'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 80));

// F5: malformed release ref (mlk/release/fat) → BLOCK
r = run(bash('git push origin mlk/release/fat'));
check('F5 malformed ref blocks', r.status === 2 && /does not match/.test(r.stderr), 'exit=' + r.status);

// F6: non-release push → NOT fired (exit 0)
r = run(bash('git push origin mlk/qa/262762'));
check('F6 non-release push ignored', r.status === 0, 'exit=' + r.status);

// F7: bypass token → ALLOW even with no state
r = run(bash('RELEASE_GATE_BYPASS=1 git push origin mlk/release/7.7.7'));
check('F7 bypass token passes', r.status === 0, 'exit=' + r.status);

// F8: non-Bash tool → NOT fired
r = run({ tool_name: 'Edit', tool_input: { file_path: 'x' } });
check('F8 non-Bash tool ignored', r.status === 0, 'exit=' + r.status);

// ── v2 cases (2026-08-19/20, baseline-1.3.5 incident) ──
function pwsh(command) { return { tool_name: 'PowerShell', tool_input: { command } }; }

// F9: PowerShell tool is inspected too (the incident's manual pushes used PowerShell)
r = run(pwsh('git push origin mlk/release/1.0.9'));
check('F9 PowerShell release push (phase=verified) passes like Bash', r.status === 0, 'exit=' + r.status);

// F10: `git -C <path> push` form matches (original /git\s+push/ was blind to it since birth)
r = run(pwsh('git -C E:\\x\\etanah-pelupusan push --force-with-lease origin mlk/release/8.8.8'));
check('F10 git -C form with no state blocks', r.status === 2 && /no pipeline state/.test(r.stderr), 'exit=' + r.status);

// F11: manual mlk/master push BANNED regardless of state (V8: master moves only via merge-to-master)
r = run(pwsh('git -C E:\\x\\etanah-pelupusan push origin mlk/master'));
check('F11 manual mlk/master push blocks', r.status === 2 && /mlk\/master is BANNED/.test(r.stderr), 'exit=' + r.status);

// F12: MemoryCore-style push untouched by the master ban
r = run(pwsh('git push origin HEAD:main'));
check('F12 HEAD:main push ignored', r.status === 0, 'exit=' + r.status);

try { fs.rmSync(stateDir, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrelease-mlk-plp-push-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
