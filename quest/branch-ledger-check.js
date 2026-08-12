#!/usr/bin/env node
// branch-ledger-check.js — deterministic guarantee that every rework branch of a ticket is
// CLASSIFIED in its quest MD. Born 2026-08-13 (miya) after the #273461 baseline miss.
//
// The guarantee is not "remember to write it" (memory failed) — it is: git always knows every
// `…/<num>vN` branch, so this reads git and FAILS when the quest MD lacks a classified row for one.
//
// Enum (one tag per branch):
//   +ADD        additional/append fix, cumulative on top of prior   → keep
//   ~CHANGE     modifies/replaces a previous fix                     → keep
//   *CANONICAL  the one complete branch to ship (merge target)       → keep
//   -NEGATIVE   wrong/superseded/incomplete                          → DELETE (still-alive = flagged)
//
// Ledger row (greppable, one per branch), lives under a "Branch ledger" heading in QA-<num>.md:
//   mlk/esokongan/273461v4 — CANONICAL — all 3 commits (v1+v2+v3)
//
// API:  checkTicket(num, {repo, root}) -> { branches, rows, missing, negativesAlive, ok }
// CLI:  node quest/branch-ledger-check.js <num>        (exit 0 ok · 1 gap · 2 usage)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TAGS = ['ADD', 'CHANGE', 'CANONICAL', 'NEGATIVE'];
const REPO_DEFAULT = 'E:\\Projects\\Melaka\\etanah-pelupusan';

// MemoryCore root = the MAIN-repo root (quest MDs live there, not in the worktree copy).
// Worktree path is <root>/.claude/worktrees/<wt>/quest → strip from `.claude` on gives <root>.
// Non-worktree path is <root>/quest → up one gives <root>.
function memcoreRoot() {
  if (/[\\/]\.claude[\\/]worktrees[\\/]/.test(__dirname)) {
    return __dirname.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
  }
  return path.resolve(__dirname, '..');
}

function findQuestMd(num, root) {
  for (const sub of ['active', 'archive']) {
    const dir = path.join(root, 'projects', 'coding-projects', sub);
    let entries = [];
    try { entries = fs.readdirSync(dir); } catch { continue; }
    const hit = entries.find(e => e.includes(num));
    if (hit) {
      const md = path.join(dir, hit, `${hit}.md`);
      if (fs.existsSync(md)) return md;
      // fall back to any .md inside carrying the num
      try {
        const inner = fs.readdirSync(path.join(dir, hit)).find(f => f.endsWith('.md') && f.includes(num));
        if (inner) return path.join(dir, hit, inner);
      } catch { /* skip */ }
    }
  }
  return null;
}

function originBranches(num, repo) {
  let out = '';
  try { out = execSync(`git -C "${repo}" ls-remote --heads origin`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }); } catch { return []; }
  return out.split('\n')
    .map(l => (l.split('\t')[1] || '').replace('refs/heads/', ''))
    .filter(r => new RegExp(`/${num}(v\\d+)?$`).test(r) || new RegExp(`/${num}(-|_)`).test(r));
}

// parse ledger text → { branchName: TAG } — PURE (no fs), so the eval can exercise it directly
function parseLedgerText(txt) {
  const rows = {};
  for (const line of String(txt).split('\n')) {
    // match: <...>/<name> — <TAG> — ... (em-dash or hyphen or pipe separators; TAG case-insensitive)
    const m = line.match(/((?:mlk\/)?[\w./-]*\/\d{5,6}(?:v\d+)?)\s*[—\-|]+\s*[+~*\-]?\s*(ADD|CHANGE|CANONICAL|NEGATIVE)\b/i);
    if (m) rows[m[1].replace(/^.*?(mlk\/)/, '$1')] = m[2].toUpperCase();
  }
  return rows;
}
function parseLedger(mdPath) {
  if (!mdPath) return {};
  return parseLedgerText(fs.readFileSync(mdPath, 'utf8'));
}

// PURE decision — given the branch list + parsed rows, compute the verdict (eval hits this directly)
function evaluate(branches, rows) {
  const stacked = branches.length > 1 || branches.some(b => /v\d+$/.test(b));
  const missing = stacked ? branches.filter(b => !rows[b]) : [];
  const negativesAlive = branches.filter(b => rows[b] === 'NEGATIVE');
  return { stacked, missing, negativesAlive, ok: missing.length === 0 };
}

function checkTicket(num, opts = {}) {
  num = String(num).replace(/^#/, '');
  const repo = opts.repo || process.env.PLP_REPO || REPO_DEFAULT;
  const root = opts.root || memcoreRoot();
  const branches = originBranches(num, repo);
  const mdPath = findQuestMd(num, root);
  const rows = parseLedger(mdPath);
  const { stacked, missing, negativesAlive, ok } = evaluate(branches, rows);
  return { num, repo, mdPath, branches, rows, stacked, missing, negativesAlive, ok };
}

function render(r) {
  const L = [];
  L.push(`\n## branch-ledger-check #${r.num}`);
  L.push(`quest MD: ${r.mdPath || '🚨 NOT FOUND'}`);
  L.push(`branches: ${r.branches.join(' · ') || 'none'}`);
  if (!r.stacked) { L.push(`✅ single branch — ledger not required`); return L.join('\n'); }
  L.push(`\n| branch | ledger tag |`);
  L.push(`|---|---|`);
  for (const b of r.branches) L.push(`| ${b} | ${r.rows[b] ? r.rows[b] : '🚨 UNCLASSIFIED'} |`);
  if (r.missing.length) L.push(`\n🚨 FAIL — classify in ${path.basename(r.mdPath || 'QA-<num>.md')} §Branch ledger: ${r.missing.join(', ')}`);
  else L.push(`\n✅ all rework branches classified`);
  if (r.negativesAlive.length) L.push(`🗑️  tagged -NEGATIVE but still on origin (delete these): ${r.negativesAlive.join(', ')}`);
  return L.join('\n');
}

module.exports = { checkTicket, render, TAGS, parseLedgerText, evaluate };

// open-quest sweep for session-close (DE): read active.txt, check every OPEN quest's stack
const OPEN = ['active', 'hold', 'blocked', 'delegated'];
function openQuestNums(root) {
  let txt = '';
  try { txt = fs.readFileSync(path.join(root, 'quest', 'active.txt'), 'utf8'); } catch { return []; }
  const nums = [];
  let cur = null;
  for (const line of txt.split('\n')) {
    const q = line.match(/qa=QA-(\d{5,6})/i);
    if (q) { cur = { num: q[1], status: null }; nums.push(cur); continue; }
    // blocks can carry APPENDED duplicate keys (active-cli appends) → LAST status= wins
    const s = line.match(/status=(\w+)/i);
    if (s && cur) cur.status = s[1].toLowerCase();
  }
  return nums.filter(n => OPEN.includes(n.status)).map(n => n.num);
}

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg) { console.error('usage: branch-ledger-check.js <num> | --all'); process.exit(2); }
  if (arg === '--all') {
    const root = memcoreRoot();
    const nums = openQuestNums(root);
    let bad = 0;
    console.log(`\n## branch-ledger session-close sweep — ${nums.length} open quest(s)`);
    for (const num of nums) {
      const r = checkTicket(num, { root });
      if (!r.stacked) continue;                 // single-branch quests need no ledger
      const flag = r.ok ? '✅' : '🚨';
      console.log(`${flag} #${num}: ${r.ok ? 'classified' : 'MISSING ' + r.missing.join(',')}${r.negativesAlive.length ? ' · 🗑️ delete ' + r.negativesAlive.join(',') : ''}`);
      if (!r.ok) bad++;
    }
    if (!nums.length) console.log('  (none open)');
    console.log(`\n${bad ? '🚨 ' + bad + ' quest(s) need branch classification' : '✅ all stacked open quests classified'}`);
    process.exit(bad ? 1 : 0);
  }
  const r = checkTicket(arg);
  console.log(render(r));
  process.exit(r.ok ? 0 : 1);
}
