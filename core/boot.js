#!/usr/bin/env node
/**
 * core/boot.js — K1: deterministic boot assembler (SHADOW MODE — external-audit blueprint).
 * Assembles the context bundle a session boot NEEDS, enforces the ≤25K-token budget,
 * and (in shadow) writes it to system/telemetry/boot-bundle-preview.md for comparison
 * against the live prose boot. Cutover only after shadow agreement — NOT wired tonight.
 *
 * Bundle: profile card · open-quest summary (state-check) · todo Q1 head · slip escalations
 *         (top tables only) · standing flags · reproducibility: same repo state → same bundle.
 * USAGE: node core/boot.js [--print]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const BUDGET_TOKENS = 25000;

function readSafe(f, cap) {
  try { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); return cap ? t.slice(0, cap) : t; } catch (_) { return ''; }
}

// 1. profile card (regenerate for freshness)
spawnSync(process.execPath, [path.join(ROOT, 'core', 'profile-card.js')], { env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
const profile = readSafe('system/profile-card.md');

// 2. open quests via state-check --json
let quests = '(state-check unavailable)';
const sc = spawnSync(process.execPath, [path.join(ROOT, 'core', 'state-check.js'), '--json'], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
try {
  const j = JSON.parse(sc.stdout);
  quests = `${j.blocks} blocks, ${j.open} open · errors: ${j.errors.length} · warnings: ${j.warnings.length}`;
} catch (_) {}
// open-quest one-liners straight from active.txt (qa + status + one_liner)
const activeRaw = readSafe('quest/active.txt');
const questLines = [];
for (const block of activeRaw.split(/\r?\n\r?\n/)) {
  const qa = (block.match(/^qa=(.*)$/m) || [])[1];
  const status = (block.match(/^status=(.*)$/m) || [])[1];
  const one = (block.match(/^issue_one_liner=(.*)$/m) || [])[1] || '';
  if (qa && ['active', 'hold', 'blocked', 'delegated'].includes(status)) {
    questLines.push(`| ${qa} | ${status} | ${one.slice(0, 90)} |`);
  }
}

// 3. todo Q1 head (first 10 items after a Q1 heading)
const todo = readSafe('main/todo.md');
const q1 = (() => {
  const m = todo.match(/#+.*Q1[\s\S]*?(?=\n#+ |$)/);
  if (!m) return '(no Q1 section found)';
  return m[0].split(/\r?\n/).filter(l => /^\s*[-*\d]/.test(l)).slice(0, 10).join('\n');
})();

// 4. slip escalations — TOP tables only (stop at first dated entries header)
const slipTop = (() => {
  const raw = readSafe('system/slip-log.md', 12000);
  const stop = raw.search(/^## 20\d\d-.*entries/m);
  const top = stop > 0 ? raw.slice(0, stop) : raw;
  return top.split(/\r?\n/).filter(l => l.includes('🚨')).slice(0, 15).join('\n') || '(no escalation rows)';
})();

// 5. standing flags from current-session
const flags = (() => {
  const cs = readSafe('main/current-session.md');
  const m = cs.match(/### 🧊[\s\S]*?(?=\n### |\n## |$)/g);
  return m ? m.join('\n') : '(none)';
})();

const bundle = [
  '# Boot bundle — assembled by core/boot.js (SHADOW) · reproducible from repo state',
  '',
  profile,
  '',
  '## Open quests (' + quests + ')',
  '| qa | status | one-liner |', '|---|---|---|',
  ...questLines,
  '',
  '## todo Q1 (top 10)',
  q1,
  '',
  '## Slip escalations (top tables only)',
  slipTop,
  '',
  '## Standing flags',
  flags,
  '',
].join('\n');

const tokens = Math.round(bundle.length / 4);
const status = tokens <= BUDGET_TOKENS ? '✓ within budget' : '🚨 OVER BUDGET';
const OUT = path.join(ROOT, 'system', 'telemetry', 'boot-bundle-preview.md');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundle);

// comparison vs the live prose-boot set
const proseSet = ['.claude/CLAUDE.md', '.claude/personality.md', 'main/main-memory.md', 'Feature/Domain-Expansion/expansion-protocol.md', 'main/current-session.md', 'quest/active.txt'];
const proseBytes = proseSet.reduce((a, f) => a + (readSafe(f) || '').length, 0);
console.log(`boot(shadow): bundle ${bundle.length} bytes ≈ ${tokens} tokens (${status}, budget ${BUDGET_TOKENS})`);
console.log(`boot(shadow): live prose-boot set ≈ ${proseBytes} bytes ≈ ${Math.round(proseBytes / 4)} tokens → reduction ${(100 - bundle.length / proseBytes * 100).toFixed(1)}%`);
if (process.argv.includes('--print')) console.log('\n' + bundle);
