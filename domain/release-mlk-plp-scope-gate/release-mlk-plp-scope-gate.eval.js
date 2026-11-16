#!/usr/bin/env node
// release-mlk-plp-scope-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: mid-release-1.0.9 I start hand-editing a Java file to fix a ticket whose branch was missing instead of marking it out-of-module
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'release-mlk-plp-scope-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-scope-eval-'));
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir, RELEASE_SCOPE_BRANCH: 'mlk/release/1.0.9' };
function run(payload) {
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env });
}
function edit(file_path, extra) {
  return { tool_name: 'Edit', tool_input: { file_path, old_string: 'a', new_string: 'b', ...(extra || {}) } };
}
function setPhase(ver, phase) {
  fs.writeFileSync(path.join(stateDir, `release-${ver}.json`), JSON.stringify({ release: ver, phase }));
}
function clearState() {
  for (const f of fs.readdirSync(stateDir)) fs.rmSync(path.join(stateDir, f));
}
const JAVA = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\etanah\\pelupusan\\service\\impl\\PelupusanService.java';
const POM = 'E:\\Projects\\Melaka\\etanah-pelupusan\\pom.xml';

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: mid-release (phase=merged), hand-editing a Java file → BLOCK
setPhase('1.0.9', 'merged');
r = run(edit(JAVA));
check('F2 replay: java edit mid-release blocks (exit 2)',
  r.status === 2 && /IN FLIGHT \(phase=merged\)/.test(r.stderr) && /DO NOTHING EXCEPT WHAT IS ESTABLISHED/.test(r.stderr),
  'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 100));

// F3: pom.xml hand-edit mid-release → BLOCK too (established path is bump-version, not a hand-edit)
r = run(edit(POM));
check('F3 pom hand-edit mid-release blocks + names bump-version',
  r.status === 2 && /bump-version --release 1\.0\.9/.test(r.stderr), 'exit=' + r.status);

// F4: every in-flight phase blocks
let allBlock = true;
for (const p of ['branched', 'merging', 'merged', 'verified', 'bumped']) {
  setPhase('1.0.9', p);
  if (run(edit(JAVA)).status !== 2) { allBlock = false; break; }
}
check('F4 all in-flight phases block', allBlock, 'branched|merging|merged|verified|bumped');

// F5: phase=pushed → gate stands down (pipeline git work done)
setPhase('1.0.9', 'pushed');
r = run(edit(JAVA));
check('F5 phase=pushed does not block', r.status === 0, 'exit=' + r.status);

// F6: phase=planned → not branched yet, no block
setPhase('1.0.9', 'planned');
r = run(edit(JAVA));
check('F6 phase=planned does not block', r.status === 0, 'exit=' + r.status);

// F7: NO release in flight → normal quest work must be untouched
clearState();
r = run(edit(JAVA));
check('F7 no release in flight: quest edits pass', r.status === 0, 'exit=' + r.status);

// F8: non-pelupusan file mid-release → not our business (MemoryCore edits etc.)
setPhase('1.0.9', 'merged');
r = run(edit(require('path').join(__dirname, '..', '..', 'main', 'todo.md'))); // machine-independent (GHOST-HOOKS-2 straggler, 2026-07-19)
check('F8 non-pelupusan path ignored', r.status === 0, 'exit=' + r.status);

// F9: bypass token → allowed (auditable in transcript)
r = run(edit(JAVA, { new_string: 'b [skip-release-scope: miya nodded hotfix]' }));
check('F9 bypass token passes', r.status === 0, 'exit=' + r.status);

// F10: Write tool also gated (not just Edit)
r = spawnSync(process.execPath, [HOOK], {
  input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: JAVA, content: 'x' } }),
  encoding: 'utf8', timeout: 30000, env,
});
check('F10 Write tool blocked too', r.status === 2, 'exit=' + r.status);

// F11: non-edit tool (Read) mid-release → never blocked
r = spawnSync(process.execPath, [HOOK], {
  input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: JAVA } }),
  encoding: 'utf8', timeout: 30000, env,
});
check('F11 Read never blocked', r.status === 0, 'exit=' + r.status);

// F12 REPLAY 289425: release in flight, but the edited repo is on mlk/master (another session's quest) → pass
setPhase('1.0.9', 'verified');
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(edit(JAVA)), encoding: 'utf8', timeout: 30000, env: { ...env, RELEASE_SCOPE_BRANCH: 'mlk/master' } });
check('F12 replay 289425: quest edit on mlk/master passes mid-release', r.status === 0, 'exit=' + r.status);

// F13: state names its own branch; a repo on that branch blocks, on another passes
fs.writeFileSync(path.join(stateDir, 'release-1.0.9.json'), JSON.stringify({ release: '1.0.9', phase: 'merged', branch: 'mlk/release/1.0.9' }));
r = run(edit(JAVA));
check('F13 repo on the state branch blocks', r.status === 2, 'exit=' + r.status);

// F14: branch unreadable (no git repo at the path) → fail-open, passes
const env2 = { ...env }; delete env2.RELEASE_SCOPE_BRANCH;
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(edit(path.join(os.tmpdir(), 'no-repo', 'etanah-pelupusan', 'X.java'))), encoding: 'utf8', timeout: 30000, env: env2 });
check('F14 unreadable branch fails open', r.status === 0, 'exit=' + r.status);

try { fs.rmSync(stateDir, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrelease-mlk-plp-scope-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
