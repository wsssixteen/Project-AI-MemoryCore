#!/usr/bin/env node
/**
 * lib/hook-runtime.js — K3+K6: shared hook runtime + telemetry (external-audit Phase 1)
 *
 * Two modes:
 *   1. WRAP (zero-edit migration of existing hooks):
 *        node lib/hook-runtime.js --wrap "<abs path to hook.js>" <EventName>
 *      Forwards stdin/stdout/stderr/exit-code verbatim; appends one telemetry
 *      line per evaluation; fail-open on child crash/timeout (exit 0 + error row).
 *   2. NATIVE (for migrated/new hooks):
 *        const { runHook } = require('../lib/hook-runtime');
 *        runHook({ name, event }, (input) => ({ fired, blocked, bypassed, bypassToken, contextOut, blockReason }));
 *
 * Telemetry: system/telemetry/hook-fires.jsonl
 *   { ts, hook, event, mode, exit, blocked, bypassed?, bypass_token?, dur_ms, error? }
 *
 * Born 2026-07-13 (sprint Day 1). Pre-forge component — built with manual forge
 * discipline: node --check + eval green (lib/hook-runtime.eval.js) before commit.
 * Design: audit R1 + blueprint K3/K6 + handoff Phase 1.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const TELEMETRY_DIR = path.join(REPO_ROOT, 'system', 'telemetry');
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, 'hook-fires.jsonl');
const CHILD_TIMEOUT_MS = 30000;

function appendTelemetry(row) {
  // Telemetry must NEVER break a hook — swallow every error.
  try {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    fs.appendFileSync(TELEMETRY_FILE, JSON.stringify(row) + '\n');
  } catch (_) { /* fail-open */ }
}

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (_) { return ''; }
}

function expandRoot(p) {
  // Belt-and-braces: harness normally expands ${CLAUDE_PROJECT_DIR} already.
  return p ? p.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, REPO_ROOT) : p;
}

// ---------- WRAP MODE ----------
function wrapMain() {
  const target = expandRoot(process.argv[3]);
  const event = process.argv[4] || '';
  const hookName = target ? path.basename(target, '.js') : '?';
  const t0 = Date.now();
  const input = readStdin();

  if (!target || !fs.existsSync(target)) {
    // Missing hook file = the ghost class. Log it loudly in telemetry, fail open.
    appendTelemetry({ ts: new Date().toISOString(), hook: hookName, event, mode: 'wrap', exit: 0, blocked: false, dur_ms: Date.now() - t0, error: 'target-missing: ' + (target || '(none)') });
    process.exit(0);
  }

  let res;
  try {
    res = spawnSync(process.execPath, [target], { input, encoding: 'utf8', timeout: CHILD_TIMEOUT_MS, env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT } });
  } catch (e) {
    res = { status: null, stdout: '', stderr: '', error: e };
  }

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const spawnFailed = res.error != null || res.status == null;
  const exit = spawnFailed ? 0 : res.status; // fail-open on crash/timeout
  const blocked = !spawnFailed && (res.status === 2 || /"decision"\s*:\s*"block"/.test(stdout));

  appendTelemetry({
    ts: new Date().toISOString(), hook: hookName, event, mode: 'wrap',
    exit, blocked, dur_ms: Date.now() - t0,
    ...(spawnFailed ? { error: 'child-failed: ' + (res.error ? res.error.message : 'timeout-or-crash') } : {}),
  });

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  process.exit(exit);
}

// ---------- ORCHESTRATION MODE (added 2026-08-16, /sweep prerequisite — DESIGN.md §9) ----------
// During a sweep the controller orchestrates and never edits source; ~6 code-work Stop
// gates misfire on relayed familiar text (all observed/predicted 2026-07-27 + live 2026-08-16).
// Flag file: system/orchestration-mode.flag — first line = expiry epoch-ms (TTL guards a
// crashed sweep from muting gates forever). Suppressed gates log a telemetry row
// (mode:'orch-suppressed') so the suppression itself is OBSERVABLE, never silent.
const ORCH_SUPPRESS = new Set(['terse-gate', 'show-gate', 'full-address-trace-gate',
  'predicate-box', 'codemap-recon-consult', 'quest-context-load-gate']);
function orchestrationActive() {
  try {
    const p = path.join(REPO_ROOT, 'system', 'orchestration-mode.flag');
    const exp = parseInt(fs.readFileSync(p, 'utf8').split('\n')[0], 10);
    return Number.isFinite(exp) && Date.now() < exp;
  } catch (_) { return false; }
}

// ---------- NATIVE MODE (API for migrated/new hooks) ----------
function runHook(meta, fn) {
  const t0 = Date.now();
  if (ORCH_SUPPRESS.has(meta.name) && orchestrationActive()) {
    appendTelemetry({ ts: new Date().toISOString(), hook: meta.name, event: meta.event, mode: 'orch-suppressed', exit: 0, blocked: false, bypassed: false, dur_ms: Date.now() - t0 });
    process.exit(0);
  }
  const input = readStdin();
  let out = null;
  let error;
  try {
    out = fn(input) || {};
  } catch (e) {
    error = e.message; // fail-open: a buggy hook must not block the session
    out = {};
  }
  appendTelemetry({
    ts: new Date().toISOString(), hook: meta.name, event: meta.event, mode: 'native',
    exit: out.blocked ? 2 : 0, blocked: !!out.blocked, bypassed: !!out.bypassed,
    ...(out.bypassToken ? { bypass_token: out.bypassToken } : {}),
    dur_ms: Date.now() - t0, ...(error ? { error } : {}),
  });
  if (out.contextOut) process.stdout.write(out.contextOut);
  if (out.blocked) {
    if (out.blockReason) process.stderr.write(out.blockReason);
    process.exit(2);
  }
  process.exit(0);
}

module.exports = { runHook, appendTelemetry, REPO_ROOT, TELEMETRY_FILE };

if (require.main === module && process.argv[2] === '--wrap') wrapMain();
