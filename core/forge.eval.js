#!/usr/bin/env node
/**
 * core/forge.eval.js — replay eval for the forge itself (sandboxed via --root).
 * Fixtures:
 *   F1 birth: `forge new check probe-check` in a tmp root → files + valid settings
 *      registration + green stub eval + registry line + exit 0
 *   F2 collision → refine-first: same birth again → exit 3, no duplicate files
 *   F3 missing --nod → exit 2 (echo+nod is mandatory, per operator parameter)
 *   F4 refine of a pre-forge flat hook (.claude/hooks/<name>.js) runs its <name>.eval.js pin; red pin → exit 2
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
  '--symptom', 'eval fixture symptom 2026-09-06', '--goal', 'eval probe produces a green row', '--signal', 'the row exists', '--retention', 'regenerate', '--footprint', 'on-demand: none (eval probe)', '--trigger', 'eval probe trigger for sandbox test', '--action', 'flag probe', '--replay', 'sandbox probe replay case',
  '--route', 'check', '--route-why', 'detectable trigger', '--nod', 'forge-eval-fixture']);
check('F1 exit 0', r.status === 0, 'exit=' + r.status + ' err=' + (r.stderr || '').slice(0, 200));
check('F1 hook file born', fs.existsSync(path.join(TMP, 'domain', 'probe-check', 'probe-check.check.hook.js')), '');
check('F1 eval file born', fs.existsSync(path.join(TMP, 'domain', 'probe-check', 'probe-check.eval.js')), '');
let settings = {};
try { settings = JSON.parse(fs.readFileSync(path.join(TMP, '.claude', 'settings.json'), 'utf8')); } catch (e) { check('F1 settings still valid JSON', false, e.message); }
check('F1 registered under Stop', JSON.stringify(settings).includes('probe-check'), '');
check('F1 registry line', fs.existsSync(path.join(TMP, 'system', 'registry.jsonl')) && fs.readFileSync(path.join(TMP, 'system', 'registry.jsonl'), 'utf8').includes('"probe-check"'), '');
check('F1 echo emitted', /ECHO\s+Trigger: when eval probe trigger/.test(r.stdout), r.stdout.slice(0, 120));

// F2 — collision → refine-first
r = runForge(['new', 'check', 'probe-check', '--event', 'Stop',
  '--symptom', 'eval fixture symptom 2026-09-06', '--goal', 'eval probe produces a green row', '--signal', 'the row exists', '--retention', 'regenerate', '--footprint', 'on-demand: none (eval probe)', '--trigger', 'eval probe trigger for sandbox test', '--action', 'flag probe', '--replay', 'sandbox probe replay case', '--nod', 'forge-eval-fixture']);
check('F2 collision exit 3', r.status === 3, 'exit=' + r.status);
check('F2 refine-first suggested', /refine-first/.test(r.stdout), r.stdout.slice(0, 200));

// F3 — missing --nod
r = runForge(['new', 'check', 'nod-less-probe', '--event', 'Stop', '--symptom', 'eval fixture symptom 2026-09-06', '--goal', 'eval probe produces a green row', '--signal', 'the row exists', '--retention', 'regenerate', '--footprint', 'on-demand: none (eval probe)', '--trigger', 't', '--action', 'a', '--replay', 'r']);
check('F3 missing nod exit 2', r.status === 2, 'exit=' + r.status);

// F3b — Rule 13 WHY-chain (2026-09-06): missing --goal → exit 2; a goal that restates the trigger → exit 2
r = runForge(['new', 'check', 'goal-less-probe', '--event', 'Stop', '--symptom', 's', '--signal', 'sig', '--retention', 'keep', '--footprint', 'on-demand: none (eval probe)', '--trigger', 't', '--action', 'a', '--replay', 'r', '--nod', 'n']);
check('F3b missing --goal exit 2', r.status === 2 && /--goal/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 80));
r = runForge(['new', 'check', 'trigger-goal-probe', '--event', 'Stop', '--symptom', 's', '--goal', 'fires on every Stop', '--signal', 'sig', '--retention', 'keep', '--footprint', 'on-demand: none (eval probe)', '--trigger', 't', '--action', 'a', '--replay', 'r', '--nod', 'n']);
check('F3c goal-restates-trigger exit 2', r.status === 2 && /restates the trigger/.test(r.stderr), 'exit=' + r.status);
r = runForge(['new', 'check', 'bad-retention-probe', '--event', 'Stop', '--symptom', 's', '--goal', 'a real outcome', '--signal', 'sig', '--retention', 'forever', '--footprint', 'on-demand: none (eval probe)', '--trigger', 't', '--action', 'a', '--replay', 'r', '--nod', 'n']);
check('F3d bad --retention exit 2', r.status === 2 && /retention/.test(r.stderr), 'exit=' + r.status);

// F3e/F3f — system-rules Rule 7 (2026-09-29): missing --footprint → exit 2; unknown trigger class → exit 2; README carries the line
r = runForge(['new', 'check', 'footprint-less-probe', '--event', 'Stop', '--symptom', 's', '--goal', 'a real outcome', '--signal', 'sig', '--retention', 'keep', '--trigger', 't', '--action', 'a', '--replay', 'r', '--nod', 'n']);
check('F3e missing --footprint exit 2', r.status === 2 && /--footprint/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 80));
r = runForge(['new', 'check', 'bad-footprint-probe', '--event', 'Stop', '--symptom', 's', '--goal', 'a real outcome', '--signal', 'sig', '--retention', 'keep', '--footprint', 'light', '--trigger', 't', '--action', 'a', '--replay', 'r', '--nod', 'n']);
check('F3f footprint without a trigger class exit 2', r.status === 2 && /Rule 7/.test(r.stderr), 'exit=' + r.status);
check('F1b born README carries footprint:', /^footprint: on-demand/m.test(fs.readFileSync(path.join(TMP, 'domain', 'probe-check', 'README.md'), 'utf8')), '');
// F4 — refine resolves a pre-forge flat hook (.claude/hooks/<name>.js) and runs its <name>.eval.js pin
fs.mkdirSync(path.join(TMP, '.claude', 'hooks'), { recursive: true });
fs.writeFileSync(path.join(TMP, '.claude', 'hooks', 'flat-probe.js'), '// flat hook\n');
fs.writeFileSync(path.join(TMP, '.claude', 'hooks', 'flat-probe.eval.js'), "console.log('flat-probe pin ran'); process.exit(0);\n");
r = runForge(['refine', 'flat-probe', '--nod', 'forge-eval-fixture']);
check('F4 flat hook refine exit 0 + its eval pin ran', r.status === 0 && /flat-probe pin ran/.test(r.stdout), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 120));
fs.writeFileSync(path.join(TMP, '.claude', 'hooks', 'flat-probe.eval.js'), 'process.exit(1);\n');
r = runForge(['refine', 'flat-probe', '--nod', 'forge-eval-fixture']);
check('F4b flat hook with RED pin → exit 2', r.status === 2 && /pre-refine eval RED/.test(r.stderr), 'exit=' + r.status);

// ── F5–F12 — `forge install hook` (2026-10-05): bring an existing loose hook into a Feature folder ──
const WHY = ['--symptom', 'eval fixture: a loose hook sits outside any Feature', '--goal', 'the hook is an installed Feature with a goal and an eval', '--signal', 'census verdict PROPER', '--retention', 'regenerate', '--footprint', 'per-session: 1 node, eval probe', '--nod', 'forge-eval-fixture'];
const H = (...p) => path.join(TMP, '.claude', 'hooks', ...p);
const setSettings = (obj) => fs.writeFileSync(path.join(TMP, '.claude', 'settings.json'), JSON.stringify(obj, null, 2));
const getSettings = () => fs.readFileSync(path.join(TMP, '.claude', 'settings.json'), 'utf8');
fs.mkdirSync(path.join(TMP, 'domain', 'bundles'), { recursive: true });

// F5 happy path: wrapped registration + bundle child + its own eval move with it
fs.writeFileSync(H('LooseProbe.js'), "const path = require('path');\nconst ROOT = path.resolve(__dirname, '..', '..');\nprocess.stdout.write('loose ok');\n");
fs.writeFileSync(H('LooseProbe.eval.js'), "const path = require('path');\nconst { spawnSync } = require('child_process');\nconst r = spawnSync(process.execPath, [path.join(__dirname, 'LooseProbe.js')], { encoding: 'utf8' });\nconsole.log('loose pin: ' + r.stdout);\nprocess.exit(r.stdout === 'loose ok' ? 0 : 1);\n");
setSettings({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\LooseProbe.js" SessionStart' }] }], Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\\\.claude\\\\hooks\\\\LooseProbe.js"' }] }] } });
fs.writeFileSync(path.join(TMP, 'domain', 'bundles', 'b.json'), JSON.stringify({ children: ['.claude/hooks/LooseProbe.js', '.claude/hooks/other.js'] }));
fs.writeFileSync(path.join(TMP, 'system', 'note.md'), 'see .claude/hooks/LooseProbe.js\n');
r = runForge(['install', 'hook', '.claude/hooks/LooseProbe.js', ...WHY]);
const fdir = path.join(TMP, 'domain', 'loose-probe');
check('F5 install exit 0', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 300));
check('F5 hook moved to domain/<kebab-name>/<name>.hook.js, old copy gone', fs.existsSync(path.join(fdir, 'loose-probe.hook.js')) && !fs.existsSync(H('LooseProbe.js')), '');
check('F5 its own eval moved, re-pointed and still green', fs.existsSync(path.join(fdir, 'loose-probe.eval.js')) && !fs.existsSync(H('LooseProbe.eval.js')) && /loose pin: loose ok/.test(r.stdout), r.stdout.slice(-200));
let st = getSettings();
check('F5 wrapped registration re-pointed, separator style kept, telemetry name appended', st.includes('--wrap \\"${CLAUDE_PROJECT_DIR}\\\\domain\\\\loose-probe\\\\loose-probe.hook.js\\" SessionStart LooseProbe'), st.slice(0, 400));
check('F5 direct registration re-pointed with its own (double) separator style, no name appended', st.includes('\\\\\\\\domain\\\\\\\\loose-probe\\\\\\\\loose-probe.hook.js\\"') && !/hook\.js\\" LooseProbe"\s*}\s*]\s*}\s*]\s*}/.test(st.split('Stop')[1] || ''), st.slice(-300));
check('F5 no registration left on the old path', !/\.claude[\\/]+hooks[\\/]+LooseProbe\.js/.test(st), '');
check('F5 bundle child re-pointed, sibling child untouched', fs.readFileSync(path.join(TMP, 'domain', 'bundles', 'b.json'), 'utf8') === JSON.stringify({ children: ['domain/loose-probe/loose-probe.hook.js', '.claude/hooks/other.js'] }), '');
const rdme = fs.readFileSync(path.join(fdir, 'README.md'), 'utf8');
check('F5 README carries goal · retention · footprint · telemetry_name', /^goal: the hook is an installed Feature/m.test(rdme) && /^retention: regenerate/m.test(rdme) && /^footprint: per-session/m.test(rdme) && /^telemetry_name: LooseProbe/m.test(rdme), rdme.slice(0, 300));
check('F5 NUKE-MARKER with the rollback recipe', /Rollback \| move `domain\/loose-probe\/loose-probe\.hook\.js` back to `\.claude\/hooks\/LooseProbe\.js`/.test(fs.readFileSync(path.join(fdir, 'NUKE-MARKER.md'), 'utf8')), '');
check('F5 registry row kind=install-hook with installed_from', /"kind":"install-hook"/.test(fs.readFileSync(path.join(TMP, 'system', 'registry.jsonl'), 'utf8')) && /"installed_from":"\.claude\/hooks\/LooseProbe\.js"/.test(fs.readFileSync(path.join(TMP, 'system', 'registry.jsonl'), 'utf8')), '');
check('F5 docs naming the old path are LISTED, not silently left', /DOCS still naming the old path.*note\.md/.test(r.stdout), r.stdout.slice(-300));

// F6 the moved hook still runs from its new home through the wrapper, logged under its OLD name
const wr5 = spawnSync(process.execPath, [path.join(TMP, 'lib', 'hook-runtime.js'), '--wrap', path.join(fdir, 'loose-probe.hook.js'), 'SessionStart', 'LooseProbe'], { input: '{}', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: TMP } });
const tele = fs.readFileSync(path.join(TMP, 'system', 'telemetry', 'hook-fires.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('F6 behaviour unchanged after install (same output) + telemetry row under the pre-install name', wr5.stdout === 'loose ok' && tele.some(t => t.hook === 'LooseProbe' && t.mode === 'wrap'), wr5.stdout + ' ' + JSON.stringify(tele.slice(-1)));

// F7 no eval of its own → an INSTALL pin is generated and is green
fs.writeFileSync(H('bare-probe.js'), "process.stdout.write('bare');\n");
setSettings({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\bare-probe.js" Stop' }] }] } });
r = runForge(['install', 'hook', '.claude/hooks/bare-probe.js', ...WHY]);
check('F7 hook without an eval gets a green install pin', r.status === 0 && /bare-probe\.eval: 3\/3 green/.test(r.stdout), 'exit=' + r.status + ' ' + r.stdout.slice(-200) + (r.stderr || '').slice(0, 200));

// F8 sibling-relative reference → REFUSED, nothing moved
fs.writeFileSync(H('rel-probe.js'), "const helper = require('./helper-lib');\nprocess.stdout.write('x');\n");
r = runForge(['install', 'hook', '.claude/hooks/rel-probe.js', ...WHY]);
check('F8 sibling-relative require refuses (exit 2), names the line, moves nothing', r.status === 2 && /sibling-relative/.test(r.stderr) && /line 1/.test(r.stderr) && fs.existsSync(H('rel-probe.js')) && !fs.existsSync(path.join(TMP, 'domain', 'rel-probe')), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));
fs.writeFileSync(H('oneup-probe.js'), "const path = require('path');\nconst S = path.resolve(__dirname, '..', 'settings.json');\nconst ROOT = path.join(__dirname, '..', '..');\n");
r = runForge(['install', 'hook', '.claude/hooks/oneup-probe.js', ...WHY]);
check('F8c ONE level up from __dirname refuses (only two-up = repo root survives the move)', r.status === 2 && /line 2/.test(r.stderr) && !/line 3/.test(r.stderr) && fs.existsSync(H('oneup-probe.js')), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 260));
r = runForge(['install', 'hook', '.claude/hooks/rel-probe.js', ...WHY, '--allow-relative', '--no-smoke']);
check('F8b --allow-relative lets a checked hook through', r.status === 0 && fs.existsSync(path.join(TMP, 'domain', 'rel-probe', 'rel-probe.hook.js')), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));

// F9 another code file names the old path → REFUSED with the list, nothing moved
fs.writeFileSync(H('ref-probe.js'), "process.stdout.write('r');\n");
fs.writeFileSync(path.join(TMP, 'lib', 'caller.js'), "const p = path.join(ROOT, '.claude', 'hooks', 'ref-probe.js');\n");
r = runForge(['install', 'hook', '.claude/hooks/ref-probe.js', ...WHY]);
check('F9 a code referencer refuses (exit 2), lists the file, moves nothing', r.status === 2 && /caller\.js/.test(r.stderr) && fs.existsSync(H('ref-probe.js')) && !fs.existsSync(path.join(TMP, 'domain', 'ref-probe')), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));
fs.writeFileSync(path.join(TMP, 'lib', 'caller.js'), "// old home was .claude/hooks/ref-probe.js\n");
r = runForge(['install', 'hook', '.claude/hooks/ref-probe.js', ...WHY]);
check('F9b a mention inside a comment does not refuse', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));

// F10 red eval after the move → full rollback (hook back, eval back, settings byte-identical)
fs.writeFileSync(H('red-probe.js'), "process.stdout.write('red');\n");
fs.writeFileSync(H('red-probe.eval.js'), "process.exit(1);\n");
setSettings({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\red-probe.js" Stop' }] }] } });
const stBefore = getSettings();
r = runForge(['install', 'hook', '.claude/hooks/red-probe.js', ...WHY]);
check('F10 red eval → exit 2 and nothing half-lands', r.status === 2 && fs.existsSync(H('red-probe.js')) && fs.readFileSync(H('red-probe.eval.js'), 'utf8') === 'process.exit(1);\n' && !fs.existsSync(path.join(TMP, 'domain', 'red-probe')) && getSettings() === stBefore, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));

// F11 WHY-chain is mandatory for an install too · F12 collision with an existing Feature folder
r = runForge(['install', 'hook', '.claude/hooks/red-probe.js', '--symptom', 's', '--signal', 'x', '--retention', 'keep', '--footprint', 'none: n/a', '--nod', 'n']);
check('F11 missing --goal exit 2, nothing moved', r.status === 2 && /--goal/.test(r.stderr) && fs.existsSync(H('red-probe.js')), 'exit=' + r.status);
fs.writeFileSync(H('probe-check.js'), "process.stdout.write('c');\n");
r = runForge(['install', 'hook', '.claude/hooks/probe-check.js', ...WHY]);
check('F12 existing domain/<name> → collision exit 3, nothing moved', r.status === 3 && fs.existsSync(H('probe-check.js')), 'exit=' + r.status);
r = runForge(['install', 'hook', 'lib/hook-runtime.js', ...WHY]);
check('F12b a source outside .claude/hooks is refused', r.status === 2 && /directly under \.claude\/hooks/.test(r.stderr), 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nforge.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
