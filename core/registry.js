#!/usr/bin/env node
/**
 * core/registry.js — K4: ONE generated inventory (blueprint: "hand-written maps deleted").
 * Scans disk + settings.json + telemetry + registry.jsonl → writes REGISTRY.md.
 * Answers "what exists, who owns it, is it registered, does it have pins, when did it
 * last fire" as a lookup — never as an essay.
 *
 * USAGE: node core/registry.js [--check]   (--check: exit 1 if REGISTRY.md is stale)
 * Deterministic: same repo state → byte-identical output.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'REGISTRY.md');

function readJsonl(f) {
  try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); }
  catch (_) { return []; }
}
function safeList(dir, filter) {
  try { return fs.readdirSync(dir, { withFileTypes: true }).filter(filter); } catch (_) { return []; }
}

// --- registrations from settings.json ---
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const registrations = new Map(); // hookName -> {events:[], wrapped}
for (const [event, blocks] of Object.entries(settings.hooks || {})) {
  for (const b of blocks) for (const h of b.hooks || []) {
    const cmd = h.command || '';
    // bundle dispatcher: expand manifest children as registered '✓ bundled(<name>)'
    if (cmd.includes('dispatch-hooks.js')) {
      const mm = cmd.match(/--manifest\s+"([^"]+)"/);
      if (mm) {
        try {
          const man = JSON.parse(fs.readFileSync(path.join(ROOT, mm[1]), 'utf8'));
          for (const child of man.children || []) {
            const key = path.basename(child).replace(/\.js$/, '');
            const e = registrations.get(key) || { events: [], wrapped: false, bundle: man.name };
            if (!e.events.includes(event)) e.events.push(event);
            e.bundle = man.name;
            registrations.set(key, e);
          }
        } catch (_) {}
      }
      continue;
    }
    const names = cmd.match(/([\w.-]+)\.js/g) || [];
    const target = names[names.length - 1]; // wrap form: last .js is the real hook
    if (!target || target === 'hook-runtime.js') continue;
    const key = target.replace(/\.js$/, '');
    const e = registrations.get(key) || { events: [], wrapped: false };
    if (!e.events.includes(event)) e.events.push(event);
    e.wrapped = e.wrapped || cmd.includes('hook-runtime.js');
    registrations.set(key, e);
  }
}

// --- hook files on disk ---
const hookFiles = new Map(); // name -> {file, evals:[]}
for (const e of safeList(path.join(ROOT, '.claude', 'hooks'), d => d.isFile() && d.name.endsWith('.js') && !d.name.includes('.eval.'))) {
  hookFiles.set(e.name.replace(/\.js$/, ''), { file: '.claude/hooks/' + e.name, evals: [] });
}
for (const dir of safeList(path.join(ROOT, 'domain'), d => d.isDirectory())) {
  const dp = path.join(ROOT, 'domain', dir.name);
  const evals = [];
  const hooks = [];
  for (const f of safeList(dp, d => d.isFile())) {
    if (/hook\.js$/.test(f.name)) hooks.push(f.name);
    if (/(^eval\.js$|\.eval\.js$)/.test(f.name)) evals.push(f.name);
  }
  for (const h of hooks) { // a domain folder can hold SEVERAL hooks (e.g. trigger + discipline pair)
    hookFiles.set(h.replace(/\.js$/, ''), { file: 'domain/' + dir.name + '/' + h, evals });
  }
  if (!hooks.length && evals.length) {
    hookFiles.set(dir.name + ' (eval-only pkg)', { file: 'domain/' + dir.name, evals });
  }
}

// --- telemetry last-fire ---
const fires = readJsonl(path.join(ROOT, 'meta', 'telemetry', 'hook-fires.jsonl'));
const lastFire = new Map();
for (const r of fires) if (r.hook) lastFire.set(r.hook, r.ts);

// --- lifecycle events from forge registry ---
const lifecycle = new Map();
for (const r of readJsonl(path.join(ROOT, 'meta', 'registry.jsonl'))) if (r.name && r.lifecycle) lifecycle.set(r.name, r.lifecycle);

// --- skills ---
const skills = safeList(path.join(ROOT, '.claude', 'skills'), d => d.isDirectory()).map(d => {
  const evals = safeList(path.join(ROOT, '.claude', 'skills', d.name), f => f.isFile() && /eval/.test(f.name)).map(f => f.name);
  return { name: d.name, evals };
});

// --- core/lib scripts ---
const scripts = [];
for (const dir of ['core', 'lib', 'quest', 'meta']) {
  for (const e of safeList(path.join(ROOT, dir), d => d.isFile() && d.name.endsWith('.js') && !d.name.includes('.eval.'))) {
    const evalTwin = fs.existsSync(path.join(ROOT, dir, e.name.replace(/\.js$/, '.eval.js')));
    scripts.push({ file: dir + '/' + e.name, eval: evalTwin });
  }
}

// --- assemble ---
const allHookNames = new Set([...registrations.keys(), ...hookFiles.keys()]);
const hookRows = [];
for (const name of [...allHookNames].sort()) {
  const reg = registrations.get(name);
  const file = hookFiles.get(name);
  const short = name.replace(/\.(discipline|gate|trigger|check)\.hook$/, '');
  const fireTs = lastFire.get(name) || lastFire.get(short) || '';
  hookRows.push({
    name: short,
    events: reg ? reg.events.join('+') : '—',
    registered: reg ? (reg.bundle ? '✓ bundled(' + reg.bundle + ')' : (reg.wrapped ? '✓ wrapped' : '✓ direct')) : '🔶 NOT registered',
    onDisk: file ? '✓' : '🚨 GHOST (registered, no file)',
    evals: file && file.evals.length ? file.evals.length + ' ✓' : '—',
    lastFire: fireTs ? fireTs.slice(0, 16) : '—',
    lifecycle: lifecycle.get(short) || lifecycle.get(name) || 'pre-forge',
  });
}
const ghosts = hookRows.filter(r => r.onDisk.includes('GHOST')).length;
const orphans = hookRows.filter(r => r.registered.includes('NOT')).length;
const noEval = hookRows.filter(r => r.evals === '—' && !r.onDisk.includes('GHOST')).length;

const md = [];
md.push('# REGISTRY — generated inventory (K4)');
md.push('');
md.push('_AUTO-GENERATED by `core/registry.js` — do NOT hand-edit. Regenerate: `node core/registry.js`._');
md.push('_Health: ' + ghosts + ' ghost(s) · ' + orphans + ' unregistered file(s) · ' + noEval + ' hook(s) without eval pins · telemetry rows: ' + fires.length + '_');
md.push('');
md.push('## Feature checks / hooks (' + hookRows.length + ')');
md.push('');
md.push('| Feature | Event(s) | Registered | On disk | Evals | Last fire (UTC) | Lifecycle |');
md.push('|---|---|---|---|---|---|---|');
for (const r of hookRows) md.push(`| ${r.name} | ${r.events} | ${r.registered} | ${r.onDisk} | ${r.evals} | ${r.lastFire} | ${r.lifecycle} |`);
md.push('');
md.push('## Skills (' + skills.length + ')');
md.push('');
md.push('| Skill | Eval fixtures |');
md.push('|---|---|');
for (const s of skills.sort((a, b) => a.name.localeCompare(b.name))) md.push(`| ${s.name} | ${s.evals.length ? s.evals.join(', ') : '—'} |`);
md.push('');
md.push('## Scripts (core/ lib/ quest/ system/) (' + scripts.length + ')');
md.push('');
md.push('| Script | Eval twin |');
md.push('|---|---|');
for (const s of scripts.sort((a, b) => a.file.localeCompare(b.file))) md.push(`| ${s.file} | ${s.eval ? '✓' : '—'} |`);
md.push('');
const content = md.join('\n');

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== content) { console.error('registry: REGISTRY.md is STALE — run `node core/registry.js`'); process.exit(1); }
  console.log('registry: up to date (' + hookRows.length + ' features, ' + skills.length + ' skills, ' + scripts.length + ' scripts).');
  process.exit(0);
}
fs.writeFileSync(OUT, content);
console.log(`registry: ${hookRows.length} features · ${skills.length} skills · ${scripts.length} scripts → REGISTRY.md  (${ghosts} ghosts, ${orphans} unregistered, ${noEval} eval-less)`);
