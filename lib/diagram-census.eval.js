#!/usr/bin/env node
// lib/diagram-census.eval.js — fixtures for lib/diagram-census.js. Run: node lib/diagram-census.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const D = require('./diagram-census.js');

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-census-'));
const PNG_OK = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(6000, 1)]);
const SVG = '<html><body><svg viewBox="0 0 10 10"></svg></body></html>';
const put = (rel, body, ageMs) => {
  const p = path.join(TMP, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
  if (ageMs) { const t = (Date.now() - ageMs) / 1000; fs.utimesSync(p, t, t); }
  return p;
};
const pair = (base, html, png) => { put(base + '.html', html); put(base + '.png', png); };

let pass = 0, fail = 0;
function t(name, fn) {
  let r; try { r = fn(); } catch (e) { r = 'threw ' + e.message; }
  if (r === true) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  — ' + r); }
}
const ok = (part) => D.check(part, TMP);

// --- where the diagram lives
t('S1 a one-file Tool keeps <name>.diagram.html/.png beside it', () => {
  const d = D.diagramFor('lib/x.js', TMP);
  return (d.html.endsWith(path.join('lib', 'x.diagram.html')) && d.png.endsWith(path.join('lib', 'x.diagram.png'))) || JSON.stringify(d);
});
t('S2 a Feature folder keeps diagram.html/.png in the folder', () => D.diagramFor('domain/feat', TMP).png === path.join(TMP, 'domain', 'feat', 'diagram.png') || 'wrong path');
t('S3 a file inside a Feature uses the Feature diagram', () => D.diagramFor('domain/feat/feat.check.hook.js', TMP).png === path.join(TMP, 'domain', 'feat', 'diagram.png') || 'wrong path');
t('S4 a SKILL.md uses its Skill folder diagram', () => D.diagramFor('.claude/skills/sk/SKILL.md', TMP).png === path.join(TMP, '.claude', 'skills', 'sk', 'diagram.png') || 'wrong path');
t('S5 an absolute path and a Windows backslash path resolve the same', () => {
  const a = D.diagramFor(path.join(TMP, 'domain', 'feat', 'x.js'), TMP).png, b = D.diagramFor('domain\\feat\\x.js', TMP).png;
  return (a === b && a === path.join(TMP, 'domain', 'feat', 'diagram.png')) || a + ' vs ' + b;
});
t('S6 a plain folder that is no Feature or Skill keeps diagram.* inside it', () => {
  fs.mkdirSync(path.join(TMP, 'tools', 'thing'), { recursive: true });
  return D.diagramFor('tools/thing', TMP).png === path.join(TMP, 'tools', 'thing', 'diagram.png') || 'wrong path';
});

// --- the check reads both files back
pair('lib/good.diagram', SVG, PNG_OK);
t('C1 a good pair passes', () => ok('lib/good.js').ok || ok('lib/good.js').why.join('; '));
put('lib/nohtml.diagram.png', PNG_OK);
t('C2 no HTML source fails', () => (!ok('lib/nohtml.js').ok && ok('lib/nohtml.js').why.includes('no HTML source')) || 'passed');
put('lib/nopng.diagram.html', SVG);
t('C3 no PNG fails', () => (!ok('lib/nopng.js').ok && ok('lib/nopng.js').why.includes('no PNG picture')) || 'passed');
pair('lib/nosvg.diagram', '<html><body>TODO draw</body></html>', PNG_OK);
t('C4 HTML with no <svg> fails', () => !ok('lib/nosvg.js').ok || 'passed');
pair('lib/fake.diagram', SVG, Buffer.alloc(9000, 65));
t('C5 a PNG that is not a PNG fails', () => (!ok('lib/fake.js').ok && /not a PNG/.test(ok('lib/fake.js').why.join())) || 'passed');
pair('lib/tiny.diagram', SVG, PNG_OK.subarray(0, 2000));
t('C6 a PNG under 5 KB (blank render) fails', () => (!ok('lib/tiny.js').ok && /under 5 KB/.test(ok('lib/tiny.js').why.join())) || 'passed');
put('lib/stale.diagram.png', PNG_OK, 60000); put('lib/stale.diagram.html', SVG);
t('C7 a PNG older than its HTML fails (stale picture)', () => (!ok('lib/stale.js').ok && /older/.test(ok('lib/stale.js').why.join())) || 'passed');
pair('lib/upper.diagram', '<HTML><SVG viewBox="0 0 1 1"></SVG></HTML>', PNG_OK);
t('C8 an upper-case <SVG> is still a drawing', () => ok('lib/upper.js').ok || ok('lib/upper.js').why.join());
t('C9 a part that does not exist fails with reasons, never throws', () => (!ok('lib/ghost.js').ok && ok('lib/ghost.js').why.length === 2) || 'unexpected');
pair('domain/feat/diagram', SVG, PNG_OK); put('domain/feat/README.md', 'goal: x');
t('C10 a Feature with its pair passes through any of its files', () => ok('domain/feat/feat.check.hook.js').ok || 'failed');

// --- census
put('domain/bare/README.md', 'goal: y');
fs.mkdirSync(path.join(TMP, 'domain', 'noreadme'), { recursive: true });
put('.claude/skills/sk/SKILL.md', '---\nname: sk\n---');
put('system/tools.json', JSON.stringify([{ id: 'good', home: 'lib/good.js' }, { id: 'gone', home: 'lib/gone.js' }, { id: 'odd', home: '' }]));
put('lib/good.js', '//');
t('N1 census counts Features with a README, Skills and Tools, and marks which have a diagram', () => {
  const rows = D.census(TMP);
  const k = rows.map(r => `${r.kind}:${r.name}:${r.ok ? 1 : 0}`).sort().join(' ');
  return k === 'Feature:bare:0 Feature:feat:1 Skill:sk:0 Tool:good:1' || k;
});
t('N2 a folder with no README and a Tool whose file is gone are skipped, never crash', () => !D.census(TMP).some(r => /noreadme|gone|odd/.test(r.name)) || 'listed');
t('N3 a broken tools.json still gives a census', () => {
  put('system/tools.json', '{not json'); const n = D.census(TMP).length;
  put('system/tools.json', '[]'); return n === 3 || 'rows ' + n;
});

// --- CLI
const cli = (...a) => spawnSync(process.execPath, [path.join(__dirname, 'diagram-census.js'), ...a], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
t('L1 --check on the real requirement-index Tool exits 0', () => { const r = cli('--check', 'quest/requirement-index.js'); return (r.status === 0 && /DIAGRAM: OK/.test(r.stdout)) || r.stdout + r.stderr; });
t('L2 --check on a part with no diagram exits 1 and names both files and the render command', () => {
  const r = cli('--check', 'lib/ghost-part-xyz.js');
  return (r.status === 1 && /ghost-part-xyz\.diagram\.html/.test(r.stdout) && /diagram-render\.js/.test(r.stdout)) || r.status + ' ' + r.stdout;
});
t('L3 --check with no part exits 2', () => cli('--check').status === 2 || 'not 2');
t('L4 the plain census prints counts and exits 0', () => { const r = cli(); return (r.status === 0 && /^DIAGRAM CENSUS: .*Feature \d+\/\d+/.test(r.stdout)) || r.stdout; });
t('L5 this Tool carries its own diagram', () => cli('--check', 'lib/diagram-census.js').status === 0 || 'no diagram for diagram-census');

// --- birth gate: a new Feature README must name its diagram
const gate = (content) => spawnSync(process.execPath, [path.join(ROOT, 'domain', 'component-birth-gate', 'component-birth-gate.check.hook.js')], {
  input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: path.join(ROOT, 'domain', 'zz-new-feature-eval', 'README.md'), content } }),
  encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, FORGE_BIRTH: '' },
});
const KEYS = 'goal: g\nretention: keep\nfootprint: on-demand: none\nself_audit: reads back\n';
t('G1 the birth gate blocks a new Feature README with no diagram: line', () => { const r = gate(KEYS); return (r.status === 2 && /diagram:/.test(r.stderr + r.stdout)) || 'exit ' + r.status + ' ' + (r.stderr || r.stdout).slice(0, 200); });
t('G2 the birth gate lets it through with a diagram: line', () => { const r = gate(KEYS + 'diagram: diagram.png\n'); return r.status === 0 || 'exit ' + r.status + ' ' + (r.stderr || r.stdout).slice(0, 200); });

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`diagram-census.eval: ${pass}/${pass + fail} ${fail ? 'RED' : 'green'}`);
process.exit(fail ? 1 : 0);
