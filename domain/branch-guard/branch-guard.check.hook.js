#!/usr/bin/env node
// branch-guard.check.hook.js — born via core/forge.js (2026-08-13)
// TRIGGER: Edit/Write on an etanah repo source file
// ACTION: block if the repo current branch is not its trunk base (mlk/master; spoc-hasil=master), unless [skip-branch-check:]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

const ETANAH_REPO_RX = /^(.*[\\/]etanah-(?:pelupusan|awam|common|spoc-hasil|teknikal))[\\/]/i;

function repoOf(fp) {
  const m = String(fp || '').match(ETANAH_REPO_RX);
  return m ? m[1] : null;
}
function expectedBranch(repo) {
  return /etanah-spoc-hasil/i.test(String(repo)) ? 'master' : 'mlk/master';
}
// Pure decision — branch supplied by caller so it is unit-testable without live git.
function decide(fp, branch, turnText) {
  const repo = repoOf(fp);
  if (!repo) return { block: false };
  if (/\[skip-branch-check:\s*[^\]]+\]/i.test(turnText || '')) return { block: false, bypass: true, repo };
  const expected = expectedBranch(repo);
  if (branch === expected) return { block: false, repo, branch };
  return { block: true, repo, branch, expected };
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

function blockMsg(repo, branch, expected) {
  return [
    `⛔ branch-guard: ${repo}`,
    `   is on branch '${branch}', NOT '${expected}' (this repo's trunk base).`,
    `   Code edits must land on the trunk base so みや's local server runs the edited code —`,
    `   editing on a ticket / int-env / stag branch is how a fix lands where the build never sees it`,
    `   (QA-274745: the fix first landed on mlk/int-env, 845 commits off master, and blocked the switch).`,
    ``,
    `   Switch first (carry WIP if the tree is dirty):`,
    `     git -C "${repo}" stash push -m "wip"`,
    `     git -C "${repo}" checkout ${expected}`,
    `     git -C "${repo}" stash pop`,
    ``,
    `   Intentionally editing on '${branch}'? add [skip-branch-check: <reason>] to your message.`,
  ].join('\n');
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'branch-guard', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const fp = String((data.tool_input || {}).file_path || '');
    const repo = repoOf(fp);
    if (!repo) return { fired: false };
    const turn = lastAssistantTurn(data.transcript_path || '');
    let branch = '';
    try { branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repo, encoding: 'utf8' }).trim(); }
    catch (_) { return { fired: false }; }
    const d = decide(fp, branch, turn);
    if (!d.block) { log({ action: d.bypass ? 'bypass' : 'pass', repo, branch }); return { fired: false }; }
    log({ action: 'blocked', repo, branch, expected: d.expected });
    return { fired: true, blocked: true, blockReason: blockMsg(repo, branch, d.expected) };
  });
}

module.exports = { repoOf, expectedBranch, decide, ETANAH_REPO_RX };
