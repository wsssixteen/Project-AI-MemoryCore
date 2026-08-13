#!/usr/bin/env node
// deploy-guard.check.hook.js — born via core/forge.js (2026-08-13)
// TRIGGER: Bash git op in an etanah/mlk company-branch context: cherry-pick, conflict auto-resolve (-X ours|theirs, checkout --ours|--theirs), force-push, or reset --hard to a ref
// ACTION: BLOCK — enforce the deploy convention: put a ticket fix on an env branch by merge --no-ff of the ticket branch and STOP on conflict; never cherry-pick / auto-resolve / force-push / reset a company branch. Bypass [skip-deploy-guard:]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// REPLAY (QA-274745 2026-08-13): a --no-ff merge of the ticket branch into mlk/int-env conflicted
// on an unrelated release-lineage .docx; instead of STOPPING (deploy skill §4: "Conflict -> stop,
// never auto-resolve"), the fix was cherry-picked onto the company branch — a divergent duplicate
// SHA that desyncs int-env from the ticket merge history. みや: "NO FUCKING CHERRY PICKING ...
// don't keep on breaking the company's branches."
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

// company-branch / etanah-repo context — MemoryCore (main) never trips this
const ETANAH_CTX = /etanah-(?:pelupusan|awam|common|spoc-hasil|teknikal)|\bmlk\/(?:master|int-env|stag-env|release|esokongan|training|internal|qa|cr)/i;

// Pure decision — unit-testable without live git.
function decide(command, turnText) {
  const cmd = String(command || '');
  if (!/\bgit\b/.test(cmd)) return { block: false };
  if (/\[skip-deploy-guard:\s*[^\]]+\]/i.test(turnText || '') || /\[skip-deploy-guard:\s*[^\]]+\]/i.test(cmd)) {
    return { block: false, bypass: true };
  }
  if (!ETANAH_CTX.test(cmd)) return { block: false };

  if (/\bgit\s+cherry-pick\b/i.test(cmd)) return { block: true, kind: 'cherry-pick' };

  if (/-X\s*(?:ours|theirs)\b/i.test(cmd) || /\bcheckout\s+--(?:ours|theirs)\b/i.test(cmd)) {
    return { block: true, kind: 'auto-resolve' };
  }
  if (/\bgit\s+push\b/i.test(cmd) && /(?:--force\b|--force-with-lease\b|(?:^|\s)-f\b|\s\+[\w./-]*mlk\/)/i.test(cmd)) {
    return { block: true, kind: 'force-push' };
  }
  if (/\bgit\s+reset\s+--hard\s+(?:origin\/|mlk\/|[0-9a-f]{7,}\b)/i.test(cmd)) {
    return { block: true, kind: 'reset-hard' };
  }
  return { block: false };
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

function blockMsg(kind) {
  const why = {
    'cherry-pick': 'cherry-pick creates a divergent duplicate SHA and desyncs the env branch from the ticket merge history',
    'auto-resolve': "auto-resolving a merge conflict on a company branch silently discards someone else's change",
    'force-push': "force-push rewrites a shared company branch and can erase teammates' commits",
    'reset-hard': 'reset --hard to a ref moves a shared branch pointer, dropping commits',
  }[kind] || 'this operation can corrupt a shared company branch';
  return [
    `⛔ deploy-guard: '${kind}' on a company etanah branch is BANNED — ${why}.`,
    ``,
    `   DEPLOY CONVENTION (deploy skill §4 — the ONLY way a fix reaches an env branch):`,
    `     1. branch off FRESH origin/mlk/master → commit the fix → push the ticket branch`,
    `     2. put it on the env branch by MERGE ONLY:`,
    `          git merge --no-ff origin/mlk/<tracker>/<num>   (into mlk/int-env / mlk/stag-env)`,
    `     3. merge CONFLICT → STOP. Show みや the conflicted paths. Never auto-resolve, never cherry-pick.`,
    `     4. never force-push or reset a company branch (mlk/*).`,
    ``,
    `   Genuinely intended (hotfix recovery, みや-approved)? add [skip-deploy-guard: <reason>].`,
  ].join('\n');
}

if (require.main === module) {
  runHook({ name: 'deploy-guard', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const cmd = String((data.tool_input || {}).command || '');
    if (!cmd) return { fired: false };
    const turn = lastAssistantTurn(data.transcript_path || '');
    const d = decide(cmd, turn);
    if (!d.block) { if (d.bypass) log({ action: 'bypass', cmd: cmd.slice(0, 120) }); return { fired: false }; }
    log({ action: 'blocked', kind: d.kind, cmd: cmd.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: blockMsg(d.kind) };
  });
}

module.exports = { decide, ETANAH_CTX };
