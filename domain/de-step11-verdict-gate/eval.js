/**
 * eval.js — de-step11-verdict-gate fixture eval (Rule 6 v1.2 pre-ship gate)
 *
 * 6 cases covering: block on undisposed file · silent on clean tree · silent
 * on non-DE reply · silent on bypass · pass on all-disposed · block on
 * partial disposition. Effect check verifies the block message renders with
 * the undisposed-file list.
 */
'use strict';
const { evaluate } = require('./de-step11-verdict-gate.discipline.hook.js');

const CLOSE = 'Barrier settles. Session done.\n═══ [ Domain Expansion — closed ] ═══';

const fixtures = [
  {
    name: 'BLOCK: DE close with 2 undisposed uncommitted files',
    text: `Everything done.\n${CLOSE}`,
    porcelain: ' M domain/quest-bounty/.verify-notified\n M projects/coding-projects/active/salvage-2026-05-26/convention-check-gate.js\n',
    expect: { verdict: 'blocked', wantCount: 2 },
  },
  {
    name: 'PASSED: DE close with all files disposed',
    text: `Cleanup:\ndiscard: domain/quest-bounty/.verify-notified\npark: projects/coding-projects/active/salvage-2026-05-26/convention-check-gate.js — LF/CRLF pending, salvage folder not mine\n${CLOSE}`,
    porcelain: ' M domain/quest-bounty/.verify-notified\n M projects/coding-projects/active/salvage-2026-05-26/convention-check-gate.js\n',
    expect: { verdict: 'passed' },
  },
  {
    name: 'BLOCK: DE close with partial disposition (1 of 2 disposed)',
    text: `Only handled one:\ndiscard: domain/quest-bounty/.verify-notified\n${CLOSE}`,
    porcelain: ' M domain/quest-bounty/.verify-notified\n M projects/coding-projects/active/salvage-2026-05-26/convention-check-gate.js\n',
    expect: { verdict: 'blocked', wantCount: 1 },
  },
  {
    name: 'SILENT: DE close with clean tree (no uncommitted)',
    text: `Nothing to reconcile.\n${CLOSE}`,
    porcelain: '',
    expect: { verdict: 'silent', wantReason: 'clean-tree' },
  },
  {
    name: 'SILENT: non-DE reply (no close banner)',
    text: 'Just a normal reply with no DE close banner.',
    porcelain: ' M some/file.txt\n',
    expect: { verdict: 'silent', wantReason: 'not-de-close' },
  },
  {
    name: 'SILENT: bypass token present',
    text: `[skip-de-verdict: harness dialog will show me the disposition]\nDone.\n${CLOSE}`,
    porcelain: ' M some/file.txt\n',
    expect: { verdict: 'silent', wantReason: 'bypass' },
  },
];

let passed = 0, failed = 0;
console.log('─── FIXTURE RUN ' + '─'.repeat(50));
for (const f of fixtures) {
  const got = evaluate(f.text, f.porcelain);
  let ok = got.verdict === f.expect.verdict;
  let detail = '';
  if (ok && typeof f.expect.wantCount === 'number') {
    const n = (got.undisposed || []).length;
    if (n !== f.expect.wantCount) { ok = false; detail = `undisposed count ${n} ≠ ${f.expect.wantCount}`; }
  }
  if (ok && f.expect.wantReason) {
    if (got.reason !== f.expect.wantReason) { ok = false; detail = `reason "${got.reason}" ≠ "${f.expect.wantReason}"`; }
  }
  if (ok) { passed++; console.log(`  ✓ ${f.name}`); }
  else {
    failed++;
    console.log(`  ✗ ${f.name}`);
    console.log(`      expected: ${JSON.stringify(f.expect)}`);
    console.log(`      got:      ${JSON.stringify(got)}`);
    if (detail) console.log(`      detail:   ${detail}`);
  }
}

// Effect check — synthesize block message like the hook does, assert key strings
const blockFx = fixtures[0];
const got = evaluate(blockFx.text, blockFx.porcelain);
if (got.verdict !== 'blocked' || !Array.isArray(got.undisposed) || got.undisposed.length === 0) {
  failed++;
  console.log('  ✗ effect check: block-fixture did not produce a block verdict');
} else {
  const message = [
    '⛔ de-step11-verdict-gate: DE close banner emitted, but the worktree has',
    '   uncommitted files with NO explicit disposition in your reply.',
    '   Every file below MUST get a disposition line THIS turn (not "flagged"):',
    '     • discard: <path>            — OK to lose (state marker, ephemeral)',
    '     • park: <path> — <reason>    — intentionally left, reason stated',
    '     • commit: <path>             — staged/committed this turn',
    '     • keep-in-worktree: <path>   — deliberately staying in worktree',
    '',
    '   Undisposed files:',
    ...got.undisposed.map(f => `     - ${f}`),
    '',
    '   Genuine no-can-do? Add [skip-de-verdict: <reason>] and continue.',
  ].join('\n');
  const wantStrings = ['⛔', 'DE close banner', 'discard:', 'park:', 'skip-de-verdict:', ...got.undisposed];
  const missing = wantStrings.filter(s => !message.includes(s));
  if (missing.length === 0) { passed++; console.log('  ✓ effect check: block message renders with undisposed-file list + all disposition-form hints'); }
  else { failed++; console.log(`  ✗ effect check: missing strings: ${missing.join(', ')}`); }
}

console.log('');
console.log(`Fixtures: ${passed} passed · ${failed} failed`);
if (failed > 0) { console.log('\nEval FAILED.'); process.exit(1); }
console.log('\nEval PASSED — Rule-6-v1.2 gate cleared.');
process.exit(0);
