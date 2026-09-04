#!/usr/bin/env node
/**
 * lib/folder-structure.js — root-layout checker for system/FOLDER-STRUCTURE.md (born 2026-09-04).
 * The MD is the single source: its ```json fence carries { allow: [...], pending_nod: [...] }.
 *   node lib/folder-structure.js check [--root <repo>] [--json]
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
module.exports = { loadRule, check, DOC };

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  const r = check({ root: i > 0 ? path.resolve(process.argv[i + 1]) : ROOT });
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.orphans.length ? 1 : 0); }
  console.log(`folder-structure — ${r.orphans.length} orphan(s) · ${r.pending.length} pending-nod · ${r.missing.length} allow-listed-but-missing (root: ${r.root})`);
  if (r.orphans.length) console.log('  ORPHANS (not in ' + DOC + '): ' + r.orphans.join(', '));
  if (r.pending.length) console.log('  pending みや nod: ' + r.pending.join(', '));
  if (r.missing.length) console.log('  allow-listed but absent: ' + r.missing.join(', '));
  process.exit(r.orphans.length ? 1 : 0);
}
