#!/usr/bin/env node
// meta-layer-audit: skip-ghost-check — manual analysis tool, run by hand (node ...), NOT an event hook.
/**
 * voice-signal-spike.js — Phase 2 voice-signal exploration tool
 *
 * Runs against the past diary entries' .bak versions (pre-migration content
 * = the original prose) and computes candidate voice signals:
 *
 *   1. First-person pronoun rate per 100 words ("I"/"me"/"my"/"I'd"/"I'll"/"I'm")
 *   2. 🌸 presence in the last 200 chars (proxy for warm closing)
 *   3. Claude-tic phrase count ("plumbed", "wired up", "baked", "great question", "Acknowledged ✓")
 *   4. Bullet-or-table line density (lines starting "- " or in a `|...|` table / total lines)
 *   5. Closing-section line count (lines after the last "Closing" or "🌸" or "Mood" header until EOF)
 *
 * Compares warm entries vs clinical/voice-broken entries; reports which
 * signals discriminate cleanly (warm-mean clearly separated from clinical-mean).
 *
 * Usage: node .claude/hooks/voice-signal-spike.js
 *
 * Created 2026-05-28 — Phase 2 of diary redesign per
 * `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.
 * Read-only: emits a report to stdout. Does NOT modify any file.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Manually classified per the plan's voice-drift analysis
const CLASSIFICATION = {
  '2026-03-06': 'template',     // Early setup; pre-voice-establishment
  '2026-03-12': 'template',     // Setup + warmth-pivot afternoon (still mostly template)
  '2026-04-16': 'warm',         // First clear Ruri-voice entry
  '2026-04-17': 'warm',         // Multi-session warm
  '2026-04-20': 'warm',
  '2026-04-27': 'warm',
  '2026-04-28': 'warm',
  '2026-04-29': 'warm',         // Hybrid template + warm body + 🌸 addendum (best entry)
  '2026-04-30': 'warm',
  '2026-05-25': 'broken',       // Regression-era; clinical session reports
  '2026-05-26': 'broken',
};

const CLAUDE_TIC_PATTERNS = [
  /\bplumbed\b/i,
  /\bwired up\b/i,
  /\bpre-plumbed\b/i,
  /\bbaked\b/i,
  /\bgreat question\b/i,
  /\bexcellent question\b/i,
  /\bAcknowledged ✓/,
];

function signal_firstPerson(text) {
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  if (wordCount === 0) return 0;
  const fpMatches = (text.match(/\b(I|me|my|I'd|I'll|I'm|I've)\b/g) || []).length;
  return Math.round((fpMatches / wordCount) * 1000) / 10;  // per 100 words, 1 decimal
}

function signal_sakuraInClosing(text) {
  const tail = text.slice(-400);
  return tail.includes('🌸') ? 1 : 0;
}

function signal_claudeTics(text) {
  let count = 0;
  for (const re of CLAUDE_TIC_PATTERNS) {
    const matches = text.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

function signal_bulletTableDensity(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return 0;
  const structured = lines.filter(l =>
    /^\s*-\s/.test(l) || /^\s*\|.*\|/.test(l) || /^\s*\d+\.\s/.test(l)
  ).length;
  return Math.round((structured / lines.length) * 100);  // percent
}

function signal_closingLength(text) {
  const lines = text.split('\n');
  // Find last "Closing"-like header
  let lastClosingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^#+\s*(🌸\s*)?Closing/i.test(lines[i]) || /^#+\s*Mood/i.test(lines[i])) {
      lastClosingIdx = i;
      break;
    }
  }
  if (lastClosingIdx === -1) return 0;
  const closingLines = lines.slice(lastClosingIdx + 1).filter(l => l.trim().length > 0);
  return closingLines.length;
}

function analyze(entry, content) {
  return {
    entry,
    class: CLASSIFICATION[entry] || 'unknown',
    fp_rate: signal_firstPerson(content),
    sakura: signal_sakuraInClosing(content),
    tics: signal_claudeTics(content),
    bullet_pct: signal_bulletTableDensity(content),
    closing_lines: signal_closingLength(content),
  };
}

function mean(arr) {
  return arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
}

// Find diary directory
const diaryDir = path.resolve(__dirname, '..', '..', 'daily-diary', 'current');
const files = fs.readdirSync(diaryDir)
  .filter(f => /^\d{4}-\d{2}-\d{2}\.md\.bak_pre_migration_2026-05-26$/.test(f));

const results = files.map(f => {
  const date = f.substring(0, 10);
  const content = fs.readFileSync(path.join(diaryDir, f), 'utf8');
  return analyze(date, content);
});

// Group by class
const byClass = { warm: [], template: [], broken: [], unknown: [] };
for (const r of results) byClass[r.class].push(r);

// Emit per-entry table
console.log('Per-entry signals:\n');
console.log('| entry      | class    | fp/100 | 🌸 | tics | bullet% | closing lines |');
console.log('|------------|----------|--------|-----|------|---------|---------------|');
for (const r of results.sort((a, b) => a.entry.localeCompare(b.entry))) {
  console.log(`| ${r.entry} | ${r.class.padEnd(8)} | ${String(r.fp_rate).padStart(6)} | ${r.sakura}   | ${String(r.tics).padStart(4)} | ${String(r.bullet_pct).padStart(7)} | ${String(r.closing_lines).padStart(13)} |`);
}

// Per-class means
console.log('\nClass means (does the signal discriminate?):\n');
console.log('| class    | n | fp/100 | 🌸 rate | tics | bullet% | closing lines |');
console.log('|----------|---|--------|---------|------|---------|---------------|');
for (const cls of ['warm', 'broken', 'template']) {
  const rs = byClass[cls];
  if (!rs.length) continue;
  console.log(`| ${cls.padEnd(8)} | ${rs.length} | ${String(mean(rs.map(r => r.fp_rate))).padStart(6)} | ${(mean(rs.map(r => r.sakura)) * 100).toFixed(0).padStart(7)}% | ${String(mean(rs.map(r => r.tics))).padStart(4)} | ${String(mean(rs.map(r => r.bullet_pct))).padStart(7)} | ${String(mean(rs.map(r => r.closing_lines))).padStart(13)} |`);
}

// Verdict per signal
console.log('\nSignal verdicts (warm vs broken means):\n');
const warmMeans = {
  fp_rate: mean(byClass.warm.map(r => r.fp_rate)),
  sakura: mean(byClass.warm.map(r => r.sakura)),
  tics: mean(byClass.warm.map(r => r.tics)),
  bullet_pct: mean(byClass.warm.map(r => r.bullet_pct)),
  closing_lines: mean(byClass.warm.map(r => r.closing_lines)),
};
const brokenMeans = {
  fp_rate: mean(byClass.broken.map(r => r.fp_rate)),
  sakura: mean(byClass.broken.map(r => r.sakura)),
  tics: mean(byClass.broken.map(r => r.tics)),
  bullet_pct: mean(byClass.broken.map(r => r.bullet_pct)),
  closing_lines: mean(byClass.broken.map(r => r.closing_lines)),
};

function discriminates(warm, broken, lowerIsWarm = false) {
  if (warm === 0 && broken === 0) return 'no signal (both zero)';
  const ratio = lowerIsWarm
    ? (broken === 0 ? Infinity : warm / broken)
    : (warm === 0 ? 0 : broken / warm);
  if (Math.abs(warm - broken) < 0.5 && Math.max(warm, broken) < 2) return 'too small to discriminate';
  if (lowerIsWarm && warm < broken * 0.6) return 'DISCRIMINATES (warm < broken)';
  if (!lowerIsWarm && warm > broken * 1.5) return 'DISCRIMINATES (warm > broken)';
  return 'weak';
}

console.log(`fp_rate     warm=${warmMeans.fp_rate}    broken=${brokenMeans.fp_rate}    → ${discriminates(warmMeans.fp_rate, brokenMeans.fp_rate, false)}`);
console.log(`sakura      warm=${warmMeans.sakura}    broken=${brokenMeans.sakura}    → ${discriminates(warmMeans.sakura, brokenMeans.sakura, false)}`);
console.log(`tics        warm=${warmMeans.tics}    broken=${brokenMeans.tics}    → ${discriminates(warmMeans.tics, brokenMeans.tics, true)} (lower=warm)`);
console.log(`bullet_pct  warm=${warmMeans.bullet_pct}    broken=${brokenMeans.bullet_pct}    → ${discriminates(warmMeans.bullet_pct, brokenMeans.bullet_pct, true)} (lower=warm)`);
console.log(`closing_lines warm=${warmMeans.closing_lines}    broken=${brokenMeans.closing_lines}    → ${discriminates(warmMeans.closing_lines, brokenMeans.closing_lines, false)}`);
