#!/usr/bin/env node
/**
 * lib/dispatch-hooks.js — C3 cluster-merge dispatcher (external-audit Phase 2).
 * ONE registration runs a BUNDLE of child hooks in PARALLEL, aggregates their outputs
 * into a single harness-safe emission, and writes per-child telemetry rows.
 *
 * WHY this merge shape: child logic/bypass-tokens/severities stay byte-identical
 * (their eval pins keep protecting them); only the REGISTRATION consolidates.
 * Parallel spawn beats the harness's serial hook walk on latency.
 *
 * USAGE (in settings.json):
 *   node "lib/dispatch-hooks.js" --manifest "domain/bundles/<bundle>.json" --event <Event>
 * Manifest: { "name": "<bundle>", "children": ["<repo-relative hook path>", ...] }
 *
 * AGGREGATION (harness expects at most ONE JSON object on stdout):
 *   1. any child exit-2                     → exit 2, stderr concatenated (Stop-block style)
 *   2. any stdout {decision:'block'}        → ONE merged block decision (reasons joined)
 *   3. any {hookSpecificOutput.permissionDecision:'deny'|'ask'} → ONE merged envelope (deny>ask)
 *   4. else advisories: all additionalContext + raw text joined → ONE envelope / plain text
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; }
const MANIFEST = path.resolve(ROOT, arg('manifest'));
const EVENT = arg('event') || '';

let manifest;
try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
catch (e) { process.exit(0); } // fail-open: a broken manifest must never block the session

function appendTelemetry(row) {
  try {
    const dir = path.join(ROOT, 'meta', 'telemetry');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'hook-fires.jsonl'), JSON.stringify(row) + '\n');
  } catch (_) {}
}

const input = (() => { try { return fs.readFileSync(0, 'utf8'); } catch (_) { return ''; } })();

function runChild(rel) {
  return new Promise(resolve => {
    const abs = path.resolve(ROOT, rel);
    const t0 = Date.now();
    if (!fs.existsSync(abs)) {
      appendTelemetry({ ts: new Date().toISOString(), hook: path.basename(rel, '.js'), event: EVENT, mode: 'bundle', exit: 0, blocked: false, dur_ms: 0, error: 'child-missing' });
      return resolve({ rel, code: 0, stdout: '', stderr: '' });
    }
    const p = spawn(process.execPath, [abs], { env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    let stdout = '', stderr = '';
    const killer = setTimeout(() => { try { p.kill(); } catch (_) {} }, 30000);
    p.stdout.on('data', d => { stdout += d; });
    p.stderr.on('data', d => { stderr += d; });
    p.on('error', () => { clearTimeout(killer); resolve({ rel, code: 0, stdout: '', stderr: '' }); });
    p.on('close', code => {
      clearTimeout(killer);
      const blocked = code === 2 || /"decision"\s*:\s*"block"/.test(stdout) || /"permissionDecision"\s*:\s*"deny"/.test(stdout);
      appendTelemetry({ ts: new Date().toISOString(), hook: path.basename(rel, '.js'), event: EVENT, mode: 'bundle', exit: code == null ? 0 : code, blocked, dur_ms: Date.now() - t0 });
      resolve({ rel, code: code == null ? 0 : code, stdout, stderr });
    });
    p.stdin.on('error', () => {});
    p.stdin.write(input);
    p.stdin.end();
  });
}

(async () => {
  const results = await Promise.all((manifest.children || []).map(runChild));

  // 1. exit-2 blocks (Stop hard-block convention)
  const exit2 = results.filter(r => r.code === 2);
  if (exit2.length) {
    process.stderr.write(exit2.map(r => r.stderr.trim()).filter(Boolean).join('\n\n'));
    process.exit(2);
  }

  const parsed = results.map(r => {
    let j = null;
    const t = (r.stdout || '').trim();
    if (t.startsWith('{')) { try { j = JSON.parse(t); } catch (_) {} }
    return { ...r, json: j };
  });

  // 2. decision:block wins
  const blocks = parsed.filter(r => r.json && r.json.decision === 'block');
  if (blocks.length) {
    const reasons = blocks.map(r => (Array.isArray(r.json.reason) ? r.json.reason.join('\n') : String(r.json.reason || ''))).join('\n\n');
    process.stdout.write(JSON.stringify({ decision: 'block', reason: reasons }));
    process.exit(0);
  }

  // 3. permissionDecision deny > ask
  const perms = parsed.filter(r => r.json && r.json.hookSpecificOutput && r.json.hookSpecificOutput.permissionDecision);
  const deny = perms.find(r => r.json.hookSpecificOutput.permissionDecision === 'deny') || perms.find(r => r.json.hookSpecificOutput.permissionDecision === 'ask');
  if (deny) {
    const others = perms.filter(r => r !== deny).map(r => r.json.hookSpecificOutput.permissionDecisionReason).filter(Boolean);
    const out = { ...deny.json };
    if (others.length) out.hookSpecificOutput.permissionDecisionReason = (out.hookSpecificOutput.permissionDecisionReason || '') + '\n\nALSO: ' + others.join('\n');
    process.stdout.write(JSON.stringify(out));
    process.exit(0);
  }

  // 4. advisories: merge additionalContext + raw text
  const contexts = [];
  for (const r of parsed) {
    if (r.json && r.json.hookSpecificOutput && r.json.hookSpecificOutput.additionalContext) contexts.push(r.json.hookSpecificOutput.additionalContext);
    else if (!r.json && r.stdout && r.stdout.trim()) contexts.push(r.stdout.trim());
  }
  if (contexts.length) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: EVENT, additionalContext: contexts.join('\n\n') } }));
  }
  process.exit(0);
})();
