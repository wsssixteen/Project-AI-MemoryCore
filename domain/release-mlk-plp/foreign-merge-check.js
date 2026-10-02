#!/usr/bin/env node
// foreign-merge-check.js — full, unfiltered check of one ticket's code on ANOTHER team's branch
// (e.g. etanah-awam mlk/release/<ver>) against the env BA tested (mlk/int-env).
// Born 2026-09-30 (#256334 AWAM): a keyword-filtered, --no-merges check missed a line int-env had
// dropped in a merge commit; it crashed the borang after I pushed. This script is the ONLY input the
// push gate accepts as "checked": it writes state/foreign-check-<HEAD sha>.json.
//
// Usage:
//   node domain/release-mlk-plp/foreign-merge-check.js --repo <path> --ticket <num> [--target HEAD]
//        [--env origin/mlk/int-env] [--base origin/mlk/master]
// Checks, per line (whitespace-normalised, no keyword filter):
//   A. every line the ticket's own branch(es) add/remove vs base: target and env must agree on it
//   B. every line added by ANY int-env commit naming the ticket (merge commits included, against their
//      first parent) that int-env still keeps: target must have it
// Exit 0 = zero differences · exit 1 = differences listed (each needs a WHY in the brief) · exit 2 = usage.
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REPO = arg('--repo'), TICKET = String(arg('--ticket', '')).replace(/^#/, '');
const TARGET = arg('--target', 'HEAD'), ENV = arg('--env', 'origin/mlk/int-env'), BASE = arg('--base', 'origin/mlk/master');
const STATE = process.env.FOREIGN_CHECK_STATE_DIR || path.join(__dirname, 'state');
if (!REPO || !/^\d+$/.test(TICKET)) { console.error('usage: --repo <path> --ticket <num> [--target HEAD]'); process.exit(2); }

const g = (a) => execSync(`git -C "${REPO}" ${a}`, { encoding: 'utf8', maxBuffer: 1 << 29, stdio: ['pipe', 'pipe', 'ignore'] });
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const skip = (t) => t.length < 4 || /^[{}();,]+$/.test(t) || t.startsWith('//') || t.startsWith('*');
const cache = {};
const lines = (ref, f) => { const k = ref + '\0' + f; if (!(k in cache)) { try { cache[k] = new Set(g(`show "${ref}:${f}"`).split(/\r?\n/).map(norm)); } catch { cache[k] = null; } } return cache[k]; };

const sha = g(`rev-parse ${TARGET}`).trim();
const heads = g('ls-remote --heads origin').split('\n').map(l => l.split('refs/heads/')[1]).filter(Boolean)
  .filter(b => new RegExp(`(^|/)${TICKET}(v\\d+)?$`, 'i').test(b));
const diffs = [];

// A. ticket branch lines: target and env must agree
for (const b of heads) {
  let mb; try { mb = g(`merge-base ${BASE} origin/${b}`).trim(); } catch { continue; }
  let file = null;
  for (const l of g(`diff -U0 ${mb} origin/${b}`).split('\n')) {
    if (l.startsWith('+++ ')) { file = l.slice(4).replace(/^b\//, ''); continue; }
    if (l.startsWith('--- ') || !file || !/^[+-]/.test(l)) continue;
    const t = norm(l.slice(1)); if (skip(t)) continue;
    const inT = !!(lines(sha, file) || new Set()).has(t), inE = !!(lines(ENV, file) || new Set()).has(t);
    if (inT !== inE) diffs.push({ check: 'A', branch: b, file, line: t.slice(0, 200), target: inT, env: inE });
  }
}
// B. every int-env commit naming the ticket, merges included (first-parent diff)
const commits = g(`log ${ENV} --format=%H -i --grep=${TICKET}`).split('\n').filter(Boolean);
for (const c of commits) {
  let file = null;
  let d = ''; try { d = g(`diff -U0 ${c}~1 ${c}`); } catch { continue; }   // ~1 = first parent; "^" is an escape char in Windows cmd
  for (const l of d.split('\n')) {
    if (l.startsWith('+++ ')) { file = l.slice(4).replace(/^b\//, ''); continue; }
    if (l.startsWith('--- ') || !file || !l.startsWith('+')) continue;
    const t = norm(l.slice(1)); if (skip(t)) continue;
    const e = lines(ENV, file); if (!e || !e.has(t)) continue;          // superseded on env
    const tg = lines(sha, file);
    if (!tg || !tg.has(t)) diffs.push({ check: 'B', commit: c.slice(0, 10), file, line: t.slice(0, 200), target: false, env: true });
  }
}
const seen = new Set(); const uniq = diffs.filter(d => { const k = d.file + '\0' + d.line; if (seen.has(k)) return false; seen.add(k); return true; });
const report = { ts: new Date().toISOString(), repo: REPO, ticket: TICKET, target: TARGET, sha, env: ENV, branches: heads, envCommits: commits.length, differences: uniq };
fs.mkdirSync(STATE, { recursive: true });
fs.writeFileSync(path.join(STATE, `foreign-check-${sha}.json`), JSON.stringify(report, null, 2));
console.log(`foreign-merge-check #${TICKET} ${sha.slice(0, 10)} vs ${ENV}: branches ${heads.join(', ') || '(none)'} · env commits ${commits.length} · differences ${uniq.length}`);
const byFile = {}; uniq.forEach(d => (byFile[d.file] ||= []).push(d));
for (const [f, a] of Object.entries(byFile)) { console.log(`\n## ${f} (${a.length})`); a.slice(0, 25).forEach(d => console.log(`  [${d.check}] target=${d.target ? 'Y' : 'N'} env=${d.env ? 'Y' : 'N'} | ${d.line}`)); }
process.exit(uniq.length ? 1 : 0);
