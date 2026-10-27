#!/usr/bin/env node
'use strict';
/**
 * lib/diagram-render.eval.js — fixtures for lib/diagram-render.js and the two places that route to it.
 * Renders one real diagram-design page (needs the plugin, python and Edge; the render cases say
 * "skipped" when the plugin is absent). Run: node lib/diagram-render.eval.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const D = require('./diagram-render.js');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-render-eval-'));
const results = [];
function t(name, fn) {
  try { const why = fn(); results.push({ name, ok: why === true, why: why === true ? '' : why }); }
  catch (e) { results.push({ name, ok: false, why: 'threw ' + e.message }); }
}
const run = args => spawnSync(process.execPath, [path.join(__dirname, 'diagram-render.js'), ...args], { encoding: 'utf8', timeout: 120000 });
const dir = D.skillDir();

// A good page: the plugin's own minimal example (passes its self-check by construction).
const GOOD = dir && path.join(dir, 'assets', 'example-swimlane.html');
const goodCopy = path.join(SB, 'good.html');
if (GOOD) fs.copyFileSync(GOOD, goodCopy);
// A bad page: an SVG with no <title> breaks the accessible-SVG contract.
const bad = path.join(SB, 'bad.html');
fs.writeFileSync(bad, '<!DOCTYPE html><html><head><meta charset="utf-8"><title>x</title></head><body><div class="frame"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg></div></body></html>');

t('E1 a valid diagram renders to a PNG and prints OK', () => {
  if (!dir) return true; // plugin absent on this machine: skipped
  const r = run([goodCopy]);
  const png = goodCopy.replace(/\.html$/, '.png');
  return (r.status === 0 && /^DIAGRAM-RENDER: OK /m.test(r.stdout) && fs.statSync(png).size > 5000) || `exit ${r.status} ${r.stdout}${r.stderr}`.slice(0, 300);
});
t('E2 a diagram that fails the self-check is refused (exit 1, no PNG)', () => {
  if (!dir) return true;
  const r = run([bad]);
  return (r.status === 1 && /DIAGRAM-RENDER: FAIL self-check/.test(r.stdout) && !fs.existsSync(bad.replace(/\.html$/, '.png'))) || `exit ${r.status} ${r.stdout}`.slice(0, 300);
});
t('E3 --out writes the PNG where asked', () => {
  if (!dir) return true;
  const out = path.join(SB, 'named.png');
  const r = run([goodCopy, '--out', out]);
  return (r.status === 0 && fs.existsSync(out)) || `exit ${r.status} ${r.stdout}`.slice(0, 200);
});
t('E4 no file or a missing file prints usage and exits 2', () => {
  const a = run([]), b = run([path.join(SB, 'nope.html')]);
  return (a.status === 2 && b.status === 2 && /usage/.test(a.stdout)) || `${a.status}/${b.status}`;
});
t('E5 a missing plugin is a named FAIL, not a crash', () => {
  const r = spawnSync(process.execPath, ['-e', `process.env.USERPROFILE='${SB.replace(/\\/g, '/')}';process.env.HOME=process.env.USERPROFILE;const os=require('os');os.homedir=()=>process.env.USERPROFILE;const D=require(${JSON.stringify(path.join(__dirname, 'diagram-render.js'))});console.log(JSON.stringify(D.selfCheck('x.html')))`], { encoding: 'utf8' });
  return /not installed/.test(r.stdout) || r.stdout + r.stderr;
});

// Routing: the parts that decide what gets drawn must point here (the "used, not orphaned" rule).
const read = p => fs.readFileSync(path.join(REPO, p), 'utf8');
t('W1 explain-diagram skill routes flows to a picture rendered by this tool', () => {
  const s = read('.claude/skills/explain-diagram/SKILL.md');
  return (/node lib\/diagram-render\.js/.test(s) && /picture.*default|default.*picture/i.test(s)) || 'skill not routed';
});
t('W2 the per-reply contract no longer says "story diagram for flows"', () => {
  const s = read('domain/pre-reply-contract/pre-reply-contract.check.hook.js');
  return (!/story diagram for flows/.test(s) && /explain-diagram/.test(s)) || 'contract still says story diagram';
});
t('W3 tools.json carries the diagram-render row', () => JSON.parse(read('system/tools.json')).tools.some(x => x.id === 'diagram-render' && x.home === 'lib/diagram-render.js') || 'no row');

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + r.why}`); }
console.log(`\ndiagram-render.eval: ${results.length - failed}/${results.length} green${dir ? '' : ' (render cases skipped: diagram-design not installed)'}`);
try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failed ? 1 : 0);
