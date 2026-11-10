#!/usr/bin/env node
/**
 * core/slips.js — C7: slip-log v2. Append-only JSONL + generated dashboard.
 * The 255KB markdown slip-log is FROZEN as archive; "did the guard fire?" becomes a query.
 *
 * USAGE:
 *   node core/slips.js add --category <c> [--qa <QA-n>] [--guard-expected <name>]
 *        [--guard-fired true|false] [--evidence <link/path>] [--action <what>] [--caught-by miya|self|gate]
 *        [--his-words "<verbatim>"] [--repeat-of <event_id of the earlier row>] [--rule-expected <rule or gate that should have held>]
 *        [--part <hook|skill|file the slip is about>] [--turn-id <id>] [--session <id>]
 *   Turn context (2026-11-10, domain/turn-log): every row carries event_id, turn_id and session_id (session id = --session, else
 *   CLAUDE_CODE_SESSION_ID, else the newest current-turn stamp of the last 6 hours); a miya-caught row with no --his-words takes
 *   his words of that turn from the transcript, verbatim, and says so in his_words_src.
 *   node core/slips.js dashboard        → regenerates system/slip-dashboard.md
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'system', 'slips.jsonl');
const DASH = path.join(ROOT, 'system', 'slip-dashboard.md');
const LEGACY = path.join(ROOT, 'system', 'slip-counts.jsonl');

function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }
function readJsonl(f) {
  try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); }
  catch (_) { return []; }
}

// Which turn is this row written in? The stamp lib/turn-context.js keeps per session (domain/turn-log joins on turn_id).
function newestStamp() {
  const dir = path.join(ROOT, 'system', 'telemetry');
  let best = null;
  try {
    for (const n of fs.readdirSync(dir)) {
      if (!/^current-turn-[^.]*\.json$/.test(n)) continue;
      const m = fs.statSync(path.join(dir, n)).mtimeMs;
      if (Date.now() - m < 6 * 3600000 && (!best || m > best.m)) best = { n, m };
    }
    if (best) return JSON.parse(fs.readFileSync(path.join(dir, best.n), 'utf8'));
  } catch (_) {}
  return null;
}
function turnContext() {
  const base = { event_id: Date.now().toString(36) + '-' + require('crypto').randomBytes(5).toString('hex'), turn_id: arg('turn-id') || null, session_id: arg('session') || process.env.CLAUDE_CODE_SESSION_ID || null, session_src: null, _stamp: null };
  let stamp = null;
  try { stamp = base.session_id ? require(path.join(ROOT, 'lib', 'turn-context.js')).readStamp(base.session_id) : null; } catch (_) {}
  if (base.session_id) base.session_src = arg('session') ? 'flag' : 'env';
  if (!stamp && !base.session_id) { stamp = newestStamp(); if (stamp) { base.session_id = stamp.session_id; base.session_src = 'newest-stamp'; } }
  if (stamp && !base.turn_id) base.turn_id = stamp.turn_id;
  base._stamp = stamp;
  return base;
}
// his_words: --his-words as typed; else, for a row he caught, his words of this turn out of the transcript (lib/his-words.js)
function hisWordsFor(row) {
  const stamp = row._stamp; delete row._stamp;
  const given = arg('his-words');
  if (given) return { his_words: given.slice(0, 2000), his_words_src: 'flag' };
  if (row.caught_by === 'miya' && stamp && stamp.transcript_path) {
    try {
      const hw = require(path.join(ROOT, 'lib', 'his-words.js'));
      const head = String(stamp.prompt_head || '').replace(/\s+/g, ' ').trim();
      const m = hw.hisMessages(stamp.transcript_path, { limit: 6 }).find(x => head && String(x.text).replace(/\s+/g, ' ').trim().startsWith(head));
      if (m) return { his_words: m.text.slice(0, 2000), his_words_src: 'turn-ask' };
    } catch (_) {}
  }
  return { his_words: null, his_words_src: null };
}

const cmd = process.argv[2];
if (cmd === 'add') {
  const row = {
    ts: new Date().toISOString(),
    type: arg('type') || 'slip', // 'slip' (default) | 'feedback' — preference/praise/style guidance that is NOT a mistake (added 2026-07-19 weekly audit: capture MORE of miya's feedbacks, not only corrections)
    category: arg('category'),
    qa: arg('qa') || null,
    guard_expected: arg('guard-expected') || null,
    guard_fired: arg('guard-fired') === 'true' ? true : (arg('guard-fired') === 'false' ? false : null),
    evidence: arg('evidence') || null,
    // WHY --situation (miya 2026-07-19): rows are written on-the-fly and read weeks later at
    // audit time — evidence says WHAT went wrong, situation says the FRAME (quest/session/phase
    // + trigger). Without it, audit-time refinement reconstructs the frame by guessing — the
    // exact failure that produced implement-from-stale-intent-no-appraise.
    situation: arg('situation') || null,
    action: arg('action') || null,
    caught_by: arg('caught-by') || null,
    // 2026-11-10 (domain/turn-log): tie the row to the turn that wrote it, with his words verbatim
    ...turnContext(),
    rule_expected: arg('rule-expected') || null,
    repeat_of: arg('repeat-of') || null,
    part: arg('part') || null,
  };
  Object.assign(row, hisWordsFor(row));
  if (!row.category) { console.error('slips: --category required'); process.exit(2); }
  fs.appendFileSync(FILE, JSON.stringify(row) + '\n');
  // keep legacy slip-counts.jsonl fed too (other tooling reads it)
  fs.appendFileSync(LEGACY, JSON.stringify({ ts: row.ts, category: row.category }) + '\n');
  console.log('slips: recorded ' + row.category + (row.qa ? ' (' + row.qa + ')' : ''));
  spawnDashboard();
} else if (cmd === 'dashboard') {
  spawnDashboard();
} else {
  console.error('usage: slips <add|dashboard> ...');
  process.exit(2);
}

// A part named again and again was never acted on: ⚠️ at 2, 🚨 at 3 (lib/session-audit.js, 2026-10-30, the telemetry bug was logged 34 times).
function repeatSection(rows) {
  let counts = {};
  try { counts = require(path.join(ROOT, 'lib', 'session-audit.js')).repeatCounts(rows, ROOT); } catch (_) { return []; }
  const top = Object.entries(counts).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  if (!top.length) return [];
  return ['## 🔁 Parts named repeatedly in the ledger', '', '| Part | Rows | Flag |', '|---|---|---|',
    ...top.map(([p, n]) => `| ${p} | ${n} | ${n >= 3 ? '🚨 build or drop' : '⚠️'} |`), ''];
}

function spawnDashboard() {
  // DEDUPE on concat (fixed 2026-07-17, みや caught the inflated headline): every slip added
  // since slips.jsonl was born (C7, 2026-07-12) is written to BOTH files by `add` below, so a
  // plain concat counted those rows TWICE — the dashboard read 29 total / 14d 27 when the truth
  // was 16 / 14. LEGACY still contributes its 3 pre-C7 rows, which live nowhere else.
  // Key on ts+category: `add` stamps a fresh ISO ts per row, so collisions are the same row.
  const primary = readJsonl(FILE);
  const seen = new Set(primary.map(r => `${r.ts}|${r.category}`));
  const legacyOnly = readJsonl(LEGACY)
    .filter(r => !seen.has(`${r.ts}|${r.category}`))
    .map(r => ({ ...r, _legacy: true }));
  const allRows = primary.concat(legacyOnly);
  // type split (2026-07-19): 'feedback' rows are preference/praise guidance, NOT mistakes — kept out of slip counts
  const fbRows = allRows.filter(r => r.type === 'feedback');
  const upRows = allRows.filter(r => r.type === 'upgrade'); // system upgrades/refinements — weekly-audit feed (miya 2026-06-20 wider intent + 2026-07-19)
  // 'proposal' rows (2026-08-05, miya): ideas raised by the DE Improvement Sweep that are NOT yet
  // built. They get their own lane so the weekly audit can see "what we thought of and have not
  // acted on" separately from "what shipped". Mixing them into type=upgrade would read as done.
  const propRows = allRows.filter(r => r.type === 'proposal');
  const rows = allRows.filter(r => r.type !== 'feedback' && r.type !== 'upgrade' && r.type !== 'proposal');
  const fb14 = fbRows.filter(r => Date.parse(r.ts) >= Date.now() - 14 * 86400000);
  const up14 = upRows.filter(r => Date.parse(r.ts) >= Date.now() - 14 * 86400000);
  const prop14 = propRows.filter(r => Date.parse(r.ts) >= Date.now() - 14 * 86400000);
  const d14 = rows.filter(r => Date.parse(r.ts) >= Date.now() - 14 * 86400000);
  const byCat = {};
  for (const r of d14) byCat[r.category] = (byCat[r.category] || 0) + 1;
  const guardRows = d14.filter(r => r.guard_expected != null);
  const miyaCatch = d14.filter(r => r.caught_by === 'miya').length;
  const md = [
    '# Slip Ledger — GENERATED by core/slips.js, never hand-edited',
    '',
    `_${rows.length} total recorded rows · last 14d: ${d14.length} · みや-caught (14d): ${miyaCatch} (north-star: drive to 0)_`,
    '_Historical archive: `system/slip-log.md` (frozen 2026-07-13) · baseline 2026-07-13: 23 slips/14d, 18 みや-caught_',
    '',
    '## Last 14 days by category',
    '', '| Category | Count |', '|---|---|',
    ...Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `| ${c} | ${n} |`),
    '',
    '## Guard accountability (14d rows carrying guard_expected)',
    '', '| ts | category | guard expected | fired? | evidence |', '|---|---|---|---|---|',
    ...guardRows.map(r => `| ${r.ts.slice(0, 10)} | ${r.category} | ${r.guard_expected} | ${r.guard_fired === true ? '✓' : r.guard_fired === false ? '🚨 NO' : '?'} | ${r.evidence || '—'} |`),
    '',
    ...(fb14.length ? [
      '## Feedback (14d — preferences/praise, not mistakes; type=feedback)',
      '', '| ts | category | evidence |', '|---|---|---|',
      ...fb14.map(r => `| ${r.ts.slice(0, 10)} | ${r.category} | ${r.evidence || '—'} |`),
      '',
    ] : []),
    ...(up14.length ? [
      '## System upgrades (14d — refinements/builds shipped; type=upgrade — the weekly-audit feed)',
      '', '| ts | category | evidence |', '|---|---|---|',
      ...up14.map(r => `| ${r.ts.slice(0, 10)} | ${r.category} | ${r.evidence || '—'} |`),
      '',
    ] : []),
    ...repeatSection(allRows),
    ...(prop14.length ? [
      '## 💡 Open proposals (14d — raised by the DE Improvement Sweep, NOT yet built; type=proposal)',
      '',
      '_Weekly audit: rule on each — BUILD / DROP / DEFER-with-date. A proposal older than 14d that',
      'has never been ruled on is itself a finding (the "parked enforcement row" failure, 2026-07-22)._',
      '', '| ts | axis | proposal |', '|---|---|---|',
      ...prop14.map(r => `| ${r.ts.slice(0, 10)} | ${r.category} | ${r.evidence || '—'} |`),
      '',
    ] : []),
  ].join('\n');
  fs.writeFileSync(DASH, md);
  console.log('slips: dashboard regenerated (' + d14.length + ' rows in window)');
}
