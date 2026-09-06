#!/usr/bin/env node
// goal-backfill — born via forge (2026-09-07) — plan §9f
// symptom: feature-census 2026-09-06: 53 of 96 domain features have no goal: line; miya has no time to write them
// goal: every goal-less feature README gets a draft goal, goal_signal and retention derived from its forge
//       registry row, NUKE-MARKER Session line or hook header, marked goal_status: draft until Ruri promotes it
// goal_signal: feature-census counts 0 goal-less features and reports drafts separately
// retention: regenerate (drafts are rewritten by --draft; promotion is the durable act)
//
//   node lib/goal-backfill.js list                → goal-less features + which source a draft would use
//   node lib/goal-backfill.js --draft [feature]   → write draft keys into README(s) lacking goal: (never overwrites a declared goal)
//   node lib/goal-backfill.js promote <feature> [--goal "..."] [--signal "..."] [--retention keep|rotate <p>|consume <into>|regenerate]
//                                                 → flips goal_status: draft → declared (optionally rewriting the lines after reading the code)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const DOMAIN = path.join(ROOT, 'domain');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] !== undefined && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } }
function hasKey(t, k) { return new RegExp('^\\s*\\**' + k + '\\**\\s*:\\s*\\S', 'mi').test(t); }
function clean(s) { return String(s || '').replace(/\s+/g, ' ').replace(/^TODO\(forge\):?\s*/i, '').trim(); }

function registry() {
  const m = {};
  for (const l of read(path.join(ROOT, 'system', 'registry.jsonl')).split('\n')) { try { const r = JSON.parse(l); if (r.lifecycle === 'created' && r.name) m[r.name] = r; } catch (_) {} }
  return m;
}
function nukeSession(dir) {
  const m = read(path.join(dir, 'NUKE-MARKER.md')).match(/^\|\s*Session\s*\|\s*([^|]+)\|/m);
  const s = m ? clean(m[1]) : '';
  return /^TODO/i.test(s) ? '' : s;
}
function hookHeader(dir) {
  let files = []; try { files = fs.readdirSync(dir).filter(f => /\.(hook\.js|js)$/.test(f) && !/eval/.test(f)); } catch (_) {}
  for (const f of files) {
    const t = read(path.join(dir, f)).slice(0, 4000);
    const trig = (t.match(/^\/\/\s*TRIGGER:\s*(.+)$/m) || [])[1];
    const act = (t.match(/^\/\/\s*ACTION:\s*(.+)$/m) || [])[1];
    if (trig || act) return { trigger: clean(trig), action: clean(act) };
    const doc = t.match(/\/\*\*([\s\S]*?)\*\//);
    if (doc) { const first = doc[1].split('\n').map(x => x.replace(/^\s*\*\s?/, '').trim()).filter(Boolean).slice(0, 3).join(' '); if (first) return { trigger: '', action: clean(first) }; }
  }
  return null;
}
function readmeWhat(dir) {
  const t = read(path.join(dir, 'README.md'));
  const w = (t.match(/\*\*What fires when\*\*:\s*(.+)/) || [])[1];
  const c = (t.match(/\*\*Contract\*\*:\s*(.+)/) || [])[1];
  return { trigger: clean(w), action: clean(c) };
}
function derive(name, dir, reg) {
  const r = reg[name];
  if (r && r.action) return { source: 'registry', symptom: clean(r.replay || r.trigger), goal: clean(r.action), signal: 'the ' + (r.event || 'run') + ' fire produced: ' + clean(r.action).slice(0, 80), retention: /log|ledger|register/i.test(r.action) ? 'keep' : 'rotate monthly' };
  const s = nukeSession(dir);
  const h = hookHeader(dir) || readmeWhat(dir);
  if (s && h && (h.action || h.trigger)) return { source: 'nuke-marker+header', symptom: s, goal: h.action || ('the outcome behind: ' + h.trigger), signal: 'a fire on: ' + (h.trigger || 'its trigger'), retention: 'rotate monthly' };
  if (h && (h.action || h.trigger)) return { source: 'hook-header', symptom: 'not recorded at birth (pre-Rule-13 feature)', goal: h.action || ('the outcome behind: ' + h.trigger), signal: 'a fire on: ' + (h.trigger || 'its trigger'), retention: 'rotate monthly' };
  if (s) return { source: 'nuke-marker', symptom: s, goal: 'resolve: ' + s, signal: 'unknown — needs a read of the code', retention: 'rotate monthly' };
  return null;
}
function goalless() {
  const reg = registry();
  const out = [];
  let dirs = []; try { dirs = fs.readdirSync(DOMAIN); } catch (_) {}
  for (const name of dirs) {
    const dir = path.join(DOMAIN, name);
    const rp = path.join(dir, 'README.md');
    if (!fs.existsSync(rp) || name === 'bundles') continue;
    const t = read(rp);
    if (hasKey(t, 'goal')) continue;
    out.push({ name, dir, draft: derive(name, dir, reg) });
  }
  return out;
}
function writeDraft(item) {
  const rp = path.join(item.dir, 'README.md');
  const t = read(rp);
  if (hasKey(t, 'goal')) return false;
  const d = item.draft; if (!d) return false;
  const block = ['goal_status: draft (derived from ' + d.source + ' on ' + new Date().toISOString().slice(0, 10) + '; promote with node lib/goal-backfill.js promote ' + item.name + ')',
    'symptom: ' + d.symptom, 'goal: ' + d.goal, 'goal_signal: ' + d.signal, 'retention: ' + d.retention, ''].join('\n');
  // insert after the H1 line if present, else at top
  const m = t.match(/^# .*\n/);
  const out = m ? t.replace(m[0], m[0] + '\n' + block) : block + t;
  fs.writeFileSync(rp, out);
  return true;
}
function promote(name) {
  const rp = path.join(DOMAIN, name, 'README.md');
  let t = read(rp); if (!t) { console.error('goal-backfill: no README for ' + name); process.exit(2); }
  const set = (k, v) => {
    if (!v) return;
    if (hasKey(t, k)) { t = t.replace(new RegExp('^(\\s*\\**' + k + '\\**\\s*:\\s*).*$', 'mi'), '$1' + v); return; }
    const h1 = t.match(/^﻿?# [^\r\n]*\r?\n/);
    t = h1 ? t.replace(h1[0], h1[0] + k + ': ' + v + '\n') : k + ': ' + v + '\n' + t;
  };
  set('goal', arg('goal')); set('goal_signal', arg('signal')); set('retention', arg('retention'));
  if (!hasKey(t, 'goal')) { console.error('goal-backfill: ' + name + ' has no goal: line — pass --goal'); process.exit(2); }
  if (/^goal_status:\s*draft/mi.test(t)) t = t.replace(/^goal_status:\s*draft.*$/mi, 'goal_status: declared (promoted ' + new Date().toISOString().slice(0, 10) + ')');
  else if (!/^goal_status:/mi.test(t)) t = t.replace(/^(goal:.*)$/mi, 'goal_status: declared (promoted ' + new Date().toISOString().slice(0, 10) + ')\n$1');
  fs.writeFileSync(rp, t);
  console.log('goal-backfill: ' + name + ' promoted → declared');
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'list') {
    const g = goalless();
    for (const it of g) console.log((it.draft ? it.draft.source.padEnd(20) : 'NO SOURCE'.padEnd(20)) + ' ' + it.name);
    console.log(g.length + ' goal-less feature(s); ' + g.filter(x => !x.draft).length + ' with no derivable source');
  } else if (cmd === '--draft') {
    const only = process.argv[3];
    let n = 0, skipped = [];
    for (const it of goalless()) { if (only && it.name !== only) continue; if (writeDraft(it)) n++; else skipped.push(it.name); }
    console.log('goal-backfill: ' + n + ' draft(s) written' + (skipped.length ? '; no source for: ' + skipped.join(', ') : ''));
  } else if (cmd === 'promote') promote(process.argv[3]);
  else { console.error('usage: goal-backfill <list | --draft [feature] | promote <feature> [--goal --signal --retention]>'); process.exit(2); }
}
module.exports = { goalless, derive, writeDraft };
