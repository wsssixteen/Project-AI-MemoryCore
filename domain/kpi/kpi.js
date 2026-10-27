#!/usr/bin/env node
// kpi — appraisal moments ledger, born via core/forge.js (skill `kpi`) 2026-10-23
// symptom: 2026-10-23 miya: "if we detect someone breaking something, or doing a wrong patch, etc, we can add into that
//          as an initiative ... take note anything that might help with our KPI or assessment for an increment"
// goal: every appraisal-worthy moment is on record the day it happens, tagged by competency, with evidence a reviewer can check
// goal_signal: `add` exits 0 (row read back + view in sync + audit PASS) in the same turn the moment happens
// retention: keep (main/kpi-moments.jsonl, append-only, merge=union) · main/kpi-tracker.md = regenerate
// footprint: on-demand: 1 node process per call, under 1 second, nothing running otherwise
// self_audit: every writing command ends with `audit` (system-design Rule 16): rows read back from disk and checked
//             against the goal (fields, competency, one sentence, evidence shape, no colleague names, no duplicates,
//             view in sync, coverage per competency). FAIL = exit 1 with the fix; the fix loop runs before the reply.
//
// USAGE
//   node domain/kpi/kpi.js add --ticket <#NNNNNN|QA-NNN|ADHOC-..|none> --competency <B1..B6|C1|C2>
//        --what "<one sentence>" --evidence "<commit / Redmine journal / SQL / file:line>" [--date YYYY-MM-DD]
//   node domain/kpi/kpi.js list [--ticket <n>] [--competency <code>] [--since YYYY-MM-DD] [--json]
//   node domain/kpi/kpi.js render      regenerate main/kpi-tracker.md from the ledger, then audit
//   node domain/kpi/kpi.js audit       self-audit only (read-only)
//   node domain/kpi/kpi.js competencies
//   node domain/kpi/kpi.js pending add <same flags as add> --until "<the condition that makes it count>"
//   node domain/kpi/kpi.js pending [list|--boot]   open pending rows; --boot prints nothing when there are none (SessionStart)
//   node domain/kpi/kpi.js confirm <id> [--evidence "<journal>"]   the condition held: the row now counts
//   node domain/kpi/kpi.js drop <id> --why "<reason>"               the condition failed (e.g. BA objected): withdrawn
// Exit 0 = PASS · 1 = audit FAIL (fix printed) · 2 = usage / refused row.
// state-scoped: no — one ledger per person, tickets from every state (the ticket id carries the state).
'use strict';
const fs = require('fs');
const path = require('path');

const t0 = Date.now();
const ROOT = argOf('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LEDGER = path.join(ROOT, 'main', 'kpi-moments.jsonl');
const VIEW = path.join(ROOT, 'main', 'kpi-tracker.md');
const LOG = process.env.KPI_LOG || path.join(__dirname, 'log.jsonl'); // env override = eval only
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8'));
const CODES = Object.keys(RULES.competencies);

function argOf(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; }
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row, { dur_ms: Date.now() - t0 })) + '\n'); } catch (_) {} }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

function normTicket(t) {
  const s = String(t || '').trim();
  let m = s.match(/^(?:#|QA-?|QA\s*#?)(\d{4,7})$/i);
  if (m) return '#' + m[1];
  if (/^ADHOC-[A-Z0-9-]+$/i.test(s)) return s.toUpperCase();
  if (/^none$/i.test(s)) return 'none';
  return null;
}

// ---------- ledger ----------
function readLedger() {
  if (!fs.existsSync(LEDGER)) return { rows: [], bad: [] };
  const rows = [], bad = [];
  fs.readFileSync(LEDGER, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    try { rows.push(Object.assign(JSON.parse(line), { _line: i + 1 })); } catch (_) { bad.push(i + 1); }
  });
  return { rows, bad };
}

// ---------- row checks (shared by add-refusal and audit) ----------
let _people = null;
function people() {
  if (_people) return _people;
  _people = [];
  try {
    const REPO = path.resolve(__dirname, '..', '..'); // the roster lives with the code, not with --root
    const states = require(path.join(REPO, 'lib', 'states.js'));
    const role = require(path.join(REPO, 'lib', 'redmine-role.js'));
    const self = (RULES.self_names || []).map(norm);
    for (const key of Object.keys(states.all())) {
      const r = role.loadRoster(key);
      for (const p of r.rows || []) {
        const n = norm(p.name.replace(/\(.*?\)/g, ''));
        if (n.split(' ').length >= 2 && !self.includes(n)) _people.push(n);
      }
    }
  } catch (_) { _people = null; }
  return _people;
}

// Row kinds (append-only, so a union merge never loses or rewrites a line):
//   (no kind)        a recorded moment
//   kind "pending"   a moment that counts only once its --until condition holds (id P-<ticket>-<code>-<yyyymmdd>)
//   kind "confirm"   event: the pending row with this id now counts (date = the day it was confirmed)
//   kind "drop"      event: the pending row with this id is withdrawn (why = the reason, e.g. BA objected)
function isEvent(r) { return r.kind === 'confirm' || r.kind === 'drop'; }
function rowProblems(r) {
  const p = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) p.push(['date', 'date must be YYYY-MM-DD']);
  else if (r.date > today()) p.push(['date', 'date ' + r.date + ' is in the future']);
  if (isEvent(r)) {
    if (!/^P-/.test(r.id || '')) p.push(['id', 'event has no pending id']);
    if (r.kind === 'drop' && !String(r.why || '').trim()) p.push(['why', 'a drop needs --why']);
    return p;
  }
  if (r.kind && r.kind !== 'pending') p.push(['kind', 'unknown kind "' + r.kind + '"']);
  if (r.kind === 'pending') {
    if (!/^P-/.test(r.id || '')) p.push(['id', 'pending row has no id']);
    if (!String(r.until || '').trim()) p.push(['until', 'pending row needs --until "<the condition that makes it count>"']);
  }
  if (!normTicket(r.ticket) || normTicket(r.ticket) !== r.ticket) p.push(['ticket', 'ticket "' + r.ticket + '" must be #NNNNNN, ADHOC-... or none']);
  if (!CODES.includes(r.competency)) p.push(['competency', 'competency "' + r.competency + '" must be one of ' + CODES.join(' ')]);
  const w = String(r.what || '').trim();
  if (!w) p.push(['what', 'what is empty']);
  else {
    if (w.length > RULES.what_max_chars) p.push(['what', 'what is ' + w.length + ' chars, max ' + RULES.what_max_chars + ' (one sentence)']);
    if (/[.!?]\s+[A-Z(]/.test(w.replace(/\b(e\.g|i\.e|vs|no|etc)\.\s/gi, ''))) p.push(['what', 'what holds more than one sentence']);
  }
  const e = String(r.evidence || '').trim();
  if (!e) p.push(['evidence', 'evidence is empty']);
  else if (!RULES.evidence_shapes.some(rx => new RegExp(rx, 'i').test(e))) p.push(['evidence', 'evidence "' + e.slice(0, 60) + '" has no checkable pointer (commit SHA, #ticket journal, schema.table, .sql, file:line, path, URL)']);
  const pl = people();
  if (pl) {
    const hay = ' ' + norm(w + ' ' + e + ' ' + (r.until || '')) + ' ';
    const hit = pl.find(n => hay.includes(' ' + n + ' '));
    if (hit) p.push(['names', 'names a person ("' + hit + '"); name colleagues by role (BA, a colleague, Reports team)']);
  }
  return p;
}
function rowKey(r) { return isEvent(r) ? [r.kind, r.id].join('|') : [r.kind || 'row', r.date, r.ticket, r.competency, norm(r.what)].join('|'); }
function clean(rows) { return rows.map(r => { const c = Object.assign({}, r); delete c._line; return c; }); }

// effective state: recorded rows + confirmed pending rows count; open pending rows wait; dropped rows vanish
function effective(rows) {
  const ev = new Map();
  for (const r of rows) if (isEvent(r) && !ev.has(r.id)) ev.set(r.id, r);
  const counted = [], open = [];
  for (const r of rows) {
    if (isEvent(r)) continue;
    if (r.kind !== 'pending') { counted.push(r); continue; }
    const e = ev.get(r.id);
    if (!e) open.push(r);
    else if (e.kind === 'confirm') counted.push(Object.assign({}, r, { evidence: r.evidence + ' · confirmed ' + e.date + (e.evidence ? ' (' + e.evidence + ')' : '') }));
  }
  return { counted, open };
}

// ---------- view ----------
function render(rows) {
  const { counted, open } = effective(rows);
  const by = {};
  for (const c of CODES) by[c] = [];
  for (const r of counted) if (by[r.competency]) by[r.competency].push(r);
  for (const c of CODES) by[c].sort((a, b) => (b.date + b.ticket).localeCompare(a.date + a.ticket));
  const cell = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const out = [
    '# 📊 KPI Tracker — appraisal moments',
    '',
    '> GENERATED by `node domain/kpi/kpi.js render` from `main/kpi-moments.jsonl`. Do not edit by hand: the self-audit fails on a hand edit.',
    '> Add a moment: `node domain/kpi/kpi.js add --ticket <#n> --competency <code> --what "<one sentence>" --evidence "<pointer>"` (skill `kpi`).',
    '> Before 2026-10-23 this file was a hand-written Phase 2 highlight reel; those 4 highlights are rows below, their long text is in git history (`git log -- main/kpi-tracker.md`).',
    '',
    '| Code | Competency | Rows | Latest |',
    '|---|---|---|---|',
  ];
  for (const c of CODES) out.push('| ' + c + ' | ' + RULES.competencies[c] + ' | ' + by[c].length + ' | ' + (by[c][0] ? by[c][0].date : '-') + ' |');
  if (open.length) {
    out.push('', '## Pending — counts once its condition holds (printed at every session start)', '', '| Id | Date | Ticket | Code | What happened | Counts when |', '|---|---|---|---|---|---|');
    for (const r of open) out.push('| ' + r.id + ' | ' + r.date + ' | ' + r.ticket + ' | ' + r.competency + ' | ' + cell(r.what) + ' | ' + cell(r.until) + ' |');
  }
  for (const c of CODES) {
    out.push('', '## ' + c + ' — ' + RULES.competencies[c], '');
    if (!by[c].length) { out.push('_No rows yet._'); continue; }
    out.push('| Date | Ticket | What happened | Evidence |', '|---|---|---|---|');
    for (const r of by[c]) out.push('| ' + r.date + ' | ' + r.ticket + ' | ' + cell(r.what) + ' | ' + cell(r.evidence) + ' |');
  }
  return out.join('\n') + '\n';
}

// ---------- self-audit (system-design Rule 16) ----------
function audit(justAdded) {
  const fails = [], warns = [];
  const { rows, bad } = readLedger();
  for (const n of bad) fails.push('ledger line ' + n + ' is not JSON — fix or remove that line in main/kpi-moments.jsonl');
  const seen = new Map();
  const pendingIds = new Set(rows.filter(r => r.kind === 'pending').map(r => r.id));
  for (const r of rows) {
    for (const [, msg] of rowProblems(r)) fails.push('row line ' + r._line + ' (' + (r.ticket || r.id) + ' ' + (r.competency || r.kind) + '): ' + msg + ' — correct that line in main/kpi-moments.jsonl, then render');
    if (isEvent(r) && !pendingIds.has(r.id)) fails.push('row line ' + r._line + ': ' + r.kind + ' for unknown pending id ' + r.id + ' — remove it or add the pending row');
    const k = isEvent(r) ? 'event|' + r.id : rowKey(r);
    if (seen.has(k)) fails.push('row line ' + r._line + (isEvent(r) ? ' is a second confirm/drop for ' + r.id : ' duplicates line ' + seen.get(k)) + ' — delete one');
    else seen.set(k, r._line);
  }
  if (justAdded && !rows.some(r => rowKey(r) === rowKey(justAdded))) fails.push('the row just written is not on disk — re-run the command');
  const want = render(clean(rows));
  const have = fs.existsSync(VIEW) ? fs.readFileSync(VIEW, 'utf8').replace(/\r\n/g, '\n') : null;
  if (have !== want) fails.push('main/kpi-tracker.md is out of sync with the ledger (hand edit or merge) — run: node domain/kpi/kpi.js render');
  if (people() === null) warns.push('people roster unreadable — the no-names check was skipped');
  // goal check: every competency should have recent evidence for the appraisal
  const { counted, open } = effective(rows);
  const since = new Date(Date.now() - RULES.coverage_days * 864e5).toISOString().slice(0, 10);
  const empty = CODES.filter(c => !counted.some(r => r.competency === c && r.date >= since));
  if (empty.length) warns.push('no row in the last ' + RULES.coverage_days + ' days for ' + empty.join(' ') + ' — look for a moment there next quest');
  const stale = new Date(Date.now() - RULES.pending_stale_days * 864e5).toISOString().slice(0, 10);
  for (const r of open) if (r.date < stale) warns.push('pending ' + r.id + ' is older than ' + RULES.pending_stale_days + ' days — check its condition: ' + r.until);
  return { fails, warns, rows: rows.length };
}
function report(cmd, a, extra) {
  for (const f of a.fails) console.log('FAIL  ' + f);
  for (const w of a.warns) console.log('WARN  ' + w);
  console.log('kpi self-audit: ' + (a.fails.length ? 'FAIL' : 'PASS') + ' · ' + a.rows + ' rows · ' + a.fails.length + ' fail · ' + a.warns.length + ' warn');
  logRow(Object.assign({ cmd, outcome: a.fails.length ? 'fail' : 'pass', fails: a.fails.length, warns: a.warns.length, rows: a.rows, goal_met: !a.fails.length }, extra || {}));
  process.exit(a.fails.length ? 1 : 0);
}
function writeView() {
  fs.mkdirSync(path.dirname(VIEW), { recursive: true });
  fs.writeFileSync(VIEW, render(clean(readLedger().rows)));
}
function append(row, cmdName) {
  const probs = rowProblems(row);
  const rows = readLedger().rows;
  if (rows.some(r => rowKey(r) === rowKey(row))) probs.push(['dup', 'the same row is already in the ledger']);
  if (isEvent(row)) {
    if (!rows.some(r => r.kind === 'pending' && r.id === row.id)) probs.push(['id', 'no pending row with id ' + row.id + ' (see: node domain/kpi/kpi.js pending list)']);
    else if (rows.some(r => isEvent(r) && r.id === row.id)) probs.push(['done', row.id + ' is already confirmed or dropped']);
  }
  if (row.kind === 'pending' && rows.some(r => r.kind === 'pending' && r.id === row.id)) probs.push(['id', 'pending id ' + row.id + ' already exists']);
  if (probs.length) {
    for (const [, m] of probs) console.log('REFUSED  ' + m);
    logRow({ cmd: cmdName, outcome: 'refused', reasons: probs.map(x => x[0]), ticket: row.ticket || row.id, competency: row.competency });
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  const prior = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8') : '';
  fs.appendFileSync(LEDGER, (prior && !prior.endsWith('\n') ? '\n' : '') + JSON.stringify(row) + '\n');
  writeView();
}
function rowFromArgs() {
  return { date: argOf('date') || today(), ticket: normTicket(argOf('ticket')) || String(argOf('ticket') || ''), competency: String(argOf('competency') || '').toUpperCase(), what: String(argOf('what') || '').trim(), evidence: String(argOf('evidence') || '').trim() };
}

// ---------- commands ----------
const cmd = process.argv[2];
if (cmd === 'competencies') { for (const c of CODES) console.log(c + '  ' + RULES.competencies[c]); process.exit(0); }
if (cmd === 'audit') report('audit', audit());
if (cmd === 'render') { writeView(); report('render', audit()); }
if (cmd === 'list') {
  const t = argOf('ticket') ? normTicket(argOf('ticket')) : null, c = argOf('competency'), s = argOf('since');
  const { counted, open } = effective(readLedger().rows);
  const pick = r => (!t || r.ticket === t) && (!c || r.competency === c) && (!s || r.date >= s);
  const rows = counted.filter(pick), pend = open.filter(pick);
  if (process.argv.includes('--json')) console.log(JSON.stringify(clean(rows.concat(pend)), null, 1));
  else {
    for (const r of rows) console.log(r.date + '  ' + r.ticket + '  ' + r.competency + '  ' + r.what + '  [' + r.evidence + ']');
    for (const r of pend) console.log('PENDING ' + r.id + '  ' + r.what + '  [counts when: ' + r.until + ']');
    console.log(rows.length + ' row(s)' + (pend.length ? ' · ' + pend.length + ' pending' : ''));
  }
  logRow({ cmd: 'list', outcome: 'ok', rows: rows.length });
  process.exit(0);
}
if (cmd === 'add') {
  const row = rowFromArgs();
  append(row, 'add');
  console.log('added  ' + row.date + '  ' + row.ticket + '  ' + row.competency + '  ' + row.what);
  report('add', audit(row), { ticket: row.ticket, competency: row.competency });
}
if (cmd === 'pending') {
  if (process.argv[3] === 'add') {
    const a = rowFromArgs();
    const row = { kind: 'pending', id: 'P-' + String(a.ticket).replace(/^#/, '') + '-' + a.competency + '-' + a.date.replace(/-/g, ''), date: a.date, ticket: a.ticket, competency: a.competency, what: a.what, evidence: a.evidence, until: String(argOf('until') || '').trim() };
    append(row, 'pending-add');
    console.log('pending  ' + row.id + '  counts when: ' + row.until);
    report('pending-add', audit(row), { ticket: row.ticket, competency: row.competency });
  }
  // list (default) and --boot: --boot prints nothing when there is no pending row, so SessionStart stays quiet
  const { open } = effective(readLedger().rows);
  const boot = process.argv.includes('--boot');
  if (boot && !open.length) process.exit(0);
  if (boot) console.log('🏅 KPI PENDING (' + open.length + ') — counts only when its condition holds; check each when its ticket comes up today:');
  for (const r of open) console.log((boot ? '  ' : '') + r.id + ' · ' + r.ticket + ' ' + r.competency + ' · ' + r.what + '\n' + (boot ? '    ' : '  ') + 'counts when: ' + r.until);
  if (boot) console.log('  held → node domain/kpi/kpi.js confirm <id> --evidence "<journal>" · failed or objected → node domain/kpi/kpi.js drop <id> --why "<reason>"');
  else console.log(open.length + ' pending');
  logRow({ cmd: boot ? 'pending-boot' : 'pending-list', outcome: 'ok', rows: open.length });
  process.exit(0);
}
if (cmd === 'confirm' || cmd === 'drop') {
  const row = { kind: cmd, id: String(process.argv[3] || ''), date: argOf('date') || today() };
  if (cmd === 'confirm' && argOf('evidence')) row.evidence = String(argOf('evidence')).trim();
  if (cmd === 'drop') row.why = String(argOf('why') || '').trim();
  append(row, cmd);
  console.log((cmd === 'confirm' ? 'confirmed  ' : 'dropped  ') + row.id);
  report(cmd, audit(row), { id: row.id });
}
console.error('usage: node domain/kpi/kpi.js <add|list|render|audit|competencies|pending [add|list|--boot]|confirm <id>|drop <id>> ... (see header)');
process.exit(2);
