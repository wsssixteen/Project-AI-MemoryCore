#!/usr/bin/env node
// deploy-guard.check.hook.js — born via core/forge.js (2026-08-13)
// TRIGGER: Bash git op in an etanah/mlk company-branch context: cherry-pick, conflict auto-resolve (-X ours|theirs, checkout --ours|--theirs), force-push, or reset --hard to a ref
// ACTION: BLOCK — enforce the deploy convention: put a ticket fix on an env branch by merge --no-ff of the ticket branch and STOP on conflict; never cherry-pick / auto-resolve / force-push / reset a company branch. Bypass [skip-deploy-guard:]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// REPLAY (QA-274745 2026-08-13): a --no-ff merge of the ticket branch into mlk/int-env conflicted
// on an unrelated release-lineage .docx; instead of STOPPING (deploy skill §4: "Conflict -> stop,
// never auto-resolve"), the fix was cherry-picked onto the company branch — a divergent duplicate
// SHA that desyncs int-env from the ticket merge history. みや (angry): "NO CHERRY PICKING ...
// don't keep on breaking the company's branches."
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));   // missing since birth: every fire threw ReferenceError (found 2026-09-08 audit)

// company-branch / etanah-repo context — MemoryCore (main) never trips this
// etanah-work = the work clone and its worktrees (wt-int-env etc.); missed until 2026-11-05, when 3 cherry-picks ran there unblocked
const ETANAH_CTX = /etanah-(?:pelupusan|awam|common|spoc-hasil|teknikal|work)|\bmlk\/(?:master|int-env|stag-env|release|esokongan|training|internal|qa|cr)/i;

// Pure decision — unit-testable without live git.
// v2 (2026-11-05): hisText = miya's own recent messages (lib/his-words.js); an ORDER token (revert, re-merge,
// multi-commit) counts only there, never in the assistant turn. turnText keeps the assistant-side skip token.
function decide(command, turnText, hisText) {
  const cmd = String(command || '');
  const orderSrc = hisText !== undefined ? String(hisText || '') : String(turnText || '');
  if (!/\bgit\b/.test(cmd) && !/origin-rewrite\.js/.test(cmd)) return { block: false };
  if (/\[skip-deploy-guard:\s*[^\]]+\]/i.test(turnText || '') || /\[skip-deploy-guard:\s*[^\]]+\]/i.test(cmd)) {
    return { block: false, bypass: true };
  }
  if (!ETANAH_CTX.test(cmd)) return { block: false };
  // the one allowed way to move an origin branch backwards (P4, lib/origin-rewrite.js): it force-pushes with a lease
  // and resets his clone in the same step; a raw force-push stays blocked below.
  if (/\blib[\\/]origin-rewrite\.js\b/.test(cmd)) return { block: false, tool: 'origin-rewrite' };

  // `git -C <folder> <verb>` counts the same as `git <verb>` (2026-11-05: `git -C ... cherry-pick` slipped through)
  const g = String.raw`\bgit(?:\s+-C\s+(?:"[^"]*"|'[^']*'|\S+))?\s+`;
  if (new RegExp(g + 'cherry-pick\\b', 'i').test(cmd)) return { block: true, kind: 'cherry-pick' };

  if (/-X\s*(?:ours|theirs)\b/i.test(cmd) || /\bcheckout\s+--(?:ours|theirs)\b/i.test(cmd)) {
    return { block: true, kind: 'auto-resolve' };
  }
  if (new RegExp(g + 'push\\b', 'i').test(cmd) && /(?:--force\b|--force-with-lease\b|(?:^|\s)-f\b|\s\+[\w./-]*mlk\/)/i.test(cmd)) {
    return { block: true, kind: 'force-push' };
  }
  if (new RegExp(g + 'reset\\s+--hard\\s+(?:origin\\/|mlk\\/|[0-9a-f]{7,}\\b)', 'i').test(cmd)) {
    return { block: true, kind: 'reset-hard' };
  }
  // v2 (2026-11-05, #287811, miya: "BAN YOURSELF"): a revert of a pushed ticket commit runs only on his order,
  // never on a question. Three fixes were reverted on "did you revert the unrelated ones", then restored.
  if (new RegExp(g + 'revert\\b', 'i').test(cmd) && !/\[miya-ordered-revert:\s*[^\]]+\]/i.test(orderSrc)) {
    return { block: true, kind: 'revert' };
  }
  return { block: false };
}

// v2 live checks (need git): run in the hook after decide() passes. gitFn is injectable for the eval.
//   re-merge     : the same ticket branch merged into the same env branch twice in one day
//                  (287811: four int-env merges in one day, one failed attempt each)
//   multi-commit : a push of a ticket branch that carries more than one non-merge commit made today
//                  (one tested commit per cycle; failed attempts are squashed before the push)
function liveDecide(cmd, cwd, hisText, gitFn) {
  cmd = String(cmd || '');
  if (!/\bgit\b/.test(cmd) || !ETANAH_CTX.test(cmd)) return { block: false };
  const { execSync } = require('child_process');
  const git = gitFn || ((args, dir) => { try { return execSync('git ' + args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { return null; } });
  const dirM = cmd.match(/\bcd\s+(?:"([^"]+)"|'([^']+)'|(\S+))/) || cmd.match(/\bgit\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  const dir = (dirM && (dirM[1] || dirM[2] || dirM[3])) || cwd;
  const turn = String(hisText || '');
  const mergeM = cmd.match(/\bgit\s+merge\b[^;&|]*?\b(?:origin\/)?(mlk\/(?:esokongan|internal|qa|cr|requirement)\/\d+(?:v\d+)?)\b/i);
  if (mergeM && !/\[miya-ordered-remerge:\s*[^\]]+\]/i.test(turn)) {
    const branch = mergeM[1];
    const env = (cmd.match(/\bmlk\/(int-env|stag-env|training)\b/i) || [])[1];
    for (const e of env ? [env] : ['int-env', 'stag-env']) {
      const log = git(`log --first-parent --since=midnight --format=%s origin/mlk/${e}`, dir);
      if (log && log.split('\n').some(s => s.includes(branch))) return { block: true, kind: 're-merge', detail: `${branch} already merged into mlk/${e} today` };
    }
  }
  const pushM = cmd.match(/\bgit\s+push\b[^;&|]*?\b(mlk\/(?:esokongan|internal|qa|cr|requirement)\/\d+(?:v\d+)?)\b/i);
  if (pushM && !/\[miya-ordered-multi-commit:\s*[^\]]+\]/i.test(turn)) {
    const branch = pushM[1];
    const n = git(`rev-list --no-merges --count --since=midnight ${branch}`, dir);
    if (n && parseInt(n, 10) > 1) return { block: true, kind: 'multi-commit', detail: `${branch} carries ${n} non-merge commits made today` };
  }
  return { block: false };
}

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// his-words: not an approval reader — finds the current turn start to scope the assistant bypass token
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
    'revert': 'a revert of a pushed ticket commit runs on his order only, never on a question; add [miya-ordered-revert: <his words>] with a CLOSES: line naming the writer that commit closed and why it is no longer one',
    're-merge': 'the same ticket branch goes into an env branch ONCE per test round; a failed round means a new Writers table first, then [miya-ordered-remerge: <his words>]',
    'multi-commit': 'a ticket branch carries ONE non-merge commit per cycle; squash the failed attempts before the push (reset --soft to the master merge, one commit), or [miya-ordered-multi-commit: <his words>]',
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
    // v2: order tokens are read from HIS messages only (lib/his-words.js), never from the assistant turn.
    let his = '';
    try { his = require(path.join(ROOT, 'lib', 'his-words.js')).hisMessages(data.transcript_path || '', { limit: 8 }).map(m => m.text).join('\n'); } catch (_) { his = ''; }
    let d = decide(cmd, turn, his);
    if (!d.block && !d.bypass && !d.tool) d = liveDecide(cmd, data.cwd || process.cwd(), his);
    if (!d.block) { if (d.bypass) log({ action: 'bypass', cmd: cmd.slice(0, 120) }); return { fired: false }; }
    log({ action: 'blocked', kind: d.kind, detail: d.detail || null, cmd: cmd.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: blockMsg(d.kind) + (d.detail ? `\n   Detail: ${d.detail}` : '') };
  });
}

module.exports = { decide, liveDecide, ETANAH_CTX };
