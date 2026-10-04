#!/usr/bin/env node
// save-quest — born via forge (2026-10-04)
// symptom: 2026-10-04 miya: when I say save this quest, you will automatically decide based on redmine status to simply close (phase 1) or if the status is Closed in Redmine, it is time for us to Archive so we will run Phase 2
// goal: a quest is closed or archived in step with its live Redmine status, with no stage question to miya
// goal_signal: the reply to save this quest carries the SAVE-QUEST verdict line and the matching stage ran
// retention: keep
// footprint: on-demand: 1 node process per call, one HTTP GET to Redmine with a 6 s timeout, about 1 second; nothing running otherwise
//
// "save this quest" resolver. Reads the LIVE Redmine status of the quest's ticket and the quest's
// local status, then prints ONE verdict line. What to do for each verdict lives in
// .claude/skills/close-phase/SKILL.md "Save-quest mode". This script decides; it never moves,
// closes or writes a quest, and it never writes to Redmine.
//
// USAGE: node lib/save-quest.js <QA-id | ticket number> [--json] [--root <memorycore root>]
//   eval-only flags: --redmine-json <file with {"issue":{...}}> · --offline (Redmine unreachable)
// Exit 0 = a verdict was printed · 2 = usage error.
// Log: <main root>/domain/save-quest/log.jsonl, one row per run (ts, qa, redmine, local, verdict, dur_ms).
// state-scoped: no. One Redmine instance serves every state; a ticket number is unique on it, and the
//   local block is found by that number whatever its state= says. Host, key and owner id have one home:
//   quest/redmine-status-check.js.
'use strict';
const fs = require('fs');
const path = require('path');

// Redmine statuses with is_closed = true. Read from /redmine/issue_statuses.json on 2026-10-04.
const TERMINAL = new Set(['Closed', 'Cancelled', 'Acknowledged']);
// Statuses where a developer is still expected to act on the ticket.
const DEV_IN_WORK = new Set(['New', 'Open', 'In Progress', 'Developing', 'Development', 'Reopened', 'Rework', 'Rework (Requirement Update)']);
const LOCAL_OPEN = new Set(['active', 'hold', 'blocked']);

const NEXT = {
  'UNKNOWN': 'Redmine did not answer. Save the quest doc only. Change no stage. Say the status is not verified.',
  'NO-BLOCK': 'No local quest block for this ticket. Nothing to save. Retrieve it first if it is yours.',
  'ADHOC': 'No Redmine ticket number. Save it with the adhoc-save skill.',
  'DONE': 'Already archived and Redmine is closed. Nothing to move. Note the Redmine close in the quest doc.',
  'LEARN-THEN-PHASE-2': 'A colleague closed it. Run /learn-from-fix first, then Phase 2 archive.',
  'PHASE-2': 'Redmine is closed. Run Phase 2 archive.',
  'PHASE-2+1': 'Redmine is closed and the quest is still open locally. Run the Phase 1 close-out, then Phase 2 archive, in the same pass.',
  'AHEAD': 'Archived locally but Redmine is still open. Nothing to undo. If Redmine reopened it, run /quest resume.',
  'KEEP-DELEGATED': 'A colleague holds it and Redmine is open. Save the quest doc, keep the block as status=delegated, do not close.',
  'WAIT': 'Phase 1 is already done. Archive waits until Redmine shows Closed.',
  'PHASE-1': 'Redmine is not closed. Run the Phase 1 close-out only. Do not archive.',
  'PHASE-1-IN-WORK': 'Redmine is not closed and still shows the ticket in work. Run the Phase 1 close-out only when the fix is finished and delivered; otherwise the save ends after the quest doc. Do not archive.',
};

// Pure decision. local = the block's status string, or null when no block exists.
// r = { status, assigneeId } from Redmine, or null when Redmine is unreachable.
function decide(local, r, ownerId) {
  const out = (verdict, key) => ({ verdict, next: NEXT[key || verdict] });
  if (!r || !r.status) return out('UNKNOWN');
  if (local === null || local === undefined) return out('NO-BLOCK');   // a block with a blank status counts as open
  const st = String(local).trim().toLowerCase();
  const terminal = TERMINAL.has(r.status);
  if (terminal) {
    if (st === 'archived') return out('DONE');
    if (st === 'delegated') return out('LEARN-THEN-PHASE-2');
    if (st === 'closed') return out('PHASE-2');
    return { ...out('PHASE-2', 'PHASE-2+1'), phase1First: true };
  }
  if (st === 'archived') return out('AHEAD');
  if (st === 'delegated') return out('KEEP-DELEGATED');
  const inWork = DEV_IN_WORK.has(r.status);
  const reassigned = r.assigneeId != null && ownerId != null && r.assigneeId !== ownerId;
  if (inWork && reassigned) return out('KEEP-DELEGATED');
  if (st === 'closed') return out('WAIT');
  return inWork ? { ...out('PHASE-1', 'PHASE-1-IN-WORK'), inWork: true } : out('PHASE-1');
}

function parseBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m && m[1] === 'qa') { cur = { qa: m[2].trim() }; blocks.push(cur); continue; }
    if (!line.trim()) { cur = null; continue; }
    if (m && cur) cur[m[1]] = m[2].trim();
  }
  return blocks;
}

const numOf = s => (String(s).match(/(\d{5,})/) || [])[1] || null;

// active.txt wins (an open block beats any archived cycle); in the archive the LAST block is the newest.
function findLocal(mainRoot, arg) {
  const num = numOf(arg);
  const same = b => (num ? numOf(b.qa) === num : b.qa.toLowerCase() === String(arg).toLowerCase());
  const read = f => { try { return fs.readFileSync(path.join(mainRoot, 'quest', f), 'utf8'); } catch (_) { return ''; } };
  const live = parseBlocks(read('active.txt')).filter(same);
  if (live.length) return { ...live[0], file: 'active.txt' };
  const old = parseBlocks(read('active-archive.txt')).filter(same);
  if (old.length) return { ...old[old.length - 1], file: 'active-archive.txt' };
  return null;
}

function arg(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; }
const has = n => process.argv.includes('--' + n);

async function main() {
  const t0 = Date.now();
  const target = process.argv[2];
  if (!target || target.startsWith('--')) {
    console.error('usage: node lib/save-quest.js <QA-id | ticket number> [--json] [--root <memorycore root>]');
    process.exit(2);
  }
  const root = arg('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
  let mainRoot = root;
  if (!arg('root')) { try { mainRoot = require(path.join(__dirname, 'states.js')).mainRoot(root); } catch (_) { mainRoot = root; } }

  const rsc = require(path.join(__dirname, '..', 'quest', 'redmine-status-check.js'));
  const num = numOf(target);
  const block = findLocal(mainRoot, target);
  const qa = block ? block.qa : (num ? 'QA-' + num : target);
  const local = block ? (block.status || '') : null;

  let r = null;
  let res;
  if (!num) {
    res = { verdict: 'ADHOC', next: NEXT.ADHOC };
  } else {
    if (has('offline')) r = null;
    else if (arg('redmine-json')) {
      try { const i = JSON.parse(fs.readFileSync(arg('redmine-json'), 'utf8')).issue; r = i ? rsc.toResult(num, i) : null; } catch (_) { r = null; }
    } else r = await rsc.fetchIssue(num);
    res = decide(local, r, rsc.OWNER_ID);
  }

  const row = {
    qa, num, verdict: res.verdict, phase1First: !!res.phase1First, inWork: !!res.inWork,
    redmine: r ? { status: r.status, assignee: r.assignee, assigneeId: r.assigneeId, done: r.done } : null,
    local, localFile: block ? block.file : null, next: res.next,
  };
  try {
    const dir = path.join(mainRoot, 'domain', 'save-quest');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), qa, redmine: r ? r.status : null, local, verdict: res.verdict, dur_ms: Date.now() - t0 }) + '\n');
  } catch (_) { /* a log failure never hides the verdict */ }

  if (has('json')) { console.log(JSON.stringify(row)); return; }
  const red = !num ? 'no ticket number' : (r ? `${r.status} (${r.assignee} · ${r.done}%)` : 'UNREACHABLE');
  const tag = res.verdict + (res.phase1First ? ' (Phase 1 first)' : '');
  console.log(`SAVE-QUEST: ${qa} · Redmine = ${red} · local = ${local === null ? 'no block' : (local || 'blank')} → ${tag}`);
  console.log('   ' + res.next);
}

if (require.main === module) main().catch(e => { console.error('save-quest: ' + e.message); process.exit(2); });

module.exports = { decide, parseBlocks, findLocal, numOf, TERMINAL, DEV_IN_WORK, NEXT };
