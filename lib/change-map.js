#!/usr/bin/env node
// change-map.js — the system change report as one picture (system/INDEX.md change route step 8)
// symptom: 2026-11-03 miya: the System › Kind tables "is not working ... always show a diagram ... use the boxes I've shown
//          you before" and "please use colours ... what has been added, where it has been added"
// goal: after every system change he sees, on the system map's own boxes, each changed part tagged new / changed / removed
//       with the folder it lives in
// boundary: covers one JSON list of changed parts, writes one HTML + PNG to the --out folder · never edits a repo file,
//           never reads INDEX.diagram.html mid-edit (the box frame is drawn here) · stops at CHANGE-MAP: OK <png> or FAIL <why>
// footprint: on-demand: 1 node, then lib/diagram-render.js (python self-check + headless Edge, ~5 s), all exit
// Usage: node lib/change-map.js <spec.json> [--out <folder>]
//   spec = { "title": "...", "subtitle": "...", "parts": [ { "kind": "rule|workflow|feature|tool|memory|kernel|project",
//            "tag": "new|changed|removed", "name": "INDEX.md", "dir": "system/", "what": "one line" } ] }
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TAG = { new: ['NEW', '#2f7d4f', 54], changed: ['CHANGED', '#2e5aa8', 70], removed: ['REMOVED', '#bf4520', 70] };
const KIND = {
  rule: { label: 'Rules', stroke: '#b8915a', fill: 'rgba(184,145,90,0.12)', ink: '#8a6a3c' },
  memory: { label: 'Memory', stroke: '#6e6479', fill: 'rgba(110,100,121,0.10)', ink: '#5a5166' },
  workflow: { label: 'Workflows', stroke: '#7c8f6f', fill: 'rgba(124,143,111,0.12)', ink: '#56684a' },
  feature: { label: 'Features', stroke: '#5e7a9b', fill: 'rgba(94,122,155,0.12)', ink: '#3d5876' },
  tool: { label: 'Tools', stroke: '#9c6b50', fill: 'rgba(156,107,80,0.12)', ink: '#7a5038' },
  kernel: { label: 'Kernel', stroke: '#4f5d75', fill: 'rgba(79,93,117,0.10)', ink: '#4f5d75' },
  project: { label: 'Projects', stroke: '#2d3142', fill: '#ffffff', ink: '#2d3142' },
};
const ALIAS = { rules: 'rule', workflows: 'workflow', features: 'feature', tools: 'tool', projects: 'project' };

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, max) {
  const out = []; let line = '';
  for (const w of String(text || '').split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out.length ? out : [];
}

// A folder path has no spaces: break it after a slash so it stays inside a narrow column.
function wrapPath(p, max) {
  const out = []; let line = '';
  for (const seg of String(p || '').split(/(?<=\/)/)) {
    if (line && (line + seg).length > max) { out.push(line); line = seg; } else line += seg;
  }
  if (line) out.push(line);
  return out;
}

function pill(x, y, tag) {
  const [label, color, w] = TAG[tag];
  return `<rect x="${x}" y="${y}" width="${w}" height="16" rx="8" fill="${color}"/><text x="${x + w / 2}" y="${y + 11}" text-anchor="middle" class="pt">${label}</text>`;
}

// A full-width band (Rules, Kernel, Projects): one line per part.
function band(kind, parts, y) {
  const k = KIND[kind]; const h = parts.length ? 46 + parts.length * 26 : 62;
  let s = box(20, y, 960, h, kind, parts.length);
  s += `<text x="40" y="${y + 26}" class="kind" fill="${parts.length ? k.ink : 'rgba(45,49,66,0.35)'}">${k.label}</text>`;
  if (!parts.length) return { svg: s + `<text x="40" y="${y + 46}" class="what" fill-opacity="0.6">no change</text>`, h };
  parts.forEach((p, i) => {
    const ly = y + 40 + i * 26;
    s += pill(40, ly, p.tag);
    s += `<text x="122" y="${ly + 12}" class="name">${esc(p.name)}</text><text x="330" y="${ly + 12}" class="dir">${esc(p.dir)}</text><text x="490" y="${ly + 12}" class="what">${esc(p.what)}</text>`;
  });
  return { svg: s, h };
}

// A column (Memory, Workflows, Features, Tools): parts stacked, text wrapped to the column width.
function column(kind, parts, x, y, w) {
  const k = KIND[kind]; const nameMax = Math.floor((w - 32) / 6.7); const textMax = Math.floor((w - 32) / 5.6);
  let body = ''; let cy = y + 40;
  if (!parts.length) body += `<text x="${x + 16}" y="${cy + 6}" class="what" fill-opacity="0.6">no change</text>`;
  for (const p of parts) {
    body += pill(x + 16, cy, p.tag); cy += 34;
    for (const l of wrap(p.name, nameMax)) { body += `<text x="${x + 16}" y="${cy}" class="name">${esc(l)}</text>`; cy += 15; }
    for (const l of wrapPath(p.dir, Math.floor((w - 32) / 5.9))) { body += `<text x="${x + 16}" y="${cy}" class="dir">${esc(l)}</text>`; cy += 15; }
    for (const l of wrap(p.what, textMax)) { body += `<text x="${x + 16}" y="${cy + 2}" class="what">${esc(l)}</text>`; cy += 15; }
    cy += 16;
  }
  const head = `<text x="${x + 16}" y="${y + 26}" class="kind" fill="${parts.length ? k.ink : 'rgba(45,49,66,0.35)'}">${k.label}</text>`;
  return { body: head + body, h: cy - y + 4 };
}

function box(x, y, w, h, kind, touched) {
  const k = KIND[kind];
  return touched
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.4"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#ffffff" stroke="rgba(45,49,66,0.2)"/>`;
}

function build(spec) {
  const by = {}; for (const k of Object.keys(KIND)) by[k] = [];
  for (const p of spec.parts || []) {
    const kind = ALIAS[String(p.kind || '').toLowerCase()] || String(p.kind || '').toLowerCase();
    const tag = String(p.tag || '').toLowerCase();
    if (!KIND[kind]) throw new Error('unknown kind "' + p.kind + '" (rule|workflow|feature|tool|memory|kernel|project)');
    if (!TAG[tag]) throw new Error('unknown tag "' + p.tag + '" for ' + p.name + ' (new|changed|removed)');
    if (!p.name) throw new Error('a part has no name');
    by[kind].push({ ...p, tag });
  }
  if (!(spec.parts || []).length) throw new Error('no parts: a change map needs at least one changed part');

  let svg = ''; let y = 34;
  const legend = pill(20, 4, 'new') + pill(84, 4, 'changed') + pill(164, 4, 'removed') + '<text x="246" y="16" class="what">faded box = no change</text>';
  const rules = band('rule', by.rule, y); svg += rules.svg; y += rules.h + 20;

  const cols = [['workflow', 370, 170], ['feature', 552, 262], ['tool', 826, 140]].map(([k, x, w]) => ({ k, x, w, ...column(k, by[k], x, y + 14, w) }));
  const mem = column('memory', by.memory, 20, y, 320);
  const midH = Math.max(mem.h, ...cols.map(c => c.h + 28), 200);
  svg += box(20, y, 320, midH, 'memory', by.memory.length) + mem.body;
  svg += `<rect x="356" y="${y}" width="624" height="${midH}" rx="6" fill="none" stroke="#4f5d75" stroke-dasharray="5 4"/>`;
  for (const c of cols) svg += box(c.x, y + 14, c.w, midH - 28, c.k, by[c.k].length) + c.body;
  y += midH + 20;

  const kernel = band('kernel', by.kernel, y); svg += kernel.svg; y += kernel.h + 20;
  const proj = band('project', by.project, y); svg += proj.svg; y += proj.h + 20;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(spec.title || 'System change report')}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #2d3142; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 3rem 2rem; }
    .frame { max-width: 1100px; width: 100%; padding: 28px 32px; box-sizing: content-box; }
    .eyebrow { font-family: Consolas, monospace; font-size: 0.66rem; letter-spacing: 0.18em; text-transform: uppercase; color: #4f5d75; margin-bottom: 0.5rem; }
    h1 { font-size: 1.6rem; font-weight: 600; line-height: 1.2; margin-bottom: 1.5rem; }
    svg { width: 100%; min-width: 1000px; display: block; }
    .pt { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8.5px; font-weight: 700; fill: #fff; letter-spacing: 0.06em; }
    .name { font-family: Consolas, monospace; font-size: 11px; fill: #2d3142; font-weight: 600; }
    .dir { font-family: Consolas, monospace; font-size: 9.5px; fill: #5a6580; }
    .what { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; fill: #4f5d75; }
    .kind { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="frame">
    <p class="eyebrow">${esc(spec.subtitle || 'System change report')}</p>
    <h1>${esc(spec.title || 'What changed, and where it lives')}</h1>
    <svg viewBox="0 0 1000 ${y}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t d">
      <title id="t">${esc(spec.title || 'System change report')}</title>
      <desc id="d">Each kind box of the system map lists the parts changed, tagged new, changed or removed, with the folder each lives in.</desc>
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      ${legend}
      ${svg}
    </svg>
  </div>
</body>
</html>
`;
}

function main(argv) {
  const specPath = argv.find(a => !a.startsWith('--'));
  const oi = argv.indexOf('--out');
  if (!specPath) { console.log('Usage: node lib/change-map.js <spec.json> [--out <folder>]'); return 2; }
  let spec;
  try { spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); } catch (e) { console.log('CHANGE-MAP: FAIL cannot read ' + specPath + ': ' + e.message); return 1; }
  let html;
  try { html = build(spec); } catch (e) { console.log('CHANGE-MAP: FAIL ' + e.message); return 1; }
  const dir = oi >= 0 && argv[oi + 1] ? argv[oi + 1] : path.dirname(path.resolve(specPath));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const out = path.join(dir, 'change-map-' + stamp + '.html');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(out, html);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'diagram-render.js'), out], { encoding: 'utf8', windowsHide: true });
  const line = String(r.stdout || '').split(/\r?\n/).find(l => /^DIAGRAM-RENDER:/.test(l)) || '';
  const ok = /^DIAGRAM-RENDER: OK (.+?\.png)/.exec(line);
  if (!ok) { console.log('CHANGE-MAP: FAIL render: ' + (line || String(r.stderr || '').trim().slice(0, 300))); return 1; }
  console.log('CHANGE-MAP: OK ' + ok[1] + ' (send it with SendUserFile, then Read it before)');
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { build, wrap, wrapPath, main };
