#!/usr/bin/env node
/**
 * eval.js — /brief skill verifier.
 *
 * The skill is skill-only (no hook), so there is no exit-code to assert.
 * What IS measurable: does a produced brief satisfy the 6-block contract
 * and the format law? This eval scores brief TEXT.
 *
 * Usage:
 *   node domain/brief/eval.js                 → run built-in fixtures
 *   node domain/brief/eval.js <file.md>       → score a real brief
 *
 * Exit 0 = all fixtures behaved as expected. Exit 1 = a fixture misbehaved.
 */

const fs = require('fs');
const path = require('path');

const LOG = path.join(__dirname, 'log.jsonl');

// ── the contract ────────────────────────────────────────────────────────────
const CHECKS = [
  {
    id: 'block1-bottom-line',
    desc: 'opens with a Bottom line (≤1 sentence before any table/diagram)',
    test: t => /bottom line/i.test(t),
  },
  {
    id: 'block2-where-table',
    desc: 'has a Where-he-sees-it table (markdown table present)',
    test: t => /^\s*\|.+\|\s*$/m.test(t),
  },
  {
    id: 'block3-story-diagram',
    desc: 'has a story diagram (box/arrow chars)',
    test: t => /[│┌└▼├─►]|-->/.test(t),
  },
  {
    id: 'block4-fix-table',
    desc: 'fix presented as a table with a From/To or Site column',
    test: t => /\|\s*(#|site|from)\b/i.test(t),
  },
  {
    id: 'block5-risk',
    desc: 'names what could bite + a confidence %',
    test: t => /\d{1,3}\s?%/.test(t),
  },
  {
    id: 'block6-first-move',
    desc: 'ends with a concrete first move',
    test: t => /first move|next\b|⬜/i.test(t),
  },
  {
    id: 'format-no-prose-wall',
    desc: 'no prose wall — <6 non-table non-diagram lines over 150 chars',
    test: t => {
      const walls = t.split('\n').filter(
        l => l.length > 150 && !l.trim().startsWith('|') && !/[│┌└▼├─►]/.test(l)
      );
      return walls.length < 6;
    },
  },
  {
    id: 'format-full-address',
    desc: 'no bare filename — code refs carry a path separator + line number',
    test: t => {
      const bare = [...t.matchAll(/(?:^|\s)([A-Z][A-Za-z0-9_]+\.(?:java|xhtml|jrxml|json)):(\d+)/g)]
        .filter(m => {
          const before = t.slice(Math.max(0, m.index - 40), m.index);
          return !/[\\/]/.test(before.slice(-40));
        });
      return bare.length === 0;
    },
  },
  {
    id: 'format-length',
    desc: 'brief is ≤60 content lines',
    test: t => t.split('\n').filter(l => l.trim()).length <= 60,
  },
  {
    id: 'no-bare-permohonan-id',
    desc: 'any permohonan ID is paired with a login in the same chunk',
    test: t => {
      const ids = [...t.matchAll(/PT[A-Z]{3}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+/g)];
      if (!ids.length) return true;
      return ids.every(m => {
        const win = t.slice(m.index, m.index + 300);
        return /@|pengguna|login|no active tugasan/i.test(win);
      });
    },
  },
];

function score(text) {
  const results = CHECKS.map(c => ({ id: c.id, desc: c.desc, pass: !!c.test(text) }));
  const passed = results.filter(r => r.pass).length;
  return { results, passed, total: CHECKS.length };
}

// ── fixtures ────────────────────────────────────────────────────────────────
const GOOD = `## Brief — ESOKONGAN #271721
**Bottom line** — the borang prints 180000.00; BA wants 180,000.00.

| Row | Value |
|---|---|
| Urusan | PRBB |
| Repo | etanah-awam |
| Test data | PTMLK/02/L/PRBB/2026/1 (as nor.aini@melaka.gov.my) |

\`\`\`
etanah-awam\\webapp\\tab\\awamPerakuanTab.xhtml:129  "Jana Semula"
       ▼
etanah-awam\\reports\\MLK\\Sub01.jrxml:800   ⚠️ raw BigDecimal
\`\`\`

| # | Site | From → To |
|---|---|---|
| 1 | etanah-awam\\reports\\MLK\\Sub01.jrxml:800 | raw → DecimalFormat |

- Wrong repo is the trap.
- Confidence 92%.

**First move** — ⬜ nod on scope.`;

const BAD_PROSE = `The issue here is complex and requires careful thought. ${'x'.repeat(200)}
${'Another very long prose line that just keeps going and going without any structure at all. '.repeat(3)}
${'Yet more prose that describes rather than shows, which is exactly what we are trying to avoid here. '.repeat(3)}
${'And still more narration about how the investigation proceeded step by step over time. '.repeat(3)}
${'Continuing to ramble instead of drawing a diagram or building a table for the reader. '.repeat(3)}
${'A sixth long line of prose to push this fixture firmly over the wall threshold limit. '.repeat(3)}`;

const BAD_BARE = `**Bottom line** — broken.

| a | b |
|---|---|
| 1 | 2 |

\`\`\`
x ▼ y
\`\`\`

| # | Site | From |
|---|---|---|
| 1 | Sub01.jrxml:800 | raw |

- Confidence 90%.
**First move** — ⬜ go.`;

function run() {
  const fixtures = [
    { name: 'good-brief', text: GOOD, expect: 'pass-all' },
    { name: 'prose-wall', text: BAD_PROSE, expect: 'fail-format-no-prose-wall' },
    { name: 'bare-filename', text: BAD_BARE, expect: 'fail-format-full-address' },
  ];

  let ok = true;
  const lines = [];

  for (const f of fixtures) {
    const s = score(f.text);
    let verdict;
    if (f.expect === 'pass-all') {
      verdict = s.passed === s.total ? 'PASS' : 'FAIL';
      if (verdict === 'FAIL') {
        ok = false;
        lines.push(`   missing: ${s.results.filter(r => !r.pass).map(r => r.id).join(', ')}`);
      }
    } else {
      const target = f.expect.replace('fail-', '');
      const hit = s.results.find(r => r.id === target);
      verdict = hit && !hit.pass ? 'PASS' : 'FAIL';
      if (verdict === 'FAIL') { ok = false; lines.push(`   expected ${target} to fail, it did not`); }
    }
    console.log(`${verdict === 'PASS' ? '✓' : '✗'} ${f.name} (${s.passed}/${s.total} checks) — expect ${f.expect}`);
    lines.forEach(l => console.log(l));
    lines.length = 0;
  }

  try {
    fs.appendFileSync(LOG, JSON.stringify({
      ts: new Date().toISOString(), event: 'eval', ok, fixtures: fixtures.length,
    }) + '\n');
  } catch { /* log is best-effort */ }

  console.log(ok ? '\n✅ brief eval: all fixtures behaved as expected' : '\n❌ brief eval: FAILURES above');
  process.exit(ok ? 0 : 1);
}

// ── entry ───────────────────────────────────────────────────────────────────
const arg = process.argv[2];
if (arg) {
  const text = fs.readFileSync(arg, 'utf8');
  const s = score(text);
  s.results.forEach(r => console.log(`${r.pass ? '✓' : '✗'} ${r.id} — ${r.desc}`));
  console.log(`\n${s.passed}/${s.total} checks passed`);
  try {
    fs.appendFileSync(LOG, JSON.stringify({
      ts: new Date().toISOString(), event: 'score', file: arg,
      passed: s.passed, total: s.total,
      failed: s.results.filter(r => !r.pass).map(r => r.id),
    }) + '\n');
  } catch { /* best-effort */ }
  process.exit(s.passed === s.total ? 0 : 1);
} else {
  run();
}
