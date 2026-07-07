/**
 * eval.workflow.js — design-consult-gate compliance scorer
 *
 * Reads the hook's own `log.jsonl` (one line per fire) and produces:
 *   1) First-try compliance rate — `allowed / (allowed + blocked-consult + blocked-eval)`
 *   2) Bypass rate — how often the escape token is invoked
 *   3) Etanah advisory frequency — count of new-symbol advisories (proxy for
 *      false-positive rate; line-level fixes that happen to hit the heuristic
 *      will surface here so tuning can happen).
 *   4) Blocked-then-resolved rate — sessions where a block was followed by a
 *      subsequent `allowed` on the same path (evidence the gate worked as
 *      intended — the model went back and invoked the consult).
 *
 * Target: ≥95% first-try compliance across a 30-day rolling window.
 *
 * Usage:
 *   node domain/design-consult-gate/eval.workflow.js           # last 30 days
 *   node domain/design-consult-gate/eval.workflow.js --window 7
 *   node domain/design-consult-gate/eval.workflow.js --all
 *   node domain/design-consult-gate/eval.workflow.js --json    # emit JSON
 *
 * Exit codes:
 *   0 — eval ran (regardless of compliance %)
 *   1 — log file missing or unreadable
 *   2 — CLI arg error
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, 'log.jsonl');

function parseArgs(argv) {
  const out = { windowDays: 30, all: false, json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') out.all = true;
    else if (a === '--json') out.json = true;
    else if (a === '--window') {
      const n = parseInt(argv[++i], 10);
      if (isNaN(n) || n <= 0) { console.error('--window requires positive integer'); process.exit(2); }
      out.windowDays = n;
    }
  }
  return out;
}

function loadEntries() {
  let raw;
  try { raw = fs.readFileSync(LOG, 'utf8'); } catch (e) {
    console.error(`[eval] log file not found at ${LOG} — nothing to score yet.`);
    process.exit(1);
  }
  return raw.split(/\r?\n/).filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch (_) { return null; }
  }).filter(Boolean);
}

function withinWindow(entry, cutoff) {
  if (!entry.ts) return false;
  const t = new Date(entry.ts).getTime();
  return !isNaN(t) && t >= cutoff;
}

function score(entries) {
  const buckets = {
    allowed: 0,
    blockedConsult: 0,
    blockedEval: 0,
    bypassedConsult: 0,
    bypassedEval: 0,
    advisory: 0,
    advisorySkipped: 0,
  };
  const pathHistory = new Map();

  for (const e of entries) {
    const action = e.action || '';
    if (action === 'allowed') buckets.allowed++;
    else if (action === 'blocked-consult' || action === 'blocked') buckets.blockedConsult++;
    else if (action === 'blocked-eval') buckets.blockedEval++;
    else if (action === 'bypassed' || action === 'bypassed-consult') buckets.bypassedConsult++;
    else if (action === 'bypassed-eval') buckets.bypassedEval++;
    else if (action === 'advisory') buckets.advisory++;
    else if (action === 'advisory-skipped') buckets.advisorySkipped++;

    if (e.file) {
      if (!pathHistory.has(e.file)) pathHistory.set(e.file, []);
      pathHistory.get(e.file).push({ ts: e.ts, action });
    }
  }

  // Blocked-then-resolved: for each path, count blocks followed by an allowed
  // within the next 24 hours (evidence the gate did its job).
  let blockedThenResolved = 0;
  let blockedThenAbandoned = 0;
  const dayMs = 24 * 60 * 60 * 1000;
  for (const [, hist] of pathHistory) {
    hist.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    for (let i = 0; i < hist.length; i++) {
      if (hist[i].action === 'blocked-consult' || hist[i].action === 'blocked-eval' || hist[i].action === 'blocked') {
        const blockTs = new Date(hist[i].ts).getTime();
        const resolved = hist.slice(i + 1).find(h => h.action === 'allowed' && (new Date(h.ts).getTime() - blockTs) <= dayMs);
        if (resolved) blockedThenResolved++;
        else blockedThenAbandoned++;
      }
    }
  }

  const totalGuarded = buckets.allowed + buckets.blockedConsult + buckets.blockedEval;
  const firstTryRate = totalGuarded === 0 ? null : (buckets.allowed / totalGuarded);
  const totalAdvisory = buckets.advisory + buckets.advisorySkipped;
  const advisoryFireRate = totalAdvisory === 0 ? null : (buckets.advisory / totalAdvisory);

  return { buckets, firstTryRate, advisoryFireRate, blockedThenResolved, blockedThenAbandoned, totalGuarded };
}

function pct(x) { return x === null ? 'n/a' : (x * 100).toFixed(1) + '%'; }

function main() {
  const args = parseArgs(process.argv);
  const all = loadEntries();
  const cutoff = args.all ? 0 : Date.now() - args.windowDays * 24 * 60 * 60 * 1000;
  const scoped = args.all ? all : all.filter(e => withinWindow(e, cutoff));

  const stats = score(scoped);

  if (args.json) {
    process.stdout.write(JSON.stringify({
      window: args.all ? 'all-time' : `${args.windowDays}d`,
      entries: scoped.length,
      buckets: stats.buckets,
      firstTryComplianceRate: stats.firstTryRate,
      advisoryFireRate: stats.advisoryFireRate,
      blockedThenResolved: stats.blockedThenResolved,
      blockedThenAbandoned: stats.blockedThenAbandoned,
      target: 0.95,
      passesTarget: stats.firstTryRate !== null && stats.firstTryRate >= 0.95,
    }, null, 2) + '\n');
    return;
  }

  const win = args.all ? 'all-time' : `${args.windowDays}d`;
  console.log(`═══ design-consult-gate eval — window=${win} ═══`);
  console.log(`Entries scanned: ${scoped.length}`);
  console.log('');
  console.log('Bucket counts:');
  console.log(`  allowed            : ${stats.buckets.allowed}`);
  console.log(`  blocked-consult    : ${stats.buckets.blockedConsult}`);
  console.log(`  blocked-eval       : ${stats.buckets.blockedEval}`);
  console.log(`  bypassed-consult   : ${stats.buckets.bypassedConsult}`);
  console.log(`  bypassed-eval      : ${stats.buckets.bypassedEval}`);
  console.log(`  advisory (etanah)  : ${stats.buckets.advisory}`);
  console.log(`  advisory-skipped   : ${stats.buckets.advisorySkipped}`);
  console.log('');
  console.log(`First-try compliance rate : ${pct(stats.firstTryRate)}   (target ≥ 95%)`);
  console.log(`Advisory fire rate         : ${pct(stats.advisoryFireRate)}   (proxy for etanah false-positive risk)`);
  console.log(`Blocked → resolved         : ${stats.blockedThenResolved}   (gate worked; model reconsulted)`);
  console.log(`Blocked → abandoned        : ${stats.blockedThenAbandoned}   (path dropped; likely bypass used or edit deferred)`);
  console.log('');
  if (stats.firstTryRate === null) {
    console.log('⏳ No guarded-path fires yet — baseline period. Re-run after usage accumulates.');
  } else if (stats.firstTryRate >= 0.95) {
    console.log('✓ PASSES target ≥ 95%.');
  } else {
    console.log(`✗ Below target. Gap: ${((0.95 - stats.firstTryRate) * 100).toFixed(1)} pp.`);
  }
}

main();
