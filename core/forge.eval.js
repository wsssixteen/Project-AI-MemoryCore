#!/usr/bin/env node
/**
 * core/forge.eval.js — replay eval for the forge itself (sandboxed via --root).
 * Fixtures:
 *   F1 birth: `forge new check probe-check` in a tmp root → files + valid settings
 *      registration + green stub eval + registry line + exit 0
 *   F2 collision → refine-first: same birth again → exit 3, no duplicate files
 *   F3 missing --nod → exit 2 (echo+nod is mandatory, per operator parameter)
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const FORGE = path.join(__dirname, 'forge.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-eval-'));

// sandbox skeleton
fs.mkdirSync(path.join(TMP, '.claude'), { recursive: true });
fs.mkdirSync(path.join(TMP, 'lib'), { recursive: true });
fs.writeFileSync(path.join(TMP, '.claude', 'settings.json'), JSON.stringify({ hooks: {} }, null, 2));
fs.copyFileSync(path.join(REPO, 'lib', 'hook-runtime.js'), path.join(TMP, 'lib', 'hook-runtime.js'));

function runForge(args) {
  return spawnSync(process.execPath, [FORGE, ...args, '--root', TMP], { encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: TMP } });
}
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1 — birth
let r = runForge(['new', 'check', 'probe-check', '--event', 'Stop',
  '--trigger', 'eval probe trigger for sandbox test', '--action', 'flag probe', '--replay', 'sandbox probe replay case',
  '--route', 'check', '--route-why', 'detectable trigger', '--nod', 'forge-eval-fixture']);
check('F1 exit 0', r.status === 0, 'exit=' + r.status + ' err=' + (r.stderr || '').slice(0, 200));
check('F1 hook file born', fs.existsSync(path.join(TMP, 'domain', 'probe-check', 'probe-check.check.hook.js')), '');
check('F1 eval file born', fs.existsSync(path.join(TMP, 'domain', 'probe-check', 'probe-check.eval.js')), '');
let settings = {};
try { settings = JSON.parse(fs.readFileSync(path.join(TMP, '.claude', 'settings.json'), 'utf8')); } catch (e) { check('F1 settings still valid JSON', false, e.message); }
check('F1 registered under Stop', JSON.stringify(settings).includes('probe-check'), '');
check('F1 registry line', fs.existsSync(path.join(TMP, 'meta', 'registry.jsonl')) && fs.readFileSync(path.join(TMP, 'meta', 'registry.jsonl'), 'utf8').includes('"probe-check"'), '');
check('F1 echo emitted', /ECHO\s+Trigger: when eval probe trigger/.test(r.stdout), r.stdout.slice(0, 120));

// F2 — collision → refine-first
r = runForge(['new', 'check', 'probe-check', '--event', 'Stop',
  '--trigger', 'eval probe trigger for sandbox test', '--action', 'flag probe', '--replay', 'sandbox probe replay case', '--nod', 'forge-eval-fixture']);
check('F2 collision exit 3', r.status === 3, 'exit=' + r.status);
check('F2 refine-first suggested', /refine-first/.test(r.stdout), r.stdout.slice(0, 200));

// F3 — missing --nod
r = runForge(['new', 'check', 'nod-less-probe', '--event', 'Stop', '--trigger', 't', '--action', 'a', '--replay', 'r']);
check('F3 missing nod exit 2', r.status === 2, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nforge.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
