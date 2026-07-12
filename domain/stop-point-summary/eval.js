#!/usr/bin/env node
/**
 * domain/stop-point-summary/eval.js
 *
 * Scans recent session transcripts under ~/.claude/projects/**\/*.jsonl and scores compliance
 * with the stop-point-summary rule: every SUBSTANTIVE assistant turn ends with a
 * Stop-Point Summary (Full form OR Micro-Summary) OR carries a whitelist bypass token.
 *
 * Target: ≥ 95% substantive-turn compliance.
 *
 * Usage:
 *   node domain/stop-point-summary/eval.js [--limit=N] [--project=<slug>] [--verbose] [--min-len=300]
 *
 * A "turn" here = one assistant message. "Substantive" and "hasSummary" use the SAME logic as the
 * hook — regressions in the hook show up as regressions in the eval.
 *
 * Also runs a SMOKE-TEST of the hook binary itself (Rule 6 v1.2 fire + effect checks): builds a
 * fixture transcript with (a) substantive + no summary → expect BLOCK, (b) substantive + summary
 * → expect PASS, (c) trivial reply → expect PASS, (d) whitelist bypass → expect PASS, (e) legacy
 * free-text bypass → expect BLOCK. Fails the eval if any fixture case diverges from expected.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// --- MATCHERS (must mirror the hook exactly) ---------------------------------

const BYPASS_WHITELIST = /\[skip-stop-point-summary:\s*(pure-ack|question-only|error-only|de-mode|closing-voice)\s*\]/;
const BYPASS_ANY = /\[skip-stop-point-(?:summary|todo):\s*([^\]]+)\]/;
const EXEMPT_STRUCT = /═══ \[ Domain Expansion \] ═══|るり結界|🌌 蒼穹宝典|Bankai 🌌/;

const SUMMARY_MARKERS = [
  /##\s*▶\s+\S/,
  /\*\*Next:\*\*/,
  /\*\*Notes:\*\*/,
  /Test Scenario\b/,
  /(?:Recon|Apply|Rubric|Discovery|Simulate|Close-out) Summary\b/,
  /Where We Are\b/,
  /Blocked\s*—\s*Awaiting/,
  /Stop-Point Summary\b/,
  /^Micro-Summary:/m,
  /^## ✅ This-turn checklist/m,
];

function hasSummary(text) {
  return SUMMARY_MARKERS.some(rx => rx.test(text));
}

function isSubstantive(text, toolUseCount) {
  if (toolUseCount >= 1) return true;
  const t = text.trim();
  if (t.length < 300) return false;
  const lines = t.split(/\r?\n/).length;
  if (lines >= 8) return true;
  if (/```[\s\S]*?```/.test(text)) return true;
  if (/^\s*\|.*\|\s*$/m.test(text)) return true;
  return false;
}

// --- ARGS --------------------------------------------------------------------

const argv = process.argv.slice(2);
const arg = (k, def) => {
  const hit = argv.find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : def;
};
const LIMIT = parseInt(arg('limit', '20'), 10);
const PROJECT_FILTER = arg('project', '');
const VERBOSE = argv.includes('--verbose');

// --- TRANSCRIPT WALKING ------------------------------------------------------

function findTranscripts(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const walk = (d) => {
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'subagents' || e.name === 'workflows') continue;
        walk(p);
      } else if (e.isFile() && e.name.endsWith('.jsonl')) {
        if (p.includes(path.sep + 'subagents' + path.sep)) continue;
        if (p.includes(path.sep + 'workflows' + path.sep)) continue;
        out.push(p);
      }
    }
  };
  walk(root);
  return out;
}

function turnFromMessage(m) {
  if (!m) return { text: '', toolUseCount: 0 };
  const c = m.content;
  if (typeof c === 'string') return { text: c, toolUseCount: 0 };
  if (!Array.isArray(c)) return { text: '', toolUseCount: 0 };
  let text = '';
  let toolUseCount = 0;
  for (const b of c) {
    if (!b) continue;
    if (b.type === 'text' && b.text) text += b.text + '\n';
    else if (b.type === 'tool_use') toolUseCount++;
  }
  return { text, toolUseCount };
}

function scoreTranscript(fp) {
  const raw = fs.readFileSync(fp, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  let substantive = 0;
  let compliant = 0;
  const failures = [];
  for (const ln of lines) {
    let o;
    try { o = JSON.parse(ln); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const { text, toolUseCount } = turnFromMessage(m);
    if (!text) continue;
    if (EXEMPT_STRUCT.test(text)) continue;
    if (BYPASS_WHITELIST.test(text)) continue;
    if (!isSubstantive(text, toolUseCount)) continue;
    substantive++;
    if (hasSummary(text)) compliant++;
    else failures.push({
      ts: m.timestamp || o.timestamp || '',
      len: text.length,
      tools: toolUseCount,
      head: text.trim().slice(0, 120).replace(/\s+/g, ' '),
    });
  }
  return { substantive, compliant, failures };
}

// --- SMOKE TEST OF HOOK (Rule 6 v1.2 fire + effect checks) -------------------

function runHookSmokeTest() {
  const hookPath = path.resolve(__dirname, 'stop-point-summary.discipline.hook.js');
  if (!fs.existsSync(hookPath)) return { ok: false, msg: 'hook not found at ' + hookPath };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sps-eval-'));
  const cases = [
    {
      name: 'substantive-no-summary',
      turn: { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(500) + '\n```\ncode\n```\n' + '\nline\n'.repeat(10) }] },
      expect: 'block',
    },
    {
      name: 'substantive-with-full-summary',
      turn: { role: 'assistant', content: [{ type: 'text', text: '## ▶ Where We Are\n\nOne line.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n**Notes:** stuff\n**Next:** ⬜ pending — みや' }] },
      expect: 'pass',
    },
    {
      name: 'substantive-with-micro-summary',
      turn: { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(400) + '\n\nMicro-Summary: fixed the hook · rebuild not needed · next: run eval' }] },
      expect: 'pass',
    },
    {
      name: 'trivial-reply',
      turn: { role: 'assistant', content: [{ type: 'text', text: 'ok, noted.' }] },
      expect: 'pass',
    },
    {
      name: 'whitelist-bypass',
      turn: { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(500) + '\n\n[skip-stop-point-summary: pure-ack]' }] },
      expect: 'pass',
    },
    {
      name: 'legacy-freetext-bypass',
      turn: { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(500) + '\n\n[skip-stop-point-summary: mid-implementation]' }] },
      expect: 'block',
    },
    {
      name: 'tool-use-with-summary',
      turn: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Read', input: {} }, { type: 'text', text: 'Micro-Summary: read the file · noted · continuing' }] },
      expect: 'pass',
    },
  ];

  const results = [];
  for (const c of cases) {
    const txPath = path.join(tmpDir, c.name + '.jsonl');
    fs.writeFileSync(txPath, JSON.stringify({ type: 'user', message: { role: 'user', content: 'test' } }) + '\n' +
      JSON.stringify({ type: 'assistant', message: c.turn }) + '\n');
    const input = JSON.stringify({ transcript_path: txPath, stop_hook_active: false });
    const r = spawnSync('node', [hookPath], { input, encoding: 'utf8', timeout: 5000 });
    let decision = 'pass';
    let reason = '';
    if (r.stdout && r.stdout.trim()) {
      try {
        const parsed = JSON.parse(r.stdout);
        if (parsed.decision === 'block') { decision = 'block'; reason = parsed.reason || ''; }
      } catch (_) { /* stdout not JSON — treat as pass */ }
    }
    const ok = decision === c.expect;
    // Effect check: if we expected a block, the reason string must actually mention the rule name.
    const effectOk = c.expect !== 'block' ? true :
      /stop-point-summary/.test(reason);
    results.push({ name: c.name, expect: c.expect, actual: decision, ok, effectOk, reason: reason.slice(0, 100) });
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  const allOk = results.every(r => r.ok && r.effectOk);
  return { ok: allOk, results };
}

// --- MAIN --------------------------------------------------------------------

function main() {
  const projectsRoot = path.join(os.homedir(), '.claude', 'projects');
  let files = findTranscripts(projectsRoot);
  if (PROJECT_FILTER) files = files.filter(f => f.includes(PROJECT_FILTER));

  files.sort((a, b) => {
    let sa = 0, sb = 0;
    try { sa = fs.statSync(a).mtimeMs; } catch (_) {}
    try { sb = fs.statSync(b).mtimeMs; } catch (_) {}
    return sb - sa;
  });
  files = files.slice(0, LIMIT);

  console.log('# stop-point-summary — Eval Report');
  console.log('');
  console.log('Root       : ' + projectsRoot);
  console.log('Transcripts: ' + files.length + ' (most recent, limit=' + LIMIT + ')');
  console.log('');

  let totalSubstantive = 0;
  let totalCompliant = 0;
  const allFailures = [];

  for (const f of files) {
    let r;
    try { r = scoreTranscript(f); } catch (e) { continue; }
    totalSubstantive += r.substantive;
    totalCompliant += r.compliant;
    if (VERBOSE) {
      console.log('  ' + path.basename(f) + ' — substantive=' + r.substantive + ' compliant=' + r.compliant);
    }
    for (const fx of r.failures) allFailures.push({ file: path.basename(f), ...fx });
  }

  const pct = totalSubstantive === 0 ? null : (totalCompliant / totalSubstantive * 100);
  console.log('');
  console.log('## Compliance');
  console.log('');
  console.log('  Substantive turns : ' + totalSubstantive);
  console.log('  Compliant         : ' + totalCompliant);
  console.log('  Compliance %      : ' + (pct === null ? 'n/a' : pct.toFixed(1) + '%'));
  console.log('  Target            : ≥ 95%');
  console.log('  Verdict           : ' + (pct === null ? 'no substantive turns found' : (pct >= 95 ? '✓ PASS' : '⛔ FAIL')));

  if (allFailures.length && VERBOSE) {
    console.log('');
    console.log('## Failure samples (top 10)');
    for (const fx of allFailures.slice(0, 10)) {
      console.log('  - ' + fx.file + ' [' + fx.len + ' chars, ' + fx.tools + ' tools] ' + fx.head + '…');
    }
  }

  console.log('');
  console.log('## Hook smoke-test (Rule 6 v1.2)');
  console.log('');
  const smoke = runHookSmokeTest();
  if (!smoke.ok) {
    for (const r of smoke.results || []) {
      const mark = r.ok && r.effectOk ? '✓' : '⛔';
      console.log('  ' + mark + ' ' + r.name + ' — expect=' + r.expect + ' actual=' + r.actual +
        (r.expect === 'block' ? ' effect=' + (r.effectOk ? 'ok' : 'missing') : ''));
    }
    console.log('');
    console.log('  Smoke-test verdict: ⛔ FAIL');
    process.exitCode = 2;
  } else {
    for (const r of smoke.results) {
      console.log('  ✓ ' + r.name + ' — expect=' + r.expect + ' actual=' + r.actual);
    }
    console.log('');
    console.log('  Smoke-test verdict: ✓ PASS');
  }

  // 2026-07-13 (external-audit Phase 1): compliance-% is REPORT-ONLY here — the gate is
  // wrapped on lib/hook-runtime.js, so live compliance is telemetry's job (weekly report +
  // lifecycle flags), not an eval red. The eval's pass/fail = the smoke fixtures above.
  if (pct !== null && pct < 95) {
    console.log('');
    console.log('  (compliance < target — tracked via meta/telemetry/hook-fires.jsonl + weekly report, not as eval RED)');
  }
}

main();
