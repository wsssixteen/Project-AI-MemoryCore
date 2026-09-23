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
//
// v1.2 (2026-09-22, C10): decide(command, turnText, ctx) — ctx = {currentBranch, envAncestry, state}
// supplied by the hook (pure decide stays unit-testable). Repo for ctx resolution = CD/-C path
// resolved against data.cwd, else data.cwd when inside an ETANAH_REPO; names come from
// lib/states.js. Three new kinds:
//   (a) branch-from-env    — `checkout -b|switch -c|branch <name> [<start>]` where the start point
//                            (explicit or, absent, ctx.currentBranch) is an env branch.
//   (b) commit-branch-name — at commit, ctx.currentBranch matches neither the state's ticket_branch
//                            pattern nor `<prefix>/release/\d+(\.\d+)*`.
//   (c) commit-off-env-ancestry — at commit, HEAD carries history from an env branch that is not
//                            an ancestor of the trunk (ctx.envAncestry[env] === false).
// Bypass for (a)(b)(c) ONLY via [miya-approved-branch: <reason>] — the generic [skip-deploy-guard:]
// does NOT cover them. When ctx cannot be resolved (no git / no state match), these three do not
// fire and a `no-ctx` row is logged instead.
// WHY (C10): causes 1 + 5 — no gate inspected branch start-point or ancestry; v2
// (mlk/esokongan/280540v2, cut from the CR merge) and v3 (intenvfix-280540, `checkout -b` while ON
// int-env) shipped with only the free-text branch-guard bypass. (a) catches the explicit and the
// on-env implicit start; (b) catches the name drift at the moment it becomes a commit; (c) is the
// ancestry belt for any route the regexes miss.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');
const states = require(fs.existsSync(path.join(ROOT, 'lib', 'states.js')) ? path.join(ROOT, 'lib', 'states.js') : path.join(__dirname, '..', '..', 'lib', 'states.js'));
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));   // missing since birth: every fire threw ReferenceError (found 2026-09-08 audit)

// company-branch / etanah-repo context — MemoryCore (main) never trips this
const ETANAH_CTX = /etanah-(?:pelupusan|awam|common|spoc-hasil|teknikal)|\bmlk\/(?:master|int-env|stag-env|release|esokongan|training|internal|qa|cr)/i;
const ETANAH_REPO_DIR_RX = /^(.*[\\/]etanah-(?:pelupusan|awam|common|spoc-hasil|awam-spoc-hasil|teknikal))(?:[\\/]|$)/i;

function stripOrigin(b) { return String(b || '').replace(/^origin\//, ''); }
function escRe(s) { return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Resolve a state record from explicit ctx.state, else by scanning `text` for a registered
// branch_prefix ("mlk/…") or a module repo name ("etanah-pelupusan"). Pure — data.all()/get() are
// static registry lookups, not live git.
function resolveState(text, ctx) {
  if (ctx && ctx.state) {
    const s = states.get(ctx.state);
    if (s) return s;
  }
  const all = states.all();
  for (const s of Object.values(all)) {
    if (s.branch_prefix && new RegExp('\\b' + escRe(s.branch_prefix) + '\\/').test(text)) return s;
  }
  for (const s of Object.values(all)) {
    if (!s.modules) continue;
    for (const m of Object.values(s.modules)) {
      if (m.repo && new RegExp('\\b' + escRe(m.repo) + '\\b', 'i').test(text)) return s;
    }
  }
  return null;
}

// (a) branch-from-env — new branch cut from (or, with no explicit start, currently sitting on) an
// env branch. `checkout -b <name> [<start>]` / `switch -c <name> [<start>]` / `branch <name> [<start>]`.
function checkBranchFromEnv(cmd, ctx) {
  // v1.2.1 (finding B): tokenize the invocation — option flags are never the branch name, and only the
  // CREATE forms fire: `checkout -b|-B <name> [<start>]`, `switch -c|-C <name> [<start>]`, `branch <name>
  // [<start>]`. `branch --show-current` / `branch -D x` / `branch -r|-a|-v|--list` / plain `checkout <x>`
  // never fire.
  const gm = /\bgit\s+((?:checkout|switch|branch)\b[^&|;]*)/i.exec(cmd);
  if (!gm) return null;
  const toks = gm[1].trim().split(/\s+/);
  const sub = toks[0].toLowerCase();
  let name = null, start = null;
  if (sub === 'checkout' || sub === 'switch') {
    const createFlag = sub === 'checkout' ? /^-[bB]$/ : /^-[cC]$/;
    const args = toks.slice(1);
    const fi = args.findIndex(t => createFlag.test(t));
    if (fi < 0) return null;
    const rest = args.slice(fi + 1).filter(t => !t.startsWith('-'));
    name = rest[0] || null;
    start = rest[1] || null;
  } else {
    const args = toks.slice(1);
    if (!args.length || args[0].startsWith('-')) return null;
    name = args[0];
    start = args[1] && !args[1].startsWith('-') ? args[1] : null;
  }
  if (!name) return null;
  if (!start) start = ctx && ctx.currentBranch;
  // v1.2.2: `checkout -B mlk/int-env origin/mlk/int-env` refreshes the local env copy before a deploy merge — not new work.
  if (start && stripOrigin(name) === stripOrigin(start)) return null;
  if (!start) return { noCtx: true, kind: 'branch-from-env' };
  const st = resolveState(cmd + ' ' + start, ctx);
  if (!st || !Array.isArray(st.env_branches)) return null;
  if (st.env_branches.map(stripOrigin).includes(stripOrigin(start))) {
    const trunk = st.modules ? (Object.values(st.modules)[0] || {}).trunk : null;
    return { block: true, kind: 'branch-from-env', state: st.key, start, trunk, ticketBranch: st.ticket_branch };
  }
  return null;
}

// (b) commit-branch-name — commit whose current branch is neither the ticket_branch shape nor a
// release branch (<prefix>/release/N[.N…]).
function checkCommitBranchName(cmd, ctx) {
  if (!/\bgit\b[^&|;]*\bcommit\b/i.test(cmd)) return null;
  if (!ctx || !ctx.currentBranch) return { noCtx: true, kind: 'commit-branch-name' };
  const br = ctx.currentBranch;
  const st = resolveState(cmd + ' ' + br, ctx);
  if (!st) return null;
  const ticketRx = st.ticket_branch
    ? new RegExp('^' + escRe(st.ticket_branch).replace('<tracker>', '[a-z]+').replace('<num>', '\\d+') + '$')
    : null;
  const releaseRx = st.branch_prefix ? new RegExp('^' + escRe(st.branch_prefix) + '\\/release\\/\\d+(?:\\.\\d+)*$') : null;
  const okTicket = ticketRx && ticketRx.test(br);
  const okRelease = releaseRx && releaseRx.test(br);
  if (okTicket || okRelease) return null;
  return { block: true, kind: 'commit-branch-name', state: st.key, branch: br, ticketBranch: st.ticket_branch };
}

// (c) commit-off-env-ancestry — HEAD carries history from an env branch the hook already checked
// (via merge-base + is-ancestor) is NOT an ancestor of the trunk.
function checkEnvAncestry(cmd, ctx) {
  if (!/\bgit\b[^&|;]*\bcommit\b/i.test(cmd)) return null;
  if (!ctx || !ctx.envAncestry) return { noCtx: true, kind: 'commit-off-env-ancestry' };
  for (const [env, isAncestor] of Object.entries(ctx.envAncestry)) {
    if (isAncestor === false) return { block: true, kind: 'commit-off-env-ancestry', env };
  }
  return null;
}

// v1.2.1 (2026-09-23, reviewer findings A/B/C on v1.2): (A) envAncestryFor() — HEAD is off-env only when
//   it CONTAINS an env first-parent commit absent from trunk; the v1.2 merge-base rule blocked a legit
//   ticket branch the moment int-env merged it. (B) checkBranchFromEnv tokenizes the invocation — flags
//   are never the branch name; only -b/-B, -c/-C and bare `branch <name>` create; listing/delete forms
//   never fire. (C) no-ctx rows are logged only when the command is in etanah context.
//   Spec preservation: v1.2 kinds (a)(b)(c), the [miya-approved-branch:] bypass and the generic
//   [skip-deploy-guard:] non-coverage are unchanged; v1.0-v1.1 cherry-pick/auto-resolve/force-push/
//   reset-hard rules untouched. Caught by the real-git fixture: `^ref` is eaten by cmd.exe under
//   execSync on Windows — rev-list exclusions use `--not` (never `^`) in this file.
// Pure decision — unit-testable without live git.
function decide(command, turnText, ctx) {
  const cmd = String(command || '');
  if (!/\bgit\b/.test(cmd)) return { block: false };
  const turn = turnText || '';
  const approvalMatch = /\[miya-approved-branch:\s*([^\]]+)\]/i.exec(turn);
  const genericSkip = /\[skip-deploy-guard:\s*[^\]]+\]/i.test(turn) || /\[skip-deploy-guard:\s*[^\]]+\]/i.test(cmd);

  // New kinds (a)/(b)/(c) — checked BEFORE the generic skip token, which does NOT cover them.
  const newResult = checkBranchFromEnv(cmd, ctx) || checkCommitBranchName(cmd, ctx) || checkEnvAncestry(cmd, ctx);
  if (newResult && newResult.block) {
    if (approvalMatch) return { block: false, bypass: true, kind: newResult.kind, reason: approvalMatch[1].trim() };
    return newResult;
  }
  const noCtxKind = newResult && newResult.noCtx && ETANAH_CTX.test(cmd) ? newResult.kind : undefined;

  if (genericSkip) return { block: false, bypass: true, noCtx: noCtxKind };
  if (!ETANAH_CTX.test(cmd)) return { block: false, noCtx: noCtxKind };

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
  return { block: false, noCtx: noCtxKind };
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

// Resolve the repo dir for ctx purposes: a `cd <path>` / `git -C <path>` in the command, resolved
// against data.cwd, else data.cwd itself when it is already inside an ETANAH_REPO.
function repoFromCmdOrCwd(cmd, cwd) {
  const m = cmd.match(/\bcd\s+["']?([^"'&|;]+?)["']?(?=\s|&&|$)/i) || cmd.match(/git\s+-C\s+["']?([^"'&|;]+?)["']?(?=\s|&&|$)/i);
  const raw = m ? path.resolve(cwd || '', m[1]) : cwd;
  if (!raw) return null;
  const mm = String(raw).match(ETANAH_REPO_DIR_RX);
  return mm ? mm[1] : null;
}

// v1.2.1 (finding A): HEAD is "off env ancestry" only when it CONTAINS one of the env branch's own
// first-parent commits that are not on the trunk. Env merges are --no-ff, so a ticket branch merged
// INTO env never contains env's first-parent commits (its own commits sit on env's second-parent side)
// and keeps passing after the merge; a branch cut FROM env, or one that merged env in, contains such a
// commit and blocks. Bounded: env-only first-parent commits ∩ HEAD-not-on-trunk (tens, not thousands).
// Returns true = fine, false = block. Throws when a ref is not fetched (caller skips, not a verdict).
// `--not <ref>` instead of `^<ref>`: execSync runs through cmd.exe on Windows, where `^` is the escape
// character and silently vanishes — the exclusion was lost and every commit looked off-env.
function envAncestryFor(repo, env, trunk) {
  const envOnly = execSync(`git rev-list --first-parent origin/${env} --not origin/${trunk}`, { cwd: repo, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean);
  if (!envOnly.length) return true;
  const mine = new Set(execSync(`git rev-list HEAD --not origin/${trunk}`, { cwd: repo, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean));
  return !envOnly.some(c => mine.has(c));
}

// Build ctx (currentBranch / envAncestry / state) from live git. Best-effort — any failure leaves
// the corresponding field unset, which decide() treats as "cannot fire, log no-ctx".
function buildCtx(cmd, cwd) {
  const ctx = {};
  const repo = repoFromCmdOrCwd(cmd, cwd);
  if (!repo) return ctx;
  const tf = states.trunkForRepo(repo);
  if (tf) ctx.state = tf.state;
  try { ctx.currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repo, encoding: 'utf8' }).trim(); } catch (_) { /* not a git repo / no HEAD */ }
  if (tf && ctx.currentBranch && /\bgit\b[^&|;]*\bcommit\b/i.test(cmd)) {
    const st = states.get(tf.state);
    if (st && Array.isArray(st.env_branches) && tf.trunk) {
      ctx.envAncestry = {};
      for (const env of st.env_branches) {
        try { ctx.envAncestry[env] = envAncestryFor(repo, env, tf.trunk); }
        catch (_) { /* env branch not fetched locally — skip, not a verdict */ }
      }
      if (!Object.keys(ctx.envAncestry).length) delete ctx.envAncestry;
    }
  }
  return ctx;
}

function blockMsg(kind, info) {
  info = info || {};
  if (kind === 'branch-from-env') {
    return [
      `⛔ deploy-guard: branching from env branch '${info.start}' is BANNED — int-env / stag-env are never a base for new work.`,
      `   branch from origin/${info.trunk || '<trunk>'}, name it ${info.ticketBranch || '<prefix>/<tracker>/<num>'}`,
      ``,
      `   Genuinely intended (hotfix on env, miya-approved)? add [miya-approved-branch: <reason>].`,
    ].join('\n');
  }
  if (kind === 'commit-branch-name') {
    return [
      `⛔ deploy-guard: commit is on branch '${info.branch}', which matches neither its ticket-branch shape (${info.ticketBranch || '<prefix>/<tracker>/<num>'}) nor a release branch.`,
      `   Branch names drift silently into env/local-fix shapes — commit on the correct ticket branch,`,
      `   or if this is intentional add [miya-approved-branch: <reason>].`,
    ].join('\n');
  }
  if (kind === 'commit-off-env-ancestry') {
    return [
      `⛔ deploy-guard: HEAD carries history from env branch '${info.env}' that is NOT an ancestor of the trunk —`,
      `   this branch was cut from an env branch, not from the trunk, even though its name looks like a ticket branch.`,
      `   Re-branch from origin/<trunk>, or if this is a confirmed hotfix add [miya-approved-branch: <reason>].`,
    ].join('\n');
  }
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
    let ctx = {};
    try { ctx = buildCtx(cmd, data.cwd); } catch (_) { ctx = {}; }
    const d = decide(cmd, turn, ctx);
    if (!d.block) {
      if (d.bypass) log({ action: 'bypass', kind: d.kind, reason: d.reason, cmd: cmd.slice(0, 120) });
      else if (d.noCtx) log({ action: 'no-ctx', kind: d.noCtx, cmd: cmd.slice(0, 120) });
      return { fired: false };
    }
    log({ action: 'blocked', kind: d.kind, cmd: cmd.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: blockMsg(d.kind, d) };
  });
}

module.exports = { decide, ETANAH_CTX, envAncestryFor };
