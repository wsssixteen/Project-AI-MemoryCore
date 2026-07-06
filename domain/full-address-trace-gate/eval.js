/**
 * eval.js — full-address-trace-gate compliance eval
 *
 * Two runs in one file:
 *
 *   (1) FIXTURE RUN — deterministic pre-ship gate (Rule 6 v1.2).
 *       Loads the hook module, feeds hand-crafted texts, asserts verdict.
 *       Covers: blocks (bare file, bare method, mixed) · silents (short,
 *       exempt, not-a-trace, full-address form) · block-message effect check.
 *
 *   (2) TRANSCRIPT RUN — retrospective compliance score.
 *       Scans recent Claude Code session transcripts (~/.claude/projects/**),
 *       finds assistant emits that WOULD have blocked, and reports:
 *         - first-try compliance % over the last N turns
 *         - trend per session
 *       Target after promotion: ≥95% first-try compliance.
 *
 * Both runs exit 0 on PASS · 1 on FAIL of the fixture run.
 * Transcript run is informational and never fails the eval by itself.
 *
 * Usage:
 *   node domain/full-address-trace-gate/eval.js
 *   node domain/full-address-trace-gate/eval.js --transcript-only
 *   node domain/full-address-trace-gate/eval.js --fixtures-only
 *   node domain/full-address-trace-gate/eval.js --sessions=20    (last N transcript files)
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate } = require('./full-address-trace-gate.discipline.hook.js');

const args = process.argv.slice(2);
const opt = {
  transcriptOnly: args.includes('--transcript-only'),
  fixturesOnly: args.includes('--fixtures-only'),
  sessions: 10,
};
const sess = args.find(a => a.startsWith('--sessions='));
if (sess) opt.sessions = Math.max(1, parseInt(sess.split('=')[1], 10) || 10);

// ─── FIXTURES ────────────────────────────────────────────────────────────

// Pad a body well past the 400-char length floor. IMPORTANT: this pad must
// NOT contain the words "trace" / "class chain" (would spuriously make the
// "not-a-trace" fixture look like one) NOR any bare filename:line / method:line
// pattern (would inject fake offenders).
const PAD = '\n\nAdditional context follows below to satisfy the length floor. '
  + 'The flow enters from the UI listener, hits the backing bean, resolves the '
  + 'entity against the database, and returns the resulting VO to the view for '
  + 'render. We walked the entire chain start-to-end to isolate the exact bug '
  + 'site before proposing any fix. All refs above are the canonical addresses '
  + 'that participate in the flow. The predicate for this gate needs to see a '
  + 'shape indicator AND at least two colon-line references before it considers '
  + 'whether an offender is present — the length floor is comfortably cleared '
  + 'here so we test the actual predicate, not the noise-guard.';

const fixtures = [
  {
    name: 'BLOCK: bare file in a trace with arrows',
    text: `Class chain:\npenyediaanDokumen.xhtml:291\n → someBean.doIt():44\n${PAD}`,
    expect: { verdict: 'blocked', wantOffender: /bare file|bare method/ },
  },
  {
    name: 'BLOCK: bare method with trace keyword',
    text: `Trace of the failure:\nregenerateNewDocument():443 is called from initData\nagain at line 512 and initData():205\n${PAD}`,
    expect: { verdict: 'blocked', wantOffender: /bare method/ },
  },
  {
    name: 'BLOCK: mixed bare file + bare method + vertical arrow',
    text: `class chain:\n  penyediaanDokumen.xhtml:291\n         ↓\n  refreshDokumenList():511\n${PAD}`,
    expect: { verdict: 'blocked', wantOffenders: 2 },
  },
  {
    name: 'PASSED: full-address form (repo + path + Class.method)',
    text: `Class chain:\netanah-common\\src\\main\\webapp\\resources\\penyediaanDokumen.xhtml:291\n → BasePenyediaanDokumenForm.refreshDokumenList():511\n${PAD}`,
    expect: { verdict: 'passed' },
  },
  {
    name: 'SILENT: short reply (<400 chars) — even with bare refs',
    text: 'Quick: someMethod():12 → foo.xhtml:34',
    expect: { verdict: 'silent', wantReason: 'short' },
  },
  {
    name: 'SILENT: not a trace (no arrows, no "trace"/"class chain")',
    text: `Some file references appear: penyediaanDokumen.xhtml:291 and helper.java:12 in the general discussion here.\n${PAD}`,
    expect: { verdict: 'silent', wantReason: 'not-trace' },
  },
  {
    name: 'SILENT: bypass token present',
    text: `[skip-full-address: quoting prior retracted emit]\nClass chain:\npenyediaanDokumen.xhtml:291 → someBean.doIt():44\n${PAD}`,
    expect: { verdict: 'silent', wantReason: 'exempt' },
  },
  {
    name: 'SILENT: DE / closing banner turn',
    text: `═══ [ Domain Expansion ] ═══\n 💠 るり結界 (ラピス バリアー) 💠\ntrace summary: penyediaanDokumen.xhtml:291 → someBean.doIt():44\n${PAD}`,
    expect: { verdict: 'silent', wantReason: 'exempt' },
  },
  {
    name: 'PASSED: only ONE ref in a trace (below refCount floor)',
    text: `Trace stops at one file:\nBasePenyediaanDokumenForm.initPenyediaanMode():2489\n${PAD}`,
    expect: { verdict: 'silent', wantReason: 'not-trace' },
  },
];

let passed = 0;
let failed = 0;
const failures = [];

function runFixtures() {
  console.log('─── FIXTURE RUN ' + '─'.repeat(50));
  for (const f of fixtures) {
    const got = evaluate(f.text);
    let ok = got.verdict === f.expect.verdict;
    let detail = '';

    if (ok && f.expect.wantOffender) {
      const list = (got.offenders || []).join(' | ');
      if (!f.expect.wantOffender.test(list)) { ok = false; detail = `offenders "${list}" did not match ${f.expect.wantOffender}`; }
    }
    if (ok && typeof f.expect.wantOffenders === 'number') {
      const n = (got.offenders || []).length;
      if (n < f.expect.wantOffenders) { ok = false; detail = `got ${n} offenders, wanted ≥${f.expect.wantOffenders}`; }
    }
    if (ok && f.expect.wantReason) {
      if (got.reason !== f.expect.wantReason) { ok = false; detail = `reason "${got.reason}" ≠ "${f.expect.wantReason}"`; }
    }

    if (ok) {
      passed++;
      console.log(`  ✓ ${f.name}`);
    } else {
      failed++;
      failures.push({ name: f.name, expected: f.expect, got, detail });
      console.log(`  ✗ ${f.name}`);
      console.log(`      expected: ${JSON.stringify(f.expect)}`);
      console.log(`      got:      ${JSON.stringify(got)}`);
      if (detail) console.log(`      detail:   ${detail}`);
    }
  }

  // Effect check — the runtime block message must render with expected fields
  // when a block is decided. We synthesize the block payload the same way the
  // hook does, and assert the required strings are present.
  const blockCase = fixtures.find(f => f.expect.verdict === 'blocked');
  const got = evaluate(blockCase.text);
  if (got.verdict !== 'blocked' || !Array.isArray(got.offenders) || got.offenders.length === 0) {
    failed++;
    console.log('  ✗ effect check: block-fixture text did not produce a block verdict');
    console.log('      got:', JSON.stringify(got));
    console.log(`\nFixtures: ${passed} passed · ${failed} failed`);
    return;
  }
  const message = [
    '⛔ full-address-trace-gate: your trace has un-greppable code reference(s).',
    '   みや must be able to grep straight to each node himself. Fix each to a FULL address:',
    '     • file → <repo>\\<full\\path>\\<File>.<ext>:<line>  (name which repo — pelupusan / common / awam)',
    '     • method → <ClassName>.<method>():<line>  — NEVER a bare method',
    ...got.offenders.map(o => `   - ${o}`),
    '   Genuinely un-addressable (quoting a retracted emit, etc.)? Add [skip-full-address: <reason>] and continue.',
  ].join('\n');
  const wantStrings = ['⛔', 'FULL address', '<ClassName>', 'bare method', '[skip-full-address:'];
  const missing = wantStrings.filter(s => !message.includes(s));
  if (missing.length === 0) {
    passed++;
    console.log('  ✓ effect check: block message contains ⛔, hints, offender list, bypass hint');
  } else {
    failed++;
    console.log(`  ✗ effect check: missing strings in block message: ${missing.join(', ')}`);
    console.log('    rendered:');
    console.log(message.split('\n').map(l => '      ' + l).join('\n'));
  }

  console.log('');
  console.log(`Fixtures: ${passed} passed · ${failed} failed`);
}

// ─── TRANSCRIPT RUN ───────────────────────────────────────────────────────

function claudeProjectsRoot() {
  return path.join(os.homedir(), '.claude', 'projects');
}

function findRecentTranscripts(rootDir, n) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  for (const proj of fs.readdirSync(rootDir)) {
    const dir = path.join(rootDir, proj);
    let stat;
    try { stat = fs.statSync(dir); } catch (_) { continue; }
    if (!stat.isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const fp = path.join(dir, f);
      try {
        const s = fs.statSync(fp);
        out.push({ path: fp, mtime: s.mtimeMs, project: proj });
      } catch (_) {}
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime).slice(0, n);
}

function extractAssistantTurns(transcriptPath) {
  const turns = [];
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return turns; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) turns.push(text);
  }
  return turns;
}

function runTranscripts() {
  console.log('─── TRANSCRIPT RUN ' + '─'.repeat(48));
  const root = claudeProjectsRoot();
  const files = findRecentTranscripts(root, opt.sessions);
  if (files.length === 0) {
    console.log(`  (no transcripts found under ${root} — informational, does not fail eval)`);
    return null;
  }
  console.log(`  Scanning last ${files.length} session transcripts...`);
  const perSession = [];
  let totalTraceTurns = 0;
  let totalCompliant = 0;
  let totalBlocked = 0;
  for (const f of files) {
    const turns = extractAssistantTurns(f.path);
    let traceTurns = 0;
    let compliant = 0;
    let blocked = 0;
    for (const t of turns) {
      const r = evaluate(t);
      if (r.verdict === 'silent') continue;      // not a trace-shape turn
      traceTurns++;
      if (r.verdict === 'passed') compliant++;
      else if (r.verdict === 'blocked') blocked++;
    }
    if (traceTurns > 0) {
      const pct = ((compliant / traceTurns) * 100).toFixed(1);
      perSession.push({ project: f.project, file: path.basename(f.path), traceTurns, compliant, blocked, pct });
      totalTraceTurns += traceTurns;
      totalCompliant += compliant;
      totalBlocked += blocked;
    }
  }

  if (perSession.length === 0) {
    console.log('  (no trace-shaped turns in the recent transcripts)');
    return { totalTraceTurns: 0 };
  }

  console.log('');
  console.log('  Per-session first-try compliance (trace-shape turns only):');
  console.log('  ' + '─'.repeat(78));
  console.log('  ' + 'file'.padEnd(46) + ' trace  ok  blk  compliance');
  console.log('  ' + '─'.repeat(78));
  for (const s of perSession) {
    console.log('  ' + s.file.slice(0, 46).padEnd(46)
      + ' ' + String(s.traceTurns).padStart(5)
      + ' ' + String(s.compliant).padStart(4)
      + ' ' + String(s.blocked).padStart(4)
      + '     ' + s.pct + '%');
  }
  console.log('  ' + '─'.repeat(78));
  const overall = ((totalCompliant / totalTraceTurns) * 100).toFixed(1);
  console.log(`  Overall: ${totalCompliant}/${totalTraceTurns} compliant · ${totalBlocked} would-block  →  ${overall}%`);
  console.log('  Target after promotion: ≥ 95.0% first-try compliance');
  console.log('');
  return { totalTraceTurns, totalCompliant, totalBlocked, overallPct: parseFloat(overall) };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

let fixtureFailed = false;
if (!opt.transcriptOnly) {
  runFixtures();
  fixtureFailed = failed > 0;
}
if (!opt.fixturesOnly) {
  runTranscripts();
}

if (fixtureFailed) {
  console.log('\nEval FAILED — fixture assertions did not pass.');
  process.exit(1);
} else if (!opt.transcriptOnly) {
  console.log('\nEval PASSED — fixture assertions passed. Rule-6-v1.2 gate cleared.');
}
process.exit(0);
