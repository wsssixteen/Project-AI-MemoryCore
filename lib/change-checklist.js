#!/usr/bin/env node
// change-checklist — born via forge
// Universal pre-touch verifier: give it the path(s) you intend to change, it derives
// WHAT TO CHECK — miya 2026-08-16: "automatically know/create checklist of what to
// check based on the things we target to touch."
//   node lib/change-checklist.js <path> [<path>...]
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const targets = process.argv.slice(2);
if (!targets.length) { console.error('usage: node lib/change-checklist.js <path> [...]'); process.exit(2); }

// live surfaces that count as "referencers" (archives/diaries deliberately excluded)
const LIVE = ['.claude/CLAUDE.md', '.claude/personality.md', '.claude/settings.json', '.claude/save-commands.md',
  '.claude/skills', '.claude/hooks', 'domain', 'core', 'lib', 'quest', 'system/INDEX.md',
  'Feature/Domain-Expansion/expansion-protocol.md', 'main/main-memory.md'];

for (const t of targets) {
  const abs = path.isAbsolute(t) ? t : path.join(ROOT, t);
  const base = path.basename(t).replace(/\.(js|md|json)$/, '');
  console.log('\n═══ CHANGE CHECKLIST — ' + t + ' ═══');
  if (!fs.existsSync(abs)) console.log('  ⚠ target does not exist on disk');

  // 1. referencers
  console.log('\n[1] LIVE REFERENCERS (verify each still holds after the change):');
  let refs = [];
  try {
    const cmd = 'grep -rl "' + base + '" ' + LIVE.map(p => '"' + path.join(ROOT, p) + '"').join(' ') + ' 2>/dev/null';
    refs = execSync(cmd, { encoding: 'utf8', windowsHide: true, shell: 'bash' }).split('\n').filter(Boolean)
      .map(p => path.relative(ROOT, p)).filter(p => p !== t.replace(/\//g, path.sep));
  } catch (_) {}
  refs.length ? refs.forEach(r => console.log('  - ' + r)) : console.log('  (none in live surfaces)');

  // 2. evals covering the component
  console.log('\n[2] EXISTING EVALS (MUST re-run after the change — eval-exists is not eval-passes):');
  const evalHits = [];
  const dirOfT = path.dirname(abs);
  try { for (const f of fs.readdirSync(dirOfT)) if (/eval.*\.js$/.test(f)) evalHits.push(path.relative(ROOT, path.join(dirOfT, f))); } catch (_) {}
  try {
    const r = spawnSync('bash', ['-c', 'grep -rl "' + base + '" "' + path.join(ROOT, 'domain') + '" "' + path.join(ROOT, 'quest') + '" 2>/dev/null | grep -i eval'], { encoding: 'utf8', windowsHide: true });
    for (const p of (r.stdout || '').split('\n').filter(Boolean)) { const rel = path.relative(ROOT, p); if (!evalHits.includes(rel)) evalHits.push(rel); }
  } catch (_) {}
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
