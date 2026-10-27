#!/usr/bin/env node
// session-name.check.hook.js — born via core/forge.js (2026-10-27)
// TRIGGER: his first typed message of a new session (no earlier typed prompt in the transcript)
// ACTION: advisory: one line telling Ruri to rename the session to '<D/M/YYYY> - <ticket number or keywords>'
//         via mcp__ccd_session_mgmt__set_session_title (session_id "self")
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// Ruled 2026-10-28 per みや: format "<date> - <title keyword/ticket number>", date as D/M/YYYY; first message only.
// Order: seen marker (fast exit) → machine message (wait, no mark) → old session (mark, silent) → fire + mark.
// CLI: --audit  checks the last 20 fires in log.jsonl against the title format (exit 0 PASS / 1 FAIL).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = process.env.SESSION_NAME_LOG || path.join(__dirname, "log.jsonl");
const SEEN = process.env.SESSION_NAME_SEEN || path.join(__dirname, '.seen.json');
const HEAD_MAX = 512 * 1024;                     // a new session's transcript is small; anything larger is an old session
const KEEP_MS = 3 * 24 * 60 * 60 * 1000;         // seen entries older than 3 days are pruned
const MACHINE_RX = /\[SYSTEM NOTIFICATION|<task-notification>|<cross-session-message|<command-name>|<local-command/;
const TICKET_RX = /(?<![\d/#.-])#?(\d{6})(?![\d/])/;   // a 6-digit Redmine number; not part of a date, id or longer number
const TITLE_RX = /^\d{1,2}\/\d{1,2}\/\d{4} - \S/;

function today(now) { return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`; }
function clock() { const d = process.env.SESSION_NAME_NOW ? new Date(process.env.SESSION_NAME_NOW) : new Date(); return Number.isNaN(d.getTime()) ? new Date() : d; }
function readSeen() { try { const j = JSON.parse(fs.readFileSync(SEEN, 'utf8')); return j && typeof j === 'object' ? j : {}; } catch { return {}; } }
function markSeen(sid) {
  try {
    const now = Date.now(), j = readSeen();
    for (const k of Object.keys(j)) if (now - j[k] > KEEP_MS) delete j[k];
    j[sid] = now;
    fs.writeFileSync(SEEN + '.tmp', JSON.stringify(j)); fs.renameSync(SEEN + '.tmp', SEEN);
    return readSeen()[sid] === now;               // self-audit: the mark reads back
  } catch { return false; }
}
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch { /* logging never blocks */ } }

// Typed prompts already in the transcript (his own words, not tool results, hook text or machine notices).
function typedPrompts(file) {
  let st; try { st = fs.statSync(file); } catch { return []; }
  if (st.size > HEAD_MAX) return null;           // old session
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.includes('"type":"user"')) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== 'user' || o.isMeta || o.isSidechain || !o.message) continue;
    const c = o.message.content;
    const text = typeof c === 'string' ? c : Array.isArray(c) && !c.some(x => x && x.type === 'tool_result')
      ? c.filter(x => x && x.type === 'text').map(x => x.text).join('\n') : '';
    if (text.trim() && !MACHINE_RX.test(text)) out.push(text.trim());
  }
  return out;
}

function decide(data) {
  const prompt = String(data.prompt || '');
  const sid = String(data.session_id || '');
  if (!sid || !prompt.trim()) return { outcome: 'no-input' };
  if (readSeen()[sid]) return { outcome: 'seen' };
  if (MACHINE_RX.test(prompt)) return { outcome: 'machine-wait' };   // wait for his first real message, no mark
  const prior = data.transcript_path ? typedPrompts(data.transcript_path) : [];
  const earlier = prior === null ? 1 : prior.filter(p => p !== prompt.trim()).length;
  const marked = markSeen(sid);
  if (earlier > 0) return { outcome: 'old-session', marked };
  const m = prompt.match(TICKET_RX);
  const title = `${today(clock())} - ${m ? m[1] : '<2-4 keywords>'}`;
  return { outcome: 'fired', marked, ticket: m ? m[1] : null, title };
}

function line(d) {
  const t = d.ticket
    ? `title "${d.title}"`
    : `title "${d.title}" with <2-4 keywords> = the topic of his message in his own words, at most 30 characters`;
  return `📛 session-name: first message of this session. Rename it now: mcp__ccd_session_mgmt__set_session_title { session_id: "self", ${t} } (load the tool with ToolSearch "select:mcp__ccd_session_mgmt__set_session_title" first). Do not mention the rename in the reply.\n`;
}

function audit() {
  let rows = [];
  try { rows = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(s => JSON.parse(s)); } catch { /* no log yet */ }
  const fires = rows.filter(r => r.outcome === 'fired').slice(-20);
  const bad = fires.filter(r => !TITLE_RX.test(String(r.title || '').replace('<2-4 keywords>', 'x')) || r.marked !== true);
  console.log(`session-name audit: ${fires.length} recent fire(s), ${bad.length} bad`);
  for (const r of bad) console.log('  FAIL ' + JSON.stringify(r));
  process.exit(bad.length ? 1 : 0);
}

if (process.argv.includes('--audit')) audit();
else {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'session-name', event: 'UserPromptSubmit' }, (input) => {
    const t0 = Date.now();
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { data = {}; }
    const d = decide(data || {});
    if (d.outcome !== 'seen' && d.outcome !== 'no-input') logRow({ sid: data.session_id, outcome: d.outcome, title: d.title, marked: d.marked, goal_met: d.outcome === 'fired' ? d.marked === true : null, dur_ms: Date.now() - t0 });
    if (d.outcome !== 'fired') return { fired: false };
    return { fired: true, blocked: false, contextOut: line(d) };
  });
}

module.exports = { decide, typedPrompts, today, TICKET_RX, TITLE_RX };
