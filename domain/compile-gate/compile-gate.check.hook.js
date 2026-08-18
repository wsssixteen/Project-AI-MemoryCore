#!/usr/bin/env node
// compile-gate.check.hook.js — born via core/forge.js (2026-08-18)
// TRIGGER: git commit Bash command inside an etanah repo (etanah-pelupusan/awam/common)
// ACTION: block unless a local mvn compile for that module is green + current
//         (compile-check.js verify exits 0); bypass [skip-compile-gate:]
// WHY: QA-275456 2026-08-18 — a fix used mh.getBandar() (MaklumatHakmilik has none). It never
//      compiled, but a green DB read (4/87 from the Kemas kini composite) made me report
//      "tested PASSED". The int-env BUILD was the FIRST compile — it failed on the server,
//      AFTER commit, and mlit went down. This gate makes a local compile the pre-commit check.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

// The WORKING DIR must be an etanah repo — match a `cd <path…etanah-mod>` or `git -C <path…etanah-mod>`,
// NOT a bare mention of the module name (a commit MESSAGE can say "etanah-pelupusan" without being one).
const CD_RX   = /cd\s+["']?([^"'&|;]*etanah-(pelupusan|awam|common))["']?/i;
const GITC_RX = /git\s+-C\s+["']?([^"'&|;]*etanah-(pelupusan|awam|common))["']?/i;

// Pure decision (unit-testable without live mvn/git).
// -> block:false  (pass or bypass)
// -> block:null   (an etanah-repo commit — caller must run verify)
function decide(command, turnText) {
  const cmd = String(command || '');
  if (!/git\s+commit/.test(cmd)) return { block: false };
  const m = cmd.match(CD_RX) || cmd.match(GITC_RX);
  if (!m) return { block: false };
  const mod = `etanah-${m[2].toLowerCase()}`;
  if (/\[skip-compile-gate:\s*[^\]]+\]/i.test(turnText || '')) return { block: false, bypass: true, mod };
  return { block: null, mod };
}
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function lastAssistantTurn(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean); let text = '';
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const mm = o.message || o; const role = mm.role || o.type;
    if (role === 'user') break;
    if (role !== 'assistant') continue;
    const c = mm.content;
    if (typeof c === 'string') { text = c + '\n' + text; continue; }
    if (Array.isArray(c)) { let t = ''; for (const b of c) { if (b && b.type === 'text' && b.text) t += b.text + '\n'; } text = t + text; }
  }
  return text;
}

function verify(mod) {
  try {
    const out = execSync(`node "${path.join(__dirname, 'compile-check.js')}" verify ${mod}`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, message: out.trim() };
  } catch (e) {
    return { ok: false, message: (e.stderr || e.stdout || e.message || '').toString().trim() };
  }
}

function blockMsg(mod, detail) {
  return [
    `⛔ compile-gate: ${mod} was NOT compiled green + current before this commit.`,
    `   ${String(detail).split('\n').join('\n   ')}`,
    ``,
    `   Run it (backgroundable — ~1-2 min, works in parallel):`,
    `     node domain/compile-gate/compile-check.js run ${mod}`,
    `   then re-commit. WHY: QA-275456 — a non-compiling fix ("tested" from a green DB read)`,
    `   reached int-env, the server BUILD failed, and mlit went down. Compile locally first.`,
    ``,
    `   Genuinely not a code commit (docs/config only) or intentional? add [skip-compile-gate: <reason>].`,
  ].join('\n');
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'compile-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const command = String((data.tool_input || {}).command || '');
    const d = decide(command, lastAssistantTurn(data.transcript_path || ''));
    if (d.block === false) { if (d.bypass) log({ action: 'bypass', mod: d.mod }); return { fired: false }; }
    const v = verify(d.mod);
    if (v.ok) { log({ action: 'pass', mod: d.mod }); return { fired: false }; }
    log({ action: 'blocked', mod: d.mod, detail: v.message });
    return { fired: true, blocked: true, blockReason: blockMsg(d.mod, v.message) };
  });
}

module.exports = { decide, CD_RX, GITC_RX };
