#!/usr/bin/env node
// probe-local-only-gate.check.hook.js — born via core/forge.js (2026-09-23)
// TRIGGER: a git merge, cherry-pick or rebase (Bash or PowerShell) whose SOURCE ref still carries a probe marker (QA<num>-PROBE or QALOG) and whose target is an env, trunk or release branch
// ACTION: BLOCK with the marker files listed; bypass [skip-probe-gate: <reason>]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// WHY: 2026-09-22 the #280176 probe commit 3ba0dd4985 reached stag-env + int-env and needed a revert merge;
//      miya 2026-09-23: probes are tested LOCALLY from now on. The regex anchors on a git verb so free text
//      that merely mentions a branch name never trips it (the release push-gate false positive of 2026-09-23).
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

// One git invocation = "git [ -C <path> ] <verb> ..." — the verb must be the first non-option word after git.
const GIT_CMD_RX = /(?:^|[;&|]\s*|\n\s*)git\s+(?:-C\s+(?:"[^"]+"|'[^']+'|\S+)\s+)?(merge|push|cherry-pick|rebase)\b([^;&|\n]*)/g;
const PROTECTED_RX = /(?:^|[\s"':])(?:origin\/)?(mlk\/(?:int-env|stag-env|master|mlit|release\/[^\s"']+)|prk\/[^\s"']+|sgr\/master|master)(?=$|[\s"':])/;
const MARKER_GREP = 'QA[0-9]+[A-Z]*-PROBE|\\bQALOG\\b';

function repoOf(cmd) {
  const c = String(cmd || '');
  let m = c.match(/git\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  if (m) return m[1] || m[2] || m[3];
  m = c.match(/(?:Set-Location|cd)\s+(?:-LiteralPath\s+)?(?:"([^"]+)"|'([^']+)'|(\S+))/);
  if (m) return m[1] || m[2] || m[3];
  return null;
}

// Every git write invocation in the command, with verb + its args.
function gitWrites(cmd) {
  const out = []; let m;
  const rx = new RegExp(GIT_CMD_RX.source, 'g');
  while ((m = rx.exec(String(cmd || ''))) !== null) out.push({ verb: m[1], args: m[2] || '' });
  return out;
}

// Which ref carries the change into the protected branch?
function sourceRef(verb, args) {
  const a = String(args || '').trim();
  const words = a.split(/\s+/).filter(w => w && !w.startsWith('-') && !/^"[^"]*"$/.test(w));
  if (verb === 'merge' || verb === 'cherry-pick' || verb === 'rebase') return words[0] || 'HEAD';
  if (verb === 'push') { const spec = words[1] || 'HEAD'; return spec.split(':')[0] || 'HEAD'; }
  return 'HEAD';
}
function targetOf(verb, args) {
  const a = String(args || '');
  if (verb === 'push') { const words = a.trim().split(/\s+/).filter(w => w && !w.startsWith('-')); const spec = words[1] || ''; return spec.includes(':') ? spec.split(':')[1] : (words[1] || ''); }
  return null; // merge / cherry-pick / rebase land on the CURRENT branch — caller resolves it
}

// Pure decision — markerFound supplied by caller (unit-testable without live git).
function decide(command, turnText, markerFound, currentBranch) {
  const writes = gitWrites(command);
  if (!writes.length) return { block: false };
  if (/\[skip-probe-gate:\s*[^\]]+\]/i.test(turnText || '')) return { block: false, bypass: true };
  for (const w of writes) {
    const tgt = w.verb === 'push' ? targetOf(w.verb, w.args) : (currentBranch || '');
    if (!PROTECTED_RX.test(' ' + tgt + ' ')) continue;
    if (!markerFound) return { block: false, checked: true, verb: w.verb, target: tgt };
    return { block: true, verb: w.verb, target: tgt, ref: sourceRef(w.verb, w.args) };
  }
  return { block: false };
}

function markersIn(repo, ref) {
  try {
    const out = execSync(`git grep -l -E "${MARKER_GREP}" ${ref} -- src`, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split(/\r?\n/).filter(Boolean);
  } catch (_) { return []; }   // exit 1 = no match; any other failure = cannot prove → do not block
}
function currentBranch(repo) {
  try { return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { return ''; }
}
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function lastAssistantTurn(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean); let text = '';
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o; const role = m.role || o.type;
    if (role === 'user') break;
    if (role !== 'assistant') continue;
    const c = m.content;
    if (typeof c === 'string') { text = c + '\n' + text; continue; }
    if (Array.isArray(c)) { let t = ''; for (const b of c) { if (b && b.type === 'text' && b.text) t += b.text + '\n'; } text = t + text; }
  }
  return text;
}

function blockMsg(repo, ref, target, files) {
  return [
    `⛔ probe-local-only-gate: '${ref}' in ${repo} still carries PROBE loggers and would land on '${target}':`,
    ...files.map(f => `     ${f}`),
    `   Probe builds are tested LOCALLY only (miya's JBoss) — never merged / pushed to an env, trunk or release branch`,
    `   (2026-09-22: probe 3ba0dd4985 reached stag-env + int-env and needed a revert merge).`,
    `   Revert the probe commit(s) on '${ref}' first, or keep the probe on a local branch and hand miya the patch.`,
    `   Intentional? add [skip-probe-gate: <reason>] to your message.`,
  ].join('\n');
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'probe-local-only-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const command = String((data.tool_input || {}).command || '');
    const writes = gitWrites(command);
    if (!writes.length) return { fired: false };
    const repo = repoOf(command) || (data.cwd ? String(data.cwd) : process.cwd());
    const branch = currentBranch(repo);
    const turn = lastAssistantTurn(data.transcript_path || '');
    // Resolve the ref once per write that targets a protected branch.
    for (const w of writes) {
      const tgt = w.verb === 'push' ? targetOf(w.verb, w.args) : branch;
      if (!PROTECTED_RX.test(' ' + tgt + ' ')) continue;
      const ref = sourceRef(w.verb, w.args);
      const files = markersIn(repo, ref);
      const d = decide(command, turn, files.length > 0, branch);
      if (!d.block) { log({ action: d.bypass ? 'bypass' : 'pass', repo, verb: w.verb, ref, target: tgt, files: files.length }); return { fired: false }; }
      log({ action: 'blocked', repo, verb: w.verb, ref, target: tgt, files });
      return { fired: true, blocked: true, blockReason: blockMsg(repo, ref, tgt, files) };
    }
    return { fired: false };
  });
}

module.exports = { decide, repoOf, gitWrites, sourceRef, targetOf, PROTECTED_RX, GIT_CMD_RX };
