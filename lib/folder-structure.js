#!/usr/bin/env node
/**
 * lib/folder-structure.js — root-layout checker for system/FOLDER-STRUCTURE.md (born 2026-09-04).
 * The MD is the single source: its ```json fence carries { allow: [...], pending_nod: [...] }.
 *   node lib/folder-structure.js check [--root <repo>] [--json]
 *   node lib/folder-structure.js map   [--root <repo>] [--json]   (system/INDEX.md map vs the disk — added 2026-10-05)
 * Exit 0 always in library use; CLI exits 1 when orphans exist. Used by .claude/hooks/system-audit.js at boot.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const DOC = 'system/FOLDER-STRUCTURE.md';

function loadRule(root) {
  const md = fs.readFileSync(path.join(root, DOC), 'utf8');
  const m = md.match(/```json\s*([\s\S]*?)```/);
  if (!m) throw new Error(DOC + ' has no ```json allow-list fence');
  const rule = JSON.parse(m[1]);
  if (!Array.isArray(rule.allow)) throw new Error(DOC + ' fence lacks "allow"');
  rule.pending_nod = rule.pending_nod || [];
  return rule;
}
function check(opts) {
  const root = (opts && opts.root) || ROOT;
  const rule = loadRule(root);
  const entries = fs.readdirSync(root);
  const allow = new Set(rule.allow), pending = new Set(rule.pending_nod);
  const orphans = entries.filter(e => !allow.has(e) && !pending.has(e));
  const pendingPresent = entries.filter(e => pending.has(e));
  const missing = rule.allow.filter(e => !entries.includes(e) && !/^(\.git|node_modules|backups|meta|outputs-temp\.gitkeep)$/.test(e));
  return { root, orphans, pending: pendingPresent, missing, allow: rule.allow.length };
}
// ── The system map (system/INDEX.md, みや ruling 4, 2026-10-04: INDEX.md is the ONE map) ──
// Its ```json fence carries { kinds: { <kind>: [paths] }, ignored: [paths] }. `map` proves the map
// against the disk, so the map cannot rot the way the 2026-05 layer block did (it named a deleted
// file and never named domain/, core/ or lib/):
//   missing    — a path the map names does not exist
//   duplicates — the same path sits under two kinds
//   unmapped   — a root entry (or a child of a partly-mapped folder) that no kind claims
// A deeper path may sit under another kind than its parent (quest → workflows, quest/active.txt →
// memory): the most specific path wins, so that is not a duplicate.
const MAP_DOC = 'system/INDEX.md';
const COPY_RX = /-[a-z0-9]+(-\d+)?(?=\.[a-z0-9]+$|$)/i;   // OneDrive conflict copy: name-<machine>[-N].ext
function loadMap(root) {
  const md = fs.readFileSync(path.join(root, MAP_DOC), 'utf8');
  const rx = /```json\s*([\s\S]*?)```/g; let m;
  while ((m = rx.exec(md)) !== null) {
    let j; try { j = JSON.parse(m[1]); } catch (_) { continue; }
    if (j && j.kinds && typeof j.kinds === 'object') { j.ignored = j.ignored || []; return j; }
  }
  throw new Error(MAP_DOC + ' has no ```json fence with "kinds" (the machine-read system map)');
}
function mapCheck(opts) {
  const root = (opts && opts.root) || ROOT;              // the disk being checked
  const mapRoot = (opts && opts.mapRoot) || root;         // where INDEX.md + FOLDER-STRUCTURE.md are read from
  const map = loadMap(mapRoot);
  const pending = new Set(loadRule(mapRoot).pending_nod);
  const norm = p => String(p).replace(/\\/g, '/').replace(/\/+$/, '');
  const owner = new Map(); const duplicates = [];
  for (const [kind, paths] of Object.entries(map.kinds)) for (const p of paths || []) {
    const k = norm(p);
    if (owner.has(k) && owner.get(k) !== kind) duplicates.push(k + ' (' + owner.get(k) + ' + ' + kind + ')');
    else owner.set(k, kind);
  }
  const ignored = new Set(map.ignored.map(norm));
  const named = [...owner.keys(), ...ignored];
  const missing = [...owner.keys()].filter(p => !fs.existsSync(path.join(root, p)));
  const unmapped = [];
  (function walk(relDir) {
    let names; try { names = fs.readdirSync(path.join(root, relDir)); } catch (_) { return; }
    for (const name of names) {
      const rel = relDir ? relDir + '/' + name : name;
      if (!relDir && pending.has(name)) continue;                       // awaiting みや's verdict, reported by `check`
      if (owner.has(rel) || ignored.has(rel)) continue;
      let isDir = false; try { isDir = fs.statSync(path.join(root, rel)).isDirectory(); } catch (_) {}
      if (isDir && named.some(p => p.startsWith(rel + '/'))) { walk(rel); continue; }
      if (relDir && COPY_RX.test(name) && named.some(p => p === rel.replace(COPY_RX, ''))) continue; // conflict copy of a mapped file
      unmapped.push(rel);
    }
  })('');
  const kinds = {}; for (const k of owner.values()) kinds[k] = (kinds[k] || 0) + 1;
  return { root, mapRoot, kinds, missing, duplicates, unmapped, ok: !missing.length && !duplicates.length && !unmapped.length };
}
module.exports = { loadRule, check, loadMap, mapCheck, DOC, MAP_DOC };

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  if (process.argv[2] === 'map') {
    const root = i > 0 ? path.resolve(process.argv[i + 1]) : ROOT;
    const r = mapCheck({ root });
    if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.ok ? 0 : 1); }
    console.log(`system-map — ${Object.entries(r.kinds).map(([k, n]) => k + ' ' + n).join(' · ')} · ${r.missing.length} missing · ${r.duplicates.length} duplicate(s) · ${r.unmapped.length} unmapped (root: ${r.root})`);
    if (r.missing.length) console.log('  MISSING (named in ' + MAP_DOC + ', not on disk): ' + r.missing.join(', '));
    if (r.duplicates.length) console.log('  UNDER TWO KINDS: ' + r.duplicates.join(', '));
    if (r.unmapped.length) console.log('  UNMAPPED (no kind claims it): ' + r.unmapped.join(', '));
    process.exit(r.ok ? 0 : 1);
  }
  const r = check({ root: i > 0 ? path.resolve(process.argv[i + 1]) : ROOT });
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.orphans.length ? 1 : 0); }
  console.log(`folder-structure — ${r.orphans.length} orphan(s) · ${r.pending.length} pending-nod · ${r.missing.length} allow-listed-but-missing (root: ${r.root})`);
  if (r.orphans.length) console.log('  ORPHANS (not in ' + DOC + '): ' + r.orphans.join(', '));
  if (r.pending.length) console.log('  pending みや nod: ' + r.pending.join(', '));
  if (r.missing.length) console.log('  allow-listed but absent: ' + r.missing.join(', '));
  process.exit(r.orphans.length ? 1 : 0);
}
