#!/usr/bin/env node
// quest-exists-gate.check.hook.js — born via core/forge.js (2026-09-24)
// TRIGGER: git commit in an etanah repo whose message names #<ticket>
// ACTION: block unless quest/active.txt has a QA-<ticket> block with an existing task_folder, and the hotfix branch number matches the commit ticket
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// STATE-SCOPE: state-agnostic — the active.txt block + task_folder path carry the state; no literal state here.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
// active.txt is untracked and lives in the MAIN repo; a worktree session must read that copy.
const MAIN_ROOT = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const ACTIVE = path.join(MAIN_ROOT, 'quest', 'active.txt');

const ETANAH_REPO_RX = /((?:[A-Za-z]:|\/[A-Za-z])[\\/][^"';|&\r\n]*?[\\/]etanah-(?:pelupusan|awam|common|spoc-hasil|awam-spoc-hasil|teknikal))(?=[\\/"';\s]|$)/i;
// git [-C <dir>|-c k=v]... commit — the subcommand itself, not 'git log --grep commit'
const COMMIT_RX = /\bgit(?:\s+-C\s+(?:"[^"]*"|'[^']*'|\S+)|\s+-c\s+\S+)*\s+commit\b/i;
// the ticket is the first #<5-7 digits> AFTER the word commit (covers -m "…", -m '…', heredoc bodies)
const TICKET_AFTER_COMMIT_RX = /\bcommit\b[\s\S]*?#\s?(\d{5,7})\b/i;
const HOTFIX_BRANCH_RX = /(?:^|\/)hotfix\/(\d{5,7})\b/i;
// first reason char may not be '<' so the gate's own help text '[skip-quest-exists: <reason>]' never disarms it
const BYPASS_RX = /\[skip-quest-exists:\s*[^\]\s<][^\]]*\]/i;
const LOG = process.env.QEG_LOG || path.join(__dirname, 'log.jsonl'); // eval points QEG_LOG at a temp file
function log(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {} }
function toWinPath(p) { const m = String(p).match(/^\/([A-Za-z])\/(.*)$/); return m ? m[1] + ':/' + m[2] : p; }

function parseBlocks(text) {
  const blocks = {};
  for (const chunk of String(text || '').split(/\r?\n(?=qa=)/)) {
    const m = chunk.match(/^qa=([^\r\n]+)/m);
    if (!m) continue;
    const tf = chunk.match(/^task_folder=([^\r\n]+)/m);
    const st = chunk.match(/^status=([^\r\n]+)/m);
    blocks[m[1].trim()] = { task_folder: tf ? tf[1].trim() : '', status: st ? st[1].trim() : '' };
  }
  return blocks;
}

// Pure decision — inputs supplied so it is testable without git or the real active.txt.
function decide({ command, activeText, branch, folderExists, turnText }) {
  const cmd = String(command || '');
  if (!COMMIT_RX.test(cmd)) return { fire: false };
  const repo = (cmd.match(ETANAH_REPO_RX) || [])[1];
  if (!repo) return { fire: false };
  const t = (cmd.match(TICKET_AFTER_COMMIT_RX) || [])[1];
  if (!t) return { fire: false };
  if (BYPASS_RX.test(turnText || '') || BYPASS_RX.test(cmd)) return { fire: false, bypass: true, ticket: t };
  const hb = (String(branch || '').match(HOTFIX_BRANCH_RX) || [])[1];
  if (hb && hb !== t) {
    return { fire: true, block: true, ticket: t, repo, reason: `branch '${branch}' is the hotfix for #${hb} but the commit says #${t}. A hotfix commit carries the hotfix's OWN ticket number.` };
  }
  const blocks = parseBlocks(activeText);
  const b = blocks['QA-' + t];
  if (!b) {
    return { fire: true, block: true, ticket: t, repo, reason: `no quest block qa=QA-${t} in quest/active.txt. Run \`node quest/redmine-sync.js ${t}\` (creates the Task folder + block), then commit.` };
  }
  if (!b.task_folder || !folderExists(b.task_folder)) {
    return { fire: true, block: true, ticket: t, repo, reason: `QA-${t} has no existing task_folder ('${b.task_folder || 'empty'}'). Re-run \`node quest/redmine-sync.js ${t}\` or fix task_folder=.` };
  }
  if (/^archived$/i.test(b.status)) {
    return { fire: true, block: true, ticket: t, repo, reason: `QA-${t} is archived. New work on a released ticket is a HOTFIX: its own ticket number, its own quest, branch mlk/hotfix/<own #> (BRANCH-AND-DEPLOY.md §8).` };
  }
  return { fire: true, block: false, ticket: t, repo };
}

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
    if (Array.isArray(c)) { let s = ''; for (const x of c) { if (x && x.type === 'text' && x.text) s += x.text + '\n'; } text = s + text; }
  }
  return text;
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'quest-exists-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const command = String((data.tool_input || {}).command || '');
    if (!COMMIT_RX.test(command)) return { fired: false };
    const repo = (command.match(ETANAH_REPO_RX) || [])[1];
    if (!repo) return { fired: false };
    let branch = '';
    try { branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: toWinPath(repo), encoding: 'utf8', windowsHide: true }).trim(); } catch (_) {}
    let activeText = '';
    try { activeText = fs.readFileSync(ACTIVE, 'utf8'); } catch (_) {}
    const d = decide({ command, activeText, branch, folderExists: (p) => { try { return fs.existsSync(p); } catch (_) { return false; } }, turnText: lastAssistantTurn(data.transcript_path || '') });
    if (d.bypass) { log({ ticket: d.ticket, repo, branch, outcome: 'bypassed' }); return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-quest-exists' }; }
    if (!d.fire) return { fired: false };
    log({ ticket: d.ticket, repo, branch, outcome: d.block ? 'blocked' : 'pass', ...(d.block ? { reason: d.reason } : {}) });
    if (!d.block) return { fired: true, blocked: false };
    return {
      fired: true, blocked: true,
      blockReason: `⛔ quest-exists-gate: commit for #${d.ticket} in ${d.repo}\n   ${d.reason}\n   Genuinely intended? add [skip-quest-exists: <reason>] to your message.`,
    };
  });
}

module.exports = { decide, parseBlocks };
