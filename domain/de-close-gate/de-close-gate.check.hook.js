#!/usr/bin/env node
// de-close-gate.check.hook.js — born via core/forge.js (2026-08-21)
// TRIGGER: DE closing banner (Domain Expansion — closed / Barrier settles) in the reply
// ACTION: BLOCK the DE close unless the deterministic close-conditions hold:
//   C1 BLOCKLESS-TICKET: every ticket id WORKED ON this session (appears in a tool call's
//      path/command, or >=5 assistant-text mentions) has a block in quest/active.txt or
//      quest/active-archive.txt. Kills the hole where step 2c (model memory) forgets a
//      ticket and step 12.6 cannot see it (it only iterates existing blocks).
//   C2 RESUME-READINESS RAN: domain/checklist-reactivate/log.jsonl carries a
//      via=resume-readiness entry from the last 12 hours (step 12.6 actually executed).
//   C3 TRIM RAN: main/current-session.md is at or under 500 lines (session-format.md cap;
//      an untrimmed file silently truncates the next boot's briefing).
//   C4 REDMINE RECONCILE RAN: this gate's own log.jsonl carries an action=reconcile-ran row
//      from the last 12 hours (quest/redmine-reconcile.js executed this session). REPLAY:
//      2026-08-21 — 20 "open" blocks vs 0 assigned-open on Redmine; DE had no Redmine step.
// REPLAY: 2026-08-20 QA-276182 — touched all session, deployed to int-env, had NO
//   active.txt block and NO qa_doc; only miya's explicit audit ask caught it.
// NOD: miya 2026-08-21 — "audit DE, list non-critical steps and MAKE THEM CRITICAL".
// PASS (silent): not-DE-close · bypass · all three conditions hold
// BYPASS: [skip-de-close-gate: <reason>] in the last assistant text
// TEST HOOK: input JSON `_testEvents` overrides transcript parse; `_testActiveText`,
//   `_testArchiveText`, `_testLogLines`, `_testSessionLineCount` override disk reads.
// Log: domain/de-close-gate/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.resolve(__dirname, 'log.jsonl');

const DE_CLOSE = /Domain Expansion\s*[—–-]+\s*closed|Barrier settles/i;
const BYPASS = /\[skip-de-close-gate:/i;
const TICKET_ID = /\b(QA-\d{6}|ADHOC-[A-Z]+-\d{4}-\d+)\b/g;
const MENTION_FLOOR = 5;         // assistant-text mentions that count as "touched" without a tool signal
const LOG_FRESH_MS = 12 * 3600 * 1000;
const SESSION_LINE_CAP = 500;

function parseTranscript(transcriptPath) {
  const events = [];
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return events; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    const role = msg.role || obj.type;
    const c = msg.content;
    const ts = obj.timestamp || null;
    if (typeof c === 'string') events.push({ kind: 'text', role, text: c, ts });
    else if (Array.isArray(c)) {
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'text' && b.text) events.push({ kind: 'text', role, text: b.text, ts });
        else if (b.type === 'tool_use') {
          const inp = b.input || {};
          events.push({ kind: 'tool', name: b.name || '', blob: JSON.stringify(inp).slice(0, 4000), input: { file_path: inp.file_path }, ts });
        }
      }
    }
  }
  return events;
}

function lastAssistantText(events) {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.kind === 'text' && e.role === 'assistant' && e.text && e.text.trim()) return e.text;
  }
  return '';
}

// Tool calls that are about TEST/EVAL artifacts, not real ticket work — their ids are
// fixtures, never touched tickets (2026-08-21 first-fire false positives: QA-111111 etc.
// from the gate's OWN eval file writes).
const FIXTURE_CONTEXT = /eval\.js|\.eval\.|scratchpad|fixture|_testEvents|test-gate/i;

// C1 — ticket ids touched this session. A tool-call signal needs >=2 DISTINCT tool calls
// (a single occurrence is a typo/one-off echo — the QA-276422 active-cli typo class);
// otherwise the assistant-mention floor applies.
function touchedTickets(events) {
  const mentions = Object.create(null);   // id -> assistant mention count
  const toolCounts = Object.create(null); // id -> distinct tool calls carrying it
  for (const e of events) {
    if (e.kind === 'text' && e.role === 'assistant') {
      let m; TICKET_ID.lastIndex = 0;
      while ((m = TICKET_ID.exec(e.text)) !== null) mentions[m[1]] = (mentions[m[1]] || 0) + 1;
    } else if (e.kind === 'tool') {
      if (FIXTURE_CONTEXT.test(e.blob)) continue;
      const seen = new Set();
      let m; TICKET_ID.lastIndex = 0;
      while ((m = TICKET_ID.exec(e.blob)) !== null) seen.add(m[1]);
      for (const id of seen) toolCounts[id] = (toolCounts[id] || 0) + 1;
    }
  }
  const touched = new Set();
  for (const id of Object.keys(toolCounts)) if (toolCounts[id] >= 2) touched.add(id);
  for (const id of Object.keys(mentions)) if (mentions[id] >= MENTION_FLOOR) touched.add(id);
  return touched;
}

function blockedIds(text) {
  const ids = new Set();
  let m; TICKET_ID.lastIndex = 0;
  while ((m = TICKET_ID.exec(text)) !== null) ids.add(m[1]);
  return ids;
}

function checkC1(events, activeText, archiveText) {
  const touched = touchedTickets(events);
  const known = blockedIds(activeText + '\n' + archiveText);
  const missing = [...touched].filter(id => !known.has(id));
  return { pass: missing.length === 0, missing, touchedCount: touched.size };
}

function checkC2(logLines, now) {
  for (let i = logLines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(logLines[i]); } catch (_) { continue; }
    if (o.via !== 'resume-readiness') continue;
    const ts = Date.parse(o.ts || '');
    if (!isNaN(ts) && (now - ts) <= LOG_FRESH_MS) return { pass: true, ageH: ((now - ts) / 3600000).toFixed(1) };
  }
  return { pass: false };
}

function checkC3(lineCount) {
  return { pass: lineCount <= SESSION_LINE_CAP, lineCount };
}

// C4 — quest/redmine-reconcile.js ran this session (writes action=reconcile-ran to THIS
// gate's log.jsonl). Same freshness contract as C2. Network failure inside the reconcile
// script still logs the row — an offline evening never deadlocks DE here.
function checkC4(gateLogLines, now) {
  for (let i = gateLogLines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(gateLogLines[i]); } catch (_) { continue; }
    if (o.action !== 'reconcile-ran') continue;
    const ts = Date.parse(o.ts || '');
    if (!isNaN(ts) && (now - ts) <= LOG_FRESH_MS) return { pass: true, ageH: ((now - ts) / 3600000).toFixed(1) };
  }
  return { pass: false };
}

// C5 — watch discipline (plan §M M5, 2026-09-06): every file under domain/ lib/ core/ .claude/hooks/
// Edit/Write-touched this session must have a `watch` row in system/claude-md-watchlist*.jsonl from
// this session (lib/watch.js add). Makes the abandoned 08-16 observe tool fire by construction.
const WATCHED_DIRS = /(?:^|\/)(domain|lib|core|\.claude\/hooks)\//;
function editedSystemFiles(events) {
  const out = new Set();
  for (const e of events) {
    if (e.kind !== 'tool' || !/^(Edit|Write|MultiEdit)$/.test(e.name || '')) continue;
    const fp = String((e.input && e.input.file_path) || '').split('\\').join('/');
    if (fp && WATCHED_DIRS.test(fp) && !/\.eval\.js$|NUKE-MARKER\.md$|README\.md$|log\.jsonl$|goal-log\.jsonl$/.test(fp)) out.add(fp);
  }
  return [...out];
}
function checkC5(events, watchLines, sessionStartMs) {
  const edited = editedSystemFiles(events);
  if (!edited.length) return { pass: true, missing: [], edited: 0 };
  const watched = new Set();
  for (const l of watchLines) { try { const r = JSON.parse(l); if (r.kind === 'watch' && Date.parse(r.ts) >= sessionStartMs) watched.add(String(r.target).split('\\').join('/')); } catch (_) {} }
  const missing = edited.filter(f => ![...watched].some(w => f.endsWith(w) || w.endsWith(f) || f.endsWith('/' + w)));
  return { pass: missing.length === 0, missing, edited: edited.length };
}

function evaluate(events, disk) {
  const last = lastAssistantText(events);
  if (!last || !DE_CLOSE.test(last)) return { verdict: 'silent', reason: 'not-de-close' };
  if (BYPASS.test(last)) return { verdict: 'silent', reason: 'bypass' };
  const c1 = checkC1(events, disk.activeText, disk.archiveText);
  const c2 = checkC2(disk.logLines, disk.now);
  const c3 = checkC3(disk.sessionLineCount);
  const c4 = checkC4(disk.gateLogLines, disk.now);
  const c5 = checkC5(events, disk.watchLines || [], disk.sessionStartMs || 0);
  if (c1.pass && c2.pass && c3.pass && c4.pass && c5.pass) return { verdict: 'pass', c1, c2, c3, c4, c5 };
  return { verdict: 'block', c1, c2, c3, c4, c5 };
}

function readDisk() {
  const safe = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };
  const activeText = safe(path.join(ROOT, 'quest', 'active.txt'));
  const archiveText = safe(path.join(ROOT, 'quest', 'active-archive.txt'));
  const logRaw = safe(path.join(ROOT, 'domain', 'checklist-reactivate', 'log.jsonl'));
  const gateLogRaw = safe(LOG);
  const sessionRaw = safe(path.join(ROOT, 'main', 'current-session.md'));
  let watchLines = [];
  try { for (const f of fs.readdirSync(path.join(ROOT, 'system'))) if (f.startsWith('claude-md-watchlist') && f.endsWith('.jsonl')) watchLines.push(...safe(path.join(ROOT, 'system', f)).split(String.fromCharCode(10)).map(l => l.replace(/\r$/, '')).filter(Boolean)); } catch (_) {}
  return {
    activeText, archiveText, watchLines, sessionStartMs: 0,
    logLines: logRaw.split(/\r?\n/).filter(Boolean),
    gateLogLines: gateLogRaw.split(/\r?\n/).filter(Boolean),
    sessionLineCount: sessionRaw ? sessionRaw.split(/\r?\n/).length : 0,
    now: Date.now(),
  };
}

function buildBlockReason(r) {
  const rows = [];
  if (!r.c1.pass) rows.push(`C1 BLOCKLESS TICKET(S): ${r.c1.missing.join(', ')} — worked on this session, NO block in quest/active.txt or active-archive.txt.`,
    `   Fix: node quest/active-cli.js start <QA> ... + create the qa_doc, then re-close.`);
  if (!r.c2.pass) rows.push('C2 resume-readiness NOT RUN this session (step 12.6).',
    '   Fix: node domain/checklist-reactivate/resume-readiness.js — fill any ✗, then re-close.');
  if (!r.c3.pass) rows.push(`C3 main/current-session.md is ${r.c3.lineCount} lines (cap ${SESSION_LINE_CAP}) — trim did not run.`,
    '   Fix: node core/session-trim.js --apply, then re-close.');
  if (!r.c4.pass) rows.push('C4 Redmine reconciliation NOT RUN this session — active.txt may carry Redmine-dead blocks.',
    '   Fix: node quest/redmine-reconcile.js — close/archive any diverged block, then re-close.');
  if (r.c5 && !r.c5.pass) rows.push(`C5 system file(s) edited this session with NO watch row: ${r.c5.missing.join(', ')}`,
    '   Fix: node lib/watch.js add --target <file> --observe "<what to watch for>" — one per file, then re-close.');
  return [
    '⛔ de-close-gate: Domain Expansion is closing but a deterministic close-condition FAILED:',
    ...rows.map(x => '   ' + x),
    '',
    '   Bypass: [skip-de-close-gate: <reason>].',
  ].join('\n');
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail: String(detail).slice(0, 300) }) + '\n'); } catch (_) {}
}

if (require.main === module) {
  runHook({ name: 'de-close-gate', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false };
    const events = Array.isArray(data._testEvents) ? data._testEvents : parseTranscript(data.transcript_path || '');
    if (!events.length) return { fired: false };
    const disk = readDisk();
    if (typeof data._testActiveText === 'string') disk.activeText = data._testActiveText;
    if (typeof data._testArchiveText === 'string') disk.archiveText = data._testArchiveText;
    if (Array.isArray(data._testLogLines)) disk.logLines = data._testLogLines;
    if (Array.isArray(data._testGateLogLines)) disk.gateLogLines = data._testGateLogLines;
    if (typeof data._testSessionLineCount === 'number') disk.sessionLineCount = data._testSessionLineCount;
    if (Array.isArray(data._testWatchLines)) disk.watchLines = data._testWatchLines;
    if (typeof data._testSessionStartMs === 'number') disk.sessionStartMs = data._testSessionStartMs;
    else { const first = events.find(e => e.ts); disk.sessionStartMs = first && Date.parse(first.ts) || 0; }

    const r = evaluate(events, disk);
    if (r.verdict === 'block') {
      const text = buildBlockReason(r);
      logFire('blocked', [!r.c1.pass && ('C1:' + r.c1.missing.join('/')), !r.c2.pass && 'C2', !r.c3.pass && ('C3:' + r.c3.lineCount), !r.c4.pass && 'C4', r.c5 && !r.c5.pass && ('C5:' + r.c5.missing.length)].filter(Boolean).join(' '));
      return { fired: true, blocked: true, blockReason: text };
    }
    if (r.verdict === 'pass') { logFire('passed', `touched=${r.c1.touchedCount} rr-age=${r.c2.ageH}h lines=${r.c3.lineCount} recon-age=${r.c4.ageH}h`); return { fired: true, blocked: false }; }
    return { fired: false };
  });
}

module.exports = { evaluate, touchedTickets, checkC1, checkC2, checkC3, checkC4, checkC5, editedSystemFiles };
