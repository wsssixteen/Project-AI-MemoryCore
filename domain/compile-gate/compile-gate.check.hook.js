#!/usr/bin/env node
// compile-gate.check.hook.js — born via core/forge.js (2026-08-18)
// TRIGGER: git commit Bash command inside an etanah repo (etanah-pelupusan/awam/common)
// ACTION: block unless a local mvn compile for that module is green + current
//         (compile-check.js verify exits 0); bypass [skip-compile-gate:]
// WHY: QA-275456 2026-08-18 — a fix used mh.getBandar() (MaklumatHakmilik has none). It never
//      compiled, but a green DB read (4/87 from the Kemas kini composite) made me report
//      "tested PASSED". The int-env BUILD was the FIRST compile — it failed on the server,
//      AFTER commit, and mlit went down. This gate makes a local compile the pre-commit check.
// v3 (2026-10-04, #244600): the same commit moment also runs the falsifier ledger + local-test check
//      (domain/falsifier-ran-check/check.js gateCommit). One registration, two checks; the compile bypass
//      token does not reach the ledger check.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

// The WORKING DIR must be an etanah repo — match a `cd <path…etanah-mod>` or `git -C <path…etanah-mod>`,
// NOT a bare mention of the module name (a commit MESSAGE can say "etanah-pelupusan" without being one).
// v2 (2026-10-02): these two regexes are now only the FALLBACK when the directory is not a readable git
// repo. The repo is named by its origin remote (lib/git-target.js), so a worktree such as
// E:\Dev\etanah-work\stag-awam-pdbb is gated as etanah-awam (v1 let its commit through ungated).
const CD_RX   = /cd\s+["']?([^"'&|;]*etanah-(pelupusan|awam|common))["']?/i;
const GITC_RX = /git\s+-C\s+["']?([^"'&|;]*etanah-(pelupusan|awam|common))["']?/i;
const { targetRepo, targetOfCall, findGitCalls, quotedSpans, assignments, invokesGit, shellOf } = require(path.join(ROOT, 'lib', 'git-target.js'));
// A raw `mvn … compile` (no -t toolchains) in an etanah repo — always fails in this shell (no JDK 8);
// compile-check.js is the one path that compiles AND records the marker the commit gate needs.
const RAW_MVN_RX = /(?:^|[;&|\n(]\s*)mvn(?:\.cmd)?\b(?![^;&|\n]*\s-t\s)[^;&|\n]*\bcompile\b/i;

// v2.2 (2026-10-05, after the independent reviews): the repo is told by lib/git-target.js v3, which reads a path
// the way the tool's SHELL reads it and says `unresolved` when it cannot be sure. An unreadable folder is no
// longer handed to verify under a guessed name (that refused a good commit with "is not an etanah git repo",
// live 2026-10-04): when anything in the command or the tool folder says etanah, the commit is REFUSED with
// the reason; when nothing does, it is not this gate's business.
function classify(t, cmd) {
  if (t.id && /^etanah-/i.test(t.id.name)) return { mod: t.id.name.toLowerCase(), top: t.id.top };
  if (t.id) return null;                                        // a real repo that is not etanah
  if (t.unresolved) {
    // "says etanah" = the command outside its commit MESSAGE (a MemoryCore commit about etanah is not an etanah
    // commit), or the tool's own folder (in PowerShell a cd that fails leaves the commit there).
    const outsideMessage = String(cmd || '').replace(/(\s(?:-a?m|--message(?:=|\s+)|-F|--file(?:=|\s+))\s*)(?:"[^"]*"|'[^']*')/g, '$1""');
    const signal = /etanah/i.test(outsideMessage) || (t.cwdId && /^etanah-/i.test(t.cwdId.name));
    return signal ? { unresolved: true, why: t.why, raw: t.raw } : null;
  }
  return null;
}
// every `git <verb>` call of the command is looked at (v2 judged only the first); verb null = no git call needed (raw mvn)
function identify(cmd, cwd, verb, shell) {
  if (!verb) return classify(targetRepo(cmd, cwd, null, shell), cmd);
  const spans = quotedSpans(cmd); const pre = { spans, assigns: assignments(cmd, spans) };
  const found = findGitCalls(cmd, verb, { spans }).filter(c => !c.quoted).map(c => classify(targetOfCall(cmd, c, cwd, shell, pre), cmd)).filter(Boolean);
  return found.find(x => x.unresolved) || found[0] || null;
}

// Pure decision (unit-testable without live mvn/git — pass `ident` to stub the repo lookup).
// -> block:false  (pass or bypass)
// -> block:null   (an etanah-repo commit — caller must run verify)
// -> block:true   (raw mvn compile — use compile-check.js)
// -> block:'unresolved' (an etanah-looking commit whose repo cannot be told)
function decide(command, turnText, cwd, ident, shell) {
  const cmd = String(command || '');
  const who = ident || identify;
  const bypass = /\[skip-compile-gate:\s*[^\]]+\]/i.test(turnText || '');
  if (RAW_MVN_RX.test(cmd)) {
    const t = who(cmd, cwd, null, shell);
    if (t && !t.unresolved) return bypass ? { block: false, bypass: true, mod: t.mod } : { block: true, rawMvn: true, mod: t.mod, top: t.top };
  }
  if (!invokesGit(cmd, 'commit')) return { block: false };
  const t = who(cmd, cwd, 'commit', shell);
  if (!t) return { block: false };
  if (bypass) return { block: false, bypass: true, mod: t.mod };
  if (t.unresolved) return { block: 'unresolved', why: t.why, raw: t.raw };
  return { block: null, mod: t.mod, top: t.top };
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

function verify(target) {
  try {
    const out = execSync(`node "${path.join(__dirname, 'compile-check.js')}" verify "${target}"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, message: out.trim() };
  } catch (e) {
    return { ok: false, message: (e.stderr || e.stdout || e.message || '').toString().trim() };
  }
}

function rawMvnMsg(mod, top) {
  return [
    `⛔ compile-gate: raw \`mvn compile\` in ${mod} — it fails in this shell (no JDK 8 toolchain) and records nothing.`,
    `   Use the tool instead (toolchain + offline→online retry + the marker the commit gate reads):`,
    `     node domain/compile-gate/compile-check.js run "${top}"`,
    `   Intentional raw maven run? add [skip-compile-gate: <reason>].`,
  ].join('\n');
}

function blockMsg(mod, detail, top) {
  return [
    `⛔ compile-gate: ${mod} was NOT compiled green + current before this commit.`,
    `   ${String(detail).split('\n').join('\n   ')}`,
    ``,
    `   Run it (backgroundable — ~1-2 min, works in parallel):`,
    `     node domain/compile-gate/compile-check.js run "${top}"`,
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
    const shell = shellOf(data.tool_name || '');
    const cwd0 = (data.tool_name === 'mcp__terminal__run_in_terminal' && (data.tool_input || {}).cwd) ? path.resolve(data.cwd || '.', String(data.tool_input.cwd)) : (data.cwd || '');
    const d = decide(command, lastAssistantTurn(data.transcript_path || ''), cwd0, null, shell);
    if (d.block === 'unresolved') {
      log({ action: 'blocked-unresolved', why: d.why, raw: d.raw });
      return { fired: true, blocked: true, blockReason: [
        '⛔ compile-gate: cannot tell which repo this commit runs in, and the command points at etanah.',
        `   Reason: ${d.why}${d.raw ? ` (path written as "${d.raw}")` : ''}.`,
        '   Re-issue the commit with a literal folder that exists, for example:',
        '     git -C "E:\\Projects\\Melaka\\etanah-pelupusan" commit -m "<subject>"',
        '   Not an etanah commit at all? add [skip-compile-gate: <reason>].',
      ].join('\n') };
    }
    if (d.block === true) {
      log({ action: 'blocked-raw-mvn', mod: d.mod, top: d.top });
      return { fired: true, blocked: true, blockReason: rawMvnMsg(d.mod, d.top) };
    }
    if (d.block === null) {
      const v = verify(d.top);
      if (!v.ok) {
        log({ action: 'blocked', mod: d.mod, top: d.top, detail: v.message });
        return { fired: true, blocked: true, blockReason: blockMsg(d.mod, v.message, d.top) };
      }
      log({ action: 'pass', mod: d.mod, top: d.top });
    } else if (d.bypass) log({ action: 'bypass', mod: d.mod });
    // Falsifier ledger + local test (2026-10-04, #244600): every etanah commit, also when the compile
    // check was bypassed. [skip-compile-gate:] never clears it; only miya's own [risk-ok:] clears the local test.
    if (d.mod && invokesGit(command, 'commit')) {
      const t = identify(command, cwd0, 'commit', shell);
      let g = { ok: true };
      try { g = require(path.join(ROOT, 'domain', 'falsifier-ran-check', 'check.js')).gateCommit({ command, top: (t && t.top) || d.top, transcriptPath: data.transcript_path || '' }); } catch (_) { /* fail-open */ }
      if (!g.ok) {
        log({ action: 'blocked-ledger', mod: d.mod, qa: g.qa });
        return { fired: true, blocked: true, blockReason: g.message };
      }
    }
    return { fired: false };
  });
}

module.exports = { decide, identify, RAW_MVN_RX, CD_RX, GITC_RX };
