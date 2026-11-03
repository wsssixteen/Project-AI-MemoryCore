#!/usr/bin/env node
// status-rule.js — miya's standing rule for a Redmine status hand-back, as one function (born 2026-11-03).
//
// symptom: 2026-11-03, 287747 and 287638: the gate blocked Status = Resolved four times on his own In Progress tickets
//          and asked for "set status to Resolved"; his reply: "No more asking this part."
// goal: a status write to Resolved runs with no words from him whenever his rule says so; a status at or past Resolved
//       is never set back by me; everything else still needs his named order.
// goal_signal: log.jsonl rows `surface: browser-status, rule: <row>` and zero `why: no status order` rows on his own
//              lower-status tickets.
// retention: none (reads status-rule.json; writes nothing).
// footprint: one node process per status fill, ~40 MB, a 6 s Redmine GET at most.
// state-scoped: no (one Redmine host); the BA list is Melaka's today, the roster lookup covers every state.
//
// His rule (2026-11-03, verbatim shape): (1) the ticket is under me, (2) the status is New or In Progress → Resolved
// is set with no ask. (3) Under someone else but NEW → Resolved when sending back to a BA. (4) Verified, Closed,
// Ready in PROD (and Cancelled, Ruri's judgement: terminal like Closed) are never changed by me, whoever holds them:
// they have passed Resolved. Gaps he left open, resolved here: Open · Rework · KIV · Reviewing under him = lower
// statuses, same as In Progress (row 1); Rework or any non-New status under someone else = that person's work,
// blocked (row 3 is New only); Resolved itself is at Resolved, nothing to set (row 4).
//
// API (sync, none throws):
//   rule()                                  → the config object
//   isBA(name)                              → true when the name is in the config list or the roster class is BA/QA
//   verdict({ status, assignee, assigneeId, to, stagedAssignee })
//                                           → { allow, row, why }   row = 1 | 2 | 3 | 4 | 0 (no rule covers it)
//   liveState(num)                          → Promise<{ num, status, assignee, assigneeId } | null>  (6 s GET)
//   liveStateSync(num)                      → the same through a child process (the hook is sync); null when unreachable
// CLI:
//   node domain/redmine-write-gate/status-rule.js <num> [--to Resolved] [--assignee "<name>"]   prints the state + the verdict
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const CONFIG = path.join(__dirname, 'status-rule.json');

let _rule = null;
function rule() {
  if (_rule) return _rule;
  _rule = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  return _rule;
}
const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
// "Ahmad Ridhwan Anuar (Dev PLP)" and "Ahmad Ridhwan Anuar" are one person (lib/redmine-role.js loose()).
const loose = s => { let v = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); while (/\s*\([^()]*\)$/.test(v)) v = v.replace(/\s*\([^()]*\)$/, '').trim(); return v.toLowerCase(); };

function isBA(name) {
  const n = loose(name);
  if (!n) return false;
  const r = rule();
  if ((r.ba || []).some(b => loose(b.name) === n || norm(b.short) === n)) return true;
  try {
    const role = require(path.join(ROOT, 'lib', 'redmine-role.js')).roleOf(name, { state: 'melaka' });
    return (r.roster_classes || ['BA']).includes(role.cls);
  } catch (_) { return false; }
}
function isOwner(assignee, assigneeId) {
  const r = rule();
  if (assigneeId != null && String(assigneeId) === String(r.owner.id)) return true;
  return loose(assignee) === loose(r.owner.name);
}

// The one decision. `to` is the status the form sets; `stagedAssignee` is the Assignee already filled on the same
// form (row 3 needs a BA there, or the ticket already under a BA).
function verdict(s) {
  const r = rule();
  const status = String((s && s.status) || '').trim();
  const to = String((s && s.to) || '').trim();
  const frozen = r.frozen.map(norm), lower = r.lower.map(norm);
  if (!status) return { allow: false, row: 0, why: 'the live status is not known' };
  if (frozen.includes(norm(status))) return { allow: false, row: 4, why: `the ticket is ${status}: at or past Resolved, never set back` };
  if (norm(to) !== norm(r.handback_status)) return { allow: false, row: 0, why: `the rule covers a hand-back to ${r.handback_status} only; "${to}" needs his named order` };
  if (!lower.includes(norm(status))) return { allow: false, row: 0, why: `status "${status}" is not in the rule` };
  const mine = isOwner(s.assignee, s.assigneeId);
  if (mine) return { allow: true, row: norm(status) === 'new' || norm(status) === 'in progress' ? 2 : 1, why: `under ${r.owner.name}, status ${status}` };
  if (norm(status) !== 'new') return { allow: false, row: 3, why: `under ${s.assignee || 'nobody'} and ${status}: someone else's work (row 3 covers New only)` };
  if (isBA(s.assignee)) return { allow: true, row: 3, why: `New, already under BA ${s.assignee}` };
  if (s.stagedAssignee && isBA(s.stagedAssignee)) return { allow: true, row: 3, why: `New under ${s.assignee || 'nobody'}, sent back to BA ${s.stagedAssignee}` };
  return { allow: false, row: 3, why: `New under ${s.assignee || 'nobody'}: set the Assignee to a BA first (status-rule.json ba list), then the Status` };
}

// Live state. Evals and the skill's dry runs point REDMINE_GATE_TICKET_STATE at a JSON file { "<num>": { status, assignee, assigneeId } }.
async function liveState(num) {
  const n = String(num || '').match(/\d{5,}/);
  if (!n) return null;
  const fixture = process.env.REDMINE_GATE_TICKET_STATE;
  if (fixture) {
    try { const m = JSON.parse(fs.readFileSync(fixture, 'utf8')); const x = m[n[0]]; return x ? Object.assign({ num: n[0] }, x) : null; } catch (_) { return null; }
  }
  try {
    const rsc = require(path.join(ROOT, 'quest', 'redmine-status-check.js'));
    const r = await rsc.fetchIssue(n[0]);
    return r ? { num: n[0], status: r.status, assignee: r.assignee === 'NONE' ? null : r.assignee, assigneeId: r.assigneeId } : null;
  } catch (_) { return null; }
}
function liveStateSync(num) {
  const r = spawnSync(process.execPath, [__filename, String(num), '--json'], { encoding: 'utf8', timeout: 15000, env: process.env });
  try { const o = JSON.parse(String(r.stdout || '').trim()); return o && o.state ? o.state : null; } catch (_) { return null; }
}

module.exports = { rule, isBA, isOwner, verdict, liveState, liveStateSync, norm, loose };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
  const num = argv.find(a => /^\d{5,}$/.test(a));
  if (!num) { console.log('usage: node domain/redmine-write-gate/status-rule.js <num> [--to Resolved] [--assignee "<name>"] [--json]'); process.exit(2); }
  liveState(num).then(state => {
    const v = state ? verdict(Object.assign({ to: flag('to') || rule().handback_status, stagedAssignee: flag('assignee') }, state)) : null;
    if (argv.includes('--json')) { console.log(JSON.stringify({ state, verdict: v })); return; }
    if (!state) { console.log(`#${num}: Redmine unreachable or no such ticket`); process.exit(1); }
    console.log(`#${num}: ${state.status} · ${state.assignee || 'nobody'}${state.assigneeId ? ' (' + state.assigneeId + ')' : ''}`);
    console.log(`→ ${flag('to') || rule().handback_status}: ${v.allow ? 'ALLOWED' : 'BLOCKED'} (row ${v.row}: ${v.why})`);
  });
}
