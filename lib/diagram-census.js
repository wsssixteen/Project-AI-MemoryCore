#!/usr/bin/env node
/**
 * lib/diagram-census.js — every part of the system carries its own diagram (born 2026-10-28 via forge).
 *
 * symptom: 2026-10-28 miya: "I am planning to create like a mandatory diagram creation for each of
 *          anything we've built. It will be included inside the git of this project as reference."
 * goal: every part of the system has a checked picture of how it works, kept next to it in git, so it
 *       can be brought up and explained at once next time.
 * goal_signal: `node lib/diagram-census.js --check <part>` exits 0 for every part born or refined.
 * retention: regenerate (the census is printed, nothing is stored).
 * footprint: on-demand: 1 node process, under 1 s, exits.
 * self_audit: --check reads both files back from disk: the HTML holds an <svg>, the PNG is a real PNG
 *             of at least 5 KB and is not older than its HTML (a stale picture fails).
 * state-scoped: no, state-agnostic.
 * rollback: delete lib/diagram-census.js + lib/diagram-census.eval.js + the system/tools.json row
 *           "diagram-census" + system-design Rule 17 + the `diagram` key in component-birth-gate.
 *
 * Where a part's diagram lives (one rule, next to the part):
 *   Feature  domain/<name>/            → domain/<name>/diagram.html + diagram.png
 *   Skill    .claude/skills/<name>/    → .claude/skills/<name>/diagram.html + diagram.png
 *   one file lib/x.js, quest/x.js, ... → lib/x.diagram.html + lib/x.diagram.png
 *   a file inside a Feature or Skill folder uses that folder's diagram.
 * Draw it with the explain-diagram skill; render it with `node lib/diagram-render.js <html> --out <png>`.
 *
 * CLI: node lib/diagram-census.js --check <part path>   exit 0 PASS · 1 FAIL (prints why and the two paths)
 *      node lib/diagram-census.js [--missing] [--json]  census of Features, Skills and Tools
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR && fs.existsSync(path.join(process.env.CLAUDE_PROJECT_DIR, 'lib'))
  ? process.env.CLAUDE_PROJECT_DIR : path.resolve(__dirname, '..');
const MIN_PNG = 5 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

// The diagram pair for a part, by the rule above. `part` is relative to root or absolute.
function diagramFor(part, root) {
  const r = root || ROOT;
  const abs = path.resolve(r, part);
  const rel = path.relative(r, abs).replace(/\\/g, '/');
  const folder = rel.match(/^(domain\/[^/]+|\.claude\/skills\/[^/]+)(\/|$)/);
  if (folder) {
    const dir = path.join(r, folder[1]);
    return { html: path.join(dir, 'diagram.html'), png: path.join(dir, 'diagram.png') };
  }
  let isDir = false; try { isDir = fs.statSync(abs).isDirectory(); } catch (_) {}
  if (isDir) return { html: path.join(abs, 'diagram.html'), png: path.join(abs, 'diagram.png') };
  const base = abs.replace(/\.[^./\\]+$/, '');
  return { html: base + '.diagram.html', png: base + '.diagram.png' };
}

// Reads both files back; returns [] when the pair is good, else the reasons.
function check(part, root) {
  const d = diagramFor(part, root);
  const why = [];
  let html = null, png = null, hs = null, ps = null;
  try { html = fs.readFileSync(d.html, 'utf8'); hs = fs.statSync(d.html); } catch (_) { why.push('no HTML source'); }
  try { png = fs.readFileSync(d.png); ps = fs.statSync(d.png); } catch (_) { why.push('no PNG picture'); }
  if (html !== null && !/<svg[\s>]/i.test(html)) why.push('HTML holds no <svg> drawing');
  if (png !== null) {
    if (!png.subarray(0, 4).equals(PNG_MAGIC)) why.push('PNG file is not a PNG');
    else if (png.length < MIN_PNG) why.push(`PNG is ${png.length} bytes, under 5 KB (blank render)`);
  }
  if (hs && ps && ps.mtimeMs + 2000 < hs.mtimeMs) why.push('PNG is older than its HTML: render it again');
  return { ...d, ok: why.length === 0, why };
}

// Every part that should carry a diagram: Features, Skills, and Tools from system/tools.json.
function parts(root) {
  const r = root || ROOT;
  const out = [];
  const dirs = (p) => { try { return fs.readdirSync(path.join(r, p), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); } catch (_) { return []; } };
  for (const n of dirs('domain')) if (fs.existsSync(path.join(r, 'domain', n, 'README.md'))) out.push({ kind: 'Feature', name: n, part: 'domain/' + n });
  for (const n of dirs('.claude/skills')) if (fs.existsSync(path.join(r, '.claude', 'skills', n, 'SKILL.md'))) out.push({ kind: 'Skill', name: n, part: '.claude/skills/' + n });
  let tools = [];
  try { const t = JSON.parse(fs.readFileSync(path.join(r, 'system', 'tools.json'), 'utf8')); tools = Array.isArray(t) ? t : (t.tools || []); } catch (_) {}
  for (const t of tools) {
    const home = String(t.home || '').split(/[ ·,]/)[0];
    if (/\.(js|py|md)$/.test(home) && fs.existsSync(path.join(r, home))) out.push({ kind: 'Tool', name: t.id, part: home });
  }
  return out;
}

function census(root) {
  return parts(root).map(p => ({ ...p, ok: check(p.part, root).ok }));
}

module.exports = { diagramFor, check, parts, census };

if (require.main === module) {
  const a = process.argv.slice(2);
  const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
  const i = a.indexOf('--check');
  if (i >= 0) {
    const part = a[i + 1];
    if (!part || part.startsWith('--')) { console.error('usage: node lib/diagram-census.js --check <part path>'); process.exit(2); }
    const c = check(part);
    if (c.ok) { console.log(`DIAGRAM: OK ${rel(c.png)}`); process.exit(0); }
    console.log(`DIAGRAM: FAIL ${part}: ${c.why.join('; ')}\n  draw  ${rel(c.html)}  (explain-diagram skill)\n  render node lib/diagram-render.js ${rel(c.html)} --out ${rel(c.png)}`);
    process.exit(1);
  }
  const rows = census();
  if (a.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
  const by = {};
  for (const r of rows) { by[r.kind] = by[r.kind] || { have: 0, all: 0 }; by[r.kind].all++; if (r.ok) by[r.kind].have++; }
  console.log('DIAGRAM CENSUS: ' + Object.entries(by).map(([k, v]) => `${k} ${v.have}/${v.all}`).join(' · '));
  if (a.includes('--missing')) for (const r of rows.filter(x => !x.ok)) console.log(`  missing  ${r.kind.padEnd(7)} ${r.part}`);
  process.exit(0);
}
