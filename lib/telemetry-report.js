#!/usr/bin/env node
/**
 * lib/telemetry-report.js — K6: generated telemetry report (external-audit Phase 1).
 * Three cadences (handoff, binding):
 *   --now            on-demand: "print the telemetry summary"
 *   --session-close  one screen: fires, blocks, bypasses, slips today, contingency status
 *   --weekly         trends + tripwires + lifecycle flags (promotion / retirement)
 * Data: meta/telemetry/hook-fires.jsonl · meta/slip-counts.jsonl · meta/registry.jsonl
 *       · meta/telemetry/contingency.json ({"status":"A-on-track"} default)
 * Generated file, never prose-from-memory (handoff Rule 6).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const FIRES = path.join(ROOT, 'meta', 'telemetry', 'hook-fires.jsonl');
const SLIPS = path.join(ROOT, 'meta', 'slip-counts.jsonl');
const CONTINGENCY = path.join(ROOT, 'meta', 'telemetry', 'contingency.json');

function readJsonl(f) {
  try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); }
  catch (_) { return []; }
}
function since(rows, ms) { const cut = Date.now() - ms; return rows.filter(r => r.ts && Date.parse(r.ts) >= cut); }
function contingency() {
  try { return JSON.parse(fs.readFileSync(CONTINGENCY, 'utf8')).status || 'A-on-track'; } catch (_) { return 'A-on-track (default — no contingency file)'; }
}
function byHook(rows) {
  const m = {};
  for (const r of rows) {
    const k = r.hook || '?';
    m[k] = m[k] || { fires: 0, blocks: 0, bypasses: 0, errors: 0 };
    m[k].fires++;
    if (r.blocked) m[k].blocks++;
    if (r.bypassed) m[k].bypasses++;
    if (r.error) m[k].errors++;
  }
  return m;
}
function table(m) {
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [pad('HOOK', 40) + pad('FIRES', 7) + pad('BLOCKS', 8) + pad('BYPASS', 8) + 'ERRORS'];
  for (const [k, v] of Object.entries(m).sort((a, b) => b[1].fires - a[1].fires)) {
    lines.push(pad(k, 40) + pad(v.fires, 7) + pad(v.blocks, 8) + pad(v.bypasses, 8) + v.errors);
  }
  return lines.join('\n');
}

const fires = readJsonl(FIRES);
const slips = readJsonl(SLIPS);
const mode = process.argv[2] || '--now';

if (mode === '--now' || mode === '--session-close') {
  const day = since(fires, 24 * 3600 * 1000);
  const daySlips = since(slips, 24 * 3600 * 1000);
  console.log('# Telemetry — ' + (mode === '--now' ? 'on-demand summary' : 'session close') + ' · ' + new Date().toISOString());
  console.log('');
  console.log(table(byHook(day)) || '(no fires in last 24h)');
  console.log('');
  console.log('Slips today (slip-counts.jsonl): ' + daySlips.length + (daySlips.length ? ' — ' + daySlips.map(s => s.category).join(' · ') : ''));
  console.log('Contingency status: ' + contingency());
  console.log('All-time telemetry rows: ' + fires.length + ' (since 2026-07-13 — coverage grows as hooks wrap)');
} else if (mode === '--weekly') {
  const wk = since(fires, 7 * 24 * 3600 * 1000);
  const prevWk = fires.filter(r => { const t = Date.parse(r.ts); return t < Date.now() - 7 * 24 * 3600 * 1000 && t >= Date.now() - 14 * 24 * 3600 * 1000; });
  const m = byHook(wk);
  console.log('# Telemetry — weekly roll-up · ' + new Date().toISOString());
  console.log('');
  console.log(table(m) || '(no fires this week)');
  console.log('');
  // Lifecycle flags (handoff policy)
  const flags = [];
  for (const [k, v] of Object.entries(m)) {
    if (v.fires >= 20) {
      const compliance = 1 - v.blocks / v.fires; // block = non-compliant first try
      if (compliance < 0.8) flags.push('PROMOTION candidate: ' + k + ' — first-try compliance ' + (compliance * 100).toFixed(0) + '% over ' + v.fires + ' fires (<80%)');
    }
  }
  // retirement: registered hooks with 0 fires in 30 days — needs registry+30d data; report what we can
  const mo = byHook(since(fires, 30 * 24 * 3600 * 1000));
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
    const registered = new Set();
    for (const ev of Object.values(settings.hooks || {})) for (const b of ev) for (const h of b.hooks || []) {
      const mm = (h.command || '').match(/([\w.-]+)\.js/g);
      if (mm) registered.add(mm[mm.length - 1].replace('.js', ''));
    }
    const dataDays = fires.length ? (Date.now() - Date.parse(fires[0].ts)) / 86400000 : 0;
    if (dataDays >= 30) {
      for (const name of registered) if (!mo[name]) flags.push('RETIREMENT candidate: ' + name + ' — 0 fires in 30 days');
    } else {
      flags.push('(retirement flags need 30 days of telemetry — have ' + dataDays.toFixed(1) + ')');
    }
  } catch (_) {}
  console.log('Lifecycle flags:');
  console.log(flags.length ? flags.map(f => '  - ' + f).join('\n') : '  (none)');
  console.log('');
  // Tripwire: slip category rising >30% across two consecutive weekly windows
  const wkSlips = since(slips, 7 * 24 * 3600 * 1000);
  const prevSlips = slips.filter(r => { const t = Date.parse(r.ts); return t < Date.now() - 7 * 86400000 && t >= Date.now() - 14 * 86400000; });
  const cnt = rows => rows.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});
  const cw = cnt(wkSlips), cp = cnt(prevSlips);
  const trips = Object.keys(cw).filter(c => cp[c] && cw[c] > cp[c] * 1.3);
  console.log('Tripwire: ' + (trips.length ? '⚠️ ' + trips.join(' · ') + ' rose >30% wk/wk' : 'none fired'));
  console.log('Contingency status: ' + contingency());
} else {
  console.error('usage: telemetry-report [--now|--session-close|--weekly]');
  process.exit(2);
}
