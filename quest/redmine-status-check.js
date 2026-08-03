// redmine-status-check.js — shared Redmine-vs-active.txt truth check.
//
// WHY (2026-08-04, miya): active.txt is MY working memory and it rots; Redmine is the truth he
// lives in. On 2026-08-04 boot surfaced 4 quests that were Resolved/Closed or reassigned to
// someone else — he was shown other people's tickets as his open work.
//
// WHERE it fires — every point a quest's state is created, changed, or read out. One module,
// four call sites, no duplication:
//   quest/active-cli.js  cmdStart   — opening a quest on an already-closed/reassigned ticket
//   quest/active-cli.js  cmdUpdate  — status= changes (the primary capture-at-the-moment point)
//   quest/active-cli.js  cmdArchive — archiving something Redmine still shows open
//   .claude/hooks/open-quest-surfacer.js — catches drift caused outside these tools (~0.4s, measured)
//
// Report-only by contract: prints, never throws, never blocks a write. A network failure is
// silent — an unreachable Redmine must never stop miya from recording quest state.
'use strict';
const http = require('http');

const REDMINE_HOST = '172.16.90.169';
const REDMINE_KEY = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66';
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);
const DONE_ON_REDMINE = new Set(['Resolved', 'Closed', 'Rejected']);
const OWNER = 'Ahmad Ridhwan Anuar';

function fetchIssue(num) {
  return new Promise(resolve => {
    const req = http.get({
      host: REDMINE_HOST,
      path: `/redmine/issues/${num}.json`,
      headers: { 'X-Redmine-API-Key': REDMINE_KEY },
      timeout: 6000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const i = JSON.parse(d).issue;
          resolve(i ? { num, status: i.status && i.status.name, assignee: i.assigned_to ? i.assigned_to.name : 'NONE', done: i.done_ratio } : null);
        } catch (_) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

const numOf = qa => (String(qa).match(/(\d{5,})/) || [])[1];

// Returns 'diverged' | 'redmine-open' | 'ok' | 'unknown'
function classify(localStatus, r) {
  if (!r) return 'unknown';
  const staysOpen = OPEN_STATUSES.has(localStatus);
  const doneThere = DONE_ON_REDMINE.has(r.status);
  const reassigned = r.assignee !== OWNER && r.assignee !== 'NONE';
  if (staysOpen && (doneThere || reassigned)) return 'diverged';
  if (!staysOpen && !doneThere && !reassigned) return 'redmine-open';
  return 'ok';
}

// Single quest, at the moment its state changes. context = 'start' | 'update' | 'archive'
async function checkOne(qa, localStatus, context) {
  const num = numOf(qa);
  if (!num) return;
  const r = await fetchIssue(num);
  const verdict = classify(localStatus, r);
  if (verdict === 'diverged') {
    console.log(`🚨 REDMINE DIVERGENCE — ${qa} is '${localStatus}' locally but Redmine says: ${r.status} · ${r.assignee} · ${r.done}%`);
    console.log(`   Not miya's open work${context === 'start' ? ' — do not open a quest on it' : ' — close it instead'}.`);
  } else if (verdict === 'redmine-open' && context !== 'start') {
    console.log(`ℹ️  ${qa} is '${localStatus}' locally but Redmine still shows: ${r.status} · ${r.assignee} · ${r.done}% — update Redmine too.`);
  }
}

// All open quests at once (boot). Prints one summary line; silent-clean when everything agrees.
async function checkAll(quests) {
  if (!quests.length) return;
  const results = await Promise.all(quests.map(async q => ({ q, r: await fetchIssue(numOf(q.qa)) })));
  const diverged = results.filter(x => classify(x.q.status, x.r) === 'diverged');
  const unknown = results.filter(x => !x.r);
  if (diverged.length) {
    console.log(`🚨 REDMINE DIVERGENCE — ${diverged.length}/${quests.length} "open" quest(s) are NOT miya's work:`);
    for (const d of diverged) {
      console.log(`   ${d.q.qa}  local=${d.q.status}  →  Redmine: ${d.r.status} · ${d.r.assignee} · ${d.r.done}%`);
    }
    console.log(`   Close them: node quest/active-cli.js update <QA> status=closed closed=<date> close_note="RECONCILED from Redmine ..."`);
  }
  if (unknown.length) console.log(`   ⚠️  Redmine unreachable for ${unknown.length} quest(s) — status unverified (VPN/offline?)`);
}

module.exports = { checkOne, checkAll, OPEN_STATUSES };
