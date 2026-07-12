#!/usr/bin/env node
/**
 * lib/eval-runner.js — R2: the eval suite runner (external-audit Phase 1).
 *
 * Discovers and runs every replay eval in the repo:
 *   lib/*.eval.js · core/*.eval.js · domain/** eval.js + *.eval.js
 * Skips: *.workflow.js (needs the Workflow tool) · files containing '// eval-runner: skip'
 *        (skip reason shown) · node_modules · .claude/worktrees.
 *
 * USAGE:
 *   node lib/eval-runner.js            — run full suite, table + summary, exit 1 on any red
 *   node lib/eval-runner.js --json     — machine-readable result
 *   node lib/eval-runner.js --only <substring>  — run matching evals only
 *
 * Cadence (handoff Phase 1): affected evals at component change (forge does this at birth),
 * FULL suite at session close, weekly = trend line. Each suite run appends one telemetry row.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const EVAL_TIMEOUT_MS = 120000;

function discover() {
  const found = [];
  const roots = [path.join(ROOT, 'lib'), path.join(ROOT, 'core'), path.join(ROOT, 'domain')];
  const walk = dir => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'worktrees') continue;
        walk(p);
      } else if (/(^eval\.js$|\.eval\.js$)/.test(e.name) && !/workflow/.test(e.name)) {
        found.push(p);
      }
    }
  };
  roots.forEach(walk);
  return found.sort();
}

const only = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const asJson = process.argv.includes('--json');

const rows = [];
for (const file of discover()) {
  const rel = path.relative(ROOT, file);
  if (only && !rel.includes(only)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const skipMatch = src.match(/\/\/\s*eval-runner:\s*skip(?:\s*[—-]\s*(.*))?/);
  if (skipMatch) { rows.push({ eval: rel, status: 'SKIP', detail: skipMatch[1] || '(marked skip)', ms: 0 }); continue; }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: EVAL_TIMEOUT_MS, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  const ms = Date.now() - t0;
  const out = (r.stdout || '') + (r.stderr || '');
  const scoreMatch = out.match(/(\d+)\/(\d+)\s+green/);
  rows.push({
    eval: rel,
    status: r.status === 0 ? 'GREEN' : (r.status == null ? 'TIMEOUT' : 'RED'),
    detail: scoreMatch ? scoreMatch[0] : (r.status === 0 ? 'exit 0' : 'exit ' + r.status + ' — ' + out.trim().split('\n').slice(-3).join(' | ').slice(0, 200)),
    ms,
  });
}

const green = rows.filter(r => r.status === 'GREEN').length;
const red = rows.filter(r => r.status === 'RED' || r.status === 'TIMEOUT').length;
const skipped = rows.filter(r => r.status === 'SKIP').length;

// telemetry row per suite run (never breaks the run)
try {
  const { appendTelemetry } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  appendTelemetry({ ts: new Date().toISOString(), hook: 'eval-runner', event: 'EvalSuite', mode: 'suite', exit: red ? 1 : 0, blocked: false, total: rows.length, green, red, skipped });
} catch (_) {}

if (asJson) {
  console.log(JSON.stringify({ green, red, skipped, rows }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('STATUS', 8) + pad('MS', 7) + 'EVAL — detail');
  for (const r of rows) console.log(pad(r.status, 8) + pad(r.ms, 7) + r.eval + ' — ' + r.detail);
  console.log(`\neval-runner: ${green} GREEN · ${red} RED · ${skipped} SKIP  (${rows.length} total)`);
}
process.exit(red ? 1 : 0);
