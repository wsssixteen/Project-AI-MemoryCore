#!/usr/bin/env node
// quest-start-claim — born via forge (2026-10-07)
// symptom: 2026-10-07 miya: add a background run during start quest; straight away update the ticket Status as In progress IF the status is New, to avoid people stealing our tickets by mistake
// goal: no ticket whose quest has started is still New on the ticket board
// goal_signal: the log row for the started ticket reads set, or no-change because it was already past New
// retention: keep
// footprint: on-demand: 1 detached node process per quest start, 2 to 3 HTTP calls with a 6 s timeout, about 1 second, nothing running otherwise
//
// When work on a ticket begins, its Redmine status goes from New to In Progress. Status only:
// this script sends one field and nothing else, ever. quest/active-cli.js starts it in a detached
// background process the moment a block becomes status=active with a quest_start stamp, so the
// quest never waits on the network.
//
// Three guards, all must hold before anything is sent:
//   1. the ticket has a block in quest/active.txt with status=active and a quest_start stamp
//      (so it cannot fire at retrieval or in a multi-ticket sweep, only on a ticket he started)
//   2. the live Redmine status is New
//   3. the ticket is assigned to the owner (a colleague's or an unassigned ticket is never touched)
// Opt out for one ticket: node quest/active-cli.js update <QA> redmine_claim=off
//
// USAGE: node lib/quest-start-claim.js <QA-id | ticket number> [--dry-run] [--json] [--root <memorycore root>]
//        node lib/quest-start-claim.js --result <QA-id | ticket number>      the last recorded run for that ticket
//   eval-only: env QUEST_CLAIM_HOST / QUEST_CLAIM_PORT (a local stub server) · QUEST_CLAIM_RETRY_MS · QUEST_CLAIM_ROOT
// Exit 0 = an outcome was recorded and printed · 2 = usage error.
// Log: <main root>/domain/quest-start-claim/log.jsonl, one row per run
//      (ts, qa, num, outcome, from, to, http, assignee, dry, dur_ms). A real change also adds one
//      row to <main root>/domain/redmine-write-gate/log.jsonl, the ledger of every Redmine write.
// Approval: miya's standing instruction of 2026-10-07 covers this one change. Every other Redmine
//   write still goes through domain/redmine-write-gate and .claude/auto-memory/feedback_redmine_write_needs_nod.md.
// state-scoped: no. One Redmine instance serves every state. Host, key and owner id have one home:
//   quest/redmine-status-check.js.
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');

// Read from /redmine/issue_statuses.json on 2026-10-07.
const NEW_ID = 1;
const IN_PROGRESS_ID = 2;
const TIMEOUT_MS = 6000;
const STANDING = 'standing: miya 2026-10-07, quest start, New to In Progress, status only';

function arg(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; }
const has = n => process.argv.includes('--' + n);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Guard 1. Returns the skip outcome, or null when the quest has really started.
function blockGuard(block) {
  if (!block) return 'skipped-no-block';
  if (String(block.redmine_claim || '').trim().toLowerCase() === 'off') return 'skipped-opt-out';   // his "leave Redmine alone on this one"
  const started = String(block.status || '').trim().toLowerCase() === 'active' && String(block.quest_start || '').trim() !== '';
  return started ? null : 'skipped-not-started';
}

// Guards 2 and 3. Returns the outcome that stops the change, or null when it may be sent.
function issueGuard(issue, ownerId) {
  if (!issue || !issue.status || issue.status.id !== NEW_ID) return 'no-change';
  if (!issue.assigned_to || issue.assigned_to.id !== ownerId) return 'skipped-not-mine';
  return null;
}

// One HTTP call. Resolves { code, body }, or null when the server did not answer.
function call(cfg, method, pathname, payload) {
  return new Promise(resolve => {
    const data = payload ? JSON.stringify(payload) : null;
    const headers = { 'X-Redmine-API-Key': cfg.key };
    if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    const req = http.request({ host: cfg.host, port: cfg.port, path: pathname, method, headers, timeout: TIMEOUT_MS }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ code: res.statusCode, body }));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    if (data) req.write(data);
    req.end();
  });
}

function issueOf(r) {
  if (!r || r.code !== 200) return null;
  try { return JSON.parse(r.body).issue || null; } catch (_) { return null; }
}

const SAY = {
  'set': r => `New → ${r.to} (set)`,
  'would-set': () => 'is New and yours: In Progress would be set (dry run, nothing sent)',
  'no-change': r => `is already ${r.from || 'past New'}: nothing sent`,
  'skipped-not-mine': r => `is New but assigned to ${r.assignee || 'nobody'}: nothing sent`,
  'skipped-not-started': () => 'has no started quest (the block needs status=active and a quest_start stamp): nothing sent',
  'skipped-no-block': () => 'has no block in quest/active.txt: nothing sent',
  'skipped-opt-out': () => 'has redmine_claim=off on its block: nothing sent',
  'skipped-no-number': () => 'no ticket number: nothing sent',
  'unreachable': r => `Redmine did not answer: nothing sent. Retry: node lib/quest-start-claim.js ${r.num}`,
  'failed': r => `Redmine refused the change (HTTP ${r.http})${r.detail ? ': ' + r.detail : ''}`,
  'failed-verify': r => `the change was sent but Redmine still shows ${r.to || 'an unreadable status'}`,
};
function line(r) {
  const what = (SAY[r.outcome] || (() => r.outcome))(r);
  return `QUEST-START-CLAIM: ${r.num ? '#' + r.num : r.qa} ${what}`;
}

function logPath(mainRoot) { return path.join(mainRoot, 'domain', 'quest-start-claim', 'log.jsonl'); }

function lastResult(mainRoot, num) {
  let rows = [];
  try { rows = fs.readFileSync(logPath(mainRoot), 'utf8').split('\n').filter(Boolean); } catch (_) { return null; }
  for (let i = rows.length - 1; i >= 0; i--) {
    try { const r = JSON.parse(rows[i]); if (String(r.num) === String(num)) return r; } catch (_) { /* skip a damaged row */ }
  }
  return null;
}

async function main() {
  const t0 = Date.now();
  const sq = require(path.join(__dirname, 'save-quest.js'));              // parseBlocks + numOf: one parser for active.txt
  const rsc = require(path.join(__dirname, '..', 'quest', 'redmine-status-check.js'));
  const fixedRoot = arg('root') || process.env.QUEST_CLAIM_ROOT;   // eval-only: a fixture root, used as given
  const root = fixedRoot || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
  let mainRoot = root;
  if (!fixedRoot) { try { mainRoot = require(path.join(__dirname, 'states.js')).mainRoot(root); } catch (_) { mainRoot = root; } }

  if (has('result')) {
    const num = sq.numOf(arg('result'));
    if (!num) { console.error('usage: node lib/quest-start-claim.js --result <QA-id | ticket number>'); process.exit(2); }
    const r = lastResult(mainRoot, num);
    console.log(r ? line(r) + `  [${r.ts}]` : `QUEST-START-CLAIM: #${num} no run recorded`);
    return;
  }

  const target = process.argv[2];
  if (!target || target.startsWith('--')) {
    console.error('usage: node lib/quest-start-claim.js <QA-id | ticket number> [--dry-run] [--json] [--root <memorycore root>]');
    process.exit(2);
  }
  const dry = has('dry-run');
  const num = sq.numOf(target);
  const row = { qa: target, num, outcome: null, from: null, to: null, http: null, assignee: null, dry };

  if (!num) row.outcome = 'skipped-no-number';
  else {
    let text = '';
    try { text = fs.readFileSync(path.join(mainRoot, 'quest', 'active.txt'), 'utf8'); } catch (_) { text = ''; }
    const block = sq.parseBlocks(text).find(b => sq.numOf(b.qa) === num) || null;
    if (block) row.qa = block.qa;
    row.outcome = blockGuard(block);
  }

  if (!row.outcome) {
    const cfg = { host: process.env.QUEST_CLAIM_HOST || rsc.REDMINE_HOST, port: process.env.QUEST_CLAIM_PORT ? Number(process.env.QUEST_CLAIM_PORT) : 80, key: rsc.REDMINE_KEY };
    const issuePath = `/redmine/issues/${num}.json`;
    let r = await call(cfg, 'GET', issuePath);
    if (!r) { await sleep(Number(process.env.QUEST_CLAIM_RETRY_MS || 3000)); r = await call(cfg, 'GET', issuePath); }
    const issue = issueOf(r);
    if (!issue) { row.outcome = 'unreachable'; row.http = r ? r.code : 0; }
    else {
      row.from = issue.status ? issue.status.name : null;
      row.assignee = issue.assigned_to ? issue.assigned_to.name : null;
      row.outcome = issueGuard(issue, rsc.OWNER_ID);
      if (!row.outcome && dry) { row.outcome = 'would-set'; row.to = 'In Progress'; }
      else if (!row.outcome) {
        const w = await call(cfg, 'PUT', issuePath, { issue: { status_id: IN_PROGRESS_ID } });
        row.http = w ? w.code : 0;
        if (!w || w.code < 200 || w.code >= 300) { row.outcome = 'failed'; row.detail = w ? String(w.body || '').replace(/\s+/g, ' ').slice(0, 200) : 'no answer'; }
        else {
          const after = issueOf(await call(cfg, 'GET', issuePath));
          row.to = after && after.status ? after.status.name : null;
          row.outcome = after && after.status && after.status.id === IN_PROGRESS_ID ? 'set' : 'failed-verify';
        }
      }
    }
  }

  const ts = new Date().toISOString();
  try {
    fs.mkdirSync(path.dirname(logPath(mainRoot)), { recursive: true });
    fs.appendFileSync(logPath(mainRoot), JSON.stringify({ ts, ...row, dur_ms: Date.now() - t0 }) + '\n');
    const ledger = path.join(mainRoot, 'domain', 'redmine-write-gate');
    if (row.outcome === 'set' && fs.existsSync(ledger)) {
      fs.appendFileSync(path.join(ledger, 'log.jsonl'), JSON.stringify({ ts, outcome: 'allowed', surface: 'quest-start-claim', approval: STANDING, num }) + '\n');
    }
  } catch (_) { /* a log failure never hides the outcome */ }

  console.log(has('json') ? JSON.stringify({ ts, ...row }) : line(row));
}

if (require.main === module) main().catch(e => { console.error('quest-start-claim: ' + e.message); process.exit(2); });

module.exports = { blockGuard, issueGuard, line, lastResult, NEW_ID, IN_PROGRESS_ID, STANDING };
