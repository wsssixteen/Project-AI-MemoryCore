#!/usr/bin/env node
// feature-census.js — born via forge (2026-08-21)
// Deterministic estate-wide feature inventory. Regenerates system/feature-census.md.
// WHY: "list every feature so you do not lie" (miya 2026-08-21). A hand-written list rots;
// this scan IS the list. Also the observability monitor: per component it records whether
// the component can be AUDITED (eval) and MONITORED (log.jsonl / telemetry).
// Usage: node lib/feature-census.js            (writes system/feature-census.md + log row)
//        node lib/feature-census.js --gaps     (print only GAPS rows to stdout)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'system', 'feature-census.md');
const LOG = path.join(ROOT, 'lib', 'feature-census.log.jsonl');

const exists = p => { try { fs.statSync(p); return true; } catch (_) { return false; } };
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };
const listDir = p => { try { return fs.readdirSync(p); } catch (_) { return []; } };

// ── 1. What settings.json actually runs (direct · wrapped · bundled) ──
function registeredPaths() {
  const set = new Set();        // every path that runs
  const telemetered = new Set(); // paths whose fires reach central telemetry (wrapped or bundled)
  const bundleFiles = new Set();
  let settings;
  try { settings = JSON.parse(read(path.join(ROOT, '.claude', 'settings.json'))); } catch (_) { return { set, telemetered }; }
  const commands = [];
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.command === 'string') commands.push(node.command);
    for (const k of Object.keys(node)) walk(node[k]);
  })(settings.hooks || settings);
  for (const cmd of commands) {
    const wrapped = /hook-runtime\.js"?\s+--wrap|dispatch-hooks\.js/.test(cmd);
    // decoded command: single (or doubled) backslashes; pull every repo-relative script/json path
    const pathRe = /\$\{CLAUDE_PROJECT_DIR\}[\\/]+((?:[\w.-]+[\\/]+)*[\w.-]+\.(?:js|json))/g;
    let pm;
    while ((pm = pathRe.exec(cmd)) !== null) {
      const rel = pm[1].replace(/\\+/g, '/');
      set.add(rel);
      if (wrapped) telemetered.add(rel);
      if (rel.endsWith('.json')) bundleFiles.add(rel);
    }
    // manifest paths given repo-relative without the env prefix
    const manifestRe = /--manifest"?\s+"?((?:[\w-]+[\\/])*[\w-]+\.json)/g;
    while ((pm = manifestRe.exec(cmd)) !== null) bundleFiles.add(pm[1].replace(/\\+/g, '/'));
  }
  // expand bundles — dispatch-hooks.js writes per-child telemetry, so children are telemetered
  for (const b of bundleFiles) {
    let j; try { j = JSON.parse(read(path.join(ROOT, b))); } catch (_) { continue; }
    for (const c of (j && j.children) || []) {
      const rel = String(c).replace(/\\+/g, '/');
      set.add(rel); telemetered.add(rel);
    }
  }
  return { set, telemetered };
}

// A folder whose README declares RETIRED / DEREGISTERED is a tombstone, not a ghost.
function tombstoned(dir) {
  const rd = read(path.join(dir, 'README.md'));
  return /\b(RETIRED|DEREGISTERED|TOMBSTONE)\b/.test(rd.slice(0, 400));
}

function verdict(gaps) { return gaps.length ? 'GAPS: ' + gaps.join(', ') : 'PROPER'; }

function main() {
  const { set: reg, telemetered } = registeredPaths();
  const rows = [];
  const isReg = rel => reg.has(rel.replace(/\\/g, '/'));
  const isTele = rel => telemetered.has(rel.replace(/\\/g, '/'));

  // ── domain/ trinities ──
  for (const name of listDir(path.join(ROOT, 'domain'))) {
    const dir = path.join(ROOT, 'domain', name);
    if (!fs.statSync(dir).isDirectory() || name === 'bundles') continue;
    const files = listDir(dir);
    const hooks = files.filter(f => /\.hook\.js$/.test(f));
    const hasEval = files.some(f => /eval/.test(f) && f.endsWith('.js'));
    const hasReadme = files.includes('README.md');
    const hasLog = files.some(f => f === 'log.jsonl' || f.endsWith('.log.jsonl'));
    if (tombstoned(dir)) { rows.push({ name: 'domain/' + name, kind: 'feature(hook)', reg: 'retired (tombstone)', verdict: 'RETIRED' }); continue; }
    const hookReg = hooks.length === 0 || hooks.some(h => isReg('domain/' + name + '/' + h));
    // observable via: settings wrap/bundle OR body's runHook (hook-runtime writes central telemetry)
    const hookTele = hooks.some(h => isTele('domain/' + name + '/' + h))
      || hooks.some(h => /runHook|hook-runtime/.test(read(path.join(dir, h))));
    const gaps = [];
    if (hooks.length && !hookReg) gaps.push('NOT REGISTERED (ghost)');
    if (!hasEval) gaps.push('no eval');
    if (!hasReadme) gaps.push('no README');
    if (!hasLog && !hookTele) gaps.push('no log (unobservable)');
    rows.push({ name: 'domain/' + name, kind: hooks.length ? 'feature(hook)' : 'feature(other)', reg: hooks.length ? (hookReg ? 'registered' : 'GHOST') : '—', verdict: verdict(gaps) });
  }

  // ── legacy .claude/hooks ──
  for (const f of listDir(path.join(ROOT, '.claude', 'hooks'))) {
    if (!f.endsWith('.js') || /\.eval\.js$/.test(f)) continue;
    const rel = '.claude/hooks/' + f;
    const body = read(path.join(ROOT, rel));
    const optOut = /system-audit:\s*skip-ghost-check/.test(body);
    const hasLog = /log\.jsonl|appendFileSync\(LOG|hook-runtime/.test(body) || isTele(rel);
    const evalSibling = exists(path.join(ROOT, '.claude', 'hooks', f.replace(/\.js$/, '.eval.js')));
    const gaps = [];
    if (!isReg(rel) && !optOut) gaps.push('NOT REGISTERED (ghost)');
    if (!hasLog) gaps.push('no log (unobservable)');
    if (!evalSibling) gaps.push('no eval');
    rows.push({ name: rel, kind: 'legacy-hook', reg: isReg(rel) ? 'registered' : (optOut ? 'opted-out' : 'GHOST'), verdict: verdict(gaps) });
  }

  // ── skills ──
  for (const s of listDir(path.join(ROOT, '.claude', 'skills'))) {
    const sk = path.join(ROOT, '.claude', 'skills', s);
    if (!fs.statSync(sk).isDirectory()) continue;
    const gaps = [];
    if (!exists(path.join(sk, 'SKILL.md'))) gaps.push('no SKILL.md');
    rows.push({ name: '.claude/skills/' + s, kind: 'skill', reg: 'description-matched', verdict: verdict(gaps) });
  }

  // ── scripts (core/ quest/ lib/) — observability = writes some log or telemetry ──
  for (const dirName of ['core', 'quest', 'lib']) {
    for (const f of listDir(path.join(ROOT, dirName))) {
      if (!f.endsWith('.js') || /eval|\.log\./.test(f)) continue;
      const body = read(path.join(ROOT, dirName, f));
      const hasLog = /appendFileSync|log\.jsonl|jsonl'/.test(body);
      const gaps = hasLog ? [] : ['no log (unobservable)'];
      rows.push({ name: dirName + '/' + f, kind: 'script', reg: 'invoked-manually', verdict: verdict(gaps) });
    }
  }

  // ── Feature/ legacy systems ──
  for (const f of listDir(path.join(ROOT, 'Feature'))) {
    const dir = path.join(ROOT, 'Feature', f);
    if (!exists(dir) || !fs.statSync(dir).isDirectory()) continue;
    rows.push({ name: 'Feature/' + f, kind: 'protocol-system', reg: 'doc-driven', verdict: 'review: protocol-tier (enforcement lives in its gates)' });
  }

  const gapsRows = rows.filter(r => r.verdict.startsWith('GAPS'));
  const ghostRows = rows.filter(r => r.reg === 'GHOST');

  if (process.argv.includes('--gaps')) {
    for (const r of gapsRows) console.log(`${r.name} · ${r.kind} · ${r.reg} · ${r.verdict}`);
    console.log(`\n${gapsRows.length} gap component(s) / ${rows.length} total · ghosts: ${ghostRows.length}`);
    return;
  }

  const ts = new Date().toISOString();
  const md = [
    '# Feature Census — auto-generated by lib/feature-census.js',
    '',
    `> Regenerated ${ts}. NEVER hand-edit — rerun the script.`,
    `> ${rows.length} components · ${rows.length - gapsRows.length} PROPER · ${gapsRows.length} with gaps · ${ghostRows.length} ghost(s)`,
    '',
    '| Component | Kind | Registration | Verdict |',
    '|---|---|---|---|',
    ...rows.sort((a, b) => (a.verdict.startsWith('GAPS') ? 0 : 1) - (b.verdict.startsWith('GAPS') ? 0 : 1) || a.name.localeCompare(b.name))
      .map(r => `| ${r.name} | ${r.kind} | ${r.reg} | ${r.verdict} |`),
    '',
  ].join('\n');
  fs.writeFileSync(OUT, md);
  try { fs.appendFileSync(LOG, JSON.stringify({ ts, total: rows.length, gaps: gapsRows.length, ghosts: ghostRows.length }) + '\n'); } catch (_) {}
  console.log(`feature-census: ${rows.length} components -> ${path.relative(ROOT, OUT)} · ${gapsRows.length} with gaps · ${ghostRows.length} ghost(s)`);
}

main();
