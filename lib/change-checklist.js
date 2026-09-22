#!/usr/bin/env node
// change-checklist — born via forge
// Universal pre-touch verifier: give it the path(s) you intend to change, it derives
// WHAT TO CHECK — miya 2026-08-16: "automatically know/create checklist of what to
// check based on the things we target to touch."
//   node lib/change-checklist.js <path> [<path>...]
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');

// live surfaces that count as "referencers" (archives/diaries deliberately excluded)
const LIVE = ['.claude/CLAUDE.md', '.claude/personality.md', '.claude/settings.json', '.claude/save-commands.md',
  '.claude/skills', '.claude/hooks', 'domain', 'core', 'lib', 'quest', 'system/INDEX.md',
  'Feature/Domain-Expansion/expansion-protocol.md', 'main/main-memory.md',
  '.claude/auto-memory/MEMORY.md']; // 2026-09-22: the memory index is a live citer too

const TEXT_EXT = /\.(js|md|json|jsonl|txt|ps1|py|sql|yml|yaml)$/i;
const SKIP_DIR = new Set(['node_modules', '.git', 'worktrees']);

// 2026-09-22 (system-check run 3): the referencer + eval greps used to shell out to `bash`, which is
// not on PATH for node on this laptop → ENOENT → swallowed → "(none in live surfaces)" for EVERY
// target (feedback_pengguna_semasa.md has 3 live citers; the tool said none). Pure-node walk now —
// no shell, identical on every machine. `grepFiles` returns repo-relative paths whose text contains `needle`.
function walkFiles(abs, out, depth) {
  if (depth > 8 || SKIP_DIR.has(path.basename(abs))) return;
  let st; try { st = fs.statSync(abs); } catch (_) { return; }
  if (st.isFile()) { if (TEXT_EXT.test(abs)) out.push(abs); return; }
  let ents = []; try { ents = fs.readdirSync(abs, { withFileTypes: true }); } catch (_) { return; }
  for (const e of ents) {
    if (SKIP_DIR.has(e.name)) continue;
    walkFiles(path.join(abs, e.name), out, depth + 1);
  }
}
function grepFiles(roots, needle) {
  const files = [];
  for (const r of roots) walkFiles(path.isAbsolute(r) ? r : path.join(ROOT, r), files, 0);
  const hits = [];
  for (const f of files) {
    let txt; try { txt = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    if (txt.includes(needle)) hits.push(path.relative(ROOT, f));
  }
  return hits;
}
module.exports = { grepFiles, LIVE };
if (require.main !== module) return;

const targets = process.argv.slice(2);
if (!targets.length) { console.error('usage: node lib/change-checklist.js <path> [...]'); process.exit(2); }

for (const t of targets) {
  const abs = path.isAbsolute(t) ? t : path.join(ROOT, t);
  const base = path.basename(t).replace(/\.(js|md|json)$/, '');
  const selfRel = path.relative(ROOT, abs);
  console.log('\n═══ CHANGE CHECKLIST — ' + t + ' ═══');
  if (!fs.existsSync(abs)) console.log('  ⚠ target does not exist on disk');

  // 1. referencers
  console.log('\n[1] LIVE REFERENCERS (verify each still holds after the change):');
  const refs = grepFiles(LIVE, base).filter(p => p !== selfRel);
  refs.length ? refs.forEach(r => console.log('  - ' + r)) : console.log('  (none in live surfaces)');

  // 2. evals covering the component
  console.log('\n[2] EXISTING EVALS (MUST re-run after the change — eval-exists is not eval-passes):');
  const evalHits = [];
  const dirOfT = path.dirname(abs);
  try { for (const f of fs.readdirSync(dirOfT)) if (/eval.*\.js$/.test(f)) evalHits.push(path.relative(ROOT, path.join(dirOfT, f))); } catch (_) {}
  for (const rel of grepFiles(['domain', 'quest', 'lib'], base)) { if (/eval/i.test(rel) && !evalHits.includes(rel)) evalHits.push(rel); }
  evalHits.length ? evalHits.forEach(e => console.log('  - node ' + e)) : console.log('  ⚠ NO EVALS FOUND — write a fixture eval or smoke-test BEFORE shipping (Rule 6)');

  // 3. gates watching the path
  console.log('\n[3] GATES WATCHING THIS PATH (each must stay green):');
  let gateHits = [];
  try {
    const s = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8');
    if (s.includes(base)) gateHits.push('settings.json registers this component directly');
  } catch (_) {}
  gateHits.push('boot-required-read-gate (refs resolve)', 'system-audit (ghost/drift)', 'liveness-report --summary');
  gateHits.forEach(g => console.log('  - ' + g));

  // 4. rollback
  console.log('\n[4] ROLLBACK LINE:');
  try {
    const sha = execSync('git log -1 --format="%h %s" -- "' + t + '"', { encoding: 'utf8', cwd: ROOT, windowsHide: true }).trim();
    console.log('  last commit: ' + (sha || '(untracked — snapshot before touching)'));
    console.log('  revert: git checkout ' + (sha.split(' ')[0] || 'HEAD') + ' -- "' + t + '"');
  } catch (_) { console.log('  (git unavailable for this path)'); }
}
console.log('\nRule: run [2] evals + [3] gates AFTER the change; any red = do not ship.');
