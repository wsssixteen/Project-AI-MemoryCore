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

function rowProblems(r) {
  const p = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) p.push(['date', 'date must be YYYY-MM-DD']);
  else if (r.date > today()) p.push(['date', 'date ' + r.date + ' is in the future']);
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
    const hay = ' ' + norm(w + ' ' + e) + ' ';
    const hit = pl.find(n => hay.includes(' ' + n + ' '));
    if (hit) p.push(['names', 'names a person ("' + hit + '"); name colleagues by role (BA, a colleague, Reports team)']);
  }
  return p;
}
function rowKey(r) { return [r.date, r.ticket, r.competency, norm(r.what)].join('|'); }

// ---------- view ----------
function render(rows) {
  const by = {};
  for (const c of CODES) by[c] = [];
  for (const r of rows) if (by[r.competency]) by[r.competency].push(r);
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
  for (const r of rows) {
    for (const [, msg] of rowProblems(r)) fails.push('row line ' + r._line + ' (' + r.ticket + ' ' + r.competency + '): ' + msg + ' — correct that line in main/kpi-moments.jsonl, then render');
    const k = rowKey(r);
    if (seen.has(k)) fails.push('row line ' + r._line + ' duplicates line ' + seen.get(k) + ' — delete one');
    else seen.set(k, r._line);
  }
  if (justAdded && !rows.some(r => rowKey(r) === rowKey(justAdded))) fails.push('the row just added is not on disk — re-run add');
  const want = render(rows.map(r => { const c = Object.assign({}, r); delete c._line; return c; }));
  const have = fs.existsSync(VIEW) ? fs.readFileSync(VIEW, 'utf8').replace(/\r\n/g, '\n') : null;
  if (have !== want) fails.push('main/kpi-tracker.md is out of sync with the ledger (hand edit or merge) — run: node domain/kpi/kpi.js render');
  if (people() === null) warns.push('people roster unreadable — the no-names check was skipped');
  // goal check: every competency should have recent evidence for the appraisal
  const since = new Date(Date.now() - RULES.coverage_days * 864e5).toISOString().slice(0, 10);
  const empty = CODES.filter(c => !rows.some(r => r.competency === c && r.date >= since));
  if (empty.length) warns.push('no row in the last ' + RULES.coverage_days + ' days for ' + empty.join(' ') + ' — look for a moment there next quest');
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
  const { rows } = readLedger();
  fs.mkdirSync(path.dirname(VIEW), { recursive: true });
  fs.writeFileSync(VIEW, render(rows.map(r => { const c = Object.assign({}, r); delete c._line; return c; })));
}

// ---------- commands ----------
const cmd = process.argv[2];
if (cmd === 'competencies') { for (const c of CODES) console.log(c + '  ' + RULES.competencies[c]); process.exit(0); }
if (cmd === 'audit') report('audit', audit());
if (cmd === 'render') { writeView(); report('render', audit()); }
if (cmd === 'list') {
  const t = argOf('ticket') ? normTicket(argOf('ticket')) : null, c = argOf('competency'), s = argOf('since');
  const rows = readLedger().rows.filter(r => (!t || r.ticket === t) && (!c || r.competency === c) && (!s || r.date >= s));
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows.map(r => { delete r._line; return r; }), null, 1));
  else { for (const r of rows) console.log(r.date + '  ' + r.ticket + '  ' + r.competency + '  ' + r.what + '  [' + r.evidence + ']'); console.log(rows.length + ' row(s)'); }
  logRow({ cmd: 'list', outcome: 'ok', rows: rows.length });
  process.exit(0);
}
if (cmd === 'add') {
  const row = { date: argOf('date') || today(), ticket: normTicket(argOf('ticket')) || String(argOf('ticket') || ''), competency: String(argOf('competency') || '').toUpperCase(), what: String(argOf('what') || '').trim(), evidence: String(argOf('evidence') || '').trim() };
  const probs = rowProblems(row);
  const dup = readLedger().rows.some(r => rowKey(r) === rowKey(row));
  if (dup) probs.push(['dup', 'the same row is already in the ledger']);
  if (probs.length) {
    for (const [, m] of probs) console.log('REFUSED  ' + m);
    logRow({ cmd: 'add', outcome: 'refused', reasons: probs.map(x => x[0]), ticket: row.ticket, competency: row.competency });
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  const prior = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8') : '';
  fs.appendFileSync(LEDGER, (prior && !prior.endsWith('\n') ? '\n' : '') + JSON.stringify(row) + '\n');
  writeView();
  console.log('added  ' + row.date + '  ' + row.ticket + '  ' + row.competency + '  ' + row.what);
  report('add', audit(row), { ticket: row.ticket, competency: row.competency });
}
console.error('usage: node domain/kpi/kpi.js <add|list|render|audit|competencies> ... (see header)');
process.exit(2);
