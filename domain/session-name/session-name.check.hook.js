#!/usr/bin/env node
// session-name.check.hook.js — born via core/forge.js (2026-10-27); v2 2026-10-28 (every kind of start)
// Ruled 2026-10-28 per みや: every session is named "<D/M/YYYY> - <ticket number or keywords>"; "audit to ensure all kinds of startup to include this".
// Truth = the session's current title, read from the transcript's last {"type":"custom-title"} record (or a dated set_session_title call).
// UserPromptSubmit (upsm-mode bundle, FIRST child): title not dated → one line telling Ruri to rename.
//   new session → today's date + the ticket in his message · resumed / child session → the date of its first typed prompt.
// Stop (stop-reply-shape bundle): title still not dated → block ONCE with the same line; dated → log goal_met (the only goal_met source).
// PreToolUse start_session / hand_off_to_session (settings.json matcher): a title with no date → refused with the dated title to use.
// Silent when: seen as done · machine notice first (waits for a real message) · not the desktop app (no rename tool).
// CLI: --audit  every recent fire must have a goal_met row for its session (exit 0 PASS / 1 FAIL).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = process.env.SESSION_NAME_LOG || path.join(__dirname, "log.jsonl");
const SEEN = process.env.SESSION_NAME_SEEN || path.join(__dirname, '.seen.json');
const KEEP_MS = 3 * 24 * 60 * 60 * 1000;         // seen entries older than 3 days are pruned
const PENDING_MS = 15 * 60 * 1000;               // --audit leaves fires younger than this alone
const MACHINE_RX = /\[SYSTEM NOTIFICATION|<task-notification>|<cross-session-message|<command-name>|<local-command/;
const TICKET_RX = /(?<![\d/#.-])#?(\d{6})(?![\d/])/;   // a 6-digit Redmine number; not part of a date, id or longer number
const TITLE_RX = /^\d{1,2}\/\d{1,2}\/\d{4} - \S/;
const APP_RX = /"entrypoint":"claude-desktop"/;
const RENAME_RX = /"name":"mcp__ccd_session_mgmt__set_session_title","input":(\{[^{}]*\})/g;
const START_TOOLS = /^mcp__ccd_session__(start_session|hand_off_to_session)$/;
const DONE = new Set(['done', 'gave-up', 'no-app']);

function dmy(d) { return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
function clock() { const d = process.env.SESSION_NAME_NOW ? new Date(process.env.SESSION_NAME_NOW) : new Date(); return Number.isNaN(d.getTime()) ? new Date() : d; }
function today(now) { return dmy(now || clock()); }
function dated(t) { return TITLE_RX.test(String(t || '')); }
function readSeen() { try { const j = JSON.parse(fs.readFileSync(SEEN, 'utf8')); return j && typeof j === 'object' ? j : {}; } catch { return {}; } }
function seenGet(sid) { const v = readSeen()[sid]; return v == null ? null : typeof v === 'number' ? { t: v, s: 'legacy' } : v; }
function markSeen(sid, patch) {
  try {
    const now = Date.now(), j = readSeen();
    for (const k of Object.keys(j)) { const t = typeof j[k] === 'number' ? j[k] : (j[k] || {}).t; if (!(now - t <= KEEP_MS)) delete j[k]; }
    const prev = typeof j[sid] === 'object' && j[sid] ? j[sid] : {};
    j[sid] = { ...prev, ...patch, t: now };
    const tmp = SEEN + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(j)); fs.renameSync(tmp, SEEN);
    return (readSeen()[sid] || {}).t === now;     // self-audit: the mark reads back
  } catch { return false; }
}
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch { /* logging never blocks */ } }

// One read of the transcript: current title, a dated rename call, desktop app or not, first typed prompt(s).
function scan(file, current) {
  const info = { title: null, renamed: null, app: false, first: null, earlier: false, missing: true };
  let raw; try { raw = fs.readFileSync(file, 'utf8'); } catch { return info; }
  info.missing = false;
  info.app = APP_RX.test(raw.slice(0, 256 * 1024));
  const i = raw.lastIndexOf('"type":"custom-title"');
  if (i >= 0) {
    const a = raw.lastIndexOf('\n', i) + 1, b = raw.indexOf('\n', i);
    try { info.title = JSON.parse(raw.slice(a, b < 0 ? undefined : b)).customTitle || null; } catch { /* torn line */ }
  }
  for (const m of raw.matchAll(RENAME_RX)) {
    try { const inp = JSON.parse(m[1]); if (inp.session_id === 'self' && dated(inp.title)) info.renamed = inp.title; } catch { /* partial */ }
  }
  const cur = String(current || '').trim();
  for (const line of raw.split('\n')) {
    if (!line.includes('"type":"user"')) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== 'user' || o.isMeta || o.isSidechain || !o.message) continue;
    const c = o.message.content;
    const text = (typeof c === 'string' ? c : Array.isArray(c) && !c.some(x => x && x.type === 'tool_result')
      ? c.filter(x => x && x.type === 'text').map(x => x.text).join('\n') : '').trim();
    if (!text || MACHINE_RX.test(text)) continue;
    if (!info.first) info.first = { text, ts: o.timestamp || null };
    if (text !== cur) { info.earlier = true; break; }
  }
  return info;
}

function wanted(src, date) {
  const m = String(src || '').match(TICKET_RX);
  return { ticket: m ? m[1] : null, title: `${date} - ${m ? m[1] : '<2-4 keywords>'}` };
}
function startDate(info) { const d = info.first && info.first.ts ? new Date(info.first.ts) : null; return d && !Number.isNaN(d.getTime()) ? dmy(d) : today(); }

function decidePrompt(data) {
  const prompt = String(data.prompt || '');
  const sid = String(data.session_id || '');
  if (!sid || !prompt.trim()) return { outcome: 'no-input' };
  if (seenGet(sid)) return { outcome: 'seen' };
  if (MACHINE_RX.test(prompt)) return { outcome: 'machine-wait' };   // wait for his first real message, no mark
  const info = data.transcript_path ? scan(data.transcript_path, prompt) : scan('', prompt);
  if (dated(info.title) || info.renamed) return { outcome: 'already-dated', title: info.renamed || info.title, marked: markSeen(sid, { s: 'done' }), goal_met: true };
  const resumed = info.earlier;
  const w = wanted(resumed ? info.first.text : prompt, resumed ? startDate(info) : today());
  return { outcome: resumed ? 'fired-resumed' : 'fired', ...w, current: info.title, resumed, marked: markSeen(sid, { s: 'asked' }), goal_met: null };
}

function decideStop(data) {
  const sid = String(data.session_id || '');
  if (!sid || !data.transcript_path) return { outcome: 'no-input' };
  const s = seenGet(sid);
  if (s && DONE.has(s.s)) return { outcome: 'seen' };
  const info = scan(data.transcript_path, '');
  if (info.missing) return { outcome: 'no-input' };
  if (!info.app) return { outcome: 'no-app', marked: markSeen(sid, { s: 'no-app' }), goal_met: null };
  if (dated(info.title) || info.renamed) return { outcome: 'renamed', title: info.renamed || info.title, marked: markSeen(sid, { s: 'done' }), goal_met: true };
  if (!info.first) return { outcome: 'seen' };                       // no typed prompt yet (machine-first): wait
  if (data.stop_hook_active) return { outcome: 'seen' };
  if (s && s.b) return { outcome: 'gave-up', title: info.title, marked: markSeen(sid, { s: 'gave-up' }), goal_met: false };
  const w = wanted(info.first.text, startDate(info));
  return { outcome: 'stop-block', ...w, current: info.title, resumed: true, marked: markSeen(sid, { s: 'asked', b: true }), goal_met: false };
}

function decideStart(data) {
  const tool = String(data.tool_name || '');
  if (!START_TOOLS.test(tool)) return { outcome: 'no-input' };
  const t = String((data.tool_input || {}).title || '').trim();
  if (!t || dated(t)) return { outcome: 'seen' };                     // proposal_id only, or already dated
  return { outcome: 'start-title-denied', tool, title: `${today()} - ${t}`, goal_met: false };
}

function line(d) {
  const head = d.resumed ? 'this session has no dated title yet' : 'first message of this session';
  const t = d.ticket
    ? `title "${d.title}"`
    : `title "${d.title}" with <2-4 keywords> = the topic of his message in his own words, at most 30 characters`;
  const cur = d.current ? ` (current title "${String(d.current).slice(0, 60)}": keep its topic)` : '';
  return `📛 session-name: ${head}. Rename it now: mcp__ccd_session_mgmt__set_session_title { session_id: "self", ${t} }${cur} (load the tool with ToolSearch "select:mcp__ccd_session_mgmt__set_session_title" first). Do not mention the rename in the reply.\n`;
}

function audit() {
  let rows = [];
  try { rows = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean); } catch { /* no log yet */ }
  const met = new Set(rows.filter(r => r.goal_met === true).map(r => r.sid));
  const cutoff = Date.now() - PENDING_MS;
  const fires = rows.filter(r => /^(fired|fired-resumed|stop-block)$/.test(r.outcome) && Date.parse(r.ts) < cutoff);
  const last = new Map(); for (const r of fires) last.set(r.sid, r);
  const recent = [...last.values()].slice(-20);
  const bad = recent.filter(r => !met.has(r.sid) || !TITLE_RX.test(String(r.title || '').replace('<2-4 keywords>', 'x')));
  console.log(`session-name audit: ${recent.length} recent session(s) asked to rename, ${bad.length} never renamed`);
  for (const r of bad) console.log('  FAIL ' + JSON.stringify(r));
  process.exit(bad.length ? 1 : 0);
}

if (process.argv.includes('--audit')) audit();
else if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch { input = ''; }
  let data = {}; try { data = JSON.parse(input || '{}') || {}; } catch { data = {}; }
  const event = data.hook_event_name || (data.tool_name ? 'PreToolUse' : data.prompt != null ? 'UserPromptSubmit' : 'Stop');
  runHook({ name: 'session-name', event, input }, () => {
    const t0 = Date.now();
    const d = event === 'Stop' ? decideStop(data) : event === 'PreToolUse' ? decideStart(data) : decidePrompt(data);
    if (d.outcome !== 'seen' && d.outcome !== 'no-input') logRow({ sid: data.session_id, event, outcome: d.outcome, title: d.title, marked: d.marked, goal_met: d.goal_met, dur_ms: Date.now() - t0 });
    if (d.outcome === 'fired' || d.outcome === 'fired-resumed') return { fired: true, blocked: false, contextOut: line(d) };
    if (d.outcome === 'stop-block') return { fired: true, blocked: true, blockReason: line(d) };
    if (d.outcome === 'start-title-denied') return { fired: true, blocked: true, blockReason: `📛 session-name: a session title starts with the date. Call ${d.tool} again with title "${d.title}".\n` };
    return { fired: false };
  });
}

module.exports = { decidePrompt, decideStop, decideStart, scan, today, TICKET_RX, TITLE_RX };
